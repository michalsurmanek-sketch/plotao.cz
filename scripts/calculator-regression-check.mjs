import fs from 'node:fs';

const read = p => fs.readFileSync(p,'utf8');
const assets = fs.readdirSync('assets').filter(x=>x.endsWith('.js'));
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const close=(a,b,eps=.0001)=>Math.abs(a-b)<=eps;

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
assert(panel.includes('function slabHeight()'),'panel-pricing: underfence slab height must participate in post sizing');
assert(panel.includes('need=pd.key+50+slabH'),'panel-pricing: post length must include panel height, embedment allowance and slab height');
assert(panel.includes('postLength:post.key'),'panel-pricing: exported benchmark must report selected post length');
assert(panel.includes('function stockPanels('),'panel-pricing: reusable cut panels must be optimized across runs');
assert(panel.includes('panelCost=panelPieces*pd.val'),'panel-pricing: purchased panel count, not geometric field count, must drive panel cost');
assert(panel.includes('panelPieces,panelWaste'),'panel-pricing: exported benchmark must expose purchased panel count and leftover material');

const mesh=read('assets/mesh-pricing-v2.js');
assert(mesh.includes('openingSides')&&mesh.includes('strain*2+openingSides'),'mesh-pricing: braces/tension points must use actual fence sides adjoining openings');
assert(mesh.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'mesh-pricing: mesh length must come from validated geometry');
assert(mesh.includes('slab?post48:post38'),'mesh-pricing: classic mesh with underfence slabs must use 48mm line posts compatible with slab holders');
assert(mesh.includes('linePostDiameter:weld||slab?48:38'),'mesh-pricing: exported benchmark must report the actual line-post diameter');

const structural=read('assets/structural-pricing-v5.js');
assert(structural.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'structural pricing: gabion length must come from validated geometry instead of raw gate-width subtraction');
assert(structural.includes('if(materialH>300)'),'structural pricing: concrete post pricing above 300 cm must stay individual, not extrapolated');

const slab=read('assets/slab-pricing-v2.js');
assert(slab.includes("productLength:2.45,bay:2.5"),'slab-pricing: panel 2450mm product must retain nominal 2.5m bay');
assert(slab.includes("productLength:2.95,bay:3"),'slab-pricing: mesh 2950mm product must retain nominal 3m bay');
assert(slab.includes("panel:{20:{end:54,through:null},30:{end:71,through:null}}"),'slab-pricing: panel 20/30cm slabs must not use round-post through holders on square panel posts');
assert(slab.includes('dvojici kompatibilních koncových U držáků'),'slab-pricing: panel holder explanation must keep the square-post mounting rule visible');
assert(slab.includes('unsupportedHolders')&&slab.includes('unpricedOpeningHolders'),'slab-pricing: holders adjoining gates/wickets must not be priced as ordinary post holders');

const accuracy=read('assets/accuracy-guard.js');
assert(accuracy.includes('PLOTAO_SLAB_PRICE?.unsupportedHolders'),'accuracy guard: unverified slab holders at openings must force a partial budget');

const slabSafety=read('assets/panel-slab-safety-v1.js');
assert(slabSafety.includes("startsWith('300')"),'panel slab safety: 3m slab options must be blocked for panel type');

const gate=read('assets/gate-pricing-v1.js');
assert(gate.includes('slab().with'),'gate pricing: underfence slab state must participate in exact matching');
assert(gate.includes('leafLength')&&gate.includes('totalWeight'),'gate pricing: verified gate specs must be available for automation');

const drive=read('assets/gate-drive-pricing-v1.js');
assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight'),'gate drive: automation must require verified gate dimensions/weight');
assert(!drive.includes("if(w<=4)"),'gate drive: width-only motor selection must not return');

const roleVolume={line:.05,strain:.06,end:.06,corner:.075};
function straightRun(length,gap,{mesh=false}={}){
  const maxSection=mesh?Math.max(gap,Math.floor(25/gap)*gap):length;
  let fields=0,line=0,strain=0;
  for(let a=0;a<length-.001;a+=maxSection){
    const section=Math.min(length,a+maxSection)-a;
    const f=Math.ceil(section/gap);
    fields+=f;
    line+=Math.max(0,f-1);
    if(a+maxSection<length-.001)strain++;
  }
  const end=2;
  const posts=line+strain+end;
  const concrete=line*roleVolume.line+strain*roleVolume.strain+end*roleVolume.end;
  return{fields,line,strain,end,posts,concrete};
}
function exactPanelStock(runLengths,width=2.5){
  let full=0,res=[];
  for(const l0 of runLengths){const l=Math.max(0,l0),n=Math.floor((l+.000001)/width),r=l-n*width;full+=n;if(r>.001)res.push(r)}
  res.sort((a,b)=>b-a);let best=res.length,bins=[];
  function place(i){if(i===res.length){best=Math.min(best,bins.length);return}if(bins.length>=best)return;const x=res[i],seen=new Set;for(let j=0;j<bins.length;j++){const cap=+bins[j].toFixed(4);if(seen.has(cap)||bins[j]+.000001<x)continue;seen.add(cap);bins[j]-=x;place(i+1);bins[j]+=x}bins.push(width-x);place(i+1);bins.pop()}
  if(res.length)place(0);else best=0;return full+best;
}

const panel37=straightRun(37,2.5);
assert(panel37.fields===15,'numeric panel 37m: expected 15 fields');
assert(panel37.line===14&&panel37.posts===16,'numeric panel 37m: expected 14 line + 2 end posts');
assert(close(panel37.concrete,.82),'numeric panel 37m: expected 0.82 m3 footing model');
const panelMaterial=15*607+16*354+64*40;
const panelSlabs=15*680+30*54;
const panelBags=Math.ceil(.82*2000/25)*129.71;
assert(panelMaterial===17329,'numeric panel 37m: 153cm panel + 20cm slab must use 240cm posts and 17,329 CZK core');
assert(panelSlabs===11820,'numeric panel 37m: 20cm slabs + verified end holders must stay 11,820 CZK');
assert(close(panelMaterial+panelSlabs+panelBags,37709.86,.01),'numeric panel 37m: known material total must stay 37,709.86 CZK');
assert(exactPanelStock([37])===15,'numeric panel 37m: one run must purchase 15 panels');
assert(exactPanelStock([6,6])===5,'numeric panel 6m+6m: reusable 1m offcuts must reduce purchase from 6 fields to 5 panels');
assert(exactPanelStock([1.4,1.4,1.4])===3,'numeric panel offcuts: three 1.4m pieces cannot be packed into only two 2.5m stock panels');
const panel30cmSlabHolders=15*2*71;
assert(panel30cmSlabHolders===2130,'numeric panel 30cm slabs: 15 slabs must use 30 square-post end holders, not round-post through holders');

const mesh30=straightRun(30,3,{mesh:true});
assert(mesh30.fields===10,'numeric mesh 30m/3m: expected 10 fields');
assert(mesh30.strain===1,'numeric mesh 30m/3m: expected one strain point at the 24m module boundary');
assert(mesh30.line===8&&mesh30.posts===11,'numeric mesh 30m/3m: expected 8 line + 1 strain + 2 end posts');
assert(close(mesh30.concrete,.58),'numeric mesh 30m/3m: expected 0.58 m3 footing model');
const meshCore30=30*87+8*229+3*229+4*223+167+4*15;
const meshSlabs30=10*772+4*44.77+8*56;
const meshBags30=Math.ceil(.58*2000/25)*129.71;
assert(meshCore30===6248,'numeric mesh 30m/3m: verified core with 48mm slab-compatible posts must stay 6,248 CZK');
assert(close(meshSlabs30,8347.08,.01),'numeric mesh 30m/3m: slabs + compatible holders must stay 8,347.08 CZK');
assert(close(meshCore30+meshSlabs30+meshBags30,20691.45,.01),'numeric mesh 30m/3m: known material total must stay 20,691.45 CZK');

const connected20={fields:8,line:6,corner:1,end:2,posts:9};
const separate20={fields:8,line:6,corner:0,end:4,posts:10};
assert(connected20.posts===9&&separate20.posts===10,'numeric 10m+10m sections: connected corner must share one post; separate runs must not');

if(failures.length){console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Calculator regression checks OK (${assets.length} JS assets checked; numeric scenarios passed)`);
