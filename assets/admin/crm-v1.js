(()=> {
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const statusLabels={new:'Nová',review:'Prověřit',waiting_customer:'Čekáme na zákazníka',preparing_quote:'Připravuje se nabídka',quote_sent:'Nabídka odeslána',waiting_decision:'Čekáme na rozhodnutí',ordered:'Objednáno',partner_assigned:'Předáno partnerovi',completed:'Vyřízeno',closed:'Uzavřeno',contacted:'Kontaktováno'};
 let sourceLeads=[],expanded=new Set();
 const normalized=value=>String(value||'').trim().toLocaleLowerCase('cs-CZ');
 const customerKey=lead=>lead.email&&lead.email.trim()?'email:'+normalized(lead.email):lead.phone&&lead.phone.trim()?'phone:'+lead.phone.replace(/\D/g,''):'lead:'+lead.id;
 const received=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('cs-CZ',{timeZone:'Europe/Prague',dateStyle:'short',timeStyle:'short'})};
 function groups(){
  const map=new Map();
  [...sourceLeads].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).forEach(lead=>{
   const key=customerKey(lead),group=map.get(key)||{key,leads:[]};group.leads.push(lead);map.set(key,group)
  });
  return [...map.values()].sort((a,b)=>new Date(b.leads[0]?.created_at)-new Date(a.leads[0]?.created_at))
 }
 function leadDetail(group){
  return '<tr class="customer-history-row"><td colspan="5"><div class="panel"><strong>Historie zákazníka</strong><div class="list">'+group.leads.map(lead=>'<div class="lead"><b>'+esc(lead.payload?.fenceType||(lead.mode==='help'?'Potřebuji poradit':lead.mode==='partner'?'Zájem o spolupráci':'Poptávka plotu'))+'</b><span class="badge '+(lead.status==='completed'?'closed':lead.status==='new'?'new':'contacted')+'">'+esc(statusLabels[lead.status]||lead.status||'—')+'</span><small>'+esc(lead.place||'Místo neuvedeno')+' · '+esc(received(lead.created_at))+'</small><button type="button" class="link" data-customer-lead="'+esc(lead.id)+'">Otevřít poptávku →</button></div>').join('')+'</div></div></td></tr>'
 }
 function render(){
  const body=document.querySelector('#customerRows');if(!body)return;
  const query=normalized(document.querySelector('#customerSearch')?.value),all=groups();
  const filtered=all.filter(group=>{const l=group.leads[0]||{};return !query||[l.name,l.email,l.phone,...group.leads.map(x=>x.place)].some(v=>normalized(v).includes(query))});
  const count=document.querySelector('#customerCount');if(count)count.textContent=filtered.length+' zákazníků · '+filtered.reduce((n,g)=>n+g.leads.length,0)+' poptávek';
  body.innerHTML=filtered.map(group=>{
   const latest=group.leads[0],email=group.leads.find(x=>x.email)?.email||'',phone=group.leads.find(x=>x.phone)?.phone||'',opened=expanded.has(group.key);
   return '<tr><td data-label="Zákazník"><strong>'+esc(latest.name||'Zákazník')+'</strong></td><td data-label="Kontakt">'+(email?'<a href="mailto:'+esc(email)+'">'+esc(email)+'</a>':'')+(phone?'<small><a href="tel:'+esc(phone)+'">'+esc(phone)+'</a></small>':'')+(!email&&!phone?'—':'')+'</td><td data-label="Poptávky">'+group.leads.length+'</td><td data-label="Poslední aktivita">'+esc(received(latest.created_at))+'</td><td data-label="Historie"><button class="link" type="button" data-customer-toggle="'+esc(group.key)+'">'+(opened?'Skrýt':'Historie')+'</button></td></tr>'+(opened?leadDetail(group):'')
  }).join('')||'<tr><td colspan="5" class="empty">Zatím nejsou žádní zákazníci odpovídající hledání.</td></tr>'
 }
 document.querySelector('#customerSearch')?.addEventListener('input',render);
 document.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-customer-toggle]');
  if(toggle){const key=toggle.dataset.customerToggle;expanded.has(key)?expanded.delete(key):expanded.add(key);render();return}
  const open=event.target.closest('[data-customer-lead]');
  if(open){document.querySelector('[data-view="leads"]')?.click();document.querySelector('[data-open="'+CSS.escape(open.dataset.customerLead)+'"]')?.click()}
 });
 window.addEventListener('plotao:admin-data',event=>{sourceLeads=Array.isArray(event.detail?.leads)?event.detail.leads:[];render()});
})();
