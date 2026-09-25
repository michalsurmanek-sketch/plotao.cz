/* Region boundaries: siwekm/czech-geojson, kraje.json (bundled in index.html).
   The map and marker share a single geographic projection and selection state. */
(() => {
  'use strict';
  const q = s => document.querySelector(s);
  const input = q('#locationInput'), suggestions = q('#locationSuggestions');
  const confirm = q('#locationConfirm'), next = q('#locationNext');
  const svg = q('.cz-regions-map'), marker = q('#locationMarker'), label = q('#locationLabel'), progressLocation = q('#progressLocation');
  if (!input || !svg) return;
  const regions = [...svg.querySelectorAll('.region')];
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const project = (lon, lat) => ({ x: (Number(lon) - 12) * 100, y: (51.2 - Number(lat)) * 155 });
  const key = 'plotao.location';
  let selected = null, timer, request = 0, controller;
  const storage = value => { try { value ? localStorage.setItem(key, JSON.stringify(value)) : localStorage.removeItem(key); } catch (_) {} };
  const regionFor = value => {
    if (Number.isFinite(Number(value.lon)) && Number.isFinite(Number(value.lat)) && value.lon != null && value.lat != null) {
      const point = svg.createSVGPoint(); Object.assign(point, project(value.lon, value.lat));
      const match = [...regions].reverse().find(path => path.isPointInFill(point));
      if (match) return match;
    }
    return regions.find(path => normalize(path.dataset.region) === normalize(value.region));
  };
  function pick(value, persist = true) {
    const region = value && regionFor(value);
    selected = value && region ? { ...value, region: region.dataset.region } : null;
    regions.forEach(path => {
      const on = !!selected && path === region;
      path.classList.toggle('on', on); path.setAttribute('aria-pressed', String(on));
    });
    next.disabled = !selected;
    confirm.textContent = selected ? '✓ Vybráno: ' + selected.label : '';
    confirm.classList.toggle('show', !!selected);
    label.hidden = !selected;
    label.textContent = selected ? selected.label.split(',')[0] : '';
    if (progressLocation) { progressLocation.textContent = selected ? selected.label.split(',')[0] : ''; progressLocation.hidden = !selected; progressLocation.style.display = selected ? 'block' : 'none'; }
    marker.setAttribute('visibility', 'hidden');
    if (selected) {
      input.value = selected.label;
      const hasCoords = selected.lat != null && selected.lon != null;
      const box = region.getBBox();
      const point = hasCoords ? project(selected.lon, selected.lat) : { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
      marker.setAttribute('visibility', 'visible');
    }
    const place = q('#place');
    if (place) { place.value = selected ? selected.label : ''; place.dispatchEvent(new Event('input', { bubbles: true })); }
    if (persist) storage(selected);
    document.dispatchEvent(new CustomEvent('plotao:location-change', { detail: selected }));
  }
  function render(items, message = '') {
    suggestions.replaceChildren();
    items.forEach(value => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = value.label;
      button.addEventListener('click', () => { cancel(); pick(value); render([]); });
      suggestions.appendChild(button);
    });
    if (message) { const note = document.createElement('p'); note.textContent = message; note.style.padding = '0 13px'; suggestions.appendChild(note); }
    suggestions.classList.toggle('show', !!items.length || !!message);
  }
  function cancel() { clearTimeout(timer); request++; if (controller) controller.abort(); }
  function scrollAfterRegionPick() {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    const anchor = q('.updated') || q('.progress') || q('#locationStep');
    if (!anchor) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const top = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - 10);
      window.scrollTo({ top, behavior: 'smooth' });
    }));
  }
  regions.forEach(path => {
    const choose = () => {
      cancel();
      pick({ label: path.dataset.region, region: path.dataset.region, kind: 'region' });
      render([]);
      scrollAfterRegionPick();
    };
    path.addEventListener('click', choose);
    path.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
  });
  // Fast suggestions for regional centres and the local Uhersko area; other towns use city search.
  const cities = [
    ['Uherské Hradiště','686 01',17.4597,49.0698],['Uherský Brod','688 01',17.6472,49.0251],
    ['Uherský Ostroh','687 24',17.3898,48.9856],['Zlín','760 01',17.6663,49.2265],
    ['Praha','110 00',14.4378,50.0755],['Brno','602 00',16.6068,49.1951],
    ['Ostrava','702 00',18.2625,49.8209],['Olomouc','779 00',17.2509,49.5938],
    ['Plzeň','301 00',13.3776,49.7384],['Liberec','460 01',15.0543,50.7671],
    ['České Budějovice','370 01',14.4747,48.9747],['Hradec Králové','500 02',15.8328,50.2092],
    ['Pardubice','530 02',15.7812,50.0343],['Jihlava','586 01',15.5912,49.3961],
    ['Karlovy Vary','360 01',12.8712,50.2319],['Ústí nad Labem','400 01',14.0403,50.6607]
  ].map(([city, postcode, lon, lat]) => ({ label: city + ', ' + postcode, city, postcode, lon, lat, kind: 'city' }));
  const fromResult = result => {
    const address = result.address || {};
    const city = address.city || address.town || address.village || address.municipality;
    if (!city) return null;
    return { label: [city, address.postcode, address.state].filter(Boolean).join(', '), lat: Number(result.lat), lon: Number(result.lon), region: address.state, kind: 'city' };
  };
  input.addEventListener('input', () => {
    cancel(); const text = input.value.trim(); pick(null); input.value = text;
    if (text.length < 2) { render([]); return; }
    const query = normalize(text);
    const local = cities.filter(city => normalize(city.city).startsWith(query) || city.postcode.replace(/\s/g, '').startsWith(query.replace(/\s/g, '')));
    render(local);
    if (local.length) return;
    const token = request;
    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const field = /^\d[\d ]*$/.test(text) ? 'postalcode' : 'city';
        const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=cz&limit=8&' + field + '=' + encodeURIComponent(text);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('search');
        const rows = await response.json();
        if (token !== request) return;
        const values = rows.map(fromResult).filter(value => value && regionFor(value));
        const unique = [...new Map(values.map(value => [value.label, value])).values()];
        render(unique, unique.length ? '' : 'Obec nenalezena. Zkuste celý název nebo vyberte kraj na mapě.');
      } catch (error) {
        if (token === request && error.name !== 'AbortError') render([], 'Vyhledávání není dostupné. Vyberte kraj na mapě.');
      }
    }, 400);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') render([]);
    if (event.key === 'ArrowDown') { event.preventDefault(); suggestions.querySelector('button')?.focus(); }
    if (event.key === 'Enter') { const button = suggestions.querySelector('button'); if (button) { event.preventDefault(); button.click(); } }
  });
  q('#useLocation').addEventListener('click', () => {
    if (!navigator.geolocation) { render([], 'Prohlížeč polohu nepodporuje. Vyberte kraj nebo zadejte obec.'); return; }
    cancel(); const token = request;
    navigator.geolocation.getCurrentPosition(async position => {
      if (token !== request) return;
      const value = { lat: position.coords.latitude, lon: position.coords.longitude };
      const region = regionFor(value);
      if (!region) { render([], 'Poloha je mimo ČR. Vyberte místo realizace na mapě.'); return; }
      pick({ ...value, region: region.dataset.region, label: region.dataset.region }); render([]);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${value.lat}&lon=${value.lon}`);
        if (!response.ok) return;
        const result = fromResult(await response.json());
        if (token === request && result) pick({ ...result, ...value });
      } catch (_) {}
    }, () => { if (token === request) render([], 'Polohu se nepodařilo získat. Zadejte obec nebo vyberte kraj.'); }, { timeout: 10000 });
  });
  next.addEventListener('click', () => {
    if (!selected) return;
    q('.mobile-price')?.classList.remove('location-blocked');
    q('#locationStep').classList.add('step-hidden'); q('#configArea').classList.remove('step-hidden');
    const steps = document.querySelectorAll('.progress b'); steps[0].classList.remove('on'); steps[1].classList.add('on');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  q('.mobile-price')?.classList.add('location-blocked');
  try { const saved = JSON.parse(localStorage.getItem(key) || 'null'); pick(saved && typeof saved.label === 'string' ? saved : null); } catch (_) { pick(null); }
})();
