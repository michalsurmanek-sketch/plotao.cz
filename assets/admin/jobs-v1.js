(()=>{'use strict';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const money=n=>new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number(n)||0);
const labels={preparing:'Příprava',material_ordered:'Materiál objednán',material_delivered:'Materiál dodán',scheduled:'Naplánováno',in_progress:'Probíhá realizace',paused:'Pozastaveno',completed:'Dokončeno',cancelled:'Zrušeno',complaint:'Reklamace'};
let jobs=[];
const api=()=>window.PLOTAOAdmin;
function render(){const body=document.querySelector('#jobRows');if(!body)return;const term=(document.querySelector('#jobSearch')?.value||'').trim().toLocaleLowerCase('cs-CZ');const filtered=jobs.filter(j=>[j.job_number,j.plotao_customers?.full_name,j.site_address,j.plotao_leads?.place,j.plotao_quotes?.quote_number].some(x=>String(x||'').toLocaleLowerCase('cs-CZ').includes(term)));const count=document.querySelector('#jobCount');if(count)count.textContent=filtered.length+' zakázek';body.innerHTML=filtered.map(j=>{const sale=Number(j.sale_total)||0,cost=Number(j.purchase_total)||0,items=j.plotao_job_items||[];return '<tr'+(j.id===focusId?' class="job-focused"':'')+'><td><strong>'+esc(j.job_number)+'</strong><small>'+esc(j.plotao_quotes?.quote_number||'')+'</small></td><td>'+esc(j.plotao_customers?.full_name||j.plotao_leads?.name||'—')+'<small>'+esc(j.plotao_customers?.email||j.plotao_leads?.email||'')+'</small></td><td>'+esc(j.site_address||j.plotao_leads?.place||'—')+'</td><td><span class="badge contacted">'+esc(labels[j.status]||j.status)+'</span></td><td>'+money(sale)+'</td><td>'+money(cost)+'</td><td>'+money(sale-cost)+'</td><td>'+items.length+' · '+esc(items.slice(0,3).map(x=>x.product_name).join(', '))+(items.length>3?'…':'')+'</td></tr>'}).join('')||'<tr><td colspan="8" class="empty">Zatím nejsou žádné zakázky. Přijaté nabídky lze převést v sekci Nabídky.</td></tr>'}
let focusId='';
async function refresh(){if(!api())return;const data=await api().request('/functions/v1/admin-leads?resource=jobs');jobs=Array.isArray(data)?data:[];render()}
document.addEventListener('plotao:admin-data',()=>refresh().catch(()=>{}));
document.addEventListener('click',e=>{if(e.target.closest('[data-refresh-jobs]'))refresh().catch(()=>{})});
document.addEventListener('input',e=>{if(e.target.id==='jobSearch')render()});
document.addEventListener('plotao:jobs-open',e=>{focusId=e.detail?.jobId||'';refresh().catch(()=>{})});
if(api())refresh().catch(()=>{});
})();