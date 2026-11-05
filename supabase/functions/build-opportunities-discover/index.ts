const ADMIN_EMAIL="michalsurmanek@seznam.cz";
const BASE="https://portal.cenia.cz/eiasea";
const ORIGIN="https://portal.cenia.cz";
const REGION_NAMES=["Hlavní město Praha","Středočeský kraj","Jihočeský kraj","Plzeňský kraj","Karlovarský kraj","Ústecký kraj","Liberecký kraj","Královéhradecký kraj","Pardubický kraj","Kraj Vysočina","Jihomoravský kraj","Olomoucký kraj","Zlínský kraj","Moravskoslezský kraj"];
const cors={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://plotao.cz","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const decode=token=>{try{const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(atob(p.padEnd(p.length+((4-p.length%4)%4),"=")))}catch{return null}};
function entity(s){return String(s||"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;|&#x27;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))}
function plain(s){return entity(String(s||"").replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim()}
function attr(tag,name){const m=tag.match(new RegExp("\\b"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))","i"));return entity(m?.[1]??m?.[2]??m?.[3]??"")}
function cellValue(html,label){const re=new RegExp('<td[^>]*class=["\\']label["\\'][^>]*>\\s*'+label+'\\s*<\\/td>\\s*<td[^>]*class=["\\']value["\\'][^>]*>([\\s\\S]*?)<\\/td>','i');return plain(html.match(re)?.[1]||"")}
function locationFields(html){
 const m=html.match(/<table[^>]*class=["'][^"']*umisteni[^"']*["'][^>]*>[\s\S]*?<tr[^>]*>\s*<th[^>]*>[\s\S]*?<\/tr>\s*<tr[^>]*>([\s\S]*?)<\/tr>/i);
 const cells=m?[...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>plain(x[1])):[];
 return {region:cells[0]||"",district:cells[1]||"",town:cells[2]||""};
}
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("cs-CZ");
function isHousing(s){const n=normalize(s);return /(obytn|rodinn.{0,12}dom|bytov.{0,15}dom|rezidenc|sidliste|sidliste|bytov.{0,15}zon|domy)/.test(n)}
function regionMatches(value,region){if(!region)return true;return normalize(value)===normalize(region)}
async function getPage(url,opts={}){
 const r=await fetch(url,{...opts,signal:AbortSignal.timeout(12000),redirect:"follow"});
 if(!r.ok)throw new Error("CENIA vrátila HTTP "+r.status);
 return {html:await r.text(),headers:r.headers}
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const claims=decode(req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"");
 if(!claims||String(claims.email||"").toLowerCase()!==ADMIN_EMAIL)return json({error:"admin_forbidden"},403);
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 let b;try{b=await req.json()}catch{return json({error:"invalid_json"},400)}
 const query=String(b.query||"").trim().slice(0,100),region=String(b.region||"").trim();
 if(query.length<3||region&&!REGION_NAMES.includes(region))return json({error:"invalid_search"},422);
 try{
  const start=await getPage(BASE+"/view/eia100_cr?lang=cs",{headers:{"accept":"text/html"}});
  const formInput=start.html.match(/<input\b[^>]*\bname=["']typHledani["'][^>]*>/i)?.[0]||"";
  const mode=attr(formInput,"value");
  if(!mode)return json({error:"cenia_form_changed"},502);
  const cookie=start.headers.get("set-cookie")?.split(";")[0]||"";
  const payload=new URLSearchParams({typHledani:mode,quickSearch:query,stavRychleHledani:"",razeniRychleHledani:"1",filtrRychleHledani:""});
  const results=await getPage(BASE+"/view/eia100_cr?lang=cs",{method:"POST",headers:{"accept":"text/html","content-type":"application/x-www-form-urlencoded","origin":ORIGIN,"referer":BASE+"/view/eia100_cr?lang=cs",...(cookie?{cookie}:{})},body:payload.toString()});
  const found=[];const linkRe=/<a\b[^>]*href=["']([^"']*\/eiasea\/detail\/EIA_([A-Z0-9_-]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while((match=linkRe.exec(results.html))&&found.length<10){
   const code=match[2],title=plain(match[3]);
   if(!/^[A-Z0-9_-]{3,40}$/i.test(code)||!isHousing(title))continue;
   found.push({code,title,url:ORIGIN+entity(match[1])});
  }
  const details=await Promise.all(found.map(async item=>{
   try{
    const d=await getPage(BASE+"/detail/EIA_"+encodeURIComponent(item.code)+"?lang=cs",{headers:{"accept":"text/html","referer":BASE+"/view/eia100_cr?lang=cs",...(cookie?{cookie}:{})}});
    const loc=locationFields(d.html),status=cellValue(d.html,"Stav:"),reporter=cellValue(d.html,"Oznamovatel:");
    return {...item,...loc,status,reporter,location:loc.town||loc.district||"",project_type:/bytov/i.test(item.title)&&!/rodinn/i.test(item.title)?"bytove_domy":"rodinne_domy",external_ref:"EIA:"+item.code};
   }catch{return {...item,region:"",district:"",town:"",location:"",status:"",reporter:"",project_type:/bytov/i.test(item.title)&&!/rodinn/i.test(item.title)?"bytove_domy":"rodinne_domy",external_ref:"EIA:"+item.code}}
  }));
  const candidates=details.filter(x=>x.location&&regionMatches(x.region,region)).map(x=>({...x,stage:"zamer",units:1,source_name:"CENIA – Informační systém EIA",notes:["Kód EIA: "+x.code,x.status?"Stav EIA: "+x.status:"",x.reporter?"Oznamovatel: "+x.reporter:""].filter(Boolean).join("\n")}));
  return json({source:"CENIA",query,region:region||null,checked_at:new Date().toISOString(),count:candidates.length,candidates});
 }catch(error){console.error("CENIA discovery failed",error?.message||error);return json({error:"source_unavailable",message:"Veřejnou evidenci EIA se nyní nepodařilo načíst. Zkuste to později."},502)}
});