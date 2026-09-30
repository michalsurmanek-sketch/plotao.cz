(()=>{
  const core=window.PLOTAO_LEAD_TRANSPORT_CORE;
  if(!core){console.error('PLOTAO lead transport core is missing');return}
  function config(){return window.PLOTAO_LEAD_TRANSPORT_CONFIG||{}}
  function available(){return core.prepare({schemaVersion:2,mode:'help',name:'Test User',phone:'777888999',email:'test@example.com'},config()).ok}
  async function submit(payload){
    const prepared=core.prepare(payload,config());
    if(!prepared.ok)return{ok:false,code:prepared.code};
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(prepared.endpoint,{...prepared.request,signal:controller.signal});
      let body=null;try{body=await response.json()}catch{}
      if(!response.ok)return{ok:false,code:body?.error||'http',status:response.status,fields:body?.fields||[]};
      return{ok:true,status:response.status,id:typeof body?.id==='string'?body.id:'',body};
    }catch(error){return{ok:false,code:error?.name==='AbortError'?'timeout':'network'};}
    finally{clearTimeout(timer)}
  }
  window.PLOTAO_LEAD_TRANSPORT={available,submit};
})();
