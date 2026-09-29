(() => {
  'use strict';
  const $ = s => document.querySelector(s), form = $('#quoteForm');
  if (!form) return;
  const names = {panel:'Panelový plot',concrete:'Betonový plot',mesh:'Pletivový plot',gabion:'Gabionový plot',aluminium:'Hliníkový plot',advice:'Poradit s výběrem',metal:'Kovový plot',masonry:'Zděný plot',mobile:'Mobilní oplocení',hedge:'Živý plot'};
  const images = {panel:'panelovy-3d.webp',concrete:'betonovy.webp',mesh:'pletivovy.webp',gabion:'gabionovy.webp',aluminium:'hlinikovy.webp',advice:'category-other.webp',metal:'category-metal.webp',masonry:'category-masonry.webp',mobile:'category-mobile.webp',hedge:'category-hedge.webp'};
  let files = [], importedOptions = [];
  const val = name => form.elements.namedItem(name)?.value || '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const set = (name,value) => {const el=form.elements.namedItem(name); if(el && value != null)el.value=String(value);};
  const kind = () => val('extraType') || val('fenceType');
  const segments = () => [...document.querySelectorAll('.segment')].map((el,i)=>({name:el.querySelector('[data-name]').value || 'Úsek '+(i+1),length:el.querySelector('[data-length]').value,height:el.querySelector('[data-height]').value}));
  function addSegment(data={}) {
    if ($('#segments').children.length >= 12) return;
    const el=document.createElement('div'); el.className='segment';
    el.innerHTML='<div class="segment-title"><strong>Úsek</strong><button type="button" class="remove">Odebrat</button></div><label>Název úseku<input data-name maxlength="100" placeholder="Např. ulice, zahrada"></label><div class="two"><label>Délka (m) *<input data-length type="number" min="0.01" max="1000" step="0.01" required placeholder="Např. 30"></label><label>Výška (cm) *<input data-height type="number" min="40" max="400" step="1" required placeholder="Např. 153"></label></div>';
    el.querySelector('[data-name]').value=data.name || '';
    el.querySelector('[data-length]').value=data.length || '';
    el.querySelector('[data-height]').value=data.height || '';
    el.querySelector('.remove').addEventListener('click',()=>{el.remove();renumber();update();});
    $('#segments').append(el);renumber();
  }
  function renumber() {
    const list=[...$('#segments').children];
    list.forEach((el,i)=>{el.querySelector('strong').textContent='Úsek '+(i+1);el.querySelector('.remove').hidden=list.length===1;});
    $('#addSegment').disabled=list.length>=12;
  }
  function update() {
    const ss=segments(), total=ss.reduce((n,s)=>n+(Number(s.length)||0),0), heights=[...new Set(ss.map(s=>s.height).filter(Boolean))];
    const lengthInput=$('[data-length]'); if(lengthInput)lengthInput.setCustomValidity(total>1000?'Celková délka všech úseků může být nejvýše 1000 m.':'');
    const phone=val('phone').replace(/\D/g,''), email=val('email').trim();
    form.elements.phone.setCustomValidity(phone && (phone.length<9||phone.length>15)?'Zadejte telefon s 9 až 15 číslicemi.':!phone&&!email?'Vyplňte alespoň telefon nebo e-mail.':'');
    const k=kind();
    $('#sumPlace').textContent=val('place')||'Zvolte lokalitu';
    $('#sumType').textContent=names[k]||'Vyberte oplocení';
    $('#sumSize').textContent=total?total.toLocaleString('cs-CZ')+' m · '+ss.length+' '+(ss.length===1?'úsek':'úseky')+(heights.length?' · výška '+heights.join(' / ')+' cm':''):'Doplňte rozměry';
    $('#sumOptions').textContent=[val('color'),val('variant'),form.elements.slab.checked?'s podhrabovými deskami':'',form.elements.privacy.checked?'soukromí':''].filter(Boolean).join(' · ');
    $('#sumScope').textContent=val('scope')||'Vyberte rozsah';
    $('#summaryImage').src='/assets/fence-types/'+(images[k]||images.panel);
    $('#summaryImage').alt=k?names[k]:'Inspirace pro váš nový plot';
    form.querySelectorAll('[name=fenceType]').forEach(el=>el.required=!val('extraType'));
  }

  // City and postcode autocomplete mirrors the calculator's map search.
  const placeInput = $('#placeInput'), placeSuggestions = $('#placeSuggestions');
  if (placeInput && placeSuggestions) {
    const normalizePlace = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const placeCities = [
      ['Uherské Hradiště','686 01'],['Uherský Brod','688 01'],['Uherský Ostroh','687 24'],['Zlín','760 01'],
      ['Praha','110 00'],['Brno','602 00'],['Ostrava','702 00'],['Olomouc','779 00'],
      ['Plzeň','301 00'],['Liberec','460 01'],['České Budějovice','370 01'],['Hradec Králové','500 02'],
      ['Pardubice','530 02'],['Jihlava','586 01'],['Karlovy Vary','360 01'],['Ústí nad Labem','400 01']
    ].map(([city, postcode]) => ({label: city + ', ' + postcode, city, postcode}));
    let placeTimer = 0, placeRequest = 0, placeController = null;
    const hidePlaceSuggestions = () => { placeSuggestions.replaceChildren(); placeSuggestions.classList.remove('show'); placeInput.setAttribute('aria-expanded','false'); };
    const renderPlaceSuggestions = (items, message = '') => {
      placeSuggestions.replaceChildren();
      items.forEach((item, index) => {
        const option = document.createElement('button');
        option.type = 'button'; option.role = 'option'; option.tabIndex = -1;
        option.setAttribute('aria-selected','false'); option.textContent = item.label;
        option.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown') { event.preventDefault(); placeSuggestions.querySelectorAll('button')[index + 1]?.focus(); }
          if (event.key === 'ArrowUp') { event.preventDefault(); index ? placeSuggestions.querySelectorAll('button')[index - 1]?.focus() : placeInput.focus(); }
          if (event.key === 'Escape') { hidePlaceSuggestions(); placeInput.focus(); }
        });
        option.addEventListener('click', () => {
          clearTimeout(placeTimer); placeRequest++; if (placeController) placeController.abort();
          placeInput.value = item.label; hidePlaceSuggestions(); update(); placeInput.focus({preventScroll:true});
          placeInput.dispatchEvent(new Event('change',{bubbles:true}));
        });
        placeSuggestions.appendChild(option);
      });
      if (message) { const note=document.createElement('p'); note.className='place-message'; note.textContent=message; placeSuggestions.appendChild(note); }
      const visible = !!items.length || !!message;
      placeSuggestions.classList.toggle('show',visible); placeInput.setAttribute('aria-expanded',String(visible));
    };
    const cancelPlaceSearch = () => { clearTimeout(placeTimer); placeRequest++; if (placeController) placeController.abort(); };
    const placeFromResult = result => {
      const address = result.address || {};
      const city = address.city || address.town || address.village || address.municipality;
      if (!city) return null;
      return {label:[city,address.postcode,address.state].filter(Boolean).join(', ')};
    };
    placeInput.addEventListener('input', () => {
      cancelPlaceSearch();
      const queryText=placeInput.value.trim();
      if (queryText.length < 2) { hidePlaceSuggestions(); return; }
      const normalized=normalizePlace(queryText);
      const local=placeCities.filter(item=>normalizePlace(item.city).startsWith(normalized) || item.postcode.replace(/\s/g,'').startsWith(normalized.replace(/\s/g,'')));
      if (local.length) { renderPlaceSuggestions(local); return; }
      const token=placeRequest;
      placeTimer=setTimeout(async () => {
        placeController=new AbortController();
        try {
          const field=/^\d[\d ]*$/.test(queryText) ? 'postalcode' : 'city';
          const url='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=cz&limit=8&'+field+'='+encodeURIComponent(queryText);
          const response=await fetch(url,{signal:placeController.signal});
          if (!response.ok) throw new Error('search');
          const rows=await response.json();
          if (token!==placeRequest) return;
          const unique=[...new Map(rows.map(placeFromResult).filter(Boolean).map(item=>[item.label,item])).values()];
          renderPlaceSuggestions(unique,unique.length?'':'Obec nenalezena. Zkuste celý název nebo PSČ.');
        } catch(error) {
          if (token===placeRequest && error.name!=='AbortError') renderPlaceSuggestions([],'Vyhledávání není dostupné. Zkuste celý název obce nebo PSČ.');
        }
      },400);
    });
    placeInput.addEventListener('keydown',event=>{
      if(event.key==='Escape') hidePlaceSuggestions();
      if(event.key==='ArrowDown'){const first=placeSuggestions.querySelector('button');if(first){event.preventDefault();first.focus();}}
      if(event.key==='Enter' && placeSuggestions.classList.contains('show')){const first=placeSuggestions.querySelector('button');if(first){event.preventDefault();first.click();}}
    });
    placeInput.addEventListener('blur',()=>setTimeout(()=>{if(!placeSuggestions.contains(document.activeElement))hidePlaceSuggestions();},120));
  }

  form.addEventListener('input',update); form.addEventListener('change',update);
  form.querySelectorAll('[name=fenceType]').forEach(el=>el.addEventListener('change',()=>{set('extraType','');$('#otherType').value='';update();}));
  $('#otherType').addEventListener('change',e=>{set('extraType',e.target.value);if(e.target.value)form.querySelectorAll('[name=fenceType]').forEach(el=>el.checked=false);update();});
  $('#addSegment').addEventListener('click',()=>{addSegment();$('#segments').lastElementChild.querySelector('input').focus();update();});
  function renderFiles() {
    const list=$('#fileList');list.replaceChildren();
    files.forEach((file,i)=>{const row=document.createElement('div');row.className='file-row';const name=document.createElement('span');name.textContent=file.name+' · '+Math.ceil(file.size/1024)+' kB';const button=document.createElement('button');button.type='button';button.textContent='×';button.setAttribute('aria-label','Odebrat '+file.name);button.addEventListener('click',()=>{files.splice(i,1);renderFiles();});row.append(name,button);list.append(row);});
  }
  $('#files').addEventListener('change',e=>{
    const next=[...files,...e.target.files];e.target.value='';
    if(next.length>5||next.reduce((n,f)=>n+f.size,0)>10*1024*1024){$('#fileError').textContent='Vyberte nejvýše 5 souborů o celkové velikosti do 10 MB.';return;}
    if(next.some(f=>!['image/jpeg','image/png','image/webp','application/pdf'].includes(f.type))){$('#fileError').textContent='Povoleny jsou pouze JPG, PNG, WEBP a PDF.';return;}
    files=next;$('#fileError').textContent='';renderFiles();
  });
  const readFile = file => new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=()=>reject(new Error('Soubor nelze přečíst.'));r.readAsDataURL(file);});
  form.addEventListener('submit',async e=>{
    e.preventDefault();update();if(!form.reportValidity())return;
    const button=$('#downloadQuote');button.disabled=true;$('#status').textContent='Připravuji poptávku…';
    try{
      const attachments=await Promise.all(files.map(readFile));
      const rows=[['Místo realizace',val('place')],['Typ plotu',names[kind()]],['Rozsah dodávky',val('scope')],['Barva / povrch',val('color')],['Varianta / dekor',val('variant')],['Podhrabové desky',form.elements.slab.checked?'Ano':'Ne'],['Soukromí',form.elements.privacy.checked?'Ano':'Ne'],['Brána',val('gate')],['Šířka brány',val('gate')==='Bez brány'?'—':val('gateWidth')?val('gateWidth')+' m':'Upřesním později'],['Ovládání brány',val('gate')==='Bez brány'?'—':val('drive')],['Počet branek',val('wickets')],['Terén',val('terrain')],['Příjezd techniky',val('access')],['Demontáž a odvoz',form.elements.demolition.checked?'Ano':'Ne'],['Podloží a překážky',val('obstacles')],['Termín',val('timing')],['Jméno',val('name')],['Telefon',val('phone')],['E-mail',val('email')]];
      const content='<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Poptávka plotu – PLOTAO.cz</title><style>body{font:16px/1.6 Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 20px;color:#193a2a}h1{color:#176a44}table{border-collapse:collapse;width:100%}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{width:38%}pre{white-space:pre-wrap;font:inherit;overflow-wrap:anywhere}img{max-width:100%;height:auto}section{margin:25px 0}@media print{body{margin:0}a{color:inherit}tr,img{break-inside:avoid}}</style><h1>Poptávka plotu</h1><p>PLOTAO.cz · '+esc(new Date().toLocaleDateString('cs-CZ'))+'</p><p>Podklady k nezávazné nabídce. Tento dokument nebyl automaticky odeslán dodavateli.</p><table>'+rows.map(([a,b])=>'<tr><th>'+esc(a)+'</th><td>'+esc(b||'—')+'</td></tr>').join('')+'</table><h2>Úseky oplocení</h2><table><tr><th>Úsek</th><th>Délka</th><th>Výška</th></tr>'+segments().map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+esc(s.length)+' m</td><td>'+esc(s.height)+' cm</td></tr>').join('')+'</table>'+(importedOptions.length?'<h2>Původní podklady z kalkulátoru</h2><p>Aktuální hodnoty uvedené výše mají přednost před původním zadáním.</p><pre>'+esc(importedOptions.join('\n'))+'</pre>':'')+'<h2>Poznámka</h2><pre>'+esc(val('note')||'—')+'</pre>'+(attachments.length?'<h2>Přílohy</h2>':'')+attachments.map(f=>'<section><h3>'+esc(f.name)+'</h3>'+(f.type.startsWith('image/')?'<img src="'+f.data+'" alt="'+esc(f.name)+'">':'<a download="'+esc(f.name)+'" href="'+f.data+'">Stáhnout PDF: '+esc(f.name)+'</a>')+'</section>').join('')+'</html>';
      const url=URL.createObjectURL(new Blob([content],{type:'text/html;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='plotao-poptavka-'+new Date().toISOString().slice(0,10)+'.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      $('#status').textContent='Soubor je připravený ke stažení. Otevřete jej v prohlížeči; můžete ho vytisknout nebo uložit jako PDF. Poptávka nebyla odeslána.';
    }catch{ $('#status').textContent='Poptávku se nepodařilo připravit. Údaje zůstaly vyplněné. Zkontrolujte přílohy a zkuste to znovu.'; }
    finally{button.disabled=false;}
  });
  let snapshot=null;
  try{snapshot=JSON.parse(sessionStorage.getItem('plotao.quote-transfer')||'null');sessionStorage.removeItem('plotao.quote-transfer');}catch{}
  if(snapshot && typeof snapshot==='object'){
    set('place',snapshot.place);set('variant',snapshot.variant);set('scope',snapshot.scope);set('note',snapshot.note);
    if(names[snapshot.type]){const radio=[...form.querySelectorAll('[name=fenceType]')].find(el=>el.value===snapshot.type);if(radio)radio.checked=true;else{set('extraType',snapshot.type);$('#otherType').value=snapshot.type;}}
    if(Array.isArray(snapshot.segments))snapshot.segments.slice(0,12).forEach(s=>addSegment({name:s.name,length:s.length,height:snapshot.height}));
    if(Array.isArray(snapshot.options))importedOptions=snapshot.options.map(x=>String(x).slice(0,1000)).slice(0,50);
    $('#importNotice').hidden=false;$('#importNotice').textContent='Převzali jsme dostupné zadání z kalkulátoru. Zkontrolujte provedení a doplňte zbývající údaje.';
  }
  if(!$('#segments').children.length)addSegment();
  if(!val('place'))try{const location=JSON.parse(localStorage.getItem('plotao.location')||'null');if(location?.label)set('place',location.label);}catch{}
  update();
})();
