(() => {
  'use strict';
  if (window.PLOTAO_CART_READY) return;
  window.PLOTAO_CART_READY = true;
  const KEY = 'plotao.cart.v1';
  const money = value => new Intl.NumberFormat('cs-CZ', {style:'currency', currency:'CZK'}).format(value);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeImage = value => typeof value === 'string' && /^\/assets\/[a-zA-Z0-9/_.-]+$/.test(value) ? value : '/assets/logo-plotao.svg';
  const validItem = item => item && typeof item.id === 'string' && item.id.length <= 1500 && typeof item.name === 'string' && item.name.length <= 200 && typeof item.detail === 'string' && item.detail.length <= 800 && Number.isInteger(item.qty) && item.qty >= 1 && item.qty <= 999 && (item.price === null || Number.isSafeInteger(item.price) && item.price >= 0 && item.price < 1000000000);
  let storageAvailable = true;
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data.filter(validItem).slice(0, 20) : [];
    } catch { storageAvailable = false; return []; }
  }
  let items = read(), busy = false, activeCard = null;
  const style = document.createElement('style');
  style.textContent = `
    .pc-dialog{box-sizing:border-box;width:min(980px,calc(100vw - 24px));max-width:none;max-height:92dvh;padding:0;border:0;border-radius:20px;background:#f7f8f5;color:#183d30;box-shadow:0 24px 80px #082c1c55;overflow:auto;font:16px/1.5 Inter,Arial,sans-serif}
    .pc-dialog::backdrop{background:#09251ecc;backdrop-filter:blur(3px)}.pc-dialog *{box-sizing:border-box}.pc-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 28px;border-bottom:1px solid #dce5dd;background:white}.pc-top h2{font-size:27px;margin:0}.pc-close{width:40px;height:40px;border:0;border-radius:50%;background:#edf2ee;color:#075b42;font-size:26px;cursor:pointer}
    .pc-content{padding:24px 28px}.pc-note{font-size:14px;color:#53695c;margin:0 0 20px}.pc-items{display:grid;gap:12px}.pc-item{display:grid;grid-template-columns:76px minmax(0,1fr) 100px 130px 36px;gap:14px;align-items:center;border:1px solid #dfe7df;background:white;padding:16px;border-radius:12px}.pc-item img{width:76px;height:70px;object-fit:contain}.pc-item h3{font-size:16px;line-height:1.4;margin:0}.pc-item p{font-size:13px;line-height:1.5;color:#607065;margin:4px 0;overflow-wrap:anywhere}.pc-item label{font-size:12px;display:grid;gap:5px}.pc-item input{width:80px;padding:9px;border:1px solid #c6d4c9;border-radius:8px;font:inherit}.pc-line-price{text-align:right;font-weight:800;font-size:16px}.pc-line-price small{display:block;font-weight:400;color:#607065;font-size:12px}.pc-remove{border:0;background:#f2f5f1;border-radius:8px;min-width:36px;min-height:36px;color:#794132;font-size:22px;cursor:pointer}
    .pc-summary{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px 0;border-bottom:1px solid #dce5dd}.pc-summary strong{font-size:25px}.pc-summary small{display:block;color:#627467;font-size:13px}.pc-form{margin-top:24px}.pc-form h3{font-size:21px;margin:0 0 6px}.pc-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}.pc-fields label{display:grid;gap:6px;font-size:14px;font-weight:600}.pc-fields input,.pc-fields select,.pc-fields textarea{width:100%;padding:12px;border:1px solid #cbd7cd;border-radius:9px;background:#fff;color:#183d30;font:inherit;font-size:16px}.pc-wide{grid-column:1/-1}.pc-consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;margin:14px 0}.pc-consent input{margin-top:4px;accent-color:#087443}.pc-dialog a{color:#087443;text-decoration:underline}.pc-actions{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:20px}.pc-primary,.pc-add{border:0;border-radius:9px;background:#f07828;color:white;padding:13px 20px;font:inherit;font-weight:800;cursor:pointer}.pc-primary:disabled{opacity:.6;cursor:wait}.pc-add{display:block;width:100%;margin-top:8px;padding:9px;font-size:13px;background:#087443}.pc-variant-add{margin-top:14px;min-height:44px}.pc-empty{padding:35px 12px;text-align:center}.pc-empty h3{font-size:24px}.pc-empty a{display:inline-block;padding:12px 22px;margin-top:8px}.pc-status{font-size:14px;min-height:24px;color:#075b42;margin:14px 0 0}.pc-status[data-error=true]{color:#9b302a}.pc-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:1900;max-width:calc(100vw - 30px);padding:12px 20px;background:#075b42;color:white;border-radius:12px;box-shadow:0 4px 24px #0003;font-size:14px}.pc-toast[hidden]{display:none}.pc-mobile-cart{position:relative;display:grid!important;place-items:center!important;width:32px!important;height:35px!important;color:#087443!important}.pc-mobile-cart svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2}:is(body>header.site-header,#eshopContextHeader>header.site-header) .pc-mobile-cart .cart-count{position:absolute;right:-2px;top:-7px;min-width:18px!important;width:auto!important;height:18px!important;font-size:11px!important;margin:0!important;padding:0 3px!important;background:#f07828;color:white;border-radius:50%}.pc-dialog :focus-visible{outline:3px solid #087443;outline-offset:3px}
    @media(max-width:700px){.pc-top{padding:16px}.pc-top h2{font-size:23px}.pc-content{padding:18px 14px}.pc-item{grid-template-columns:55px minmax(0,1fr) 36px;gap:10px;padding:12px}.pc-item img{width:55px;height:60px}.pc-item h3{font-size:15px}.pc-item>label{grid-column:2;grid-row:2}.pc-line-price{grid-column:2;grid-row:3;text-align:left}.pc-remove{grid-column:3;grid-row:1}.pc-fields{grid-template-columns:1fr}.pc-wide{grid-column:auto}.pc-summary{align-items:flex-start}.pc-summary strong{font-size:20px}.pc-actions .pc-primary{width:100%}.pc-dialog{max-height:95dvh;border-radius:15px}}
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog');
  dialog.className = 'pc-dialog';
  dialog.setAttribute('aria-labelledby','pc-title');
  dialog.innerHTML = `<div class="pc-top"><h2 id="pc-title">Váš košík</h2><button type="button" class="pc-close" aria-label="Zavřít košík">×</button></div><div class="pc-content"><div id="pc-body"></div><p class="pc-status" role="status" aria-live="polite"></p></div>`;
  document.body.append(dialog);
  const body = dialog.querySelector('#pc-body'), status = dialog.querySelector('.pc-status');
  const toast = document.createElement('div'); toast.className = 'pc-toast'; toast.setAttribute('role','status'); toast.hidden = true; document.body.append(toast);
  let toastTimer;
  function notify(message) { toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => {toast.hidden = true;}, 4500); }
  function totals(list=items) { return list.reduce((sum,item) => sum + (item.price || 0) * item.qty,0); }
  function syncBadges() {
    const count = items.reduce((sum,item) => sum + item.qty,0);
    document.querySelectorAll('.cart-count').forEach(badge => {badge.textContent = String(count); const link=badge.closest('a'); if(link){link.href='#kosik';link.setAttribute('aria-label',`Košík, počet kusů: ${count}`);}});
  }
  function save() {
    try { localStorage.setItem(KEY,JSON.stringify(items)); storageAvailable = true; }
    catch {storageAvailable = false; notify('Košík teď nelze uložit v prohlížeči. Zůstane dostupný do obnovení stránky.');}
    syncBadges();
  }
  function render() {
    const previousForm=body.querySelector('form');
    const draft=previousForm?Object.fromEntries(new FormData(previousForm)):null;
    status.textContent = '';
    if(!items.length){body.innerHTML='<div class="pc-empty"><h3>Košík je zatím prázdný</h3><p>Vyberte si produkty a přidejte je do košíku.</p><a href="/eshop.html">Prohlédnout nabídku →</a></div>';return;}
    const unknown = items.some(item => item.price === null);
    body.innerHTML = `<p class="pc-note">Vše pro váš plot na jednom místě. Vybrané produkty nám pošlete k potvrzení ceny, dostupnosti a dopravy.${storageAvailable?'':' Ukládání košíku v prohlížeči není dostupné.'}</p><div class="pc-items">${items.map((item,index)=>`<article class="pc-item" data-index="${index}"><img src="${escape(safeImage(item.image))}" alt=""><div><h3>${escape(item.name)}</h3><p>${escape(item.detail)}</p><p>${item.price===null?'Cena vybrané varianty k potvrzení':`Orientačně od ${money(item.price/100)} / ${escape(item.unit||'ks')}`}</p></div><label>Množství (${escape(item.unit||'ks')})<input type="number" min="1" max="999" step="1" value="${item.qty}" aria-label="Množství: ${escape(item.name)}"></label><div class="pc-line-price">${item.price===null?'K nacenění':money(item.price*item.qty/100)}<small>${item.price===null?'Individuální nabídka':'Orientačně od'}</small></div><button type="button" class="pc-remove" aria-label="Odebrat: ${escape(item.name)}">×</button></article>`).join('')}</div><div class="pc-summary"><div><b>${unknown?'Součet položek s uvedenou cenou':'Orientační součet produktů'}</b><small>Dopravu a konečnou cenu potvrdíme v nabídce.${unknown?' Další položky čekají na nacenění.':''}</small></div><strong id="pc-total">${items.every(i=>i.price===null)?'K nacenění':`od ${money(totals()/100)}`}</strong></div><form class="pc-form"><h3>Nechte si potvrdit nabídku</h3><p class="pc-note">Odesláním vzniká nezávazná poptávka. Ozveme se s cenou a dostupností; nyní nic neplatíte.</p><div class="pc-fields"><label>Jméno a příjmení<input name="name" autocomplete="name" required minlength="2" maxlength="120"></label><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Telefon (nepovinné)<input name="phone" type="tel" autocomplete="tel" maxlength="30"></label><label>Způsob převzetí<select name="delivery"><option>Doprava na adresu</option><option>Osobní vyzvednutí – místo dohodneme</option><option>Chci se domluvit</option></select></label><label class="pc-wide">Obec nebo PSČ<input name="place" autocomplete="address-level2" required maxlength="200"></label><label class="pc-wide">Poznámka (nepovinné)<textarea name="note" rows="3" maxlength="600" placeholder="Upřesnění rozměrů, termínu nebo přístupu na pozemek…"></textarea></label></div><label class="pc-consent"><input type="checkbox" name="consent" required><span>Beru na vědomí informace o zpracování údajů pro vyřízení poptávky. <a href="/ochrana-osobnich-udaju.html" target="_blank" rel="noopener">Informace o zpracování údajů</a>.</span></label><div class="pc-actions"><button type="button" data-pc-continue class="pc-close-shopping">Pokračovat ve výběru</button><button type="submit" class="pc-primary">Odeslat poptávku košíku →</button></div></form>`;
    body.querySelectorAll('.pc-item').forEach(row => {
      const index=Number(row.dataset.index), input=row.querySelector('input');
      input.addEventListener('change',()=>{
        if(!input.reportValidity())return;
        items[index].qty=Number(input.value);save();
        row.querySelector('.pc-line-price').innerHTML=items[index].price===null?'K nacenění<small>Individuální nabídka</small>':`${money(items[index].price*items[index].qty/100)}<small>Orientačně od</small>`;
        body.querySelector('#pc-total').textContent=items.every(i=>i.price===null)?'K nacenění':`od ${money(totals()/100)}`;
      });
      row.querySelector('.pc-remove').addEventListener('click',()=>{items.splice(index,1);save();render();(body.querySelector('.pc-remove')||dialog.querySelector('.pc-close')).focus();});
    });
    body.querySelector('[data-pc-continue]').addEventListener('click',()=>dialog.close());
    body.querySelector('[name="phone"]').addEventListener('input',event=>event.target.setCustomValidity(''));
    if(draft)for(const [key,value] of Object.entries(draft)){const control=body.querySelector('form').elements.namedItem(key);if(control){if(control.type==='checkbox')control.checked=true;else control.value=value;}}
    body.querySelector('form').addEventListener('submit',submit);
  }
  function open() {if(busy)return;render();if(!dialog.open)dialog.showModal();dialog.querySelector('.pc-close').focus();}
  dialog.querySelector('.pc-close').addEventListener('click',()=>{if(!busy)dialog.close();});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  dialog.addEventListener('click',event=>{if(event.target===dialog&&!busy)dialog.close();});
  function product(card, form) {
    const name=(card.dataset.name||card.querySelector('h3')?.textContent||'Produkt').trim().slice(0,200);
    const base=(card.querySelector('.product-info p')?.textContent||'').trim();
    const options=form?[...form.querySelectorAll('select')].filter(select=>!select.closest('label')?.hidden).map(select=>`${select.getAttribute('aria-label')||select.name}: ${select.selectedOptions[0]?.textContent||''}`).join('; '):'';
    // Published card prices are starting prices, not a quote for another selected variant.
    const raw=card.dataset.price||card.querySelector('.product-price')?.textContent?.replace(/\s/g,'').match(/[\d]+(?:[,.]\d{1,2})?/)?.[0];
    const parsed=Number(String(raw||'').replace(',','.'));
    const price=options?null:(Number.isFinite(parsed)&&parsed>0?Math.round(parsed*100):null);
    const detail=[base,options].filter(Boolean).join(' · ').slice(0,800);
    const unit=card.querySelector('.product-price')?.textContent?.match(/\/\s*(bm|m|sada|ks)\b/i)?.[1]?.toLowerCase()||'ks';
    return {id:JSON.stringify([name,detail,price,unit]),name,detail,price,unit,qty:1,image:safeImage(card.querySelector('img')?.getAttribute('src'))};
  }
  function add(card, form) {
    if(!card)return;
    const item=product(card,form), existing=items.find(x=>x.id===item.id);
    if(existing&&existing.qty>=999){notify('Maximální množství je 999. Vyšší množství nám napište do poznámky.');return;}
    if(existing)existing.qty++;else {if(items.length>=20){notify('Košík může obsahovat nejvýše 20 různých položek.');return;}items.push(item);}
    save();notify(`${item.name} je v košíku.`);
  }
  document.querySelectorAll('.product-card').forEach(card=>{
    if(card.querySelector('[data-variant-open]'))return;
    const button=document.createElement('button');button.type='button';button.className='pc-add';button.textContent='Přidat do košíku';
    button.addEventListener('click',()=>add(card));(card.querySelector('.product-info')||card).append(button);
  });
  const variantForm=document.querySelector('#variantForm');
  if(variantForm){
    const button=document.createElement('button');button.type='button';button.className='pc-add pc-variant-add';button.textContent='Přidat vybranou variantu do košíku';
    button.addEventListener('click',()=>{if(!variantForm.reportValidity())return;add(activeCard,variantForm);document.querySelector('#variantModal [data-variant-close]')?.click();});variantForm.append(button);
  }
  document.addEventListener('click',event=>{
    const variant=event.target.closest('[data-variant-open]');if(variant)activeCard=variant.closest('.product-card');
    const link=event.target.closest('a');if(link&&(link.hash==='#kosik'||link.querySelector('.cart-count'))){event.preventDefault();open();}
  },true);
  document.querySelectorAll('header.site-header .mobile-tools').forEach(tools=>{
    const original=tools.closest('header').querySelector('.cart-count')?.closest('a');if(!original)return;
    const link=original.cloneNode(true);link.className='pc-mobile-cart';link.querySelector('span')?.remove();link.href='#kosik';tools.prepend(link);
  });
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;items=read();syncBadges();if(dialog.open&&!busy)render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#kosik')open();});
  syncBadges();if(location.hash==='#kosik')open();
  async function submit(event) {
    event.preventDefault();if(busy||!items.length)return;
    const form=event.currentTarget;
    if(!form.reportValidity()||![...body.querySelectorAll('.pc-item input')].every(input=>input.reportValidity()))return;
    const phone=form.elements.phone;
    phone.setCustomValidity(phone.value.trim()&&!/^\+?[\d\s()-]{9,30}$/.test(phone.value.trim())?'Zadejte platné telefonní číslo.':'');
    if(phone.value.trim()&&(phone.value.replace(/\D/g,'').length<9||phone.value.replace(/\D/g,'').length>15))phone.setCustomValidity('Telefon musí obsahovat 9 až 15 číslic.');
    if(!form.reportValidity())return;
    const snapshot=items.map(item=>({...item}));
    const note=['Poptávka košíku PLOTAO (nezávazná)',...snapshot.map((item,index)=>`${index+1}. ${item.name}\n${item.detail}\nMnožství: ${item.qty} ${item.unit}; ${item.price===null?'cena k potvrzení':`orientačně od ${money(item.price/100)}/${item.unit}; řádek od ${money(item.price*item.qty/100)}`}`),`Orientační součet oceněných položek: ${money(totals(snapshot)/100)}; doprava a konečné ceny k potvrzení.`,`Převzetí: ${form.elements.delivery.value}`,`Poznámka: ${form.elements.note.value.trim()}`,'Souhlas se zpracováním poptávky: udělen.'].join('\n\n');
    if(note.length>4000){status.dataset.error='true';status.textContent='Poptávka je příliš dlouhá. Zkraťte poznámku nebo odešlete položky ve dvou poptávkách.';return;}
    const payload={transportVersion:1,source:'plotao.cz',submittedAt:new Date().toISOString(),lead:{schemaVersion:2,mode:'help',name:form.elements.name.value.trim(),phone:phone.value.trim(),email:form.elements.email.value.trim(),place:form.elements.place.value.trim(),region:'',partner_share_consent:false,note}};
    busy=true;dialog.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=true);status.dataset.error='false';status.textContent='Odesílám poptávku košíku…';
    try {
      const response=await fetch('https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/submit-lead',{method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.id)throw Error('send_failed');
      // Preserve quantities added in another tab while this request was being sent.
      const current=storageAvailable?read():items;
      items=current.map(item=>({...item,qty:item.qty-(snapshot.find(sent=>sent.id===item.id)?.qty||0)})).filter(item=>item.qty>0);save();
      body.innerHTML='<div class="pc-empty"><h3>Poptávku košíku jsme přijali</h3><p>Ozveme se vám s potvrzením ceny, dostupnosti a dopravy.</p><a href="/eshop.html">Zpět do e-shopu →</a></div>';
      status.textContent=result.email_sent===true?'Potvrzení jsme poslali také na váš e-mail.':'Poptávka je uložená. Potvrzovací e-mail se zatím nepodařilo odeslat.';
    } catch {
      status.dataset.error='true';status.textContent='Odeslání se nepodařilo potvrdit. Položky i vyplněné údaje zůstávají v košíku. Zkontrolujte připojení a zkuste to znovu.';
    } finally {busy=false;dialog.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=false);}
  }
})();
