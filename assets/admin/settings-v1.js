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

 const faviconForm=$('#settingsFaviconForm'),faviconFile=$('#settingsFaviconFile'),faviconPreview=$('#settingsFaviconPreview'),faviconStatus=$('#settingsFaviconStatus'),faviconSubmit=$('#settingsFaviconSubmit');
 const showFavicon=(url)=>{if(faviconPreview&&url)faviconPreview.src=url};
 const currentFavicon=document.querySelector('link[rel~="icon"]');if(currentFavicon)showFavicon(currentFavicon.href);
 window.addEventListener('plotao:favicon-loaded',event=>showFavicon(event.detail?.url));
 faviconFile?.addEventListener('change',()=>{const file=faviconFile.files?.[0];if(!file)return;if(!['image/png','image/x-icon','image/vnd.microsoft.icon'].includes(file.type)||file.size>524288){faviconStatus.textContent='Vyberte PNG nebo ICO do velikosti 512 KB.';faviconStatus.className='settings-message error';faviconFile.value='';return}showFavicon(URL.createObjectURL(file));faviconStatus.textContent='Náhled je připravený. Uložte změnu.';faviconStatus.className='settings-message'});
 faviconForm?.addEventListener('submit',async event=>{event.preventDefault();const file=faviconFile?.files?.[0];if(!file)return;if(!api()?.session?.access_token){faviconStatus.textContent='Nejdřív se přihlaste jako administrátor.';faviconStatus.className='settings-message error';return}if(!['image/png','image/x-icon','image/vnd.microsoft.icon'].includes(file.type)||file.size>524288){faviconStatus.textContent='Vyberte PNG nebo ICO do velikosti 512 KB.';faviconStatus.className='settings-message error';return}faviconSubmit.disabled=true;faviconStatus.textContent='Nahrávám faviconu…';faviconStatus.className='settings-message';try{const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+32768,bytes.length)));const result=await api().request('/functions/v1/admin-leads','POST',{action:'update_favicon',mime_type:file.type,data:btoa(binary)});showFavicon(result.favicon_url);window.dispatchEvent(new CustomEvent('plotao:favicon-update',{detail:{url:result.favicon_url}}));faviconForm.reset();faviconStatus.textContent='Favicona byla uložena. Pokud ji hned nevidíte, obnovte stránku.';faviconStatus.className='settings-message success'}catch(error){faviconStatus.textContent=error.message||'Faviconu se nepodařilo uložit.';faviconStatus.className='settings-message error'}finally{faviconSubmit.disabled=false}});
 
})();