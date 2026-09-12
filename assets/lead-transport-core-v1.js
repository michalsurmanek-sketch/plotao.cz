(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_LEAD_TRANSPORT_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION=1,MODES=new Set(['lead','help','partner']);
  function text(v,max=500){return String(v??'').trim().slice(0,max)}
  function normalizeEndpoint(raw){
    const value=text(raw,1000);if(!value)return null;
    try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash)return null;return u.href}catch{return null}
  }
  function normalizeOrigins(items){const out=[];for(const raw of Array.isArray(items)?items:[]){try{const u=new URL(text(raw,1000));if(u.protocol!=='https:')continue;const origin=u.origin;if(!out.includes(origin))out.push(origin)}catch{}if(out.length>=20)break}return out}
  function validatePayload(payload){return!!(payload&&typeof payload==='object'&&payload.schemaVersion===2&&MODES.has(payload.mode)&&typeof payload.name==='string'&&typeof payload.phone==='string'&&typeof payload.email==='string')}
  function prepare(payload,config={},now){
    if(!validatePayload(payload))return{ok:false,code:'payload'};
    if(config.enabled!==true)return{ok:false,code:'disabled'};
    const endpoint=normalizeEndpoint(config.endpoint);if(!endpoint)return{ok:false,code:'disabled'};
    const allowedOrigins=normalizeOrigins(config.allowedOrigins),origin=new URL(endpoint).origin;
    if(!allowedOrigins.includes(origin))return{ok:false,code:'origin'};
    const submittedAt=text(now,40)||new Date().toISOString();
    return{ok:true,endpoint,request:{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin',body:JSON.stringify({transportVersion:VERSION,source:'plotao.cz',submittedAt,lead:payload})}};
  }
  return{VERSION,normalizeEndpoint,normalizeOrigins,validatePayload,prepare};
});
