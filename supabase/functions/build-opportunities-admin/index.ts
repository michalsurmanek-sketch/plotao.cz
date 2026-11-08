const ADMIN_EMAIL="michalsurmanek@seznam.cz";
const ALLOWED_TYPES=["rodinne_domy","bytove_domy","komercni","verejne","jine"];
const ALLOWED_STAGES=["uzemni_plan","zamer","povoleno","realizace","dokonceno","pozastaveno"];
const ALLOWED_OUTREACH=["neosloveno","pripraveno","osloveno","jednani","zakazka","bez_zajmu"];
const cors={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://plotao.cz","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
async function isAdminToken(token,base,key){
 if(!token)return false;
 try{const response=await fetch(base+"/auth/v1/user",{headers:{apikey:key,Authorization:"Bearer "+token},signal:AbortSignal.timeout(8000)});if(!response.ok)return false;const user=await response.json();return String(user?.email||"").toLowerCase()===ADMIN_EMAIL}catch{return false}
}
const validId=v=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const validUrl=v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==="https:"&&Boolean(u.hostname)&&!u.username&&!u.password}catch{return false}};
const clean=v=>{
 if(!v||typeof v!=="object")return null;
 const title=String(v.title||"").trim().slice(0,180),location=String(v.location||"").trim().slice(0,180),region=String(v.region||"").trim().slice(0,100),project_type=String(v.project_type||"rodinne_domy"),stage=String(v.stage||"zamer"),source_name=String(v.source_name||"").trim().slice(0,180),source_url=String(v.source_url||"").trim().slice(0,1000),outreach_status=String(v.outreach_status||"neosloveno"),units=Number(v.units||0),expected_start=String(v.expected_start||"").trim(),contact_name=String(v.contact_name||"").trim().slice(0,120),contact_email=String(v.contact_email||"").trim().toLowerCase().slice(0,254),contact_phone=String(v.contact_phone||"").trim().slice(0,40),notes=String(v.notes||"").trim().slice(0,4000),external_ref=String(v.external_ref||"").trim().slice(0,120),latitude=v.latitude===""||v.latitude==null?null:Number(v.latitude),longitude=v.longitude===""||v.longitude==null?null:Number(v.longitude);
 if(title.length<3||location.length<2||source_name.length<2||!ALLOWED_TYPES.includes(project_type)||!ALLOWED_STAGES.includes(stage)||!ALLOWED_OUTREACH.includes(outreach_status)||!Number.isInteger(units)||units<0||units>100000||!validUrl(source_url)||external_ref&&!/^EIA:[A-Z0-9_-]{3,40}$/i.test(external_ref))return null;
 if(expected_start&&!/^\d{4}-\d{2}-\d{2}$/.test(expected_start))return null;
 if(contact_email&&!/^\S+@\S+\.\S+$/.test(contact_email))return null;
 if(latitude!==null&&(!Number.isFinite(latitude)||latitude<47||latitude>52.5)||longitude!==null&&(!Number.isFinite(longitude)||longitude<11||longitude>20)||(latitude===null)!==(longitude===null))return null;
 return {title,location,region,project_type,stage,units,source_name,source_url,external_ref,expected_start:expected_start||null,outreach_status,contact_name,contact_email,contact_phone,notes,latitude,longitude,updated_at:new Date().toISOString()};
};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return json({error:"server_config"},500);
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";
 if(!await isAdminToken(token,base,key))return json({error:"admin_forbidden"},403);
 const api={apikey:key,Authorization:"Bearer "+key};
 const url=base+"/rest/v1/plotao_build_opportunities";
 if(req.method==="GET"){
   const r=await fetch(url+"?select=*&order=updated_at.desc&limit=2000",{headers:api});
   let data;try{data=await r.json()}catch{data=null}
   return json(data,r.status);
 }
 let body;try{body=await req.json()}catch{return json({error:"invalid_json"},400)}
 if(req.method==="POST"||req.method==="PATCH"){
   if(req.method==="PATCH"&&body.op==="set_verification"){
   if(!validId(body.id))return json({error:"invalid_id"},422);
   if(typeof body.verified!=="boolean")return json({error:"invalid_verification"},422);
   const now=new Date().toISOString();
   const patch={verified_at:body.verified?now:null,updated_at:now};
   const r=await fetch(url+"?id=eq."+encodeURIComponent(body.id),{method:"PATCH",headers:{...api,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(patch)});
   let data;try{data=await r.json()}catch{data=null}
   if(!r.ok)return json({error:"verification_update_failed"},r.status);
   return json(Array.isArray(data)?data[0]:data,200);
  }
  if(body.id!=null&&!validId(body.id))return json({error:"invalid_id"},422);
   if(req.method==="PATCH"&&!body.id)return json({error:"invalid_id"},422);
   const row=clean(body.opportunity);if(!row)return json({error:"invalid_opportunity"},422);
   // Verification is managed only by set_verification; editing metadata must not clear it.
   if(!body.id)row.verified_at=null;
   const r=await fetch(body.id?url+"?id=eq."+encodeURIComponent(body.id):url,{method:body.id?"PATCH":"POST",headers:{...api,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(row)});
   let data;try{data=await r.json()}catch{data=null}
   if(!r.ok)return json({error:r.status===409?"duplicate_source":"save_failed"},r.status);
   return json(Array.isArray(data)?data[0]:data,body.id?200:201);
 }
 if(req.method==="DELETE"){
   if(!validId(body.id))return json({error:"invalid_id"},422);
   const r=await fetch(url+"?id=eq."+encodeURIComponent(body.id),{method:"DELETE",headers:{...api,"Prefer":"return=representation"}});
   if(!r.ok)return json({error:"delete_failed"},r.status);
   return json({ok:true});
 }
 return json({error:"method_not_allowed"},405);
});