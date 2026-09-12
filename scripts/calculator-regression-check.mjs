import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{solveGeometry}=require('../assets/geometry-core-v1.js');
const read=p=>fs.readFileSync(p,'utf8'),assets=fs.readdirSync('assets').filter(x=>x.endsWith('.js')),failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)},close=(a,b,eps=.0001)=>Math.abs(a-b)<=eps;
for(const f of assets){const s=read('assets/'+f);assert(!s.includes('setInterval('),`${f}: polling setInterval must not return`)}

const geometry=read('assets/geometry-v3.js'),core=read('assets/geometry-core-v1.js');
assert(geometry.includes('PLOTAO_GEOMETRY_CORE')&&geometry.includes('solveGeometry'),'geometry-v3 must delegate to shared production geometry core');
assert(geometry.includes("document.addEventListener('plotao:placement'")&&geometry.includes("document.addEventListener('plotao:segment-connections'"),'geometry adapter must react to placement and section connectivity');
assert(core.includes('Math.floor(25/gap)*gap'),'geometry core tension sections must align to nominal bay');
assert(core.includes('pa+gap*k'),'geometry core full fields must stay on nominal spacing');
assert(core.includes('gateSides')&&core.includes('wicketSides')&&core.includes('endpointHasFence'),'geometry core must publish and resolve opening fence sides');
assert(!geometry.includes('vol={line:'),'legacy role-volume footing constants must not return');
assert(!geometry.includes("$('#concreteAmount')"),'geometry adapter must not own concrete amount');

const connections=read('assets/segment-connections-v1.js');assert(connections.includes('Samostatný úsek')&&connections.includes('Navazuje rohem'),'segment connection choices required');
const calculator=read('assets/calculator-v3.js');assert(calculator.includes('plan-disconnected'),'separate sections must be visible in plan');

const panelAdapter=read('assets/panel-pricing-v5.js'),panelCore=read('assets/panel-pricing-core-v1.js');
assert(panelAdapter.includes('PLOTAO_PANEL_PRICING_CORE')&&panelAdapter.includes('computePanelPrice'),'panel browser adapter must delegate to shared pricing core');
assert(panelCore.includes('openingSides')&&panelCore.includes('clipQty'),'panel core must price clips from actual opening sides');
assert(panelCore.includes('need=pd.key+50+Math.max(0,slabHeight||0)'),'panel core must extend post need by slab height');
assert(panelCore.includes('stockPanels')&&panelCore.includes('panelPieces'),'panel core must optimize reusable panel offcuts');
assert(panelCore.includes('postLength:post.key')&&panelCore.includes('panelWaste:stock.waste'),'panel core must export selected post length and waste');

const meshAdapter=read('assets/mesh-pricing-v2.js'),meshCore=read('assets/mesh-pricing-core-v1.js');
assert(meshAdapter.includes('PLOTAO_MESH_PRICING_CORE')&&meshAdapter.includes('computeMeshPrice'),'mesh browser adapter must delegate to shared pricing core');
assert(meshCore.includes('openingSides')&&meshCore.includes('strain*2+openingSides'),'mesh core must size braces from actual opening sides');
assert(meshCore.includes('g.fenceLen'),'mesh core must use validated net fence length');
assert(meshCore.includes('slab?post48:post38'),'mesh slab systems must use Ø48 line posts');
assert(meshCore.includes('linePostDiameter:weld||slab?48:38'),'mesh core must export line-post diameter');
assert(meshCore.includes('postNeed=d.key+50+(slab?Math.max(0,slabHeight||0):0)'),'mesh core must extend main posts by slab height');
assert(meshCore.includes('braceNeed=d.key+50'),'mesh core must size braces independently');
assert(meshCore.includes('postWeld={170:245,200:288,230:337,250:365}'),'verified grooved-post prices must stay in mesh core');
assert(meshCore.includes('post48={150:184,175:211,200:229,220:295,230:296,240:305,260:319,300:399}'),'verified Ø48 prices must stay in mesh core');
assert(meshCore.includes("reason:'post'"),'missing verified post length must become individual');

const structural=read('assets/structural-pricing-v5.js');assert(structural.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'gabion must use validated net length');assert(structural.includes('if(materialH>300)'),'concrete over 300cm must not extrapolate');
const slab=read('assets/slab-pricing-v2.js');
assert(slab.includes("productLength:2.45,bay:2.5")&&slab.includes("productLength:2.95,bay:3"),'slab nominal bay/product lengths required');
assert(slab.includes("panel:{20:{end:54,through:null},30:{end:71,through:null}}"),'panel square posts must not use round through holders');
assert(slab.includes("mesh:{20:{end:76,through:116},30:{end:96,through:162}}"),'current mesh holder prices required');
assert(slab.includes('braceHolder={holder:148,screw:6}')&&slab.includes('braceMountCount'),'brace-to-slab hardware required');
assert(slab.includes('unsupportedHolders')&&slab.includes('unpricedOpeningHolders'),'opening holders must remain partial if profile unknown');
const concreteMaterial=read('assets/concrete-material-v1.js');
assert(concreteMaterial.includes('diameter=20,depth=80'),'footing model must expose 20x80cm reference dimensions');
assert(concreteMaterial.includes('Math.PI*(d/2)**2*h'),'footing volume must be geometric cylinder volume');
assert(concreteMaterial.includes("type()==='mesh'&&!meshHasSlab()"),'mesh braces without slab must receive concrete footings');
assert(concreteMaterial.includes('unsupportedOpenings:openingUnknown'),'gate/wicket footing uncertainty must be exported');
const accuracy=read('assets/accuracy-guard.js');assert(accuracy.includes('unsupportedHolders')&&accuracy.includes('unsupportedOpenings'),'accuracy guard must preserve partial slab/opening states');
const priceBridge=read('assets/price-bridge.js');assert(priceBridge.includes('c.unsupportedOpenings')&&priceBridge.includes('s.unsupportedHolders'),'price bridge must preserve partial totals');
const lead=read('assets/lead-safety-v1.js');assert(lead.includes('PLOTAO_SEGMENT_CONNECTIONS'),'lead snapshot must preserve section connectivity');
const slabSafety=read('assets/panel-slab-safety-v1.js');assert(slabSafety.includes("startsWith('300')"),'3m slabs must stay blocked for panels');
const gate=read('assets/gate-pricing-v1.js');assert(gate.includes('slab().with')&&gate.includes('leafLength')&&gate.includes('totalWeight'),'gate exact matching/specs required');
const drive=read('assets/gate-drive-pricing-v1.js');assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight')&&!drive.includes("if(w<=4)"),'drive must use verified gate specs');

function g(type,gap,segments,openings=[]){return solveGeometry({type,gap,segments,openings})}
let x=g('panel',2.5,[{len:37,connected:false}]);assert(x.gross===37&&x.fenceLen===37&&x.fields===15,'37m panel geometry must stay 37m / 15 fields');assert(x.total===16&&x.line===14&&x.end===2&&x.corner===0,'37m panel posts must stay 14 line + 2 end');
x=g('panel',2.5,[{len:20,connected:false},{len:17,connected:true}]);assert(x.corner===1&&x.end===2&&x.total===16,'connected 20+17m must share one corner post');
x=g('panel',2.5,[{len:20,connected:false},{len:17,connected:false}]);assert(x.corner===0&&x.end===4&&x.total===17,'separate 20+17m must have four end posts');
x=g('mesh',3,[{len:30,connected:false}]);assert(x.fields===10&&x.strain===1,'30m mesh at 3m must have 10 fields and one strain post');assert(x.runs[0].sections.length===2&&close(x.runs[0].sections[0],24)&&close(x.runs[0].sections[1],6),'30m mesh must split 24m + 6m');
x=g('panel',2.5,[{len:10,connected:false},{len:10,connected:true}],[{kind:'gate',s:1,p:0,w:4}]);assert(x.gateSides===2&&x.fenceLen===16,'connected-joint gate must count two sides and remove exactly 4m fill');
x=g('panel',2.5,[{len:10,connected:false},{len:10,connected:false}],[{kind:'gate',s:1,p:0,w:4}]);assert(x.gateSides===1,'separate gate must not borrow previous fence side');

if(failures.length){console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));process.exit(1)}console.log(`Calculator regression checks OK (${assets.length} JS assets checked; shared production cores verified)`);
