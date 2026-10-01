(()=>{
 const api=()=>window.PLOTAOAdmin;
 const $=selector=>document.querySelector(selector);
 function render(){
  const info=api()?.session,email=info?.email||'';
  const account=$('#settingsAccountEmail'),badge=$('#settingsSessionBadge'),expiry=$('#settingsSessionExpiry');
  if(account)account.textContent=email||'Přihlaste se do administrace';
  if(badge){badge.textContent=email?'Aktivní':'Nepřihlášeno';badge.classList.toggle('active',!!email);badge.classList.toggle('inactive',!email)}
  if(expiry)expiry.textContent=info?.expiresAt?new Date(info.expiresAt).toLocaleString('cs-CZ',{timeZone:'Europe/Prague',dateStyle:'medium',timeStyle:'short'}):'—';
 }
 window.addEventListener('plotao:admin-data',render);render();
 $('#settingsPasswordForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),current=String(data.get('current_password')||''),next=String(data.get('new_password')||''),confirm=String(data.get('confirm_password')||''),status=$('#settingsPasswordStatus'),button=$('#settingsPasswordSubmit');
  if(next.length<12){status.textContent='Nové heslo musí mít alespoň 12 znaků.';status.className='settings-message error';return}
  if(next!==confirm){status.textContent='Nová hesla se neshodují.';status.className='settings-message error';return}
  if(next===current){status.textContent='Nové heslo musí být jiné než současné.';status.className='settings-message error';return}
  if(!api()?.changePassword){status.textContent='Relace není aktivní. Znovu se přihlaste.';status.className='settings-message error';return}
  button.disabled=true;status.textContent='Ověřuji současné heslo a ukládám nové…';status.className='settings-message';
  try{await api().changePassword(current,next);form.reset();status.textContent='Heslo bylo změněno. Změna platí ihned.';status.className='settings-message success';render()}
  catch(error){status.textContent=error.message||'Heslo se nepodařilo změnit.';status.className='settings-message error'}
  finally{button.disabled=false}
 });
 $('[data-settings-signout]')?.addEventListener('click',async event=>{
  const button=event.currentTarget,status=$('#settingsSignoutStatus');if(!api()?.signOut)return;
  button.disabled=true;status.textContent='Bezpečně odhlašuji tento prohlížeč…';
  await api().signOut();window.location.reload();
 });
})();
