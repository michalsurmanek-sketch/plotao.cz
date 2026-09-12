(()=>{
  const core=window.PLOTAO_LEAD_TRANSPORT_CORE;if(!core){console.error('PLOTAO lead transport core is missing');return}
  function config(){return window.PLOTAO_LEAD_TRANSPORT_CONFIG||{}}
  function available(){return core.prepare({schemaVersion:2,mode:'help',name:'x',phone:'x',email:'x'},config()).ok}
  async function submit(payload){
    const prepared=core.prepare(payload,config());if(!prepared.ok)return{ok:false,code:prepared.code};
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await fetch(prepared.endpoint,{...prepared.request,signal:controller.signal});
      if(!res.ok)return{ok:false,code:'http',status:res.status};
      let body=null;try{body=await res.json()}catch{}
      return{ok:true,status:res.status,id:body&&typeof body.id==='string'?body.id:'',body};
    }catch(err){return{ok:false,code:err?.name==='AbortError'?'timeout':'network'}}finally{clearTimeout(timer)}
  }
  window.PLOTAO_LEAD_TRANSPORT={available,submit};
})();
