(()=>{
  const storageKey='plotao-product-favorites-v1';
  let favorites=[];
  try{favorites=JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{}
  const syncCards=()=>{const cards=[...document.querySelectorAll('.product-card')];
  const idFor=button=>{
    const card=button.closest('.product-card');
    return (card?.dataset.name||card?.querySelector('.product-info h3')?.textContent||'').trim().toLocaleLowerCase('cs-CZ').replace(/\s+/g,' ')
  };
  cards.forEach(card=>{
    const button=card.querySelector('.product-favorite');
    if(!button)return;
    const on=favorites.includes(idFor(button));
    button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label',on?'Odebrat z oblíbených':'Přidat do oblíbených');
    button.textContent=on?'♥':'♡';
  });};
  syncCards();
  document.addEventListener('plotao:products-rendered',syncCards);
  document.addEventListener('click',event=>{
    const button=event.target.closest('.product-favorite');
    if(!button)return;
    const id=idFor(button),on=button.getAttribute('aria-pressed')!=='true';
    favorites=favorites.filter(item=>item!==id);
    if(on)favorites.push(id);
    try{localStorage.setItem(storageKey,JSON.stringify(favorites))}catch{}
    button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label',on?'Odebrat z oblíbených':'Přidat do oblíbených');
    button.textContent=on?'♥':'♡';
  });
})();
