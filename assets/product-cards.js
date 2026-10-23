(()=>{
'use strict';
if(window.PLOTAO_FAVORITES_READY)return;window.PLOTAO_FAVORITES_READY=true;
const key='plotao-product-favorites-v1',labelsKey=key+'-labels';
const normalize=value=>String(value||'').trim().toLocaleLowerCase('cs-CZ').replace(/\s+/g,' ');
function read(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?[...new Set(data.filter(x=>typeof x==='string'&&x.length&&x.length<500).map(normalize))]:[]}catch{return []}}
let favorites=read(),labels={};try{const data=JSON.parse(localStorage.getItem(labelsKey)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))labels=data}catch{}
const nameFor=card=>(card?.dataset.name||card?.querySelector('.product-info h3,h3')?.textContent||'').trim();
const idFor=button=>normalize(nameFor(button.closest('.product-card')));
function sync(){
 document.querySelectorAll('.favorites-count').forEach(el=>el.textContent=String(favorites.length));
 document.querySelectorAll('.favorites-toggle').forEach(el=>el.setAttribute('aria-label','Oblíbené produkty, počet: '+favorites.length));
 document.querySelectorAll('.product-card .product-favorite').forEach(button=>{const on=favorites.includes(idFor(button));button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Odebrat z oblíbených':'Přidat do oblíbených');button.textContent=on?'♥':'♡'});
}
function save(){try{localStorage.setItem(key,JSON.stringify(favorites));localStorage.setItem(labelsKey,JSON.stringify(labels))}catch{}sync();document.dispatchEvent(new CustomEvent('plotao:favorites-changed',{detail:{count:favorites.length}}))}
let dialog=null,opener=null;
function openList(){
 if(!dialog){dialog=document.createElement('dialog');dialog.className='favorites-dialog';dialog.setAttribute('aria-labelledby','favorites-title');document.body.append(dialog);dialog.addEventListener('close',()=>opener?.focus());dialog.addEventListener('click',event=>{if(event.target.closest('[data-close-favorites]'))dialog.close();const remove=event.target.closest('[data-remove-favorite]');if(remove){favorites=favorites.filter(x=>x!==remove.dataset.removeFavorite);save();renderList()}});
 const style=document.createElement('style');style.textContent='.favorites-dialog{width:min(560px,calc(100vw - 28px));max-height:80dvh;padding:24px;border:0;border-radius:18px;color:#17231d;background:#fff;font:16px/1.5 system-ui,sans-serif}.favorites-dialog::backdrop{background:#09251e99}.favorites-dialog h2{margin:0;font-size:23px}.favorites-dialog header{display:flex;align-items:center;justify-content:space-between;gap:20px}.favorites-dialog button{cursor:pointer;border:0;border-radius:8px;padding:8px 12px;background:#edf3ef;color:#075846;font:inherit}.favorites-dialog ul{padding:0;list-style:none}.favorites-dialog li{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #e4ebe6}.favorites-dialog a{color:#075846}.favorites-dialog li button{font-size:13px}';document.head.append(style);
 }renderList();dialog.showModal();
}
function renderList(){dialog.replaceChildren();const top=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.id='favorites-title';title.textContent='Oblíbené produkty ('+favorites.length+')';close.textContent='×';close.setAttribute('aria-label','Zavřít oblíbené produkty');close.dataset.closeFavorites='';top.append(title,close);dialog.append(top);
 if(!favorites.length){const p=document.createElement('p');p.textContent='Zatím nemáte žádné oblíbené produkty. Přidejte je srdíčkem u produktu.';dialog.append(p);return}
 const list=document.createElement('ul');favorites.forEach(id=>{const row=document.createElement('li'),link=document.createElement('a'),remove=document.createElement('button');link.textContent=typeof labels[id]==='string'?labels[id]:id;link.href='/kontakt.html?produkt='+encodeURIComponent(link.textContent);remove.textContent='Odebrat';remove.dataset.removeFavorite=id;row.append(link,remove);list.append(row)});dialog.append(list);
}
document.addEventListener('click',event=>{
 const toggle=event.target.closest('.favorites-toggle');if(toggle){event.preventDefault();opener=toggle;openList();return}
 const button=event.target.closest('.product-favorite');if(!button)return;
 const id=idFor(button);if(!id)return;labels[id]=nameFor(button.closest('.product-card'));favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save();
});
document.addEventListener('plotao:products-rendered',sync);
window.addEventListener('storage',event=>{if(event.key===key){favorites=read();sync();if(dialog?.open)renderList()}});
sync();
})();
