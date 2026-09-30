const ADMIN_EMAIL="michalsurmanek@seznam.cz";
const STATUSES=["new","review","waiting_customer","preparing_quote","quote_sent","waiting_decision","ordered","partner_assigned","completed","closed","contacted"];
const FROM_EMAIL="PLOTAO.cz <odpovedi@plotao.cz>";
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://plotao.cz","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"}});
const decode=token=>{try{const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(atob(p.padEnd(p.length+((4-p.length%4)%4),"=")))}catch{return null}};
const allowed=req=>{const t=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");const p=t&&decode(t);return p&&String(p.email||"").toLowerCase()===ADMIN_EMAIL};
const apiHeaders=key=>({apikey:key,Authorization:"Bearer "+key});
const leadUrl=(base,id,select="*")=>base+"/rest/v1/plotao_leads?id=eq."+encodeURIComponent(id)+"&select="+encodeURIComponent(select);
const PARTNER_REGIONS=["Hlavní město Praha","Středočeský kraj","Jihočeský kraj","Plzeňský kraj","Karlovarský kraj","Ústecký kraj","Liberecký kraj","Královéhradecký kraj","Pardubický kraj","Kraj Vysočina","Jihomoravský kraj","Olomoucký kraj","Zlínský kraj","Moravskoslezský kraj"];
const PARTNER_SERVICE_TYPES=["installation_material","installation_only","material_only"];
const PARTNER_TYPES=["Panelový plot","Pletivový plot","Betonový plot","Gabionový plot","Hliníkový plot","Kovový plot","Zděný plot","Mobilní oplocení","Živý plot","Všechny typy"];
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const validId=v=>typeof v==="string"&&/^[0-9a-f-]{36}$/i.test(v);
const partnerUrl=(base,id)=>base+"/rest/v1/plotao_partners?id=eq."+encodeURIComponent(id)+"&select=*";
const referralUrl=(base,id)=>base+"/rest/v1/plotao_lead_referrals?id=eq."+encodeURIComponent(id)+"&select=*";
function cleanPartner(v){
 if(!v||typeof v!=="object")return null;
 const company_name=String(v.company_name||"").trim().slice(0,160),contact_name=String(v.contact_name||"").trim().slice(0,120),email=String(v.email||"").trim().toLowerCase(),phone=String(v.phone||"").trim().slice(0,40),ico=String(v.ico||"").replace(/\s/g,"").slice(0,20),registered_address=String(v.registered_address||"").trim().slice(0,255);
 const regions=Array.isArray(v.regions)?[...new Set(v.regions.filter(x=>PARTNER_REGIONS.includes(x)))]:[];
 const fence_types=Array.isArray(v.fence_types)?[...new Set(v.fence_types.filter(x=>PARTNER_TYPES.includes(x)))]:[];
 const service_types=Array.isArray(v.service_types)?[...new Set(v.service_types.filter(x=>PARTNER_SERVICE_TYPES.includes(x)))]:[];
 if(company_name.length<2||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!regions.length||!fence_types.length||!service_types.length)return null;
 if(ico&&!/^\d{8}$/.test(ico))return null;
 return{company_name,contact_name,email,phone,ico,registered_address,regions,fence_types,service_types,active:v.active!==false,updated_at:new Date().toISOString()};
}

function bytesToHex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function sha256(value){return bytesToHex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))}
const quoteUrl=(base,id,select="*")=>base+"/rest/v1/plotao_quotes?id=eq."+encodeURIComponent(id)+"&select="+encodeURIComponent(select);
async function decideQuote(base,key,quoteId,status,source,note,actor,tokenHash=null){
 const r=await fetch(base+"/rest/v1/rpc/plotao_set_quote_decision",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({p_quote_id:quoteId,p_status:status,p_source:source,p_note:note,p_actor:actor,p_token_hash:tokenHash})});
 let data;try{data=await r.json()}catch{data=null}return{response:r,data}
}
function regionForLead(lead){
 const value=String(lead.region||lead.payload?.region||"")+" "+String(lead.place||"")+" "+String(lead.payload?.placeFromCalculator||"");
 return PARTNER_REGIONS.find(region=>norm(value).includes(norm(region)))||"";
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return json({ok:true});
 if(!allowed(req))return json({error:"admin_forbidden"},403);
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return json({error:"server_config"},500);
 if(req.method==="GET"){
  const resource=new URL(req.url).searchParams.get("resource")||"leads";
  if(resource==="quote_decision"){
   const id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
   if(!validId(id)||!/^[A-Za-z0-9_-]{40,100}$/.test(token))return json({error:"invalid_decision_link"},400);
   const hash=await sha256(token),found=await fetch(quoteUrl(base,id,"id,quote_number,status,decision_token_hash"),{headers:apiHeaders(key)});
   if(!found.ok)return json({error:"quote_read_failed"},found.status);
   const rows=await found.json(),q=rows[0];if(!q||q.status!=="sent"||q.decision_token_hash!==hash)return json({error:"decision_link_unavailable"},404);
   return json({quote_number:q.quote_number,status:q.status})
  }
  if(resource==="quotes"){
   const r=await fetch(base+"/rest/v1/plotao_quotes?select=*,plotao_customers(id,full_name,email,phone),plotao_leads(id,name,email,phone,place,region,payload),plotao_quote_items(*),plotao_quote_events(*)&order=created_at.desc&limit=1000",{headers:apiHeaders(key)});
   return json(await r.json(),r.status)
  }
  if(resource==="partners"){
   const r=await fetch(base+"/rest/v1/plotao_partners?select=*&order=company_name.asc",{headers:apiHeaders(key)});
   return json(await r.json(),r.status)
  }
  if(resource==="referrals"){
   const r=await fetch(base+"/rest/v1/plotao_lead_referrals?select=*,plotao_partners(id,company_name,email)&order=created_at.desc&limit=1000",{headers:apiHeaders(key)});
   return json(await r.json(),r.status)
  }
  const r=await fetch(base+"/rest/v1/plotao_leads?select=*&order=created_at.desc&limit=500",{headers:apiHeaders(key)});
  return json(await r.json(),r.status)
 }
 if(req.method==="POST"){
  let b;try{b=await req.json()}catch{return json({error:"invalid_json"},400)}
  if(b.action==="customer_quote_decision"){
   if(!validId(b.quote_id)||!["accepted","declined"].includes(b.status))return json({error:"invalid_quote_decision"},422);
   const token=typeof b.token==="string"?b.token:"";if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))return json({error:"invalid_decision_token"},422);
   const allowed=await fetch(quoteUrl(base,b.quote_id,"id,quote_number,lead_id,status,decision_token_hash"),{headers:apiHeaders(key)});if(!allowed.ok)return json({error:"quote_read_failed"},allowed.status);
   const rows=await allowed.json(),quote=rows[0];if(!quote||quote.status!=="sent"||quote.decision_token_hash!==await sha256(token))return json({error:"decision_link_unavailable"},404);
   const result=await decideQuote(base,key,b.quote_id,b.status,"customer_link",typeof b.note==="string"?b.note.trim().slice(0,1000):"","zákazník",await sha256(token));
   if(!result.response.ok)return json({error:"decision_link_unavailable"},result.response.status===409?409:404);
   if(quote.lead_id)await fetch(leadUrl(base,quote.lead_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:b.status==="accepted"?"ordered":"review",updated_at:new Date().toISOString()})});
   return json({ok:true,quote_number:result.data.quote_number,status:result.data.status})
  }
  if(b.action==="create_quote"){
   if(!validId(b.lead_id))return json({error:"invalid_lead_id"},422);
   const leadRes=await fetch(leadUrl(base,b.lead_id,"id,customer_id,name,email,phone,place,region,payload,created_at"),{headers:apiHeaders(key)});
   if(!leadRes.ok)return json({error:"lead_read_failed"},leadRes.status);
   const leadsFound=await leadRes.json(),lead=leadsFound[0];
   if(!lead)return json({error:"lead_not_found"},404);
   if(!validId(lead.customer_id))return json({error:"customer_link_missing"},409);
   const prior=await fetch(base+"/rest/v1/plotao_quotes?lead_id=eq."+encodeURIComponent(lead.id)+"&select=version&order=version.desc&limit=1",{headers:apiHeaders(key)});
   if(!prior.ok)return json({error:"quote_version_read_failed"},prior.status);
   const priorRows=await prior.json(),version=Number(priorRows[0]?.version||0)+1;
   const payload=lead.payload&&typeof lead.payload==="object"?lead.payload:{};
   const segments=Array.isArray(payload.segments)?payload.segments:[];
   const length=segments.reduce((sum,x)=>sum+(Number(x?.length)||0),0);
   const details=[payload.scope?String(payload.scope):"",payload.height?"Výška "+String(payload.height)+" cm":"",segments.map((x,n)=>"Úsek "+(n+1)+": "+(Number(x?.length)||0)+" m").join("; "),Array.isArray(payload.options)?payload.options.join(", "):"",lead.note?"Poznámka: "+lead.note:""].filter(Boolean).join("\n").slice(0,4000);
   const item={position:1,category:"material",product_name:String(payload.fenceType||"Oplocení").slice(0,200),description:details,quantity:length>0?length:1,unit:length>0?"m":"soubor",purchase_unit_price:0,sale_unit_price:0,vat_percent:21};
   const create=await fetch(base+"/rest/v1/plotao_quotes",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({lead_id:lead.id,customer_id:lead.customer_id,version,status:"draft",created_by:ADMIN_EMAIL,source_snapshot:payload,plotao_quote_items:[item]})});
   let saved;try{saved=await create.json()}catch{saved=null}
   if(!create.ok)return json({error:"quote_create_failed"},create.status);
   return json(Array.isArray(saved)?saved[0]:saved,201)
  }
  if(b.action!=="create_partner")return json({error:"invalid_action"},422);
  const partner=cleanPartner(b.partner);
  if(!partner)return json({error:"invalid_partner"},422);
  const r=await fetch(base+"/rest/v1/plotao_partners",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(partner)});
  let data;try{data=await r.json()}catch{data=null}
  if(!r.ok)return json({error:"partner_save_failed"},r.status);
  return json(Array.isArray(data)?data[0]:data,201)
 }
 if(req.method==="PATCH"){
  let b;try{b=await req.json()}catch{return json({error:"invalid_json"},400)}
  if(b.action==="send_quote"){
   if(!validId(b.quote_id))return json({error:"invalid_quote_id"},422);
   const read=await fetch(quoteUrl(base,b.quote_id,"*,plotao_customers(id,full_name,email,phone),plotao_leads(id,name,email,phone,place,payload),plotao_quote_items(*)"),{headers:apiHeaders(key)});
   if(!read.ok)return json({error:"quote_read_failed"},read.status);const rows=await read.json(),q=rows[0];if(!q)return json({error:"quote_not_found"},404);
   if(q.status!=="draft")return json({error:"quote_not_draft"},409);
   const customer=q.plotao_customers||{},email=String(customer.email||q.plotao_leads?.email||"").trim();if(!/^\\S+@\\S+\\.\\S+$/.test(email))return json({error:"customer_email_missing"},422);
   const items=Array.isArray(q.plotao_quote_items)?q.plotao_quote_items:[];if(!items.length||items.some(i=>Number(i.sale_unit_price)<=0))return json({error:"quote_prices_incomplete"},409);
   const percent=1-(Number(q.discount_percent)||0)/100;const net=items.reduce((s,i)=>s+(Number(i.net_total)||0),0)*percent;const vat=items.reduce((s,i)=>s+(Number(i.vat_total)||0),0)*percent;const gross=net+vat;
   const date=q.valid_until?new Date(q.valid_until).toLocaleDateString("cs-CZ",{timeZone:"Europe/Prague"}):"neuvedena";
   const itemText=items.map(i=>String(i.product_name)+" · "+Number(i.quantity)+" "+i.unit+" · "+Number(i.net_total||0).toLocaleString("cs-CZ")+" Kč bez DPH").join("\n");
   const token=crypto.randomUUID()+crypto.randomUUID(),hash=await sha256(token),sentAt=new Date().toISOString();
   const updated=await fetch(quoteUrl(base,q.id)+"&status=eq.draft",{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({status:"sent",sent_at:sentAt,sent_to_email:email,email_provider_id:null,decision_token_hash:hash,decision_source:"",decision_note:"",decision_by:"",decision_event_at:null,updated_at:sentAt})});let saved;try{saved=await updated.json()}catch{saved=null}if(!updated.ok)return json({error:"quote_send_prepare_failed"},updated.status);if(!Array.isArray(saved)||!saved[0])return json({error:"quote_send_conflict"},409);
   const baseUrl=Deno.env.get("PLOTAO_SITE_URL")?.trim()||"https://plotao.cz",decisionUrl=baseUrl+"/nabidka-rozhodnuti.html?id="+encodeURIComponent(q.id)+"&token="+encodeURIComponent(token);
   const message=["Dobrý den, "+(customer.full_name||q.plotao_leads?.name||""), "", "zasíláme vám cenovou nabídku "+q.quote_number+".", "", "Detail nabídky: "+decisionUrl, "", "Položky:",itemText,"","Celkem včetně DPH: "+gross.toLocaleString("cs-CZ")+" Kč","Platnost do: "+date,"", "Pro přijetí nabídky otevřete tento odkaz: "+decisionUrl+"&decision=accepted","Pro odmítnutí nabídky otevřete tento odkaz: "+decisionUrl+"&decision=declined","", "PLOTAO.cz"].join("\n");
   const resendKey=Deno.env.get("RESEND_API_KEY")?.trim();if(!resendKey){await fetch(quoteUrl(base,q.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"draft",decision_token_hash:null,sent_at:null,sent_to_email:"",updated_at:new Date().toISOString()})});return json({error:"resend_not_configured"},503)}
   let send;try{send=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":"plotao-quote-"+q.id+"-"+Date.now()},body:JSON.stringify({from:FROM_EMAIL,to:[email],reply_to:ADMIN_EMAIL,subject:"Cenová nabídka "+q.quote_number+" – PLOTAO.cz",text:message})})}catch{send=null}
   let provider={};if(send)try{provider=await send.json()}catch{}if(!send?.ok){await fetch(quoteUrl(base,q.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"draft",decision_token_hash:null,sent_at:null,updated_at:new Date().toISOString()})});return json({error:"quote_email_failed"},502)}
   const sentRow=Array.isArray(saved)?saved[0]:saved;await fetch(quoteUrl(base,q.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({email_provider_id:provider.id||null,updated_at:new Date().toISOString()})});await fetch(base+"/rest/v1/plotao_quote_events",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({quote_id:q.id,event_type:"sent",event_source:"email",actor:ADMIN_EMAIL,note:"E-mail odeslán zákazníkovi"})});
   if(q.lead_id)await fetch(leadUrl(base,q.lead_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"quote_sent",updated_at:sentAt})});
   return json({ok:true,id:q.id,status:"sent",sent_to_email:email,provider_id:provider.id||null,quote:sentRow})
  }
  if(b.action==="quote_decision_admin"){
   if(!validId(b.quote_id)||!["accepted","declined"].includes(b.status))return json({error:"invalid_quote_decision"},422);
   const note=typeof b.note==="string"?b.note.trim().slice(0,1000):"";
   const result=await decideQuote(base,key,b.quote_id,b.status,"admin_manual",note,ADMIN_EMAIL);
   if(!result.response.ok)return json({error:"quote_decision_unavailable"},409);
   const q=result.data;if(q.lead_id)await fetch(leadUrl(base,q.lead_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:q.status==="accepted"?"ordered":"review",updated_at:new Date().toISOString()})});
   return json(q,200)
  }
  if(b.action==="save_quote"){
   if(!validId(b.quote_id))return json({error:"invalid_quote_id"},422);
   const discount=Number(b.discount_percent??0);
   if(!Number.isFinite(discount)||discount<0||discount>100)return json({error:"invalid_discount"},422);
   const note=typeof b.note==="string"?b.note.trim().slice(0,4000):"";
   const validUntil=b.valid_until===""?null:b.valid_until;
   if(validUntil!==null&&(typeof validUntil!=="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(validUntil)||!Number.isFinite(Date.parse(validUntil))))return json({error:"invalid_valid_until"},422);
   if(!Array.isArray(b.items)||b.items.length<1||b.items.length>100)return json({error:"invalid_quote_items"},422);
   const items=[];
   for(let i=0;i<b.items.length;i++){
    const row=b.items[i]||{},number=(value,fallback=0)=>value===""||value==null?fallback:Number(value);
    const quantity=number(row.quantity),purchase=number(row.purchase_unit_price),sale=number(row.sale_unit_price),rowDiscount=number(row.discount_percent),vat=number(row.vat_percent,21);
    if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000||![purchase,sale,rowDiscount,vat].every(Number.isFinite)||purchase<0||sale<0||purchase>100000000||sale>100000000||rowDiscount<0||rowDiscount>100||vat<0||vat>100)return json({error:"invalid_quote_item",position:i},422);
    if(!["material","installation","transport","other"].includes(row.category))return json({error:"invalid_quote_item_category",position:i},422);
    const product=String(row.product_name||"").trim().slice(0,200);
    if(!product)return json({error:"quote_item_name_required",position:i},422);
    items.push({position:i+1,category:row.category,product_name:product,description:String(row.description||"").trim().slice(0,2000),sku:String(row.sku||"").trim().slice(0,80),quantity,unit:String(row.unit||"ks").trim().slice(0,30),purchase_unit_price:purchase,sale_unit_price:sale,discount_percent:rowDiscount,vat_percent:vat});
   }
   const saved=await fetch(base+"/rest/v1/rpc/plotao_save_quote",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({p_quote_id:b.quote_id,p_discount_percent:discount,p_note:note,p_valid_until:validUntil,p_items:items})});
   let data;try{data=await saved.json()}catch{data=null}
   if(!saved.ok)return json({error:"quote_save_failed",detail:data?.message||data?.details||""},saved.status);
   return json(data,200)
  }
  if(b.action==="update_partner"){
   if(!validId(b.partner_id))return json({error:"invalid_partner_id"},422);
   const partner=cleanPartner(b.partner);
   if(!partner)return json({error:"invalid_partner"},422);
   const r=await fetch(partnerUrl(base,b.partner_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(partner)});
   let data;try{data=await r.json()}catch{data=null}
   if(!r.ok)return json({error:"partner_save_failed"},r.status);
   return json(Array.isArray(data)?data[0]:data,200)
  }
  if(b.action==="send_to_partner"){
   if(!validId(b.id)||!validId(b.partner_id))return json({error:"invalid_id"},422);
   const leadRes=await fetch(leadUrl(base,b.id,"id,mode,name,email,phone,place,note,payload,status,region"),{headers:apiHeaders(key)});
   if(!leadRes.ok)return json({error:"lead_read_failed"},leadRes.status);
   const leadRows=await leadRes.json(),lead=leadRows[0];
   if(!lead)return json({error:"lead_not_found"},404);
   if(lead.payload?.partner_share_consent!==true)return json({error:"partner_consent_required"},409);
   const region=regionForLead(lead);
   if(!region)return json({error:"partner_region_required"},409);
   const partnerRes=await fetch(partnerUrl(base,b.partner_id),{headers:apiHeaders(key)});
   if(!partnerRes.ok)return json({error:"partner_read_failed"},partnerRes.status);
   const partnerRows=await partnerRes.json(),partner=partnerRows[0];
   if(!partner)return json({error:"partner_not_found"},404);
   if(!partner.active)return json({error:"partner_inactive"},409);
   if(!Array.isArray(partner.regions)||!partner.regions.includes(region))return json({error:"partner_region_mismatch"},409);
   const fenceType=String(lead.payload?.fenceType||"");
   const typeKnown=fenceType&&!["neupresneno","kalkulatorplotu","poraditsvyberem"].includes(norm(fenceType));
   const typeMatches=!typeKnown||partner.fence_types?.includes("Všechny typy")||(Array.isArray(partner.fence_types)&&partner.fence_types.some(t=>norm(fenceType).includes(norm(t))||norm(t).includes(norm(fenceType))));
   if(!typeMatches)return json({error:"partner_type_mismatch"},409);
   const scope=String(lead.payload?.scopeValue||"material"),services=Array.isArray(partner.service_types)?partner.service_types:["material_only"];
   const installNeeded=scope==="turnkey"||scope==="installation",materialNeeded=scope!=="installation";
   const serviceMatches=(!installNeeded||services.includes("installation_material")||services.includes("installation_only"))&&(!materialNeeded||services.includes("installation_material")||services.includes("material_only"));
   if(!serviceMatches)return json({error:"partner_service_mismatch"},409);
   if(!lead.email&&!lead.phone)return json({error:"lead_has_no_contact"},409);
   const active=await fetch(base+"/rest/v1/plotao_lead_referrals?select=id&lead_id=eq."+encodeURIComponent(b.id)+"&status=in.(sending,sent,accepted)",{headers:apiHeaders(key)});
   if(!active.ok)return json({error:"referral_read_failed"},active.status);
   if((await active.json()).length)return json({error:"partner_already_assigned"},409);
   const create=await fetch(base+"/rest/v1/plotao_lead_referrals",{method:"POST",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({lead_id:b.id,partner_id:b.partner_id,status:"sending",sent_by:ADMIN_EMAIL})});
   let created;try{created=await create.json()}catch{created=null}
   if(!create.ok||!Array.isArray(created)||!created[0]?.id)return json({error:"referral_create_failed"},create.status||500);
   const referral=created[0],p=lead.payload||{};
   const segments=Array.isArray(p.segments)?p.segments.map((x,i)=>"Úsek "+(i+1)+": "+String(x.length||"")+" m").join("\n"):"";
   const options=Array.isArray(p.options)?p.options.join(" · "):"";
   const message=[
    "Dobrý den, "+(partner.contact_name||""),
    "",
    "PLOTAO.cz vám předává novou zákaznickou poptávku pro váš kraj.",
    "Firma: "+partner.company_name,
    "Místo realizace: "+(lead.place||"neuvedeno"),
    "Kraj: "+region,
    "Typ oplocení: "+(fenceType||"bude upřesněn"),
    "Délka: "+segments,
    "Výška: "+(p.height?String(p.height)+" cm":"bude upřesněna"),
    "Rozsah: "+(p.scope||"bude upřesněn"),
    "Další parametry: "+options,
    "Poznámka zákazníka: "+(lead.note||"bez poznámky"),
    "",
    "Kontakt na zákazníka:",
    "Jméno: "+lead.name,
    "Telefon: "+(lead.phone||"neuveden"),
    "E-mail: "+(lead.email||"neuveden"),
    "",
    "Zákazník souhlasil s předáním poptávky partnerské firmě PLOTAO.cz.",
    "Prosíme, odpovězte přímo zákazníkovi a potvrďte PLOTAO.cz, zda poptávku přebíráte.",
    "",
    "PLOTAO.cz",
    "https://plotao.cz"
   ].join("\n");
   const resendKey=Deno.env.get("RESEND_API_KEY")?.trim();
   if(!resendKey){
    await fetch(referralUrl(base,referral.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"failed",error_code:"resend_not_configured",updated_at:new Date().toISOString()})});
    return json({error:"resend_not_configured"},503)
   }
   let sendResponse;
   try{
    sendResponse=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":"plotao-referral-"+referral.id},body:JSON.stringify({from:FROM_EMAIL,to:[partner.email],reply_to:ADMIN_EMAIL,subject:"Nová poptávka pro váš kraj – PLOTAO.cz",text:message})})
   }catch(error){
    console.error("partner email network failure",error instanceof Error?error.message:"unknown");
    await fetch(referralUrl(base,referral.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"failed",error_code:"network_failure",updated_at:new Date().toISOString()})});
    return json({error:"partner_email_failed"},502)
   }
   let sent={};try{sent=await sendResponse.json()}catch{}
   if(!sendResponse.ok){
    console.error("partner email rejected",sendResponse.status,sent?.name||"");
    await fetch(referralUrl(base,referral.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"failed",error_code:"provider_rejected",updated_at:new Date().toISOString()})});
    return json({error:"partner_email_failed",provider_status:sendResponse.status},502)
   }
   const sentAt=new Date().toISOString();
   const recorded=await fetch(referralUrl(base,referral.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({status:"sent",sent_at:sentAt,provider_id:typeof sent.id==="string"?sent.id:null,updated_at:sentAt})});
   if(!recorded.ok)return json({error:"partner_send_record_failed",email_sent:true},502);
   const leadUpdate=await fetch(leadUrl(base,b.id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"partner_assigned",partner_name:partner.company_name,region,updated_at:sentAt})});
   if(!leadUpdate.ok)return json({error:"partner_send_record_failed",email_sent:true},502);
   return json({ok:true,email_sent:true,referral_id:referral.id,partner_name:partner.company_name,sent_at:sentAt},200)
  }
  if(b.action==="update_referral"){
   if(!validId(b.referral_id)||!["accepted","declined","withdrawn"].includes(b.status))return json({error:"invalid_referral_update"},422);
   const current=await fetch(referralUrl(base,b.referral_id),{headers:apiHeaders(key)});
   if(!current.ok)return json({error:"referral_read_failed"},current.status);
   const rows=await current.json(),referral=rows[0];
   if(!referral)return json({error:"referral_not_found"},404);
   if(!["sending","sent","accepted"].includes(referral.status))return json({error:"referral_not_active"},409);
   const now=new Date().toISOString();
   const responseNote=typeof b.response_note==="string"?b.response_note.trim().slice(0,1000):"";
   const saved=await fetch(referralUrl(base,b.referral_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({status:b.status,response_at:now,response_note:responseNote,updated_at:now})});
   let savedRows;try{savedRows=await saved.json()}catch{savedRows=null}
   if(!saved.ok)return json({error:"referral_save_failed"},saved.status);
   if(b.status==="declined"||b.status==="withdrawn"){
    await fetch(leadUrl(base,referral.lead_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"review",partner_name:"",updated_at:now})});
   }else{
    await fetch(leadUrl(base,referral.lead_id),{method:"PATCH",headers:{...apiHeaders(key),"Content-Type":"application/json"},body:JSON.stringify({status:"partner_assigned",updated_at:now})});
   }
   return json(Array.isArray(savedRows)?savedRows[0]:savedRows,200)
  }

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
   if(typeof lead.email!=="string"||!/^\S+@\S+\.\S+$/.test(lead.email))return json({error:"invalid_lead_email"},422);
   const text=b.send_reply.trim();
   let sendResponse;
   try{
    sendResponse=await fetch("https://api.resend.com/emails",{
     method:"POST",
     headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json","Idempotency-Key":b.request_id},
     body:JSON.stringify({from:FROM_EMAIL,to:[lead.email],reply_to:ADMIN_EMAIL,subject:"Re: Poptávka na oplocení – PLOTAO.cz",text:"Dobrý den,\n\n"+text+"\n\nS pozdravem,\nPLOTAO.cz"})
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
