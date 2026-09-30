import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED_ORIGINS=new Set(["https://plotao.cz","https://www.plotao.cz"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern=/^[A-Za-z0-9_-]{43}$/;
function headers(origin:string|null){const h:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0","Pragma":"no-cache","Vary":"Origin","X-Content-Type-Options":"nosniff"};if(origin&&ALLOWED_ORIGINS.has(origin))h["Access-Control-Allow-Origin"]=origin;h["Access-Control-Allow-Headers"]="apikey,authorization,content-type";h["Access-Control-Allow-Methods"]="GET,POST,OPTIONS";return h}
function reply(body:unknown,status:number,origin:string|null){return new Response(JSON.stringify(body),{status,headers:headers(origin)})}
function digestHex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function hashToken(token:string){return digestHex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))}
function equalHash(a:string|null,b:string){if(!a||a.length!==b.length)return false;let diff=0;for(let i=0;i<b.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function findReferral(id:string,hash:string){const url=SUPABASE_URL+"/rest/v1/plotao_job_referrals?select=id,status,response_token_hash,plotao_partners(company_name),plotao_jobs(job_number)&id=eq."+encodeURIComponent(id)+"&limit=1";const r=await fetch(url,{headers:{apikey:SERVICE_KEY,Authorization:"Bearer "+SERVICE_KEY}});if(!r.ok)throw new Error("lookup_failed");const rows=await r.json(),row=rows?.[0];if(!row||row.status!=="sent"||!equalHash(row.response_token_hash,hash))return null;return row}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 if(origin&&!ALLOWED_ORIGINS.has(origin))return reply({error:"origin_not_allowed"},403,origin);
 if(!SUPABASE_URL||!SERVICE_KEY)return reply({error:"service_unavailable"},503,origin);
 if(req.method==="GET"){
  const url=new URL(req.url),id=url.searchParams.get("id")||"",token=url.searchParams.get("token")||"";
  if(!uuid.test(id)||!tokenPattern.test(token))return reply({error:"response_link_unavailable"},404,origin);
  try{const row=await findReferral(id,await hashToken(token));if(!row)return reply({error:"response_link_unavailable"},404,origin);const job=Array.isArray(row.plotao_jobs)?row.plotao_jobs[0]:row.plotao_jobs,partner=Array.isArray(row.plotao_partners)?row.plotao_partners[0]:row.plotao_partners;return reply({ok:true,job_number:job?.job_number||"",partner_name:partner?.company_name||""},200,origin)}catch{return reply({error:"service_unavailable"},503,origin)}
 }
 if(req.method==="POST"){
  let body:Record<string,unknown>;try{body=await req.json()}catch{return reply({error:"invalid_request"},400,origin)}
  const action=body.action,id=typeof body.id==="string"?body.id:"",token=typeof body.token==="string"?body.token:"",status=body.status,note=typeof body.note==="string"?body.note.trim():"";
  if(!uuid.test(id)||!tokenPattern.test(token))return reply({error:"invalid_request"},422,origin);
  if(action!=="check"&&(!["accepted","declined"].includes(String(status))||note.length>1000))return reply({error:"invalid_request"},422,origin);
  try{
   const hash=await hashToken(token),row=await findReferral(id,hash);if(!row)return reply({error:"response_link_unavailable"},404,origin);
   const job=Array.isArray(row.plotao_jobs)?row.plotao_jobs[0]:row.plotao_jobs,partner=Array.isArray(row.plotao_partners)?row.plotao_partners[0]:row.plotao_partners;
   if(action==="check")return reply({ok:true,job_number:job?.job_number||"",partner_name:partner?.company_name||""},200,origin);
   const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/plotao_record_job_partner_response",{method:"POST",headers:{apikey:SERVICE_KEY,Authorization:"Bearer "+SERVICE_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_referral_id:id,p_token_hash:hash,p_status:status,p_response_note:note})});
   if(!r.ok)return reply({error:"response_link_unavailable"},409,origin);
   return reply({ok:true,status,job_number:(Array.isArray(row.plotao_jobs)?row.plotao_jobs[0]:row.plotao_jobs)?.job_number||""},200,origin)
  }catch{return reply({error:"service_unavailable"},503,origin)}
 }
 return reply({error:"method_not_allowed"},405,origin)
});
