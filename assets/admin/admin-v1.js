(()=>{const S='https://jmukoccjqykyoqsypuwb.supabase.co',K='sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V',F=S+'/functions/v1/admin-leads',AUTH=S+'/auth/v1/token?grant_type=password';
const box=document.createElement('div');box.style='position:fixed;right:24px;top:86px;z-index:10;background:#fff;padding:16px;border:1px solid #dce8e1;border-radius:12px;box-shadow:0 8px 30px #12392b22;width:min(340px,calc(100vw - 32px))';box.innerHTML='<b>Přihlášení administrátora</b><div style="display:grid;gap:8px;margin-top:10px"><input id="admEmail" type="email" autocomplete="username" placeholder="E-mail"><input id="admPass" type="password" autocomplete="current-password" placeholder="Heslo"><button id="admLogin" class="action">Přihlásit a načíst poptávky</button><small id="admMsg"></small></div>';document.body.append(box);
const statuses={new:'Nová',review:'Prověřit',waiting_customer:'Čekáme na zákazníka',preparing_quote:'Připravuje se nabídka',quote_sent:'Nabídka odeslána',waiting_decision:'Čekáme na rozhodnutí',ordered:'Objednáno',partner_assigned:'Předáno partnerovi',completed:'Vyřízeno',closed:'Uzavřeno bez realizace',contacted:'Kontaktováno'};
const SERVICE_TYPES=[{value:"installation_material",label:"Montáž i materiál"},{value:"installation_only",label:"Pouze montáž"},{value:"material_only",label:"Pouze materiál"}];
const REGIONS=["Hlavní město Praha","Středočeský kraj","Jihočeský kraj","Plzeňský kraj","Karlovarský kraj","Ústecký kraj","Liberecký kraj","Královéhradecký kraj","Pardubický kraj","Kraj Vysočina","Jihomoravský kraj","Olomoucký kraj","Zlínský kraj","Moravskoslezský kraj"];
const FENCE_TYPES=["Panelový plot","Pletivový plot","Betonový plot","Gabionový plot","Hliníkový plot","Kovový plot","Zděný plot","Mobilní oplocení","Živý plot","Všechny typy"];
const normMatch=s=>String(s||'').toLocaleLowerCase('cs-CZ').replace(/[\s,]+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let token='',leads=[],partners=[],referrals=[];
let refreshPromise=null;
const saved=()=>{try{return JSON.parse(sessionStorage.getItem('plotao.auth')||localStorage.getItem('plotao.auth')||'null')}catch{return null}};
function persistSession(session){sessionStorage.setItem('plotao.auth',JSON.stringify(session));localStorage.removeItem('plotao.auth')}
function clearSession(){sessionStorage.removeItem('plotao.auth');localStorage.removeItem('plotao.auth')}
function tokenExpiry(value){try{const part=value.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(part.padEnd(part.length+((4-part.length%4)%4),'='))).exp||0}catch{return 0}}
async function renewSession(session,force=false){
 if(!session?.access_token)return null;
 if(!force&&tokenExpiry(session.access_token)*1000>Date.now()+60000)return session;
 if(!session.refresh_token)return null;
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{try{const response=await fetch(S+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});let next;try{next=await response.json()}catch{next=null}if(!response.ok||!next?.access_token||!next?.refresh_token){clearSession();return null}persistSession(next);return next}catch{return null}})();
 try{return await refreshPromise}finally{refreshPromise=null}
}
function authBox(message=''){box.style.display='block';document.querySelector('#admMsg').textContent=message}
async function jsonRequest(path,method='GET',body=null){
 const url=/^https?:\/\//i.test(path)?path:S+path;
 const send=()=>fetch(url,{method,headers:{apikey:K,Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let response=await send();
 if(response.status===401){const session=await renewSession(saved(),true);if(session?.access_token){token=session.access_token;response=await send()}if(response.status===401){clearSession();token='';window.location.reload()}}
 let data;try{data=await response.json()}catch{data=null}
 if(!response.ok){const code=data?.error||data?.code||response.headers.get('sb-error-code')||'request_failed';const messages={partner_consent_required:'Zákazník nedal souhlas s předáním údajů partnerovi.',partner_region_required:'Nejdřív uložte kraj realizace v detailu poptávky.',partner_already_assigned:'Tato poptávka už má aktivní předání jiné firmě.',partner_region_mismatch:'Firma nepůsobí v tomto kraji.',partner_type_mismatch:'Firma neprovádí zvolený typ oplocení.',partner_service_mismatch:'Firma nenabízí požadovanou kombinaci montáže a materiálu.',partner_email_failed:'Resend e-mail nepřijal. Ověřte jeho nastavení a doménu.',email_send_failed:'Resend e-mail nepřijal. Zkontrolujte ověření domény a nastavení účtu.',email_sent_log_failed:'Resend e-mail přijal, ale uložení do historie selhalo. Před opakováním ověřte složku Odeslané.',resend_not_configured:'V Supabase chybí klíč Resend.',partner_send_record_failed:'E-mail mohl být odeslán, ale uložení předání selhalo; před opakováním zkontrolujte historii.'};const error=new Error(messages[code]||('Požadavek selhal (HTTP '+response.status+(code?' · '+code:'')+(data?.message?': '+data.message:'')+').'));error.status=response.status;error.code=code;throw error}
 return data
}
function serviceLabels(p){return (p.service_types||["material_only"]).map(v=>SERVICE_TYPES.find(x=>x.value===v)?.label||v).join(" · ")}
function renderPartners(){
 const body=document.querySelector('#partnerRows');if(!body)return;
 const count=document.querySelector('#partnerCount');if(count)count.textContent=String(partners.length);
 body.innerHTML=partners.map(p=>'<tr><td><strong>'+esc(p.company_name)+'</strong>'+(p.contact_name?'<small>'+esc(p.contact_name)+'</small>':'')+'<small><a href="mailto:'+esc(p.email)+'">'+esc(p.email)+'</a></small>'+(p.phone?'<small>'+esc(p.phone)+'</small>':'')+(p.ico?'<small>IČO '+esc(p.ico)+'</small>':'')+'</td><td>'+esc((p.regions||[]).join(' · '))+'</td><td>'+esc((p.fence_types||[]).join(' · '))+'</td><td><span class="badge '+(p.active?'closed':'new')+'">'+(p.active?'Aktivní':'Pozastavená')+'</span></td><td><div class="partner-row-actions"><button class="link" data-edit-partner="'+esc(p.id)+'">Upravit</button><button class="link" data-toggle-partner="'+esc(p.id)+'">'+(p.active?'Pozastavit':'Aktivovat')+'</button></div></td></tr>').join('')||'<tr><td colspan="6" class="empty">Zatím tu nejsou žádné partnerské firmy. Zaregistrujte první firmu pomocí tlačítka nahoře.</td></tr>';
}
function sessionInfo(){const session=saved(),activeToken=token||session?.access_token||'',claims=(()=>{try{const part=activeToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(part.padEnd(part.length+((4-part.length%4)%4),'=')))}catch{return {}}})();return{email:session?.user?.email||claims.email||'',expiresAt:tokenExpiry(activeToken)*1000}}
async function changeAdminPassword(currentPassword,newPassword){const account=sessionInfo().email;if(!account)throw Error('Přihlášení už není platné. Přihlaste se prosím znovu.');const login=await fetch(AUTH,{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email:account,password:currentPassword})});let session;try{session=await login.json()}catch{session=null}if(!login.ok||!session?.access_token)throw Error('Aktuální heslo není správné.');const response=await fetch(S+'/auth/v1/user',{method:'PUT',headers:{apikey:K,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({password:newPassword})});let data;try{data=await response.json()}catch{data=null}if(!response.ok)throw Error('Heslo se nepodařilo změnit. Zkontrolujte požadavky na heslo v Supabase Auth.');persistSession(session);token=session.access_token;return data}
async function signOutAdmin(){try{if(token)await fetch(S+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:K,Authorization:'Bearer '+token}})}catch{}clearSession();token='';window.location.reload()}
async function load(t){
 token=t;
 const [leadData,partnerData,referralData]=await Promise.all([
  jsonRequest(F),
  jsonRequest(F+'?resource=partners'),
  jsonRequest(F+'?resource=referrals')
 ]);
 leads=Array.isArray(leadData)?leadData:[];partners=Array.isArray(partnerData)?partnerData:[];referrals=Array.isArray(referralData)?referralData:[];
 box.style.display='none';render();renderPartners();
 window.PLOTAOAdmin={request:(path,method='GET',body=null)=>jsonRequest(path,method,body),get leads(){return leads},get token(){return token},get session(){return sessionInfo()},refresh:()=>load(token),show:view=>{const b=document.querySelector('[data-view="'+view+'"]');if(b)b.click()},changePassword:changeAdminPassword,signOut:signOutAdmin};
 window.dispatchEvent(new CustomEvent('plotao:admin-data',{detail:{leads}}));
 document.querySelector('#statLeads').textContent=leads.filter(x=>x.status==='new').length;
 const statusBox=document.querySelector('#dashboardStatuses');
 const stateRows=Object.entries(statuses).map(([key,label])=>({key,label,count:leads.filter(x=>x.status===key).length})).filter(x=>x.count>0);
 const waitingPartner=referrals.filter(x=>x.status==='sent').length;
 if(statusBox)statusBox.innerHTML=(stateRows.map(x=>'<div class="lead"><b>'+esc(x.label)+'</b><span class="badge '+(x.key==='new'?'new':x.key==='completed'?'closed':'contacted')+'">'+x.count+'</span></div>').join('')+(waitingPartner?'<div class="lead"><b>Čeká na reakci partnera</b><span class="badge new">'+waitingPartner+'</span></div>':'')||'<div class="empty">Zatím nejsou žádné poptávky.</div>');
 const recent=document.querySelector('#dashboard .grid .panel:last-child .list');
 if(recent)recent.innerHTML=leads.slice(0,5).map(x=>'<div class="lead"><b>'+esc(x.name)+'</b><span class="badge new">'+esc(statuses[x.status]||x.status)+'</span><small>'+esc(x.place||'Lokalita neuvedena')+' · '+esc(x.mode==='help'?'Rada':x.mode==='partner'?'Partner':'Poptávka')+'</small></div>').join('')||'<div class="empty">Zatím žádné poptávky.</div>';
}
function leadRegion(x){const value=[x.region,x.payload?.region,x.place,x.payload?.placeFromCalculator].filter(Boolean).join(' ').toLocaleLowerCase('cs-CZ');return REGIONS.find(r=>value.includes(r.toLocaleLowerCase('cs-CZ')))||''}
function matchesPartner(x,p){
 const region=leadRegion(x);if(!region||!p.active||!(p.regions||[]).includes(region))return false;
 const services=p.service_types||['material_only'],scope=x.payload?.scopeValue||'material';
 const installNeeded=scope==='turnkey'||scope==='installation',materialNeeded=scope!=='installation';
 if(installNeeded&&!services.includes('installation_material')&&!services.includes('installation_only'))return false;
 if(materialNeeded&&!services.includes('installation_material')&&!services.includes('material_only'))return false;
 const type=String(x.payload?.fenceType||'').toLocaleLowerCase('cs-CZ'),unknown=!type||['neupřesněno','kalkulátor plotu','poradit s výběrem'].includes(type);
 return unknown||(p.fence_types||[]).includes('Všechny typy')||(p.fence_types||[]).some(v=>type.includes(v.toLocaleLowerCase('cs-CZ'))||v.toLocaleLowerCase('cs-CZ').includes(type))
}
function area(x){const v=(x.region||x.payload?.region||x.place||'').toLowerCase();const list=['Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj'];return list.find(r=>v.includes(r.toLowerCase()))||'Kraj bude upřesněn'}
function total(x){const ss=x.payload?.segments||[];const n=ss.reduce((a,b)=>a+(Number(b.length)||0),0);return n?n.toLocaleString('cs-CZ')+' m':'—'}
function displayText(value){return String(value??'').replace(/\\r\\n|\\n|\\r/g,'\n')}
function displayText(value){return String(value??'').replace(/\\r\\n|\\n|\\r/g,'\n')}
function detail(x){
 const p=x.payload||{},opts=Array.isArray(p.options)?p.options.join(' · '):'',type=p.fenceType||(x.mode==='help'?'Potřebuji poradit':x.mode==='partner'?'Zájem o spolupráci':'Poptávka plotu');
 const messages=(x.communication||[]).map(m=>'<div class="message '+(m.direction==='in'?'in':'out')+'"><small>'+(m.direction==='in'?'Zpráva od zákazníka':m.kind==='automatic_confirmation'?'Automatické potvrzení':'Odpověď od PLOTAO')+' · '+((m.recorded_at||m.sent_at)?new Date(m.recorded_at||m.sent_at).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'}):'')+'</small><p>'+esc(displayText(m.body))+'</p></div>').join('');
 const original=x.note?'<div class="message in"><small>Původní zpráva · '+receivedAt(x.created_at)+'</small><p>'+esc(displayText(x.note))+'</p></div>':'';
 const history=referrals.filter(r=>r.lead_id===x.id),active=history.find(r=>['sending','sent','accepted'].includes(r.status)),matching=partners.filter(p=>matchesPartner(x,p));
 const consent=p.partner_share_consent===true,region=leadRegion(x);
 const referralStatus={sending:'Odesílá se',sent:'Předáno firmě',accepted:'Firma přijala',declined:'Firma odmítla',withdrawn:'Předání uvolněno',failed:'Odeslání selhalo'};
 let handoff='';
 if(!consent)handoff='<div class="handoff-notice blocked"><b>Předání je zablokované</b><span>Zákazník zatím nesouhlasil s předáním kontaktu partnerské firmě. Nejdřív si vyžádejte jeho souhlas.</span></div>';
 else if(!region)handoff='<div class="handoff-notice"><b>Chybí kraj realizace</b><span>Doplňte a uložte kraj v bloku „Vyřízení žádosti“.</span></div>';
 else if(active){
  const firm=active.plotao_partners?.company_name||partners.find(v=>v.id===active.partner_id)?.company_name||'Partnerská firma';
  const date=active.sent_at?new Date(active.sent_at).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'}):'';
  handoff='<div class="active-handoff"><div><small>'+esc(referralStatus[active.status]||active.status)+' · '+esc(date)+'</small><strong>'+esc(firm)+'</strong></div><div class="handoff-actions">'+(active.status==='sent'?'<button type="button" data-referral-action="accepted" data-referral-id="'+esc(active.id)+'" data-lead-id="'+esc(x.id)+'">Firma přijala</button>':'')+'<button type="button" class="secondary" data-referral-action="declined" data-referral-id="'+esc(active.id)+'" data-lead-id="'+esc(x.id)+'">Firma odmítla</button><button type="button" class="secondary" data-referral-action="withdrawn" data-referral-id="'+esc(active.id)+'" data-lead-id="'+esc(x.id)+'">Uvolnit firmu</button></div></div>';
 }else{
  handoff=matching.length?'<div class="handoff-send"><label for="partner-choice-'+esc(x.id)+'">Vhodné firmy · '+esc(region)+'</label><div class="handoff-picker"><select id="partner-choice-'+esc(x.id)+'" data-partner-choice="'+esc(x.id)+'"><option value="">Vyberte jednu firmu</option>'+matching.map(v=>'<option value="'+esc(v.id)+'">'+esc(v.company_name)+' · '+esc(v.email)+'</option>').join('')+'</select><button type="button" data-send-partner="'+esc(x.id)+'">Předat poptávku</button></div><small>Kontakty zákazníka obdrží pouze vybraná firma. Další partner dostane poptávku až po odmítnutí nebo uvolnění této.</small></div>':'<div class="handoff-notice"><b>Pro tuto poptávku není vhodný aktivní partner</b><span>V evidenci není firma pro kraj '+esc(region)+' a typ '+esc(p.fenceType||'oplocení')+'. Upravte její působnost nebo nejdřív zaregistrujte vhodnou firmu.</span></div>';
 }
 const past=history.filter(r=>!['sending','sent','accepted'].includes(r.status)).map(r=>'<div class="handoff-history"><span>'+esc(r.plotao_partners?.company_name||partners.find(v=>v.id===r.partner_id)?.company_name||'Firma')+'</span><small>'+esc(referralStatus[r.status]||r.status)+' · '+esc(r.updated_at?new Date(r.updated_at).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'}):'')+'</small></div>').join('');
 const regionOptions='<option value="">Vyberte kraj…</option>'+REGIONS.map(v=>'<option value="'+esc(v)+'" '+((x.region||p.region)===v?'selected':'')+'>'+esc(v)+'</option>').join('');
 return '<tr hidden class="detail-row" data-detail="'+esc(x.id)+'"><td colspan="8"><div class="lead-detail"><section class="lead-main"><header class="detail-head"><div><span class="eyebrow">PŘIJATÁ ŽÁDOST · '+esc(receivedAt(x.created_at))+'</span><h3>'+esc(type)+'</h3></div><span class="badge '+(x.status==='new'?'new':x.status==='closed'?'closed':'contacted')+'">'+esc(statuses[x.status]||x.status)+'</span></header><div class="detail-facts"><div><small>Zákazník</small><strong>'+esc(x.name)+'</strong></div><div><small>Telefon</small><strong>'+(x.phone?'<a href="tel:'+esc(x.phone)+'">'+esc(x.phone)+'</a>':'—')+'</strong></div><div><small>E-mail</small><strong>'+(x.email?'<a href="mailto:'+esc(x.email)+'">'+esc(x.email)+'</a>':'—')+'</strong></div><div><small>Místo realizace</small><strong>'+esc(x.place||'Lokalita neuvedena')+'</strong><small>'+esc(region||'Kraj není určen')+'</small></div><div><small>Typ oplocení</small><strong>'+esc(p.fenceType||type)+'</strong></div><div><small>Délka</small><strong>'+esc(total(x))+'</strong></div><div><small>Souhlas s předáním</small><strong class="'+(consent?'consent-yes':'consent-no')+'">'+(consent?'Ano':'Ne')+'</strong></div></div><div class="spec-box"><b>Podklady k žádosti</b><button type="button" class="secondary quote-from-lead" data-create-quote-from-lead="'+x.id+'">Vytvořit nabídku</button><p>'+esc([p.scope,p.height?'Výška '+p.height+' cm':'',opts].filter(Boolean).join(' · ')||'Zákazník zatím neposlal další technické údaje.')+'</p></div><section class="conversation"><header class="conversation-head"><div><h3>Komunikace</h3><small>Původní zpráva a e-mailová historie</small></div><span class="mail-state">'+(x.email?'E-mail zákazníka uveden':'Bez e-mailu')+'</span></header><div class="thread">'+(original+messages||'<div class="empty">Zatím bez zpráv.</div>')+'</div>'+(x.email?'<div class="reply-compose"><label for="reply-'+esc(x.id)+'">Vaše odpověď</label><textarea id="reply-'+esc(x.id)+'" data-reply="'+esc(x.id)+'" placeholder="Napište odpověď zákazníkovi…"></textarea><div class="reply-actions"><button data-send-reply="'+esc(x.id)+'">Odeslat odpověď</button><small class="reply-help">Odpověď se odešle z adresy PLOTAO.cz.</small></div></div>':'<div class="no-email">Zákazník neuvedl e-mail. Zavolejte mu: '+(x.phone?'<a href="tel:'+esc(x.phone)+'">'+esc(x.phone)+'</a>':'telefon není uveden')+'</div>')+'</section><section class="partner-handoff"><header><div><span class="eyebrow">PŘEDÁNÍ ZAKÁZKY</span><h3>Partnerská firma</h3></div><span class="handoff-count">'+history.length+'×</span></header>'+handoff+past+'</section></section><aside class="lead-workflow"><header><span class="eyebrow">DALŠÍ POSTUP</span><h3>Vyřízení žádosti</h3></header><label>Stav poptávky<select data-field="status">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'" '+(x.status===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Kraj realizace<select data-field="region">'+regionOptions+'</select></label><label>Odpovědná osoba<input data-field="assigned_to" value="'+esc(x.assigned_to||'')+'" placeholder="Kdo žádost vyřizuje?"></label><label class="wide">Další krok<input data-field="next_action" value="'+esc(x.next_action||'')+'" placeholder="Např. ověřit podklady nebo zavolat"></label><label class="wide">Termín dalšího kroku<input data-field="next_action_at" type="datetime-local" value="'+(x.next_action_at?new Date(x.next_action_at).toISOString().slice(0,16):'')+'"></label><label class="wide">Partner / pobočka<input data-field="partner_name" value="'+esc(x.partner_name||'')+'" placeholder="Doplní se po předání"></label><button class="save-lead" data-save="'+esc(x.id)+'">Uložit vyřízení</button><span class="save-message" role="status"></span></aside></div></td></tr>'
}
function receivedAt(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))return '—';const tz='Europe/Prague',fmt=new Intl.DateTimeFormat('cs-CZ',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric'});return fmt.format(d)===fmt.format(new Date())?d.toLocaleTimeString('cs-CZ',{timeZone:tz,hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('cs-CZ',{timeZone:tz})}
function render(){const body=document.querySelector('#leadRows');if(!body)return;const q=(document.querySelector('#leadSearch')?.value||'').toLowerCase(),st=document.querySelector('#leadStatus')?.value||'',rg=document.querySelector('#leadRegion')?.value||'';const rows=leads.filter(x=>(!st||x.status===st)&&(!rg||area(x)===rg)&&(!q||[x.name,x.place,x.phone,x.email,x.note,x.payload?.fenceType,x.assigned_to].join(' ').toLowerCase().includes(q)));body.innerHTML=rows.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><small>'+esc(x.phone||x.email||'')+'</small></td><td>'+esc(x.place||'—')+(x.place&&x.place.trim().toLowerCase()===area(x).trim().toLowerCase()?'':'<small>'+esc(area(x))+'</small>')+'</td><td>'+esc(x.payload?.fenceType|| (x.mode==='help'?'Potřebuji poradit':'—'))+'<small>'+esc(x.payload?.scope||'')+'</small></td><td>'+esc(total(x))+'</td><td><select class="status-select" data-quick="'+esc(x.id)+'">'+Object.entries(statuses).map(([k,v])=>'<option value="'+k+'" '+(x.status===k?'selected':'')+'>'+v+'</option>').join('')+'</select></td><td>'+esc(x.next_action||'—')+(x.next_action_at?'<small>'+new Date(x.next_action_at).toLocaleString('cs-CZ')+'</small>':'')+'</td><td>'+receivedAt(x.created_at)+'</td><td><button class="link" data-open="'+esc(x.id)+'">Otevřít</button></td></tr>'+detail(x)).join('')||'<tr><td colspan="8" class="empty">Žádná poptávka neodpovídá filtrům.</td></tr>'}
async function patch(id,data){return jsonRequest(F,'PATCH',{id,...data})}
document.querySelector('#leadSearch')?.addEventListener('input',render);document.querySelector('#leadStatus')?.addEventListener('change',render);document.querySelector('#leadRegion')?.addEventListener('change',render);
document.addEventListener('click',async e=>{const open=e.target.closest('[data-open]');if(open){const row=document.querySelector('[data-detail="'+CSS.escape(open.dataset.open)+'"]');row.hidden=!row.hidden;open.textContent=row.hidden?'Otevřít':'Zavřít';}

const sendReply=e.target.closest('[data-send-reply]');if(sendReply){const id=sendReply.dataset.sendReply,area=document.querySelector('[data-reply="'+CSS.escape(id)+'"]'),msg=area?.closest('.conversation')?.querySelector('.reply-help'),body=area?.value?.trim();if(!body){if(msg)msg.textContent='Nejdřív napište odpověď.';return}sendReply.disabled=true;if(msg)msg.textContent='Odesílám e-mail…';try{const updated=await patch(id,{send_reply:body,request_id:crypto.randomUUID()});leads=leads.map(x=>x.id===updated.id?updated:x);render();const row=document.querySelector('[data-detail="'+CSS.escape(id)+'"]');if(row)row.hidden=false;const help=row?.querySelector('.reply-help');if(help)help.textContent='Resend e-mail přijal k odeslání. Stav poptávky: čekáme na zákazníka.'}catch(err){if(msg)msg.textContent=err.message;sendReply.disabled=false}}
const save=e.target.closest('[data-save]');if(save){const row=document.querySelector('[data-detail="'+CSS.escape(save.dataset.save)+'"]'),data={};row.querySelectorAll('[data-field]').forEach(el=>data[el.dataset.field]=el.value);const due=row.querySelector('[data-field=next_action_at]').value;data.next_action_at=due?new Date(due).toISOString():null;const msg=row.querySelector('[role=status]');msg.textContent='Ukládám…';try{const updated=await patch(save.dataset.save,data);leads=leads.map(x=>x.id===updated.id?updated:x);render();const refreshed=document.querySelector('[data-detail="'+CSS.escape(save.dataset.save)+'"]');if(refreshed){refreshed.hidden=false;const opener=document.querySelector('[data-open="'+CSS.escape(save.dataset.save)+'"]');if(opener)opener.textContent='Zavřít';const status=refreshed.querySelector('[role=status]');if(status)status.textContent='Uloženo'}}catch(err){msg.textContent=err.message}}
});
document.addEventListener('change',async e=>{const sel=e.target.closest('[data-quick]');if(!sel)return;try{const x=await patch(sel.dataset.quick,{status:sel.value});leads=leads.map(v=>v.id===x.id?x:v);render()}catch{authBox('Stav se nepodařilo uložit. Přihlaste se znovu.')}});
document.querySelector('#admLogin').onclick=async()=>{const m=document.querySelector('#admMsg');m.textContent='Ověřuji přihlášení…';try{const r=await fetch(AUTH,{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email:document.querySelector('#admEmail').value,password:document.querySelector('#admPass').value})}),j=await r.json();if(!r.ok||!j.access_token)throw Error('Přihlášení se nepodařilo. Ověřte e-mail, heslo a přístup správce.');persistSession(j);await load(j.access_token)}catch(e){m.textContent=e.message}};
function validIcoChecksum(value){
 const digits=String(value||'').replace(/\D/g,'');
 if(!/^\d{8}$/.test(digits))return false;
 const n=[...digits].map(Number);
 const sum=n[0]*8+n[1]*7+n[2]*6+n[3]*5+n[4]*4+n[5]*3+n[6]*2;
 const mod=sum%11,check=mod===0?1:mod===1?0:11-mod;
 return check===n[7];
}
let icoTimer=0,icoRequest=0;const verifiedIcoData=new Map();
async function lookupIco(value){
 const input=document.querySelector('#partnerForm input[name="ico"]'),status=document.querySelector('#icoStatus');
 if(!input||!status)return;
 const ico=String(value||'').replace(/\D/g,'');
 input.dataset.aresValid='';input.dataset.aresIco='';
 if(!ico){status.textContent='IČO je volitelné. Po zadání ověříme firmu v ARES.';return}
 if(ico.length!==8){status.textContent=ico.length<8?'Doplňte osm číslic IČO.':'IČO musí obsahovat osm číslic.';return}
 if(!validIcoChecksum(ico)){status.textContent='Kontrolní číslice nesouhlasí. Zkontrolujte zadané IČO.';return}
 const request=++icoRequest;status.textContent='Ověřuji IČO v registru ARES…';
 try{
  const response=await fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/'+encodeURIComponent(ico),{headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(request!==icoRequest||input.value.replace(/\D/g,'')!==ico)return;
  if(response.status===404){status.textContent='Toto IČO ARES nenašel. Ověřte, zda je správně.';return}
  if(!response.ok){status.textContent='ARES nyní neodpovídá. Registraci zkuste uložit později.';return}
  const state=data.seznamRegistraci?.stavZdrojeRos;
  if(String(data.ico)!==ico||state==='NEAKTIVNI'||state==='ZANIKLY'){
   status.textContent='IČO je v ARES neaktivní. Firmu nelze uložit s tímto IČO.';return
  }
  input.dataset.aresValid='true';input.dataset.aresIco=ico;
  const company=document.querySelector('#partnerForm input[name="company_name"]');
  const address=document.querySelector('#partnerForm input[name="registered_address"]');
  const addressData=data.sidlo||{};
  const fullAddress=addressData.textovaAdresa||[
   addressData.nazevUlice?[addressData.nazevUlice,String(addressData.cisloDomovni||'')+(addressData.cisloOrientacni?'/'+addressData.cisloOrientacni+String(addressData.cisloOrientacniPismeno||''):'')].filter(Boolean).join(' '):'',
   addressData.nazevObce,addressData.psc?String(addressData.psc):''
  ].filter(Boolean).join(', ');
  verifiedIcoData.set(ico,{companyName:data.obchodniJmeno||'',address:fullAddress,region:addressData.nazevKraje||''});
  if(company&&(!company.value.trim()||company.dataset.aresFilled==='true')){
   company.value=data.obchodniJmeno||company.value;company.dataset.aresFilled='true';
  }
  if(address&&(!address.value.trim()||address.dataset.aresFilled==='true')){
   address.value=fullAddress||address.value;address.dataset.aresFilled='true';
  }
  status.textContent='✓ Platné IČO · '+(data.obchodniJmeno||'firma nalezena v ARES')+(state==='AKTIVNI'?' · aktivní subjekt':' · záznam nalezen');
 }catch{
  if(request===icoRequest)status.textContent='ARES není dostupný. Ověření se nezdařilo; zkuste to znovu.';
 }
}
function initPartnerForm(){
 const icoInput=document.querySelector('#partnerForm input[name="ico"]');
 icoInput?.addEventListener('input',()=>{clearTimeout(icoTimer);const company=document.querySelector('#partnerForm input[name="company_name"]');if(company&&company.dataset.aresFilled==='true')company.dataset.aresFilled='';icoTimer=setTimeout(()=>lookupIco(icoInput.value),450)});
 icoInput?.addEventListener('blur',()=>{clearTimeout(icoTimer);if(icoInput.value.trim())lookupIco(icoInput.value)});
 const regions=document.querySelector('#partnerRegions'),types=document.querySelector('#partnerTypes'),services=document.querySelector('#partnerServices');
 if(regions)regions.innerHTML=REGIONS.map((v,i)=>'<label><input type="checkbox" name="regions" value="'+esc(v)+'"> '+esc(v)+'</label>').join('');
 if(types)types.innerHTML=FENCE_TYPES.map(v=>'<label><input type="checkbox" name="fence_types" value="'+esc(v)+'"> '+esc(v)+'</label>').join('');
 if(services)services.innerHTML=SERVICE_TYPES.map(v=>'<label><input type="checkbox" name="service_types" value="'+esc(v.value)+'"> '+esc(v.label)+'</label>').join('');
}
function clearPartnerForm(){
 const form=document.querySelector('#partnerForm');if(!form)return;
 form.reset();form.elements.partner_id.value='';form.elements.ico.dataset.aresValid='';form.elements.ico.dataset.aresIco='';form.elements.company_name.dataset.aresFilled='';form.elements.registered_address.value='';form.elements.registered_address.dataset.aresFilled='';verifiedIcoData.clear();document.querySelector('#icoStatus').textContent='Po zadání IČO vyhledáme firmu v ARES a předvyplníme její údaje.';document.querySelector('#partnerFormTitle').textContent='Registrace partnerské firmy';document.querySelector('#partnerSubmit').textContent='Uložit firmu';document.querySelector('#partnerFormStatus').textContent='';
}
function fillPartnerForm(p){
 const form=document.querySelector('#partnerForm');if(!form)return;
 form.elements.partner_id.value=p.id;for(const key of ['company_name','contact_name','email','phone','ico','registered_address'])form.elements[key].value=p[key]||'';form.elements.company_name.dataset.aresFilled='';form.elements.registered_address.dataset.aresFilled='';
 form.querySelectorAll('input[name="regions"]').forEach(e=>e.checked=(p.regions||[]).includes(e.value));
 form.querySelectorAll('input[name="fence_types"]').forEach(e=>e.checked=(p.fence_types||[]).includes(e.value));
 form.querySelectorAll('input[name="service_types"]').forEach(e=>e.checked=(p.service_types||['material_only']).includes(e.value));
 if(p.ico)lookupIco(p.ico);
 const all= form.querySelector('[data-all-regions]');if(all)all.checked=REGIONS.every(v=>(p.regions||[]).includes(v));
 document.querySelector('#partnerFormTitle').textContent='Upravit partnerskou firmu';document.querySelector('#partnerSubmit').textContent='Uložit změny';
 document.querySelector('#partnerFormPanel').hidden=false;document.querySelector('#partnerFormPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
initPartnerForm();
document.addEventListener('click',async e=>{
 if(e.target.closest('[data-new-partner]')){clearPartnerForm();document.querySelector('#partnerFormPanel').hidden=false;document.querySelector('#partnerFormPanel').scrollIntoView({behavior:'smooth',block:'start'});}
 if(e.target.closest('[data-cancel-partner]')){document.querySelector('#partnerFormPanel').hidden=true;clearPartnerForm();}
 const edit=e.target.closest('[data-edit-partner]');if(edit){const partner=partners.find(p=>p.id===edit.dataset.editPartner);if(partner)fillPartnerForm(partner);}
 if(e.target.closest('[data-all-regions]')){const all=document.querySelector('[data-all-regions]');document.querySelectorAll('#partnerRegions input').forEach(i=>i.checked=all.checked);}
 const toggle=e.target.closest('[data-toggle-partner]');if(toggle){const p=partners.find(x=>x.id===toggle.dataset.togglePartner);if(!p)return;toggle.disabled=true;try{const updated=await jsonRequest(F,'PATCH',{action:'update_partner',partner_id:p.id,partner:{...p,active:!p.active}});partners=partners.map(x=>x.id===updated.id?updated:x);renderPartners();render()}catch(err){alert(err.message)}}
 const handoff=e.target.closest('[data-send-partner]');if(handoff){const id=handoff.dataset.sendPartner,select=document.querySelector('[data-partner-choice="'+CSS.escape(id)+'"]'),partnerId=select?.value;if(!partnerId){alert('Vyberte partnerskou firmu.');return}if(!confirm('Předat tuto poptávku firmě '+(partners.find(p=>p.id===partnerId)?.company_name||'')+'? Firma obdrží kontaktní údaje zákazníka.'))return;handoff.disabled=true;handoff.textContent='Předávám…';try{await jsonRequest(F,'PATCH',{id,action:'send_to_partner',partner_id:partnerId});await load(token);const row=document.querySelector('[data-detail="'+CSS.escape(id)+'"]');if(row){row.hidden=false;const btn=document.querySelector('[data-open="'+CSS.escape(id)+'"]');if(btn)btn.textContent='Zavřít'}}catch(err){alert(err.message);handoff.disabled=false;handoff.textContent='Předat poptávku'}}
 const referralAction=e.target.closest('[data-referral-action]');if(referralAction){const leadId=referralAction.dataset.leadId,referralId=referralAction.dataset.referralId,status=referralAction.dataset.referralAction;referralAction.disabled=true;try{await jsonRequest(F,'PATCH',{id:leadId,action:'update_referral',referral_id:referralId,status});await load(token);const row=document.querySelector('[data-detail="'+CSS.escape(leadId)+'"]');if(row){row.hidden=false;const btn=document.querySelector('[data-open="'+CSS.escape(leadId)+'"]');if(btn)btn.textContent='Zavřít'}}catch(err){alert(err.message);referralAction.disabled=false}}
});
document.querySelector('#partnerForm')?.addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,status=document.querySelector('#partnerFormStatus'),id=form.elements.partner_id.value;
 const partner={company_name:form.elements.company_name.value.trim(),contact_name:form.elements.contact_name.value.trim(),email:form.elements.email.value.trim(),phone:form.elements.phone.value.trim(),ico:form.elements.ico.value.trim(),registered_address:form.elements.registered_address.value.trim(),regions:[...form.querySelectorAll('input[name="regions"]:checked')].map(i=>i.value),fence_types:[...form.querySelectorAll('input[name="fence_types"]:checked')].map(i=>i.value),service_types:[...form.querySelectorAll('input[name="service_types"]:checked')].map(i=>i.value),active:id?(partners.find(p=>p.id===id)?.active!==false):true};
 if(partner.ico&&(form.elements.ico.dataset.aresValid!=='true'||form.elements.ico.dataset.aresIco!==partner.ico)){status.textContent='IČO nejdřív ověřte v ARES. Vyčkejte na potvrzení platného IČO.';lookupIco(partner.ico);return}
 if(!partner.regions.length){status.textContent='Vyberte alespoň jeden kraj.';return}
 if(!partner.fence_types.length){status.textContent='Vyberte alespoň jeden typ oplocení.';return}
 if(!partner.service_types.length){status.textContent='Vyberte alespoň jednu službu.';return}
 const button=document.querySelector('#partnerSubmit');button.disabled=true;status.textContent='Ukládám firmu…';
 try{const saved=id?await jsonRequest(F,'PATCH',{action:'update_partner',partner_id:id,partner}):await jsonRequest(F,'POST',{action:'create_partner',partner});partners=id?partners.map(p=>p.id===saved.id?saved:p):[...partners,saved];renderPartners();render();clearPartnerForm();document.querySelector('#partnerFormPanel').hidden=true}
 catch(err){status.textContent=err.message}
 finally{button.disabled=false}
});
const session=saved();if(session?.access_token){renewSession(session).then(active=>{if(!active){clearSession();authBox('Přihlášení vypršelo. Zadejte prosím přihlašovací údaje.');return}load(active.access_token).catch(error=>{if(error.status===401||error.code==='admin_forbidden'){clearSession();authBox('Přihlášení vypršelo nebo účet nemá administrátorský přístup.')}else authBox(error.message)})})}else authBox();
})();
