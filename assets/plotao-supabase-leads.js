(()=>{
  const ENDPOINT='https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/submit-lead';
  const API_KEY='sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V';
  const now=()=>new Date().toISOString();
  const val=(form,name)=>String(form.elements?.[name]?.value||'').trim();
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
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:'help',name,phone,email,place,note:val(form,'message')}},status);
    }
    if(form.id==='quoteForm'){
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:'lead',name,phone,email,place,note:val(form,'note'),fenceType:val(form,'fenceType')||val(form,'extraType')||'Neupřesněno',height:180,segments:[{name:'Hlavní úsek',length:10,connection:'začátek'}],options:[val(form,'color'),val(form,'variant'),val(form,'slab')?'Podhrabové desky':''].filter(Boolean),gate:false,wicket:false,scopeValue:'material',scope:val(form,'scope'),displayedPrice:'',priceKind:'individuální nabídka'}},status);
    }
    if(form.id==='form'){
      const help=(document.querySelector('#modalTitle')?.textContent||'').includes('poradit');
      return send({transportVersion:1,source:'plotao.cz',submittedAt:now(),lead:{schemaVersion:2,mode:help?'help':'lead',name,phone,email,place,note:val(form,'note')||document.querySelector('#modalText')?.textContent||'Dotaz z kalkulátoru',fenceType:'Kalkulátor plotu',height:180,segments:[{name:'Hlavní úsek',length:10,connection:'začátek'}],options:[],gate:false,wicket:false,scopeValue:'material',scope:'Materiál',displayedPrice:'',priceKind:'individuální nabídka'}},status);
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