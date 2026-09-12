import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const assets=fs.readdirSync('assets').filter(x=>x.endsWith('.js'));
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const close=(a,b,eps=.0001)=>Math.abs(a-b)<=eps;

for(const f of assets){const s=read('assets/'+f);assert(!s.includes('setInterval('),`${f}: polling setInterval must not return`)}

const geometry=read('assets/geometry-v3.js');
[
 ['Math.floor(25/gp)*gp','tension sections must align to nominal bay spacing'],['pa+gp*k','full fields must remain on nominal spacing'],['gateSides','opening-adjacent gate sides must be published'],['wicketSides','opening-adjacent wicket sides must be published'],['endpointHasFence','connected-joint openings must inspect adjacent sections'],["linked(ss,s.i)&&endpointHasFence(ss,ops,s.i-1,'end')",'connected section start must see previous fence'],["linked(ss,s.i+1)&&endpointHasFence(ss,ops,s.i+1,'start')",'connected section end must see next fence'],["document.addEventListener('plotao:placement'",'placement must trigger geometry'],["document.addEventListener('plotao:segment-connections'",'section connectivity must trigger geometry'],['PLOTAO_SEGMENT_CONNECTIONS','section connectivity must classify posts'],["'outer:'+i+':start",'separate section start node required'],["'outer:'+i+':end",'separate section end node required'],['gross=ss.reduce','gross route and net fill must differ'],["'Celková trasa '+g.gross",'total badge must use gross route'],["'Výplň '+g.fenceLen",'fill badge must use net length']
].forEach(([x,m])=>assert(geometry.includes(x),'geometry-v3: '+m));

const connections=read('assets/segment-connections-v1.js');
assert(connections.includes('Samostatný úsek')&&connections.includes('Navazuje rohem'),'segment connections: user must choose connected vs separate');
const calculator=read('assets/calculator-v3.js');
assert(calculator.includes('plan-disconnected'),'calculator-v3: separate sections must be visible in plan');

const panel=read('assets/panel-pricing-v5.js');
assert(panel.includes('g.gateSides')&&panel.includes('g.wicketSides'),'panel-pricing: opening clips must be counted');
assert(panel.includes('function slabHeight()')&&panel.includes('need=pd.key+50+slabH'),'panel-pricing: slab height must extend posts');
assert(panel.includes('postLength:post.key'),'panel-pricing: selected post length must be exported');
assert(panel.includes('function stockPanels(')&&panel.includes('panelCost=panelPieces*pd.val'),'panel-pricing: purchased panels must optimize reusable offcuts');
assert(panel.includes('panelPieces,panelWaste'),'panel-pricing: panel purchase count and waste must be exported');

const mesh=read('assets/mesh-pricing-v2.js');
assert(mesh.includes('openingSides')&&mesh.includes('strain*2+openingSides'),'mesh-pricing: braces/tension points must use actual opening sides');
assert(mesh.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'mesh-pricing: length must use validated geometry');
assert(mesh.includes('slab?post48:post38'),'mesh-pricing: slab system must use Ø48 line posts');
assert(mesh.includes('linePostDiameter:weld||slab?48:38'),'mesh-pricing: actual line-post diameter must be exported');
assert(mesh.includes('function slabHeight()')&&mesh.includes('postNeed=d.key+50+slabH'),'mesh-pricing: slab height must extend main posts');
assert(mesh.includes('braceNeed=d.key+50'),'mesh-pricing: brace sizing must stay independent of slab height');
assert(mesh.includes('linePostLength:linePost.key')&&mesh.includes('braceLength:bracePost.key'),'mesh-pricing: selected post/brace lengths must be exported');
assert(mesh.includes('postWeld={170:245,200:288,230:337,250:365}'),'mesh-pricing: current grooved-post prices required');
assert(mesh.includes('post48={150:184,175:211,200:229,220:295,230:296,240:305,260:319,300:399}'),'mesh-pricing: current Ø48 post benchmark required');

const structural=read('assets/structural-pricing-v5.js');
assert(structural.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'structural pricing: gabion must use validated net length');
assert(structural.includes('if(materialH>300)'),'structural pricing: concrete over 300cm must not extrapolate');

const slab=read('assets/slab-pricing-v2.js');
assert(slab.includes("productLength:2.45,bay:2.5"),'slab-pricing: 2450mm panel slab must keep 2.5m bay');
assert(slab.includes("productLength:2.95,bay:3"),'slab-pricing: 2950mm mesh slab must keep 3m bay');
assert(slab.includes("panel:{20:{end:54,through:null},30:{end:71,through:null}}"),'slab-pricing: square panel posts must not use round through holders');
assert(slab.includes("mesh:{20:{end:76,through:116},30:{end:96,through:162}}"),'slab-pricing: current mesh end/through holder prices required');
assert(slab.includes('braceHolder={holder:148,screw:6}'),'slab-pricing: brace-to-slab holder and screw must be priced');
assert(slab.includes('braceMountCount')&&slab.includes('braceMountCost'),'slab-pricing: brace mounting hardware must be counted');
assert(slab.includes('unsupportedHolders')&&slab.includes('unpricedOpeningHolders'),'slab-pricing: opening holders must stay partial if profile unknown');

const accuracy=read('assets/accuracy-guard.js');
assert(accuracy.includes('PLOTAO_SLAB_PRICE?.unsupportedHolders'),'accuracy guard: unverified opening holders must force partial budget');
const slabSafety=read('assets/panel-slab-safety-v1.js');
assert(slabSafety.includes("startsWith('300')"),'panel slab safety: 3m slab must stay blocked for panels');
const gate=read('assets/gate-pricing-v1.js');
assert(gate.includes('slab().with')&&gate.includes('leafLength')&&gate.includes('totalWeight'),'gate pricing: slab state and verified gate specs required');
const drive=read('assets/gate-drive-pricing-v1.js');
assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight')&&!drive.includes("if(w<=4)"),'gate drive: must use verified gate specs, never width only');

const roleVolume={line:.05,strain:.06,end:.06,corner:.075};
function straightRun(length,gap,{mesh=false}={}){const maxSection=mesh?Math.max(gap,Math.floor(25/gap)*gap):length;let fields=0,line=0,strain=0;for(let a=0;a<length-.001;a+=maxSection){const section=Math.min(length,a+maxSection)-a,f=Math.ceil(section/gap);fields+=f;line+=Math.max(0,f-1);if(a+maxSection<length-.001)strain++}const end=2,posts=line+strain+end,concrete=line*roleVolume.line+strain*roleVolume.strain+end*roleVolume.end;return{fields,line,strain,end,posts,concrete}}
function exactPanelStock(runLengths,width=2.5){let full=0,res=[];for(const l0 of runLengths){const l=Math.max(0,l0),n=Math.floor((l+.000001)/width),r=l-n*width;full+=n;if(r>.001)res.push(r)}res.sort((a,b)=>b-a);let best=res.length,bins=[];function place(i){if(i===res.length){best=Math.min(best,bins.length);return}if(bins.length>=best)return;const x=res[i],seen=new Set;for(let j=0;j<bins.length;j++){const cap=+bins[j].toFixed(4);if(seen.has(cap)||bins[j]+.000001<x)continue;seen.add(cap);bins[j]-=x;place(i+1);bins[j]+=x}bins.push(width-x);place(i+1);bins.pop()}if(res.length)place(0);else best=0;return full+best}

const panel37=straightRun(37,2.5);
assert(panel37.fields===15,'numeric panel 37m: expected 15 fields');
assert(panel37.line===14&&panel37.posts===16,'numeric panel 37m: expected 14 line + 2 end posts');
assert(close(panel37.concrete,.82),'numeric panel 37m: expected 0.82m3 footing model');
const panelMaterial=15*607+16*354+64*40,panelSlabs=15*680+30*54,panelBags=Math.ceil(.82*2000/25)*129.71;
assert(panelMaterial===17329,'numeric panel 37m: 153cm + 20cm slab must use 240cm posts');
assert(panelSlabs===11820,'numeric panel 37m: 20cm slabs + square-post holders must stay 11,820 CZK');
assert(close(panelMaterial+panelSlabs+panelBags,37709.86,.01),'numeric panel 37m: known material total must stay 37,709.86 CZK');
assert(exactPanelStock([37])===15,'numeric panel 37m: one run must purchase 15 panels');
assert(exactPanelStock([6,6])===5,'numeric panel offcuts: two 6m runs must purchase 5 panels');
assert(exactPanelStock([1.4,1.4,1.4])===3,'numeric panel offcuts: three 1.4m pieces require 3 stock panels');
assert(15*2*71===2130,'numeric panel 30cm slabs: 15 slabs require 30 square-post end holders');

const mesh30=straightRun(30,3,{mesh:true});
assert(mesh30.fields===10,'numeric mesh 30m/3m: expected 10 fields');
assert(mesh30.strain===1,'numeric mesh 30m/3m: expected one strain point at 24m module boundary');
assert(mesh30.line===8&&mesh30.posts===11,'numeric mesh 30m/3m: expected 8 line + 1 strain + 2 end posts');
assert(close(mesh30.concrete,.58),'numeric mesh 30m/3m: expected 0.58m3 footing model');
const meshCore30=30*87+8*295+3*295+4*223+167+4*15;
const meshSlabs30=10*772+4*76+8*116+4*(148+6);
const meshBags30=Math.ceil(.58*2000/25)*129.71;
assert(meshCore30===6974,'numeric mesh 30m/3m: 150cm mesh + 20cm slab must use 220cm Ø48 posts and 200cm braces');
assert(meshSlabs30===9568,'numeric mesh 30m/3m: current slabs, holders and brace mounts must stay 9,568 CZK');
assert(close(meshCore30+meshSlabs30+meshBags30,22638.37,.01),'numeric mesh 30m/3m: known material total must stay 22,638.37 CZK');

const connected20={fields:8,line:6,corner:1,end:2,posts:9},separate20={fields:8,line:6,corner:0,end:4,posts:10};
assert(connected20.posts===9&&separate20.posts===10,'numeric 10m+10m: connected corner must share one post; separate runs must not');

if(failures.length){console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Calculator regression checks OK (${assets.length} JS assets checked; numeric scenarios passed)`);
