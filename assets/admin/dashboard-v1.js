(()=>{
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number(v)||0);
const statuses={new:'Nová',review:'Prověřit',waiting_customer:'Čekáme na zákazníka',preparing_quote:'Připravuje se nabídka',quote_sent:'Nabídka odeslána',waiting_decision:'Čekáme na rozhodnutí',ordered:'Objednáno',partner_assigned:'Předáno partnerovi',completed:'Vyřízeno',closed:'Uzavřeno',contacted:'Kontaktováno'};
const regions=['Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj'];
let busy=false;
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
function setList(id,html,empty){const el=document.getElementById(id);if(el)el.innerHTML=html||'<div class="empty">'+empty+'</div>'}
function received(value){if(!value)return 'bez data';const d=new Date(value);return Number.isNaN(+d)?'bez data':d.toLocaleString('cs-CZ',{timeZone:'Europe/Prague'})}
function regionOf(lead){const candidate=String(lead.region||lead.payload?.region||'');return regions.find(r=>candidate.toLocaleLowerCase('cs-CZ').includes(r.toLocaleLowerCase('cs-CZ')))||'Kraj k upřesnění'}
function taskRows(leads,quotes,referrals){
 const tasks=[];
 leads.filter(x=>!['completed','closed'].includes(x.status)).forEach(x=>{
  const overdue=x.next_action_at&&new Date(x.next_action_at)<new Date();
  if(overdue)tasks.push({rank:0,title:'Prošlý termín: '+(x.next_action||'kontaktovat zákazníka'),sub:(x.name||'Zákazník')+' · '+received(x.next_action_at),view:'leads'});
  else if(['new','review'].includes(x.status))tasks.push({rank:1,title:(x.mode==='help'?'Odpovědět na žádost o radu':'Prověřit novou poptávku'),sub:(x.name||'Zákazník')+' · '+(x.place||'Lokalita neuvedena')+' · '+received(x.created_at),view:'leads'});
  else if(!x.next_action)tasks.push({rank:3,title:'Doplnit další krok',sub:(x.name||'Zákazník')+' · '+(statuses[x.status]||x.status),view:'leads'});
 });
 const waiting=referrals.filter(x=>x.status==='sent');
 waiting.forEach(x=>tasks.push({rank:2,title:'Partner zatím nereagoval',sub:(x.plotao_partners?.company_name||'Firma')+' · předáno '+received(x.sent_at||x.created_at),view:'jobs'}));
 quotes.filter(x=>x.status==='draft').slice(0,5).forEach(x=>tasks.push({rank:2,title:'Dokončit koncept nabídky '+(x.quote_number||''),sub:(x.plotao_customers?.full_name||x.plotao_leads?.name||'Zákazník')+' · '+(x.plotao_leads?.place||'bez lokality'),view:'quotes'}));
 return tasks.sort((a,b)=>a.rank-b.rank).slice(0,8).map(t=>'<button class="dashboard-task" type="button" data-view="'+esc(t.view)+'"><span><b>'+esc(t.title)+'</b><small>'+esc(t.sub)+'</small></span><span aria-hidden="true">›</span></button>').join('');
}
function render(leads,quotes,jobs,referrals){
 const pending=leads.filter(x=>!['completed','closed'].includes(x.status));
 const newCount=leads.filter(x=>['new','review'].includes(x.status)).length;
 const customerWait=leads.filter(x=>['waiting_customer','waiting_decision'].includes(x.status)).length;
 const partnerWait=referrals.filter(x=>['sent','sending'].includes(x.status)).length;
 const activeJobs=jobs.filter(x=>!['completed','cancelled'].includes(x.status)).length;
 setText('statLeads',newCount);setText('statWaitingCustomer',customerWait);setText('statWaitingPartner',partnerWait);setText('statActiveJobs',activeJobs);
 setText('dashboardPendingCount',pending.length+' otevřených poptávek');
 const revenue=jobs.reduce((s,x)=>s+(Number(x.sale_total)||0),0),cost=jobs.reduce((s,x)=>s+(Number(x.purchase_total)||0),0);
 setText('dashboardSales',money(revenue));setText('dashboardCosts',money(cost));setText('dashboardDifference',money(revenue-cost));
 const sent=quotes.filter(x=>['sent','accepted','declined','expired'].includes(x.status)).length,accepted=quotes.filter(x=>x.status==='accepted').length;
 setText('dashboardQuoteCount',String(quotes.length));setText('dashboardAcceptedQuotes',String(accepted));setText('dashboardConversion',sent?Math.round(accepted/sent*100)+' %':'—');
 const regionCounts=new Map();leads.forEach(x=>{const r=regionOf(x);regionCounts.set(r,(regionCounts.get(r)||0)+1)});
 const ranked=[...regionCounts].sort((a,b)=>b[1]-a[1]).slice(0,6),max=Math.max(1,...ranked.map(x=>x[1]));
 setList('dashboardRegions',ranked.map(([r,n])=>'<div class="dashboard-region"><div><b>'+esc(r)+'</b><span>'+n+'</span></div><div class="dashboard-track"><i style="width:'+Math.round(n/max*100)+'%"></i></div></div>').join(''),'Zatím nejsou žádné poptávky.');
 setList('dashboardTasks',taskRows(leads,quotes,referrals), 'Žádné naléhavé úkoly podle aktuálních údajů.');
 const notice=document.getElementById('dashboardDataNote');if(notice)notice.textContent='Aktualizováno '+new Date().toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague'})+' · částky vycházejí pouze z evidovaných zakázek.';
}
async function load(event){
 if(busy)return;const api=window.PLOTAOAdmin;if(!api)return;busy=true;
 try{
  const leads=Array.isArray(event?.detail?.leads)?event.detail.leads:api.leads||[];
  const [quotes,jobs,referrals]=await Promise.all([
   api.request('/functions/v1/admin-leads?resource=quotes'),
   api.request('/functions/v1/admin-leads?resource=jobs'),
   api.request('/functions/v1/admin-leads?resource=referrals')
  ]);
  render(leads,Array.isArray(quotes)?quotes:[],Array.isArray(jobs)?jobs:[],Array.isArray(referrals)?referrals:[]);
 }catch(err){
  const el=document.getElementById('dashboardDataNote');if(el)el.textContent='Rozšířené přehledy se nepodařilo načíst: '+err.message;
 }finally{busy=false}
}
window.addEventListener('plotao:admin-data',load);
if(window.PLOTAOAdmin?.leads)load({detail:{leads:window.PLOTAOAdmin.leads}});
})();