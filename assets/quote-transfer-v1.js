(() => {
  'use strict';
  const q=s=>document.querySelector(s);
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[data-quote-transfer]');if(!link)return;
    const type=q('.type.on')?.dataset.id||'', scope=q('#scope .on')?.dataset.v;
    const data={type,place:q('#place')?.value||q('#locationInput')?.value||'',height:q('#height')?.value||'',scope:scope==='turnkey'?'Montáž na klíč':scope==='delivery'?'Materiál s dopravou':'Materiál',segments:[...document.querySelectorAll('#segmentList .segment')].map((s,i)=>({name:s.querySelector('[data-segment-name]')?.value||'Úsek '+(i+1),length:s.querySelector('input[type=number]')?.value||''})),options:[...document.querySelectorAll('#options .on,#privacyConfig .on,#aluminiumConfig .on,#gabionOptionsBox .on,#metalConfig .on,#concreteConfig .on,#extraFenceConfig .on')].map(el=>el.textContent.trim()),note:q('#form [name=note]')?.value||''};
    if(q('#gate')?.checked)data.options.push('Brána: '+(q('#gateType')?.selectedOptions?.[0]?.textContent||'')+' / '+(q('#gateWidth')?.value||'')+' m / '+(q('#gateDrive')?.selectedOptions?.[0]?.textContent||''));
    if(q('#door')?.checked)data.options.push('Branka: '+(q('#doorWidth')?.value||'')+' m');
    try{sessionStorage.setItem('plotao.quote-transfer',JSON.stringify(data));}catch{}
  });
})();
