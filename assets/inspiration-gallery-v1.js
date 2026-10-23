(() => {
  'use strict';
  const gallery=document.querySelector('.ig-gallery');
  if(!gallery)return;
  const cards=[...gallery.querySelectorAll('.ig-card')];
  const side=document.querySelector('.ig-side-filters');
  const tabs=[...gallery.querySelectorAll('[data-gallery-filter]')];
  tabs.forEach(tab=>{const button=tab.cloneNode(true);side?.append(button);});
  const filters=[...document.querySelectorAll('[data-gallery-filter]')];
  const shortLabels={all:'Vše',panel:'Panelové',mesh:'Pletivové',concrete:'Betonové',aluminium:'Hliníkové',gabion:'Gabiony',gates:'Brány a branky'};
  tabs.forEach(tab=>{tab.textContent=shortLabels[tab.dataset.galleryFilter]||tab.textContent;});
  const savedKey='plotao-inspiration-favorites-v1';
  let saved=[];try{const value=JSON.parse(localStorage.getItem(savedKey)||'[]');if(Array.isArray(value))saved=value;}catch{}
  cards.forEach(card=>{const key=card.dataset.inspirationId||card.querySelector('.ig-photo').getAttribute('href');const button=document.createElement('button');button.type='button';button.className='ig-save';const sync=()=>{const selected=saved.includes(key);button.textContent=selected?'♥':'♡';button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-label',(selected?'Odebrat inspiraci: ':'Uložit inspiraci: ')+card.querySelector('h2').textContent);};sync();button.addEventListener('click',()=>{saved=saved.includes(key)?saved.filter(item=>item!==key):[...saved,key];try{localStorage.setItem(savedKey,JSON.stringify(saved));}catch{}sync();});card.append(button);});
  const count=gallery.querySelector('.ig-count');
  const dialog=document.querySelector('.ig-lightbox');
  const image=dialog.querySelector('#ig-lightbox-image');
  const title=dialog.querySelector('#ig-lightbox-title');
  const configLink=dialog.querySelector('#ig-lightbox-config');
  let selection=cards, index=0, previousOverflow='';
  function filter(kind,updateUrl=false){
    const value=filters.some(button=>button.dataset.galleryFilter===kind)?kind:'all';
    selection=cards.filter(card=>value==='all'||card.dataset.kind===value);
    cards.forEach(card=>{card.hidden=!selection.includes(card);});
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.galleryFilter===value)));
    const n=selection.length;
    count.textContent=`Zobrazeno ${n} ${n===1?'inspirace':n<5?'inspirace':'inspirací'}`;
    if(updateUrl){const url=new URL(location.href);if(value==='all')url.searchParams.delete('typ');else url.searchParams.set('typ',value);history.replaceState(null,'',url);}
  }
  function display(position){
    index=(position+selection.length)%selection.length;
    const card=selection[index];
    const source=card.querySelector('.ig-photo img');
    image.src=source.getAttribute('src');image.alt=source.alt;
    title.textContent=card.querySelector('h2').textContent;
    dialog.querySelector('#ig-lightbox-description').textContent=card.dataset.description;
    dialog.querySelector('#ig-lightbox-kind').textContent=card.querySelector('.ig-kind').textContent;
    dialog.querySelector('#ig-lightbox-count').textContent=`${index+1} / ${selection.length}`;
    configLink.href=card.querySelector('.ig-config').getAttribute('href');
    dialog.querySelectorAll('.ig-prev,.ig-next').forEach(button=>{button.hidden=selection.length<2;});
  }
  filters.forEach(button=>button.addEventListener('click',()=>filter(button.dataset.galleryFilter,true)));
  cards.forEach(card=>card.querySelector('[data-gallery-open]').addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();display(selection.indexOf(card));previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();dialog.querySelector('.ig-close').focus();
  }));
  dialog.querySelector('.ig-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{document.documentElement.style.overflow=previousOverflow;});
  dialog.querySelector('.ig-prev').addEventListener('click',()=>display(index-1));
  dialog.querySelector('.ig-next').addEventListener('click',()=>display(index+1));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();display(index+1);}if(event.key==='ArrowLeft'){event.preventDefault();display(index-1);}});
  window.addEventListener('popstate',()=>filter(new URLSearchParams(location.search).get('typ')||'all'));
  filter(new URLSearchParams(location.search).get('typ')||'all');
})();
