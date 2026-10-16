(() => {
  if (window.PLOTAO_ADVICE_MODAL_READY) return;
  window.PLOTAO_ADVICE_MODAL_READY = true;

  const ENDPOINT = 'https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/submit-lead';
  const API_KEY = 'sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V';
  const h = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const options = (items) => items.map(x => `<option>${h(x)}</option>`).join('');

  const style = document.createElement('style');
  style.textContent = `
    .pa-dialog{width:min(900px,calc(100vw - 28px));max-width:none;max-height:min(92dvh,900px);padding:0;border:0;border-radius:22px;background:#f7f8f5;color:#17231d;box-shadow:0 28px 90px #092d1e55;overflow:auto}
    .pa-dialog::backdrop{background:#09251ed1;backdrop-filter:blur(4px)}
    .pa-layout{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:600px}
    .pa-aside{padding:34px 27px;background:linear-gradient(155deg,#075846,#063d32);color:white;display:flex;flex-direction:column;justify-content:space-between}
    .pa-eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#bde4c9}
    .pa-aside h2{margin:18px 0 12px;font-size:31px;line-height:1.08;letter-spacing:-.7px}
    .pa-aside p{font-size:15px;line-height:1.6;color:#e0eee6}
    .pa-points{display:grid;gap:13px;margin-top:28px}.pa-point{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.4}.pa-check{display:grid;place-items:center;flex:none;width:21px;height:21px;border-radius:50%;background:#ff6b16;font-weight:900}
    .pa-aside small{font-size:12px;line-height:1.5;color:#c8ddd2}
    .pa-content{padding:27px 30px 25px;position:relative}
    .pa-close{position:absolute;right:18px;top:16px;width:40px;height:40px;border:0;border-radius:50%;background:#edf1ed;color:#244339;font-size:25px;cursor:pointer}
    .pa-content h3{margin:2px 52px 5px 0;font-size:23px;letter-spacing:-.4px}.pa-intro{margin:0 35px 22px 0;color:#5c6b63;font-size:14px;line-height:1.5}
    .pa-group{margin:0 0 20px;padding:0;border:0}.pa-group legend{width:100%;padding:0 0 10px;margin-bottom:12px;border-bottom:1px solid #e2e8e2;font-size:14px;font-weight:800;color:#075846}
    .pa-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pa-field{display:grid;gap:6px;min-width:0}.pa-field[hidden]{display:none!important}.pa-wide{grid-column:1/-1}.pa-field label,.pa-label{font-size:12px;font-weight:700;color:#34483e}.pa-field input,.pa-field select,.pa-field textarea{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid #d7e0d8;border-radius:10px;background:white;color:#1e3027;font:inherit;font-size:14px;outline:none}.pa-field textarea{min-height:75px;resize:vertical}.pa-field input:focus,.pa-field select:focus,.pa-field textarea:focus{border-color:#16805c;box-shadow:0 0 0 3px #16805c22}
    .pa-hint{font-size:11px;color:#718078}.pa-consent{display:flex;gap:9px;align-items:flex-start;margin:0 0 12px;font-size:12px;line-height:1.5;color:#51635a}.pa-consent input{margin-top:3px;accent-color:#087443}.pa-consent a{color:#075846;font-weight:700}
    .pa-submit{width:100%;min-height:49px;border:0;border-radius:11px;background:#ff6b16;color:white;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 7px 18px #ff6b1633}.pa-submit:hover{background:#ea5707}.pa-submit:disabled{opacity:.65;cursor:wait}.pa-status{min-height:20px;margin:10px 0 0;font-size:13px;line-height:1.4;color:#075846}.pa-status[data-error="true"]{color:#a3261a}
    .pa-ask{cursor:pointer}
    @media(max-width:800px){body>header.site-header .mobile-tools{gap:7px!important}body>header.site-header .mobile-tools .pa-mobile-advice{display:grid!important;place-items:center!important;flex:none!important;width:34px!important;height:34px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#fff0e8!important;color:#075846!important;box-shadow:none!important}body>header.site-header .mobile-tools .pa-mobile-advice svg{display:block!important;width:21px!important;height:21px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important}}
    @media(max-width:700px){.pa-dialog{width:calc(100vw - 16px);max-height:96dvh;border-radius:17px}.pa-layout{grid-template-columns:1fr;min-height:0}.pa-aside{padding:20px 20px 17px}.pa-aside h2{font-size:24px;margin:8px 45px 7px 0}.pa-aside>div>p{margin:0;font-size:13px}.pa-points{display:none}.pa-aside small{display:none}.pa-content{padding:20px 17px}.pa-content h3{font-size:19px}.pa-intro{font-size:13px;margin-bottom:16px}.pa-group{margin-bottom:16px}.pa-grid{gap:10px}.pa-field input,.pa-field select,.pa-field textarea{font-size:16px}.pa-close{right:12px;top:12px}}
    @media(max-width:390px){.pa-grid{grid-template-columns:1fr}.pa-wide{grid-column:auto}}
  `;
  document.head.append(style);

  const dialog = document.createElement('dialog');
  dialog.className = 'pa-dialog';
  dialog.setAttribute('aria-labelledby','pa-title');
  dialog.innerHTML = `
    <div class="pa-layout">
      <aside class="pa-aside"><div><div class="pa-eyebrow">Osobní poradenství PLOTAO</div><h2 id="pa-title">Najdeme plot, který vám bude sedět.</h2><p>Stačí pár základních informací. Když něco ještě nevíte, nechte to prázdné — pomůžeme vám se zorientovat.</p><div class="pa-points"><div class="pa-point"><span class="pa-check">✓</span><span>Porovnáme vhodné typy a materiály</span></div><div class="pa-point"><span class="pa-check">✓</span><span>Probereme rozměry, terén i vstupy</span></div><div class="pa-point"><span class="pa-check">✓</span><span>Řekneme, co zahrnuje materiál a montáž</span></div></div></div><small>Vaše údaje použijeme pouze k vyřízení dotazu. Předání partnerské firmě můžete povolit zvlášť.</small></aside>
      <div class="pa-content"><button class="pa-close" type="button" aria-label="Zavřít okno">×</button><h3>S čím vám máme pomoct?</h3><p class="pa-intro">Vyberte téma. Formulář vám ukáže jen otázky, které s ním souvisejí.</p>
        <form id="pa-advice-form">
          <fieldset class="pa-group"><legend>Vyberte oblast poradenství</legend><div class="pa-grid"><div class="pa-field pa-wide"><label for="pa-topic">S čím potřebujete poradit?</label><select id="pa-topic" name="topic" required><option value="">Vyberte téma…</option><option value="typ">Výběr vhodného typu plotu</option><option value="cena">Cena a rozpočet</option><option value="montaz">Montáž a příprava pozemku</option><option value="brana">Brána nebo branka</option><option value="komponenty">Komponenty, oprava nebo doplnění</option><option value="doprava">Doprava materiálu</option><option value="jine">Jiný dotaz</option></select></div></div></fieldset>
          <fieldset class="pa-group"><legend id="pa-details-legend">Podrobnosti k vašemu dotazu</legend><div class="pa-grid">
            <div class="pa-field" data-topic-field="typ,cena,montaz,brana,komponenty"><label for="pa-type">Jaký plot zvažujete?</label><select id="pa-type" name="fenceType">${options(['Ještě nevím – chci doporučit','Panelový plot','Pletivový plot','Betonový plot','Gabionový plot','Hliníkový plot','Kovový plot','Zděný plot','Živý plot','Mobilní oplocení','Jiný typ'])}</select></div>
            <div class="pa-field" data-topic-field="typ"><label for="pa-purpose">Co je pro vás nejdůležitější?</label><select id="pa-purpose" name="purpose">${options(['Soukromí a zakrytí','Bezpečí a pevnost','Příznivá cena','Snadná údržba','Vzhled domu a zahrady','Ohraničení pozemku','Zatím si nejsem jistý/á'])}</select></div>
            <div class="pa-field" data-topic-field="typ,cena,montaz"><label for="pa-length">Přibližná délka</label><input id="pa-length" name="length" type="number" min="1" max="1000" step="1" placeholder="Např. 35 m"></div>
            <div class="pa-field" data-topic-field="typ,cena,montaz"><label for="pa-height">Požadovaná výška</label><select id="pa-height" name="height">${options(['Zatím nevím','Do 100 cm','120 cm','150 cm','160 cm','180 cm','200 cm','Více než 200 cm'])}</select></div>
            <div class="pa-field" data-topic-field="typ,cena,montaz,brana,komponenty,doprava,jine"><label for="pa-place">Obec nebo PSČ</label><input id="pa-place" name="place" autocomplete="postal-code" placeholder="Kde se bude plot stavět?"></div>
            <div class="pa-field" data-topic-field="typ,montaz"><label for="pa-ground">Jaký je terén?</label><select id="pa-ground" name="terrain">${options(['Rovný','Mírně svažitý','Výrazně svažitý','Nevím / potřebuji posoudit'])}</select></div>
            <div class="pa-field" data-topic-field="montaz"><label for="pa-service">Jakou montáž potřebujete?</label><select id="pa-service" name="scope">${options(['Materiál i odbornou montáž','Montáž na můj materiál','Jen materiál','Zatím nevím'])}</select></div>
            <div class="pa-field" data-topic-field="montaz,brana"><label for="pa-when">Kdy chcete realizovat?</label><select id="pa-when" name="timing">${options(['Co nejdříve','Do 1–3 měsíců','Později během roku','Zatím jen plánuji'])}</select></div>
            <div class="pa-field" data-topic-field="cena"><label for="pa-budget">Máte představu o rozpočtu?</label><select id="pa-budget" name="budget">${options(['Zatím nevím','Do 30 000 Kč','30 000–60 000 Kč','60 000–100 000 Kč','Nad 100 000 Kč'])}</select></div>
            <div class="pa-field" data-topic-field="brana"><label for="pa-gate-type">Jakou bránu nebo branku?</label><select id="pa-gate-type" name="gateType">${options(['Branku pro pěší','Křídlovou bránu','Posuvnou bránu','Samonosnou bránu','Zatím nevím'])}</select></div>
            <div class="pa-field" data-topic-field="brana"><label for="pa-gate-width">Přibližná šířka vjezdu</label><input id="pa-gate-width" name="gateWidth" inputmode="decimal" placeholder="Např. 4 m"></div>
            <div class="pa-field" data-topic-field="brana"><label for="pa-gate-drive">Pohon</label><select id="pa-gate-drive" name="gateDrive">${options(['Ruční ovládání','Elektrický pohon','Zatím nevím'])}</select></div>
            <div class="pa-field pa-wide" data-topic-field="typ,cena,montaz,brana,komponenty,doprava,jine"><label for="pa-details">Co přesně potřebujete vyřešit?</label><textarea id="pa-details" name="details" maxlength="1500" placeholder="Doplňte, co by nám pomohlo připravit užitečnou radu."></textarea></div>
          </div></fieldset>
          <fieldset class="pa-group"><legend>Kam vám máme odpovědět?</legend><div class="pa-grid">
            <div class="pa-field"><label for="pa-name">Jméno</label><input id="pa-name" name="name" autocomplete="name" required minlength="2" maxlength="120" placeholder="Vaše jméno"></div>
            <div class="pa-field"><label for="pa-phone">Telefon</label><input id="pa-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" placeholder="+420 …"></div>
            <div class="pa-field pa-wide"><label for="pa-email">E-mail</label><input id="pa-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="vas@email.cz"><span class="pa-hint">Vyplňte telefon nebo e-mail, ať se vám můžeme ozvat.</span></div>
          </div></fieldset>
          <label class="pa-consent"><input type="checkbox" name="consent" required><span>Souhlasím se zpracováním údajů pro vyřízení mého dotazu. <a href="/ochrana-osobnich-udaju.html" target="_blank" rel="noopener">Informace o zpracování</a>.</span></label>
          <label class="pa-consent"><input type="checkbox" name="partnerShareConsent"><span>Souhlasím s předáním poptávky vhodné partnerské firmě, která mi může připravit nabídku.</span></label>
          <button class="pa-submit" type="submit">Požádat o radu <span aria-hidden="true">→</span></button><p class="pa-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const status = dialog.querySelector('.pa-status');
  const updateTopic = () => {
    const topic = form.elements.topic.value;
    form.querySelectorAll('[data-topic-field]').forEach(field => {
      field.hidden = !topic || !field.dataset.topicField.split(',').includes(topic);
    });
    const labels = {typ:'Výběr vhodného typu plotu',cena:'Cena a rozpočet',montaz:'Montáž a příprava pozemku',brana:'Brána nebo branka',komponenty:'Komponenty, oprava nebo doplnění',doprava:'Doprava materiálu',jine:'Jiný dotaz'};
    dialog.querySelector('#pa-details-legend').textContent = topic ? `Podrobnosti: ${labels[topic]}` : 'Podrobnosti k vašemu dotazu';
    const prompts = {typ:'Popište, jaký plot potřebujete a co je pro vás důležité.',cena:'Uveďte, co chcete nacenit nebo jaký rozpočet zvažujete.',montaz:'Popište stav pozemku, přístup a rozsah prací.',brana:'Napište, jaký vjezd potřebujete a co je potřeba sladit s plotem.',komponenty:'Napište, jaký díl nebo opravu řešíte.',doprava:'Napište, jaký materiál a kam potřebujete dopravit.',jine:'Popište svůj dotaz.'};
    form.elements.details.placeholder = prompts[topic] || 'Doplňte, co by nám pomohlo připravit užitečnou radu.';
  };
  form.elements.topic.addEventListener('change', updateTopic);
  updateTopic();
  const close = () => dialog.close();
  dialog.querySelector('.pa-close').addEventListener('click', close);
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  document.addEventListener('click', e => {
    const link = e.target.closest('.header-action,.pa-mobile-advice');
    if (!link || (!link.classList.contains('pa-mobile-advice') && !/poradíme vám/i.test(link.textContent))) return;
    e.preventDefault();
    const current = document.querySelector('main h1')?.textContent?.trim() || document.title.replace(/\s*[|–-]\s*PLOTAO.*$/i,'').trim();
    const type = form.elements.fenceType;
    if (current && /plot|pletiv|panel|gabion|beton|hlinik|brán|komponent/i.test(current) && type.value.startsWith('Ještě')) {
      const match = [...type.options].find(o => current.toLocaleLowerCase('cs-CZ').includes(o.textContent.toLocaleLowerCase('cs-CZ').replace(' plot','')) && !o.textContent.startsWith('Ještě'));
      if (match) type.value = match.value;
    }
    dialog.showModal();
    dialog.querySelector('#pa-topic').focus({preventScroll:true});
  });
  form.elements.phone.addEventListener('input', validateContact);
  form.elements.email.addEventListener('input', validateContact);
  function validateContact(){
    const hasPhone = form.elements.phone.value.trim().length > 0;
    const hasEmail = form.elements.email.value.trim().length > 0;
    form.elements.phone.required = !hasEmail;
    form.elements.email.required = !hasPhone;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    validateContact();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const get = key => String(data.get(key) || '').trim();
    const fenceType = get('fenceType').startsWith('Ještě') ? 'Neupřesněno' : get('fenceType');
    const topicLabel = form.elements.topic.selectedOptions[0]?.textContent || '';
    const answers = [...form.querySelectorAll('[data-topic-field]')].filter(field => !field.hidden).map(field => {
      const control = field.querySelector('input,select,textarea');
      if (!control || !control.value.trim()) return '';
      const label = field.querySelector('label')?.textContent || control.name;
      let value = control.value.trim();
      if (control.name === 'length') value += ' m';
      return `${label}: ${value}`;
    }).filter(Boolean);
    const includesType = [...form.querySelectorAll('[data-topic-field]')].some(field => field.dataset.topicField.split(',').includes(get('topic')) && field.querySelector('[name="fenceType"]'));
    const note = [`Poradenská oblast: ${topicLabel}`,includesType && `Zvažovaný typ plotu: ${fenceType}`,...answers,'Souhlas se zpracováním dotazu: udělen.'].filter(Boolean).join('\n');
    const payload = {transportVersion:1,source:'plotao.cz',submittedAt:new Date().toISOString(),lead:{schemaVersion:2,mode:'help',name:get('name'),phone:get('phone'),email:get('email'),place:get('place'),region:'',partner_share_consent:form.elements.partnerShareConsent.checked,note}};
    const button = form.querySelector('.pa-submit');
    button.disabled = true; status.dataset.error = 'false'; status.textContent = 'Odesílám váš dotaz…';
    try {
      const response = await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:API_KEY},body:JSON.stringify(payload)});
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || 'send_failed');
      status.textContent = result.email_sent === true ? 'Dotaz jsme přijali a poslali potvrzení na e-mail. Brzy se vám ozveme.' : 'Dotaz jsme přijali. Brzy se vám ozveme.';
      form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach(el=>el.disabled=true);
    } catch (error) {
      console.warn('PLOTAO advice request failed',error);
      status.dataset.error = 'true'; status.textContent = 'Odeslání se nepodařilo. Zkontrolujte připojení a zkuste to prosím znovu.';
      button.disabled = false;
    }
  });
})();
