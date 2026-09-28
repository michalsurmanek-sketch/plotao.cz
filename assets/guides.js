(() => {
  const input = document.querySelector('#guideSearch');
  if (!input) return;
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.guide-card')];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let category = 'Všechny';
  function filter() {
    const words = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const matches = (category === 'Všechny' || card.dataset.category === category) && words.every(word => normalize(card.textContent).includes(word));
      card.hidden = !matches;
      if (matches) count++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    document.querySelector('#guideResults').textContent = `${count} ${count === 1 ? 'návod' : count > 1 && count < 5 ? 'návody' : 'návodů'}`;
    document.querySelector('#guideEmpty').hidden = count !== 0;
  }
  input.addEventListener('input', filter);
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; filter(); }));
  document.querySelector('#resetGuides').addEventListener('click', () => { input.value = ''; category = 'Všechny'; filter(); input.focus(); });
})();
