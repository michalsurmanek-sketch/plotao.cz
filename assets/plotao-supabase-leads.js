(()=>{
  const ENDPOINT='https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/submit-lead';
  const API_KEY='sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V';
  const now=()=>new Date().toISOString();
  const val=(form,name)=>String(form.elements?.[name]?.value||'').trim();
  const shareConsent=form=>form.elements.namedItem('partnerShareConsent')?.checked===true;
  const selectedRegion=form=>{
    try{
      const value=JSON.parse(localStorage.getItem('plotao.location')||'null');
      if(!value?.region)return '';
      if(form.id==='form')return value.region;
      const normalize=s=>String(s||'').toLocaleLowerCase('cs-CZ').replace(/[\\s,]+/g,'');
      const place=normalize(val(form,'place')),label=normalize(value.label),region=normalize(value.region);
      return place&&(label.includes(place)||place.includes(label)||place.includes(region))?value.region:'';
    }catch{return ''}
  };
  const statusFor=form=>form.querySelector('[role="status"]')||document.querySelector('#status,#contactStatus');
  async function send(payload,status){
    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json',apikey:API_KEY},
        body:JSON.stringify(payload)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'send_failed');
      if(status)status.textContent='Odesláno. Brzy se vám ozveme.';
      return result;
    }catch(error){
      console.warn('PLOTAO lead submit failed',error);
      if(status)status.textContent='Odeslání se nepodařilo. Zkuste to prosím znovu.';
      return null;
    }
  }
  function submitForm(form){
    const status=statusFor(form);
    const name=val(form,'name'),phone=val(form,'phone'),email=val(form,'email'),place=val(form,'place');
    if(form.id==='contactForm'){
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:'help',name,phone,email,place,region:selectedRegion(form),partner_share_consent:shareConsent(form),note:val(form,'message')}},status);
    }
    if(form.id==='quoteForm'){
      const segmentNodes=[...document.querySelectorAll('#segments .segment')];
      const segments=segmentNodes.map((node,index)=>({name:node.querySelector('[data-name]')?.value||'Úsek '+(index+1),length:Number(node.querySelector('[data-length]')?.value)||0,connection:index===0?'začátek':'navazuje rohem'}));
      const height=Number(segmentNodes[0]?.querySelector('[data-height]')?.value)||180;
      const extras=[
        val(form,'color')&&'Povrch: '+val(form,'color'),
        val(form,'variant')&&'Varianta: '+val(form,'variant'),
        form.elements.slab?.checked&&'Podhrabové desky: '+val(form,'slabHeight'),
        form.elements.privacy?.checked&&'Neprůhledný plot / soukromí',
        val(form,'gate')&&'Brána: '+val(form,'gate'),
        val(form,'gateWidth')&&'Šířka brány: '+val(form,'gateWidth')+' m',
        val(form,'drive')&&'Ovládání: '+val(form,'drive'),
        val(form,'wickets')&&'Počet branek: '+val(form,'wickets'),
        val(form,'terrain')&&'Terén: '+val(form,'terrain'),
        val(form,'access')&&'Přístup techniky: '+val(form,'access'),
        form.elements.demolition?.checked&&'Demontáž původního plotu',
        val(form,'obstacles')&&'Podloží a překážky: '+val(form,'obstacles'),
        val(form,'timing')&&'Požadovaný termín: '+val(form,'timing'),
        ...segmentNodes.map((node,index)=>'Výška úseku '+(index+1)+': '+(node.querySelector('[data-height]')?.value||'')+' cm')
      ].filter(Boolean);
      const fullNote=[val(form,'note'),...extras].filter(Boolean).join('\\n');
      const scope=val(form,'scope');
      const scopeValue=scope.includes('klíč')?'turnkey':scope.includes('dopravou')?'delivery':'material';
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:'lead',name,phone,email,place,region:selectedRegion(form),partner_share_consent:shareConsent(form),note:fullNote,fenceType:val(form,'fenceType')||val(form,'extraType')||'Neupřesněno',height,segments,options:extras,gate:false,wicket:false,scopeValue,scope,displayedPrice:'',priceKind:'individuální nabídka'}},status);
    }
    if(form.id==='form'){
      const help=(document.querySelector('#modalTitle')?.textContent||'').includes('poradit');
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:help?'help':'lead',name,phone,email,place,region:selectedRegion(form),partner_share_consent:shareConsent(form),note:val(form,'note')||document.querySelector('#modalText')?.textContent||'Dotaz z kalkulátoru',fenceType:'Kalkulátor plotu',height:180,segments:[{name:'Hlavní úsek',length:10,connection:'začátek'}],options:[],gate:false,wicket:false,scopeValue:'material',scope:'Materiál',displayedPrice:'',priceKind:'individuální nabídka'}},status);
    }
    return null;
  }
  document.addEventListener('submit',event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||!['contactForm','quoteForm','form'].includes(form.id))return;
    event.preventDefault();
    submitForm(form);
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#downloadQuote');
    if(!button)return;
    const form=document.querySelector('#quoteForm');
    if(!form)return;
    event.preventDefault();
    if(form.reportValidity())form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  });
})();