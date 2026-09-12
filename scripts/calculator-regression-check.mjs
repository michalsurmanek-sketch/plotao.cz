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
assert(core.includes('gateSides')&&core.includes('wicketSides'),'geometry core must publish opening fence sides');
assert(core.includes('endpointHasFence'),'geometry core must inspect adjacent sections at opening boundaries');
assert(!geometry.includes('vol={line:'),'geometry-v3: legacy role-volume footing constants must not return');
assert(!geometry.includes("$('#concreteAmount')"),'geometry-v3: concreteAmount must be owned only by concrete-material');
assert(!geometry.toLowerCase().includes('beton podle typu patek'),'geometry-v3: material-list footing volume must be owned only by concrete-material');

const connections=read('assets/segment-connections-v1.js');assert(connections.includes('Samostatný úsek')&&connections.includes('Navazuje rohem'),'segment connections choices required');
const calculator=read('assets/calculator-v3.js');assert(calculator.includes('plan-disconnected'),'separate sections must be visible in plan');

const panel=read('assets/panel-pricing-v5.js');
assert(panel.includes('g.gateSides')&&panel.includes('g.wicketSides'),'panel opening clips required');
assert(panel.includes('function slabHeight()')&&panel.includes('need=pd.key+50+slabH'),'panel slab height must extend posts');
assert(panel.includes('postLength:post.key'),'panel selected post length exported');
assert(panel.includes('function stockPanels(')&&panel.includes('panelCost=panelPieces*pd.val'),'panel reusable offcuts must drive purchase count');
assert(panel.includes('panelPieces,panelWaste'),'panel purchase count/waste exported');

const mesh=read('assets/mesh-pricing-v2.js');
assert(mesh.includes('openingSides')&&mesh.includes('strain*2+openingSides'),'mesh braces use actual opening sides');
assert(mesh.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'mesh uses validated net length');
assert(mesh.includes('slab?post48:post38'),'mesh with slabs uses Ø48 line posts');
assert(mesh.includes('linePostDiameter:weld||slab?48:38'),'mesh post diameter exported');
assert(mesh.includes('function slabHeight()')&&mesh.includes('postNeed=d.key+50+slabH'),'mesh slab height extends main posts');
assert(mesh.includes('braceNeed=d.key+50'),'mesh braces sized independently');
assert(mesh.includes('linePostLength:linePost.key')&&mesh.includes('braceLength:bracePost.key'),'mesh selected lengths exported');
assert(mesh.includes('postWeld={170:245,200:288,230:337,250:365}'),'current grooved post prices required');
assert(mesh.includes('post48={150:184,175:211,200:229,220:295,230:296,240:305,260:319,300:399}'),'current Ø48 prices required');
assert(mesh.includes("if(!linePost||!termPost||!bracePost)return unsupported"),'mesh unavailable required post length must become individual');
assert(mesh.includes("document.addEventListener('change',()=>schedule(40))")&&mesh.includes("document.addEventListener('click',()=>schedule(70))"),'mesh slab toggle must immediately reschedule benchmark');

const structural=read('assets/structural-pricing-v5.js');assert(structural.includes('window.PLOTAO_GEOMETRY?.fenceLen'),'gabion must use validated net length');assert(structural.includes('if(materialH>300)'),'concrete over 300cm must not extrapolate');

const slab=read('assets/slab-pricing-v2.js');
assert(slab.includes("productLength:2.45,bay:2.5")&&slab.includes("productLength:2.95,bay:3"),'slab nominal bay/product lengths required');
assert(slab.includes("panel:{20:{end:54,through:null},30:{end:71,through:null}}"),'panel square posts must not use round through holders');
assert(slab.includes("mesh:{20:{end:76,through:116},30:{end:96,through:162}}"),'current mesh holder prices required');
assert(slab.includes('braceHolder={holder:148,screw:6}')&&slab.includes('braceMountCount'),'brace-to-slab hardware required');
assert(slab.includes('unsupportedHolders')&&slab.includes('unpricedOpeningHolders'),'opening holders must remain partial if profile unknown');
assert(slab.includes('Math.min(openingSides,sections*2)'),'opening holder exclusions must be capped by real slab row endpoints');

const concreteMaterial=read('assets/concrete-material-v1.js');
assert(concreteMaterial.includes('diameter=20,depth=80'),'footing model must expose 20x80cm reference dimensions');
assert(concreteMaterial.includes('Math.PI*(d/2)**2*h'),'footing volume must be geometric cylinder volume');
assert(concreteMaterial.includes("type()==='mesh'&&!meshHasSlab()"),'mesh braces without slab must receive concrete footings');
assert(concreteMaterial.includes('unsupportedOpenings:openingUnknown'),'gate/wicket footing uncertainty must be exported');

const accuracy=read('assets/accuracy-guard.js');assert(accuracy.includes('PLOTAO_SLAB_PRICE')&&accuracy.includes('unsupportedHolders'),'unverified opening slab holders must force partial budget');assert(accuracy.includes('unsupportedOpenings'),'unverified gate/wicket footing concrete must force partial budget');
const priceBridge=read('assets/price-bridge.js');assert(priceBridge.includes('c.unsupportedOpenings')&&priceBridge.includes('s.unsupportedHolders'),'price bridge must preserve partial totals for footing/slab exceptions');
const lead=read('assets/lead-safety-v1.js');assert(lead.includes('PLOTAO_SEGMENT_CONNECTIONS'),'lead snapshot must preserve section connectivity');
const slabSafety=read('assets/panel-slab-safety-v1.js');assert(slabSafety.includes("startsWith('300')"),'3m slabs must stay blocked for panels');
const gate=read('assets/gate-pricing-v1.js');assert(gate.includes('slab().with')&&gate.includes('leafLength')&&gate.includes('totalWeight'),'gate exact matching/specs required');
const drive=read('assets/gate-drive-pricing-v1.js');assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight')&&!drive.includes("if(w<=4)"),'drive must use verified gate specs');

function g(type,gap,segments,openings=[]){return solveGeometry({type,gap,segments,openings})}
let x=g('panel',2.5,[{len:37,connected:false}]);
assert(x.gross===37&&x.fenceLen===37,'37m panel gross/net length must be 37m');assert(x.fields===15,'37m panel must have 15 fields');assert(x.total===16&&x.line===14&&x.end===2&&x.corner===0,'37m panel must have 14 line + 2 end posts');

x=g('panel',2.5,[{len:20,connected:false},{len:17,connected:true}]);
assert(x.gross===37&&x.fields===15,'connected 20+17m panel must keep 37m and 15 fields');assert(x.corner===1&&x.end===2&&x.total===16,'connected 20+17m panel must share one corner post');

x=g('panel',2.5,[{len:20,connected:false},{len:17,connected:false}]);
assert(x.corner===0&&x.end===4&&x.total===17,'separate 20+17m panel must have four end posts and no corner');

x=g('mesh',3,[{len:30,connected:false}]);
assert(x.fields===10,'30m mesh at 3m spacing must have 10 fields');assert(x.strain===1,'30m mesh at 3m spacing must add one strain post at 24m');assert(x.runs[0].sections.length===2&&close(x.runs[0].sections[0],24)&&close(x.runs[0].sections[1],6),'30m mesh must split into 24m + 6m tension sections');

x=g('panel',2.5,[{len:10,connected:false},{len:10,connected:true}],[{kind:'gate',s:1,p:0,w:4}]);
assert(x.gateSides===2,'gate at connected section start must count previous and local fence side');assert(x.fenceLen===16&&x.gross===20,'connected-joint gate must subtract only its 4m opening from fill length');

x=g('panel',2.5,[{len:10,connected:false},{len:10,connected:false}],[{kind:'gate',s:1,p:0,w:4}]);
assert(x.gateSides===1,'gate at separate section start must not borrow fence side from previous section');

x=g('panel',2.5,[{len:8,connected:false},{len:4,connected:true},{len:8,connected:true}],[{kind:'gate',s:1,p:0,w:4}]);
assert(x.gateSides===2,'opening spanning entire connected middle section must see both neighbouring fences');assert(x.fenceLen===16,'full middle-section opening must remove exactly 4m of fill');

x=g('panel',2.5,[{len:8,connected:false},{len:4,connected:false},{len:8,connected:false}],[{kind:'gate',s:1,p:0,w:4}]);
assert(x.gateSides===0,'opening spanning entire separate middle section must not cross either boundary');

function chooseFrom(keys,need){return keys.find(x=>x>=need)??null}
assert(chooseFrom([170,200,230,250],200+50+20)===null,'welded 200cm +20cm slab must be individual: no verified 270cm grooved post');
assert(chooseFrom([170,200,230,250],180+50+20)===250,'welded 180cm +20cm slab may use verified 250cm grooved post');
function exactPanelStock(runLengths,width=2.5){let full=0,res=[];for(const l0 of runLengths){const l=Math.max(0,l0),n=Math.floor((l+.000001)/width),r=l-n*width;full+=n;if(r>.001)res.push(r)}res.sort((a,b)=>b-a);let best=res.length,bins=[];function place(i){if(i===res.length){best=Math.min(best,bins.length);return}if(bins.length>=best)return;const v=res[i],seen=new Set;for(let j=0;j<bins.length;j++){const cap=+bins[j].toFixed(4);if(seen.has(cap)||bins[j]+.000001<v)continue;seen.add(cap);bins[j]-=v;place(i+1);bins[j]+=v}bins.push(width-v);place(i+1);bins.pop()}if(res.length)place(0);else best=0;return full+best}
assert(exactPanelStock([37])===15,'panel37 purchase=15 panels');assert(exactPanelStock([6,6])===5,'two 6m runs purchase 5 panels via offcuts');
const footingVolume=(count,d=20,h=80)=>count*Math.PI*((d/100)/2)**2*(h/100),bagsFor=v=>Math.ceil(v*2000/25),BAG=129.71;
const panelV=footingVolume(16),panelBags=bagsFor(panelV),panelMaterial=15*607+16*354+64*40,panelSlabs=15*680+30*54;
assert(close(panelV,.4021238597),'panel37 Ø20x80 volume must be ~0.402m3');assert(panelBags===33,'panel37 must use 33 Cemix bags');assert(close(panelMaterial+panelSlabs+panelBags*BAG,33429.43,.01),'panel37 known material total must stay 33,429.43 CZK');

if(failures.length){console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));process.exit(1)}console.log(`Calculator regression checks OK (${assets.length} JS assets checked; production geometry scenarios passed)`);
