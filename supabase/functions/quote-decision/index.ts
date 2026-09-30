const ALLOWED=new Set(["https://plotao.cz","https://www.plotao.cz"]);
const cors=(origin)=>({"Access-Control-Allow-Origin":ALLOWED.has(origin)?origin:"https://plotao.cz","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"content-type,apikey","Access-Control-Max-Age":"600","Vary":"Origin"});
const json=(body,status,origin)=>new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const headers=key=>({apikey:key,Authorization:"Bearer "+key});
const validId=v=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const quoteUrl=(base,id,select)=>base+"/rest/v1/plotao_quotes?id=eq."+encodeURIComponent(id)+"&select="+encodeURIComponent(select);
async function hash(value){const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));return [...bytes].map(v=>v.toString(16).padStart(2,"0")).join("")}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return json({ok:true},200,origin);
 if(!ALLOWED.has(origin))return json({error:"origin_not_allowed"},403,origin);
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return json({error:"server_config"},500,origin);
 if(req.method==="GET"){
  const url=new URL(req.url),id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
  if(!validId(id)||!/^[A-Za-z0-9_-]{40,100}$/.test(token))return json({error:"invalid_decision_link"},400,origin);
  const result=await fetch(quoteUrl(base,id,"id,quote_number,status,decision_token_hash,valid_until,note,discount_percent,source_snapshot,plotao_quote_items(product_name,description,quantity,unit,sale_unit_price,discount_percent,vat_percent,net_total,vat_total)"),{headers:headers(key)});
  if(!result.ok)return json({error:"quote_read_failed"},result.status,origin);
  const rows=await result.json(),quote=rows[0];
  if(!quote||quote.status!=="sent"||quote.decision_token_hash!==await hash(token))return json({error:"decision_link_unavailable"},404,origin);
  const discount=1-(Number(quote.discount_percent)||0)/100,items=(quote.plotao_quote_items||[]).map(item=>({product_name:item.product_name,description:item.description,quantity:item.quantity,unit:item.unit,sale_unit_price:item.sale_unit_price,net_total:Number(item.net_total||0)*discount,vat_total:Number(item.vat_total||0)*discount})),net=items.reduce((sum,item)=>sum+item.net_total,0),vat=items.reduce((sum,item)=>sum+item.vat_total,0);return json({quote_number:quote.quote_number,status:quote.status,valid_until:quote.valid_until,note:quote.note,source_snapshot:quote.source_snapshot,items,net_total:net,vat_total:vat,gross_total:net+vat},200,origin)
 }
 if(req.method==="POST"){
  let body;try{body=await req.json()}catch{return json({error:"invalid_json"},400,origin)}
  const id=body?.quote_id,token=typeof body?.token==="string"?body.token:"",status=body?.status;
  if(!validId(id)||!/^[A-Za-z0-9_-]{40,100}$/.test(token)||!["accepted","declined"].includes(status))return json({error:"invalid_decision"},422,origin);
  const current=await fetch(quoteUrl(base,id,"id,quote_number,lead_id,status,decision_token_hash"),{headers:headers(key)});
  if(!current.ok)return json({error:"quote_read_failed"},current.status,origin);
  const rows=await current.json(),quote=rows[0],digest=await hash(token);
  if(!quote||quote.status!=="sent"||quote.decision_token_hash!==digest)return json({error:"decision_link_unavailable"},404,origin);
  const result=await fetch(base+"/rest/v1/rpc/plotao_set_quote_decision",{method:"POST",headers:{...headers(key),"Content-Type":"application/json"},body:JSON.stringify({p_quote_id:id,p_status:status,p_source:"customer_link",p_note:"",p_actor:"zákazník",p_token_hash:digest})});
  let saved;try{saved=await result.json()}catch{saved=null}
  if(!result.ok)return json({error:"decision_link_unavailable"},409,origin);
  if(quote.lead_id)await fetch(base+"/rest/v1/plotao_leads?id=eq."+encodeURIComponent(quote.lead_id),{method:"PATCH",headers:{...headers(key),"Content-Type":"application/json"},body:JSON.stringify({status:status==="accepted"?"ordered":"review",updated_at:new Date().toISOString()})});
  return json({ok:true,quote_number:saved?.quote_number||quote.quote_number,status},200,origin)
 }
 return json({error:"method_not_allowed"},405,origin)
});