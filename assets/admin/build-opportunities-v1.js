(()=>{
const API="/functions/v1/build-opportunities-admin";
const labels={project_type:{rodinne_domy:"Rodinné domy",bytove_domy:"Bytové domy",komercni:"Komerční areál",verejne:"Veřejná stavba",jine:"Jiné"},stage:{uzemni_plan:"Územní plán",zamer:"Záměr",povoleno:"Povoleno",realizace:"Ve výstavbě",dokonceno:"Dokončeno",pozastaveno:"Pozastaveno"},outreach_status:{neosloveno:"Neosloveno",pripraveno:"Připraveno k oslovení",osloveno:"Osloveno",jednani:"Probíhá jednání",zakazka:"Zakázka",bez_zajmu:"Bez zájmu"}};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let rows=[],candidates=[],map=null,markers=[],editing=null,ready=false;
const $=s=>document.querySelector(s);
const fmtDate=s=>s?new Date(s+"T00:00:00").toLocaleDateString("cs-CZ"):"—";
function message(s,bad=false){const el=$("#buildNotice");if(el){el.textContent=s;el.classList.toggle("error",bad)}}
async function api(method="GET",payload=null,id=null){
 if(!window.PLOTAOAdmin?.request)throw Error("Administrátorská relace není načtená. Obnovte stránku a přihlaste se znovu.");
 return window.PLOTAOAdmin.request(API,method,payload?{...(id?{id}:{}),...payload}:null);
}
function setupMap(){
 if(map||!window.L)return;
 map=L.map("buildMap",{scrollWheelZoom:false}).setView([49.2,16.6],7);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
 setTimeout(()=>map.invalidateSize(),180);
}
function renderMap(){
 const box=$("#buildMap");if(!box)return;
 if(!window.L){box.innerHTML='<div class="build-map-error">Mapové podklady se nepodařilo načíst. Seznam příležitostí zůstává dostupný.</div>';return}
 setupMap();markers.forEach(m=>map.removeLayer(m));markers=[];
 const located=rows.filter(x=>x.latitude!==null&&x.latitude!==undefined&&x.latitude!==""&&x.longitude!==null&&x.longitude!==undefined&&x.longitude!==""&&Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude))&&Number(x.latitude)>=47&&Number(x.latitude)<=52.5&&Number(x.longitude)>=11&&Number(x.longitude)<=20);
 located.forEach(x=>{
  const m=L.marker([Number(x.latitude),Number(x.longitude)]).addTo(map);
  m.bindPopup('<b>'+esc(x.title)+'</b><br>'+esc(x.location)+'<br>'+esc(labels.stage[x.stage]||x.stage));
  markers.push(m);
 });
 if(located.length){const group=L.featureGroup(markers);map.fitBounds(group.getBounds().pad(.2),{maxZoom:12})}
}
async function discoverEia(){
 const query=$("#buildDiscoveryQuery").value.trim(),region=$("#buildDiscoveryRegion").value||"";
 if(query.length<3){message("Zadejte alespoň 3 znaky pro hledání v EIA.",true);return}
 const button=$("#buildDiscover");button.disabled=true;button.textContent="Vyhledávám…";
 $("#buildCandidates").innerHTML='<div class="build-source-loading">Prohledávám veřejnou evidenci EIA…</div>';
 try{
  if(!window.PLOTAOAdmin?.request)throw Error("Nejdřív se přihlaste do administrace.");
  const broad=$("#buildDiscoveryBroad")?.checked===true;
  const result=await window.PLOTAOAdmin.request("/functions/v1/build-opportunities-discover","POST",{query,region,broad});
  candidates=Array.isArray(result.candidates)?result.candidates:[];
  $("#buildCandidates").dataset.searched="true";
  $("#buildDiscoveryResultCount").textContent=candidates.length+" vhodných návrhů · hledané fráze: "+(result.queries?.length||1)+" · kontrola "+new Date(result.checked_at).toLocaleString("cs-CZ");
  renderCandidates();
 }catch(error){
  candidates=[];$("#buildDiscoveryResultCount").textContent="";
  $("#buildCandidates").innerHTML='<div class="build-source-empty">'+esc(error.message||"Vyhledání selhalo.")+'</div>';
 }finally{button.disabled=false;button.textContent="Hledat v EIA"}
}
function renderCandidates(){
 const host=$("#buildCandidates");if(!host)return;
 if(!candidates.length){if(!host.dataset.searched)host.innerHTML='<div class="build-source-empty">Zadejte hledanou frázi a spusťte vyhledávání. Výsledky se zde nejdřív zobrazí ke kontrole.</div>';else host.innerHTML='<div class="build-source-empty">EIA nenašla odpovídající obytné záměry na první stránce výsledků. Zkuste jiný výraz nebo kraj.</div>';return}
 host.dataset.searched="true";
 host.innerHTML=candidates.map(c=>{const exists=rows.some(r=>r.external_ref===c.external_ref);return '<article class="build-candidate"><div class="build-candidate-main"><div><strong>'+esc(c.title)+'</strong><small>'+esc(c.location)+(c.region?' · '+esc(c.region):'')+' · '+esc(c.code)+'</small><p>Stav EIA: '+esc(c.status||"neuveden")+'</p></div><div class="build-candidate-actions"><a href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer">Otevřít zdroj ↗</a><button class="action" type="button" data-import-eia="'+esc(c.external_ref)+'" '+(exists?'disabled':'')+'>'+(exists?'Již v evidenci':'Přidat k ověření')+'</button></div></div></article>'}).join("");
}
async function importEiaCandidate(ref){
 const c=candidates.find(x=>x.external_ref===ref);if(!c)return;
 const button=document.querySelector('[data-import-eia="'+CSS.escape(ref)+'"]');if(button){button.disabled=true;button.textContent="Ukládám…"}
 try{
  await api("POST",{opportunity:{title:c.title,location:c.location,region:c.region,project_type:c.project_type,stage:"zamer",units:0,source_name:c.source_name,source_url:c.url,expected_start:"",outreach_status:"neosloveno",contact_name:"",contact_email:"",contact_phone:"",notes:["Kód EIA: "+c.code,c.status?"Stav EIA: "+c.status:""].filter(Boolean).join("\n"),external_ref:c.external_ref,verified:false}});
  await load();renderCandidates();message("Návrh z EIA byl přidán k ručnímu ověření.");
 }catch(error){if(button){button.disabled=false;button.textContent="Přidat k ověření"}message("Uložení návrhu se nezdařilo: "+error.message,true)}
}
function filteredRows(){
 const q=($("#buildSearch")?.value||"").toLocaleLowerCase("cs-CZ"),stage=$("#buildStage")?.value||"",type=$("#buildType")?.value||"",reach=$("#buildOutreach")?.value||"",verification=$("#buildVerification")?.value||"";
 return rows.filter(x=>(!q||(x.title+" "+x.location+" "+x.region+" "+x.source_name+" "+x.external_ref+" "+x.notes+" "+(labels.stage[x.stage]||x.stage)+" "+(labels.project_type[x.project_type]||x.project_type)).toLocaleLowerCase("cs-CZ").includes(q))&&(!stage||x.stage===stage)&&(!type||x.project_type===type)&&(!reach||x.outreach_status===reach)&&(!verification||(verification==="pending"?!x.verified_at:!!x.verified_at)));
}
function exportCsv(){
 const shown=filteredRows();if(!shown.length){message("Pro export nejsou vybrané žádné příležitosti.",true);return}
 const cell=v=>{let s=String(v??"");if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""').replace(/\r?\n/g," ")+'"'};
 const header=["Název","Lokalita","Kraj","Typ","Fáze","Jednotky","Zdroj","URL zdroje","EIA kód","Stav EIA","Stav oslovení","Ověřeno"];
 const data=shown.map(x=>{const code=String(x.external_ref||"").startsWith("EIA:")?String(x.external_ref).slice(4):"";const status=(String(x.notes||"").match(/(?:^|\n)Stav EIA:\s*([^\n]+)/)||[])[1]||"";return [x.title,x.location,x.region,labels.project_type[x.project_type]||x.project_type,labels.stage[x.stage]||x.stage,x.units,x.source_name,x.source_url,code,status,labels.outreach_status[x.outreach_status]||x.outreach_status,x.verified_at?"Ano":"Ne"]});
 const csv="\uFEFF"+[header,...data].map(row=>row.map(cell).join(";")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="plotao-prilezitosti-"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message("Exportováno "+shown.length+" příležitostí podle aktuálního filtrování.");
}
function render(){
 const shown=filteredRows();
 $("#buildTotal").textContent=rows.length;$("#buildEarly").textContent=rows.filter(x=>["uzemni_plan","zamer"].includes(x.stage)).length;
 $("#buildUnits").textContent=rows.filter(x=>x.project_type==="rodinne_domy"||x.project_type==="bytove_domy").reduce((a,x)=>a+(Number(x.units)||0),0);
 $("#buildUncontacted").textContent=rows.filter(x=>x.outreach_status==="neosloveno").length;
 const unverified=rows.filter(x=>!x.verified_at).length;const unverifiedEl=$("#buildUnverified");if(unverifiedEl)unverifiedEl.textContent=unverified;
 $("#buildCount").textContent=shown.length+" příležitostí";

 $("#buildRows").innerHTML=shown.map(x=>{
  const eiaCode=String(x.external_ref||"").startsWith("EIA:")?String(x.external_ref).slice(4):"";
  const eiaStatus=(String(x.notes||"").match(/(?:^|\n)Stav EIA:\s*([^\n]+)/)||[])[1]||"";
  const sourceMeta=[eiaCode?"Kód EIA: "+eiaCode:"",eiaStatus?"Stav EIA: "+eiaStatus:"",x.verified_at?"Ověřeno "+new Date(x.verified_at).toLocaleDateString("cs-CZ"):"Zdroj zatím neověřen"].filter(Boolean).join(" · ");
  return '<tr><td><strong>'+esc(x.title)+'</strong><small>'+esc(x.location)+(x.region?' · '+esc(x.region):'')+'</small><small>'+esc(labels.project_type[x.project_type]||x.project_type)+(x.expected_start?' · plán '+fmtDate(x.expected_start):'')+'</small></td><td><span class="build-pill '+esc(x.stage)+'">'+esc(labels.stage[x.stage]||x.stage)+'</span></td><td>'+Number(x.units||0).toLocaleString("cs-CZ")+'</td><td>'+(x.source_url?'<a href="'+esc(x.source_url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.source_name)+' ↗</a>':esc(x.source_name))+'<small>'+esc(sourceMeta)+'</small><button type="button" class="link" data-verify-build="'+esc(x.id)+'" aria-label="'+(x.verified_at?'Zrušit ověření ':'Označit jako ověřené ')+esc(x.title)+'">'+(x.verified_at?'Zrušit ověření':'Označit jako ověřené')+'</button></td><td><select data-reach="'+esc(x.id)+'" aria-label="Stav oslovení pro '+esc(x.title)+'">'+Object.entries(labels.outreach_status).map(([k,v])=>'<option value="'+k+'" '+(x.outreach_status===k?'selected':'')+'>'+v+'</option>').join("")+'</select></td><td class="build-actions"><button type="button" class="secondary" data-edit-build="'+esc(x.id)+'">Upravit</button><button type="button" class="link danger" data-delete-build="'+esc(x.id)+'">Smazat</button></td></tr>';
 }).join("")||'<tr><td colspan="6" class="empty">Pro tato kritéria nebyla nalezena žádná příležitost.</td></tr>';
 renderMap();renderCandidates();
}
async function load(){
 if(!window.PLOTAOAdmin?.request)return;
 try{message("Načítám stavební příležitosti…");const data=await api();rows=Array.isArray(data)?data:[];ready=true;message(rows.length?"Záznamy jsou uložené v zabezpečené databázi PLOTAO.":"Zatím nejsou vložené žádné příležitosti.");render()}
 catch(e){message("Načtení se nezdařilo: "+e.message,true)}
}
function openForm(row=null){
 editing=row?.id||null;$("#buildForm").reset();$("#buildId").value=editing||"";
 $("#buildFormTitle").textContent=editing?"Upravit příležitost":"Přidat příležitost";
 $("#buildDelete").hidden=!editing;
 $("#buildVerified").checked=!!row?.verified_at;
 $("#buildVerificationHelp").textContent=row?.verified_at?"Ověřeno "+new Date(row.verified_at).toLocaleDateString("cs-CZ")+". Odškrtnutím ověření odeberete.":"Záznam zůstane označen jako neověřený, dokud zdroj ručně nezkontrolujete.";
 for(const key of ["title","location","region","project_type","stage","units","source_name","source_url","expected_start","outreach_status","contact_name","contact_email","contact_phone","notes","latitude","longitude"]){const input=$("#buildForm [name="+key+"]");if(input)input.value=row?.[key]??(key==="project_type"?"rodinne_domy":key==="stage"?"zamer":key==="outreach_status"?"neosloveno":key==="units"?1:"")}
 $("#buildDialog").hidden=false;document.body.classList.add("build-modal-open");$("#buildForm [name=title]").focus();
}
function closeForm(){$("#buildDialog").hidden=true;document.body.classList.remove("build-modal-open")}
function formData(){
 const f=new FormData($("#buildForm"));return {opportunity:{title:f.get("title"),location:f.get("location"),region:f.get("region"),project_type:f.get("project_type"),stage:f.get("stage"),units:Number(f.get("units")||0),source_name:f.get("source_name"),source_url:f.get("source_url"),expected_start:f.get("expected_start"),outreach_status:f.get("outreach_status"),contact_name:f.get("contact_name"),contact_email:f.get("contact_email"),contact_phone:f.get("contact_phone"),notes:f.get("notes"),latitude:f.get("latitude")===""?null:Number(f.get("latitude")),longitude:f.get("longitude")===""?null:Number(f.get("longitude")),verified:$("#buildVerified").checked}};
}
async function save(e){
 e.preventDefault();const button=$("#buildSave");button.disabled=true;
 try{const payload=formData();await api(editing?"PATCH":"POST",payload,editing);closeForm();await load();message("Příležitost byla uložena.")}
 catch(err){message("Uložení se nezdařilo: "+err.message,true)}
 finally{button.disabled=false}
}
document.addEventListener("plotao:admin-data",()=>{if(!ready)load()});
document.addEventListener("click",e=>{
 if(e.target.closest('[data-view="build-opportunities"]'))setTimeout(()=>{if(!ready&&window.PLOTAOAdmin?.request)load();if(window.L&&map)map.invalidateSize();else setupMap()},80);
 if(e.target.closest("#buildAdd"))openForm();
 const edit=e.target.closest("[data-edit-build]");if(edit)openForm(rows.find(x=>x.id===edit.dataset.editBuild));
 if(e.target.closest("#buildCancel")||e.target.id==="buildDialog")closeForm();
 const del=e.target.closest("[data-delete-build]");if(del){const row=rows.find(x=>x.id===del.dataset.deleteBuild);if(row&&confirm("Smazat příležitost „"+row.title+"“?"))api("DELETE",{id:row.id}).then(load).catch(err=>message("Smazání se nezdařilo: "+err.message,true))}
 if(e.target.closest("#buildDelete")){if(editing&&confirm("Smazat tuto příležitost?"))api("DELETE",{id:editing}).then(()=>{closeForm();load()}).catch(err=>message("Smazání se nezdařilo: "+err.message,true))}
 if(e.target.closest("#buildExport"))exportCsv();
 if(e.target.closest("#buildReload"))load();
 if(e.target.closest("#buildDiscover"))discoverEia();
 const verify=e.target.closest("[data-verify-build]");if(verify){const row=rows.find(x=>x.id===verify.dataset.verifyBuild);if(row){verify.disabled=true;api("PATCH",{opportunity:{...row,verified:!row.verified_at,external_ref:row.external_ref||""}},row.id).then(load).catch(err=>{message("Změnu ověření se nepodařilo uložit: "+err.message,true);load()})}}
 const imported=e.target.closest("[data-import-eia]");if(imported)importEiaCandidate(imported.dataset.importEia);
});
document.addEventListener("change",e=>{
 if(e.target.matches("[data-reach]")){const row=rows.find(x=>x.id===e.target.dataset.reach);if(!row)return;row.outreach_status=e.target.value;api("PATCH",{opportunity:{...row,verified:!!row.verified_at,external_ref:row.external_ref||""}},row.id).then(load).catch(err=>{message("Stav oslovení se nepodařilo uložit: "+err.message,true);load()})}
 if(e.target.matches("#buildStage,#buildType,#buildOutreach,#buildVerification"))render();
});
document.addEventListener("input",e=>{if(e.target.id==="buildSearch")render()});
document.addEventListener("change",e=>{if(e.target.id==="buildDiscoveryRegion"&&candidates.length)discoverEia()});
document.addEventListener("submit",e=>{if(e.target.id==="buildForm")save(e)});
window.PLOTAOBuildOpportunities={reload:load};
})();