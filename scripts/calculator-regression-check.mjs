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
assert(geometry.includes('pa+gp*k'),'geometry-v3: full fields must remain on nominal spacing; only the last field may shorten');
assert(geometry.includes('gateSides')&&geometry.includes('wicketSides'),'geometry-v3: opening-adjacent fence sides must be published');
assert(geometry.includes('endpointHasFence'),'geometry-v3: openings at connected section joints must inspect fence on adjacent sections');
assert(geometry.includes("linked(ss,s.i)&&endpointHasFence(ss,ops,s.i-1,'end')"),'geometry-v3: an opening at a connected section start must count fence from the previous section');
assert(geometry.includes("linked(ss,s.i+1)&&endpointHasFence(ss,ops,s.i+1,'start')"),'geometry-v3: an opening at a connected section end must count fence from the next section');
assert(geometry.includes("document.addEventListener('plotao:placement'"),'geometry-v3: placement changes must trigger geometry');
assert(geometry.includes("document.addEventListener('plotao:segment-connections'"),'geometry-v3: connected/separate section changes must trigger geometry');
assert(geometry.includes('PLOTAO_SEGMENT_CONNECTIONS'),'geometry-v3: section connectivity must participate in post classification');
assert(geometry.includes("'outer:'+i+':start")&&geometry.includes("'outer:'+i+':end"),'geometry-v3: separate sections must receive their own end nodes');
assert(geometry.includes('gross=ss.reduce'),'geometry-v3: gross route length must be distinct from net fence fill');
assert(geometry.includes("'Celková trasa '+g.gross"),'geometry-v3: total length badge must use gross route only once');
assert(geometry.includes("'Výplň '+g.fenceLen"),'geometry-v3: fill badge must use net fence length');

const connections=read('assets/segment-connections-v1.js');
assert(connections.includes('Samostatný úsek')&&connections.includes('Navazuje rohem'),'segment connections: user must be able to choose connected versus separate runs');

const calculator=read('assets/calculator-v3.js');
assert(calculator.includes('plan-disconnected'),'calculator-v3: separate sections must be visible in the plan');

const panel=read('assets/panel-pricing-v5.js');
assert(panel.includes('g.gateSides')&&panel.includes('g.wicketSides'),'panel-pricing: clips adjoining openings must be counted');

const mesh=read('assets/mesh-pricing-v2.js');
assert(mesh.includes('openingSides')&&mesh.includes('strain*2+openingSides'),'mesh-pricing: braces/tension points must use actual fence sides adjoining openings');
assert(mesh.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'mesh-pricing: mesh length must come from validated geometry');

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
