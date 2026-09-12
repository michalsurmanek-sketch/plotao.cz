import fs from 'node:fs';

const read = p => fs.readFileSync(p,'utf8');
const assets = fs.readdirSync('assets').filter(x=>x.endsWith('.js'));
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};

for(const f of assets){
  const s=read('assets/'+f);
  assert(!s.includes('setInterval('),`${f}: polling setInterval must not return`);
}

const geometry=read('assets/geometry-v3.js');
assert(geometry.includes('Math.floor(25/gp)*gp'),'geometry-v3: tension sections must align to nominal bay spacing');
assert(geometry.includes('gateSides')&&geometry.includes('wicketSides'),'geometry-v3: opening-adjacent fence sides must be published');
assert(geometry.includes("document.addEventListener('plotao:placement'"),'geometry-v3: placement changes must trigger geometry');

const panel=read('assets/panel-pricing-v5.js');
assert(panel.includes('g.gateSides')&&panel.includes('g.wicketSides'),'panel-pricing: clips adjoining openings must be counted');

const slab=read('assets/slab-pricing-v2.js');
assert(slab.includes("productLength:2.45,bay:2.5"),'slab-pricing: panel 2450mm product must retain nominal 2.5m bay');
assert(slab.includes("productLength:2.95,bay:3"),'slab-pricing: mesh 2950mm product must retain nominal 3m bay');

const slabSafety=read('assets/panel-slab-safety-v1.js');
assert(slabSafety.includes("startsWith('300')"),'panel slab safety: 3m slab options must be blocked for panel type');

const gate=read('assets/gate-pricing-v1.js');
assert(gate.includes('slab().with'),'gate pricing: underfence slab state must participate in exact matching');
assert(gate.includes('leafLength')&&gate.includes('totalWeight'),'gate pricing: verified gate specs must be available for automation');

const drive=read('assets/gate-drive-pricing-v1.js');
assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight'),'gate drive: automation must require verified gate dimensions/weight');
assert(!drive.includes("if(w<=4)"),'gate drive: width-only motor selection must not return');

if(failures.length){
  console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`Calculator regression checks OK (${assets.length} JS assets checked)`);
