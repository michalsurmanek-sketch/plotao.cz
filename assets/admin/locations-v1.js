(()=>{
 const REGIONS=['Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=v=>String(v??'').trim().toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const fmt=new Intl.NumberFormat('cs-CZ');
 let leads=[];
 function placeOf(lead){return String(lead.place||lead.payload?.placeFromCalculator||lead.payload?.place||'').trim()}
 function regionOf(lead){const all=[lead.region,lead.payload?.region,placeOf(lead)].filter(Boolean).join(' ').toLocaleLowerCase('cs-CZ');return REGIONS.find(r=>all.includes(r.toLocaleLowerCase('cs-CZ')))||'Kraj k upřesnění'}
 function rows(){
  const groups=new Map();
  leads.forEach(lead=>{
   const region=regionOf(lead),rawPlace=placeOf(lead),city=rawPlace&&norm(rawPlace)!==norm(region)?rawPlace:'Místo neuvedeno';
   const key=norm(region)+'|'+norm(city),old=groups.get(key)||{region,city,leads:[]};old.leads.push(lead);groups.set(key,old)
  });
  return [...groups.values()].map(g=>({...g,latest:g.leads.reduce((latest,x)=>!latest||new Date(x.created_at)>new Date(latest.created_at)?x:latest,null)})).sort((a,b)=>a.region.localeCompare(b.region,'cs')||b.leads.length-a.leads.length||a.city.localeCompare(b.city,'cs'))
 }
 function render(){
  const body=document.querySelector('#locationRows');if(!body)return;
  const all=rows(),regions=new Map(REGIONS.map(r=>[r,0]));regions.set('Kraj k upřesnění',0);
  all.forEach(g=>regions.set(g.region,(regions.get(g.region)||0)+g.leads.length));
  const withPlace=leads.filter(x=>placeOf(x)),cities=new Set(all.filter(x=>x.city!=='Místo neuvedeno').map(x=>norm(x.city)));
  document.querySelector('#locationLeadCount').textContent=fmt.format(withPlace.length);
  document.querySelector('#locationRegionCount').textContent=fmt.format([...regions.values()].filter(n=>n>0).length);
  document.querySelector('#locationCityCount').textContent=fmt.format(cities.size);
  const top=[...regions.entries()].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1])[0];
  document.querySelector('#locationTopRegion').textContent=top?.[0]||'—';
  document.querySelector('#locationTopRegionDetail').textContent=top?fmt.format(top[1])+' poptávek v přehledu':'Zatím bez lokalit';
  const filter=document.querySelector('#locationRegionFilter'),selected=filter?.value||'';
  if(filter&&filter.options.length!==REGIONS.length+1){filter.innerHTML='<option value="">Všechny kraje</option>'+REGIONS.map(r=>'<option value="'+esc(r)+'">'+esc(r)+'</option>').join('')+'<option value="Kraj k upřesnění">Kraj k upřesnění</option>';filter.value=selected}
  const cards=document.querySelector('#locationRegionCards');
  if(cards)cards.innerHTML=REGIONS.map(r=>'<button type="button" class="location-region-card '+(selected===r?'selected':'')+'" data-location-region="'+esc(r)+'"><span>'+esc(r)+'</span><strong>'+fmt.format(regions.get(r)||0)+'</strong><small>'+(regions.get(r)===1?'poptávka':regions.get(r)>=2&&regions.get(r)<=4?'poptávky':'poptávek')+'</small><i><b style="width:'+Math.min(100,Math.round((regions.get(r)||0)/Math.max(1,leads.length)*100))+'%"></b></i></button>').join('')+(regions.get('Kraj k upřesnění')?'<button type="button" class="location-region-card unknown '+(selected==='Kraj k upřesnění'?'selected':'')+'" data-location-region="Kraj k upřesnění"><span>Kraj k upřesnění</span><strong>'+fmt.format(regions.get('Kraj k upřesnění'))+'</strong><small>poptávek</small><i><b style="width:'+Math.min(100,Math.round(regions.get('Kraj k upřesnění')/Math.max(1,leads.length)*100))+'%"></b></i></button>':'');
  const query=norm(document.querySelector('#locationSearch')?.value),regionFilter=selected;
  const filtered=all.filter(g=>(!regionFilter||g.region===regionFilter)&&(!query||norm(g.region+' '+g.city).includes(query)));
  body.innerHTML=filtered.map(g=>'<tr><td data-label="Kraj">'+esc(g.region)+'</td><td data-label="Město / obec"><strong>'+esc(g.city)+'</strong></td><td data-label="Poptávky">'+fmt.format(g.leads.length)+'</td><td data-label="Poslední přijetí">'+esc(g.latest?.created_at?new Date(g.latest.created_at).toLocaleString('cs-CZ',{timeZone:'Europe/Prague',dateStyle:'short',timeStyle:'short'}):'—')+'</td><td data-label="Akce"><button type="button" class="link" data-location-open="'+esc(g.region)+'" data-location-city="'+esc(g.city==='Místo neuvedeno'?'':g.city)+'">Otevřít poptávky →</button></td></tr>').join('')||'<tr><td colspan="5" class="empty">Pro toto hledání jsme nenašli žádné lokality.</td></tr>';
  const sub=document.querySelector('#locationCitySubhead');if(sub)sub.textContent=filtered.length+' míst podle '+fmt.format(filtered.reduce((n,g)=>n+g.leads.length,0))+' poptávek';
 }
 function source(event){leads=Array.isArray(event?.detail?.leads)?event.detail.leads:(Array.isArray(window.PLOTAOAdmin?.leads)?window.PLOTAOAdmin.leads:[]);render()}
 window.addEventListener('plotao:admin-data',source);document.addEventListener('input',e=>{if(e.target.id==='locationSearch')render()});document.addEventListener('change',e=>{if(e.target.id==='locationRegionFilter')render()});
 document.addEventListener('click',e=>{
  const card=e.target.closest('[data-location-region]');if(card){const filter=document.querySelector('#locationRegionFilter');if(filter)filter.value=filter.value===card.dataset.locationRegion?'':card.dataset.locationRegion;render();return}
  if(e.target.closest('[data-refresh-locations]')){source();return}
  const open=e.target.closest('[data-location-open]');if(open){const region=open.dataset.locationOpen,city=open.dataset.locationCity||'';const regionSelect=document.querySelector('#leadRegion'),search=document.querySelector('#leadSearch');if(regionSelect)regionSelect.value=REGIONS.includes(region)?region:'';if(search)search.value=city==='Místo neuvedeno'?'':city;document.querySelector('[data-view="leads"]')?.click();search?.dispatchEvent(new Event('input',{bubbles:true}))}
 });
 source();
})();
