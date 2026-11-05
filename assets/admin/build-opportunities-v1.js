(()=>{
const API="/functions/v1/build-opportunities-admin";
const labels={project_type:{rodinne_domy:"Rodinné domy",bytove_domy:"Bytové domy",komercni:"Komerční areál",verejne:"Veřejná stavba",jine:"Jiné"},stage:{uzemni_plan:"Územní plán",zamer:"Záměr",povoleno:"Povoleno",realizace:"Ve výstavbě",dokonceno:"Dokončeno",pozastaveno:"Pozastaveno"},outreach_status:{neosloveno:"Neosloveno",pripraveno:"Připraveno k oslovení",osloveno:"Osloveno",jednani:"Probíhá jednání",zakazka:"Zakázka",bez_zajmu:"Bez zájmu"}};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let rows=[],map=null,markers=[],editing=null,ready=false;
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
 const located=rows.filter(x=>Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude)));
 located.forEach(x=>{
  const m=L.marker([Number(x.latitude),Number(x.longitude)]).addTo(map);
  m.bindPopup('<b>'+esc(x.title)+'</b><br>'+esc(x.location)+'<br>'+esc(labels.stage[x.stage]||x.stage));
  markers.push(m);
 });
 if(located.length){const group=L.featureGroup(markers);map.fitBounds(group.getBounds().pad(.2),{maxZoom:12})}
}
function render(){
 const q=($("#buildSearch")?.value||"").toLocaleLowerCase("cs-CZ"),stage=$("#buildStage")?.value||"",type=$("#buildType")?.value||"",reach=$("#buildOutreach")?.value||"";
 const shown=rows.filter(x=>(!q||(x.title+" "+x.location+" "+x.region+" "+x.source_name).toLocaleLowerCase("cs-CZ").includes(q))&&(!stage||x.stage===stage)&&(!type||x.project_type===type)&&(!reach||x.outreach_status===reach));
 $("#buildTotal").textContent=rows.length;$("#buildEarly").textContent=rows.filter(x=>["uzemni_plan","zamer"].includes(x.stage)).length;
 $("#buildUnits").textContent=rows.filter(x=>x.project_type==="rodinne_domy"||x.project_type==="bytove_domy").reduce((a,x)=>a+(Number(x.units)||0),0);
 $("#buildUncontacted").textContent=rows.filter(x=>x.outreach_status==="neosloveno").length;
 $("#buildCount").textContent=shown.length+" příležitostí";
 $("#buildRows").innerHTML=shown.map(x=>'<tr><td><strong>'+esc(x.title)+'</strong><small>'+esc(x.location)+(x.region?' · '+esc(x.region):'')+'</small><small>'+esc(labels.project_type[x.project_type]||x.project_type)+(x.expected_start?' · plán '+fmtDate(x.expected_start):'')+'</small></td><td><span class="build-pill '+esc(x.stage)+'">'+esc(labels.stage[x.stage]||x.stage)+'</span></td><td>'+Number(x.units||0).toLocaleString("cs-CZ")+'</td><td>'+(x.source_url?'<a href="'+esc(x.source_url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.source_name)+' ↗</a>':esc(x.source_name))+'<small>'+(x.verified_at?'Ověřeno '+new Date(x.verified_at).toLocaleDateString("cs-CZ"):'Zdroj zatím neověřen')+'</small></td><td><select data-reach="'+esc(x.id)+'" aria-label="Stav oslovení pro '+esc(x.title)+'">'+Object.entries(labels.outreach_status).map(([k,v])=>'<option value="'+k+'" '+(x.outreach_status===k?'selected':'')+'>'+v+'</option>').join("")+'</select></td><td class="build-actions"><button type="button" class="secondary" data-edit-build="'+esc(x.id)+'">Upravit</button><button type="button" class="link danger" data-delete-build="'+esc(x.id)+'">Smazat</button></td></tr>').join("")||'<tr><td colspan="6" class="empty">Pro tato kritéria nebyla nalezena žádná příležitost.</td></tr>';
 renderMap();
}
async function load(){
 if(!window.PLOTAOAdmin?.request)return;
 try{message("Načítám stavební příležitosti…");const data=await api();rows=Array.isArray(data)?data:[];ready=true;message(rows.length?"Záznamy jsou uložené v zabezpečené databázi PLOTAO.":"Zatím nejsou vložené žádné ověřené příležitosti.");render()}
 catch(e){message("Načtení se nezdařilo: "+e.message,true)}
}
function openForm(row=null){
 editing=row?.id||null;$("#buildForm").reset();$("#buildId").value=editing||"";
 $("#buildFormTitle").textContent=editing?"Upravit příležitost":"Přidat příležitost";
 $("#buildDelete").hidden=!editing;
 $("#buildVerified").checked=!!row?.verified_at;
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
 if(e.target.closest("#buildReload"))load();
});
document.addEventListener("change",e=>{
 if(e.target.matches("[data-reach]")){const row=rows.find(x=>x.id===e.target.dataset.reach);if(!row)return;row.outreach_status=e.target.value;api("PATCH",{opportunity:{...row,verified:!!row.verified_at}},row.id).then(load).catch(err=>{message("Stav oslovení se nepodařilo uložit: "+err.message,true);load()})}
 if(e.target.matches("#buildStage,#buildType,#buildOutreach"))render();
});
document.addEventListener("input",e=>{if(e.target.id==="buildSearch")render()});
document.addEventListener("submit",e=>{if(e.target.id==="buildForm")save(e)});
window.PLOTAOBuildOpportunities={reload:load};
})();