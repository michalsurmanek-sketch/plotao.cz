const ADMIN_EMAIL="michalsurmanek@seznam.cz";
const STATUSES=["new","review","waiting_customer","preparing_quote","quote_sent","waiting_decision","ordered","partner_assigned","completed","closed","contacted"];
const FROM_EMAIL="PLOTAO.cz <odpovedi@plotao.cz>";
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://plotao.cz","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"GET,PATCH,OPTIONS"}});
const decode=token=>{try{const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(atob(p.padEnd(p.length+((4-p.length%4)%4),"=")))}catch{return null}};
const allowed=req=>{const t=req.headers.get("authorization")?.replace(/^Bearer\\s+/i,"");const p=t&&decode(t);return p&&String(p.email||"").toLowerCase()===ADMIN_EMAIL};
const apiHeaders=key=>({apikey:key,Authorization:"Bearer "+key});
const leadUrl=(base,id,select="*")=>base+"/rest/v1/plotao_leads?id=eq."+encodeURIComponent(id)+"&select="+encodeURIComponent(select);
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return json({ok:true});
 if(!allowed(req))return json({error:"admin_forbidden"},403);
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return json({error:"server_config"},500);
 if(req.method==="GET"){
  const r=await fetch(base+"/rest/v1/plotao_leads?select=*&order=created_at.desc&limit=500",{headers:apiHeaders(key)});
  return json(await r.json(),r.status)
 }
 if(req.method==="PATCH"){
  let b;try{b=await req.json()}catch{return json({error:"invalid_json"},400)}
  if(!b.id||!/^[0-9a-f-]{36}$/i.test(b.id))return json({error:"invalid_id"},422);
  const update={updated_at:new Date().toISOString()};
  if("send_reply" in b){
   if(typeof b.send_reply!=="string"||b.send_reply.trim().length<2||b.send_reply.length>10000)return json({error:"invalid_reply"},422);
   if(typeof b.request_id!=="string"||!/^[0-9a-f-]{36}$/i.test(b.request_id))return json({error:"invalid_request_id"},422);
   const resendKey=Deno.env.get("RESEND_API_KEY");
   if(!resendKey)return json({error:"resend_not_configured"},503);
   const current=await fetch(leadUrl(base,b.id,"id,email,name,communication,status"),{headers:apiHeaders(key)});
   if(!current.ok)return json({error:"lead_read_failed"},current.status);
   const rows=await current.json(),lead=rows[0];
   if(!lead)return json({error:"lead_not_found"},404);
   if(typeof lead.email!=="string"||!/^\\S+@\\S+\\.\\S+$/.test(lead.email))return json({error:"invalid_lead_email"},422);
   const text=b.send_reply.trim();
   let sendResponse;
   try{
    sendResponse=await fetch("https://api.resend.com/emails",{
     method:"POST",
     headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":b.request_id},
     body:JSON.stringify({from:FROM_EMAIL,to:[lead.email],reply_to:ADMIN_EMAIL,subject:"Re: Poptávka na oplocení – PLOTAO.cz",text:"Dobrý den,\\n\\n"+text+"\\n\\nS pozdravem,\\nPLOTAO.cz"})
    })
   }catch(error){console.error("resend network failure",error instanceof Error?error.message:"unknown");return json({error:"email_send_failed"},502)}
   let sent:Record<string,any>={};try{sent=await sendResponse.json()}catch{}
   if(!sendResponse.ok){console.error("resend rejected email",sendResponse.status,sent?.name||"");return json({error:"email_send_failed",provider_status:sendResponse.status},502)}
   const history=Array.isArray(lead.communication)?lead.communication:[];
   update.communication=[...history,{direction:"out",body:text,sent_at:new Date().toISOString(),provider:"resend",provider_id:sent.id||null}];
   if(["new","review","contacted"].includes(lead.status))update.status="waiting_customer";
   const save=await fetch(leadUrl(base,b.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(update)});
   let saved;try{saved=await save.json()}catch{}
   if(!save.ok){console.error("email sent but lead history save failed",save.status);return json({error:"email_sent_log_failed",email_sent:true},502)}
   return json({...((Array.isArray(saved)?saved[0]:saved)||{}),email_sent:true},200)
  }
  if(typeof b.status==="string"){if(!STATUSES.includes(b.status))return json({error:"invalid_status"},422);update.status=b.status}
  for(const k of ["assigned_to","next_action","partner_name","region","outcome"]){if(k in b){if(typeof b[k]!=="string"||b[k].length>300)return json({error:"invalid_"+k},422);update[k]=b[k]}}
  if("reply" in b){if(typeof b.reply!=="string"||b.reply.trim().length<2||b.reply.length>10000)return json({error:"invalid_reply"},422);const current=await fetch(leadUrl(base,b.id,"communication"));if(!current.ok)return json({error:"lead_read_failed"},current.status);const rows=await current.json();if(!rows.length)return json({error:"lead_not_found"},404);const history=Array.isArray(rows[0].communication)?rows[0].communication:[];update.communication=[...history,{direction:"out",body:b.reply.trim(),recorded_at:new Date().toISOString()}]}
  if("next_action_at" in b){if(b.next_action_at!==null&&(typeof b.next_action_at!=="string"||!Number.isFinite(Date.parse(b.next_action_at))))return json({error:"invalid_next_action_at"},422);update.next_action_at=b.next_action_at}
  if(Object.keys(update).length===1)return json({error:"empty_update"},422);
  const r=await fetch(leadUrl(base,b.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(update)});
  const data=await r.json();return json(Array.isArray(data)?data[0]:data,r.status)
 }
 return json({error:"method_not_allowed"},405)
});
