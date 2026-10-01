(()=> {
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const statusLabels={new:'Nová',review:'Prověřit',waiting_customer:'Čekáme na zákazníka',preparing_quote:'Připravuje se nabídka',quote_sent:'Nabídka odeslána',waiting_decision:'Čekáme na rozhodnutí',ordered:'Objednáno',partner_assigned:'Předáno partnerovi',completed:'Vyřízeno',closed:'Uzavřeno',contacted:'Kontaktováno'};
 let sourceLeads=[],expanded=new Set(),selected=new Set();
 const normalized=value=>String(value||'').trim().toLocaleLowerCase('cs-CZ');
 const customerKey=lead=>{if(lead.email&&lead.email.trim())return 'email:'+normalized(lead.email);const digits=String(lead.phone||'').replace(/\D/g,'');return digits?'phone:'+digits:'lead:'+lead.id};
 const received=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('cs-CZ',{timeZone:'Europe/Prague',dateStyle:'short',timeStyle:'short'})};
 function groups(){
  const map=new Map();
  [...sourceLeads].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).forEach(lead=>{
   const key=customerKey(lead),group=map.get(key)||{key,leads:[]};group.leads.push(lead);map.set(key,group)
  });
  return [...map.values()].sort((a,b)=>new Date(b.leads[0]?.created_at)-new Date(a.leads[0]?.created_at))
 }
 function leadDetail(group){
  return '<tr class="customer-history-row"><td colspan="6"><div class="panel"><strong>Historie zákazníka</strong><div class="list">'+group.leads.map(lead=>'<div class="lead"><b>'+esc(lead.payload?.fenceType||(lead.mode==='help'?'Potřebuji poradit':lead.mode==='partner'?'Zájem o spolupráci':'Poptávka plotu'))+'</b><span class="badge '+(lead.status==='completed'?'closed':lead.status==='new'?'new':'contacted')+'">'+esc(statusLabels[lead.status]||lead.status||'—')+'</span><small>'+esc(lead.place||'Místo neuvedeno')+' · '+esc(received(lead.created_at))+'</small><button type="button" class="link" data-customer-lead="'+esc(lead.id)+'">Otevřít poptávku →</button></div>').join('')+'</div></div></td></tr>'
 }
 function render(){
  const body=document.querySelector('#customerRows');if(!body)return;
  const query=normalized(document.querySelector('#customerSearch')?.value),all=groups();
  const filtered=all.filter(group=>{const l=group.leads[0]||{};return !query||[l.name,l.email,l.phone,...group.leads.map(x=>x.place)].some(v=>normalized(v).includes(query))});
  const count=document.querySelector('#customerCount');if(count)count.textContent=filtered.length+' zákazníků · '+filtered.reduce((n,g)=>n+g.leads.length,0)+' poptávek';
  body.innerHTML=filtered.map(group=>{
   const latest=group.leads[0],email=group.leads.find(x=>x.email)?.email||'',phone=group.leads.find(x=>x.phone)?.phone||'',opened=expanded.has(group.key);
   return '<tr><td data-label="Vybrat"><input type="checkbox" class="customer-select" data-customer-select="'+esc(group.key)+'" aria-label="Vybrat '+esc(latest.name||'zákazníka')+'" '+(selected.has(group.key)?'checked':'')+'></td><td data-label="Zákazník"><strong>'+esc(latest.name||'Zákazník')+'</strong></td><td data-label="Kontakt">'+(email?'<a href="mailto:'+esc(email)+'">'+esc(email)+'</a>':'')+(phone?'<small><a href="tel:'+esc(phone)+'">'+esc(phone)+'</a></small>':'')+(!email&&!phone?'—':'')+'</td><td data-label="Poptávky">'+group.leads.length+'</td><td data-label="Poslední aktivita">'+esc(received(latest.created_at))+'</td><td data-label="Historie"><div class="customer-actions"><button class="link" type="button" data-customer-toggle="'+esc(group.key)+'">'+(opened?'Skrýt':'Historie')+'</button><button class="link customer-delete" type="button" data-customer-delete="'+esc(group.key)+'">Smazat</button></div><small class="customer-delete-status" data-customer-delete-status="'+esc(group.key)+'" role="status"></small></td></tr>'+(opened?leadDetail(group):'')
  }).join('')||'<tr><td colspan="6" class="empty">Zatím nejsou žádní zákazníci odpovídající hledání.</td></tr>'
  updateBulkBar(filtered);
 }
 function updateBulkBar(visible=groups()){
  const bar=document.querySelector('#customerBulkActions'),count=document.querySelector('#customerSelectedCount'),master=document.querySelector('[data-customer-select-all]');
  const chosen=[...selected].map(key=>groups().find(group=>group.key===key)).filter(Boolean),leadCount=chosen.reduce((n,group)=>n+group.leads.length,0);
  if(bar)bar.hidden=!chosen.length;
  if(count)count.textContent=chosen.length+' vybráno · '+leadCount+' poptávek';
  if(master){const visibleKeys=visible.map(group=>group.key),selectedVisible=visibleKeys.filter(key=>selected.has(key)).length;master.checked=visibleKeys.length>0&&selectedVisible===visibleKeys.length;master.indeterminate=selectedVisible>0&&selectedVisible<visibleKeys.length}
 }
 document.querySelector('#customerSearch')?.addEventListener('input',render);
 document.addEventListener('change',event=>{
  const master=event.target.closest('[data-customer-select-all]');
  if(master){groups().filter(group=>!document.querySelector('#customerSearch')?.value||[group.leads[0]?.name,group.leads[0]?.email,group.leads[0]?.phone,...group.leads.map(x=>x.place)].some(value=>normalized(value).includes(normalized(document.querySelector('#customerSearch')?.value)))).forEach(group=>master.checked?selected.add(group.key):selected.delete(group.key));render();return}
  const checkbox=event.target.closest('[data-customer-select]');if(checkbox){checkbox.checked?selected.add(checkbox.dataset.customerSelect):selected.delete(checkbox.dataset.customerSelect);updateBulkBar();return}
 });
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-customer-clear-selection]')){selected.clear();const message=document.querySelector('#customerBulkStatus');if(message)message.textContent='';render();return}
  if(event.target.closest('[data-customer-email-selected]')){emailSelected();return}
  if(event.target.closest('[data-customer-delete-selected]')){deleteSelected();return}
  const remove=event.target.closest('[data-customer-delete]');
  if(remove){deleteCustomer(remove.dataset.customerDelete,remove);return}
  const toggle=event.target.closest('[data-customer-toggle]');
  if(toggle){const key=toggle.dataset.customerToggle;expanded.has(key)?expanded.delete(key):expanded.add(key);render();return}
  const open=event.target.closest('[data-customer-lead]');
  if(open){document.querySelector('[data-view="leads"]')?.click();document.querySelector('[data-open="'+CSS.escape(open.dataset.customerLead)+'"]')?.click()}
 });
 window.addEventListener('plotao:admin-data',event=>{sourceLeads=Array.isArray(event.detail?.leads)?event.detail.leads:[];render()});
 async function deleteCustomer(key,button){
  const group=groups().find(item=>item.key===key);if(!group)return;
  const latest=group.leads[0],email=group.leads.find(x=>x.email)?.email||'',phone=group.leads.find(x=>x.phone)?.phone||'';
  const identityType=key.slice(0,key.indexOf(':')),identityValue=key.slice(key.indexOf(':')+1);
  const label=latest.name||email||phone||'Zákazník';
  if(!confirm('Opravdu smazat zákazníka „'+label+'“ a všech '+group.leads.length+' jeho poptávek? Smaže se také historie komunikace a předání partnerům. Nabídky nebo zakázky mazání zablokují. Audit zůstane anonymně bez kontaktů. Tuto akci nelze vrátit.'))return;
  const status=document.querySelector('[data-customer-delete-status="'+CSS.escape(key)+'"]');
  button.disabled=true;if(status)status.textContent='Mažu zákazníka a jeho poptávky…';
  try{
   const result=await window.PLOTAOAdmin.request('/functions/v1/admin-leads','DELETE',{lead_ids:group.leads.map(x=>x.id),identity_type:identityType,identity_value:identityValue});
   if(status)status.textContent='Smazáno: '+(result.deleted_leads||0)+' poptávek.';
   await window.PLOTAOAdmin.refresh();
  }catch(error){
   if(status)status.textContent=error.code==='customer_has_quotes_or_jobs'?'Nelze smazat: zákazník má navázanou nabídku nebo zakázku. Historie musí zůstat zachována.':error.code==='customer_group_changed'?'Seznam poptávek se mezitím změnil. Obnovte administraci a zkuste to znovu.':error.message;
   button.disabled=false;
  }
 }
 function selectedGroups(){return [...selected].map(key=>groups().find(group=>group.key===key)).filter(Boolean)}
 function emailSelected(){
  const groupsToEmail=selectedGroups(),emails=[...new Set(groupsToEmail.flatMap(group=>group.leads.map(lead=>String(lead.email||'').trim()).filter(email=>/^\S+@\S+\.\S+$/.test(email))))],withoutEmail=groupsToEmail.filter(group=>!group.leads.some(lead=>/^\S+@\S+\.\S+$/.test(String(lead.email||'').trim()))).length;
  if(!emails.length){alert('Vybraní zákazníci nemají platný e-mail.');return}
  if(withoutEmail&&!confirm('E-mail se připraví pro '+emails.length+' adres. '+withoutEmail+' vybraných zákazníků nemá platný e-mail a nebude zahrnuto. Pokračovat?'))return;
  const url='mailto:?bcc='+encodeURIComponent(emails.join(','));
  if(url.length>1800){alert('Je vybráno příliš mnoho e-mailů pro jednu zprávu. Vyberte menší skupinu.');return}
  window.location.href=url;
 }
 async function deleteSelected(){
  const chosen=selectedGroups();if(!chosen.length)return;
  const leadCount=chosen.reduce((n,group)=>n+group.leads.length,0);
  if(!confirm('Smazat '+chosen.length+' vybraných zákazníků a jejich '+leadCount+' poptávek? Zákazníci s nabídkou nebo zakázkou zůstanou zachováni. Ostatní poptávky, komunikace a předání partnerům se smažou. Každý zákazník se ověří samostatně, takže část výběru může zůstat zachována. Tuto akci nelze vrátit.'))return;
  const button=document.querySelector('[data-customer-delete-selected]'),status=document.querySelector('#customerBulkStatus');
  if(button)button.disabled=true;if(status)status.textContent='Ověřuji a mažu vybrané zákazníky…';
  const results=await Promise.all(chosen.map(async group=>{
   const type=group.key.slice(0,group.key.indexOf(':')),value=group.key.slice(group.key.indexOf(':')+1);
   try{return{group,result:await window.PLOTAOAdmin.request('/functions/v1/admin-leads','DELETE',{lead_ids:group.leads.map(x=>x.id),identity_type:type,identity_value:value})}}
   catch(error){return{group,error}}
  }));
  const removed=results.filter(item=>!item.error),blocked=results.filter(item=>item.error);
  removed.forEach(item=>selected.delete(item.group.key));
  if(status)status.textContent='Smazáno '+removed.length+' zákazníků a '+removed.reduce((n,item)=>n+(item.result.deleted_leads||0),0)+' poptávek.'+(blocked.length?' '+blocked.length+' zákazníků zůstalo zachováno, protože mají nabídku/zakázku nebo se změnily jejich poptávky.':'');
  if(button)button.disabled=false;
  try{await window.PLOTAOAdmin.refresh()}catch(error){if(status)status.textContent+=' Obnovení seznamu selhalo: '+error.message}
 }
})();
