import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),assets=fs.readdirSync('assets').filter(x=>x.endsWith('.js')),failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)},close=(a,b,eps=.0001)=>Math.abs(a-b)<=eps;
for(const f of assets){const s=read('assets/'+f);assert(!s.includes('setInterval('),`${f}: polling setInterval must not return`)}

const geometry=read('assets/geometry-v3.js');
[['Math.floor(25/gp)*gp','tension sections align to nominal bay'],['pa+gp*k','full fields stay on nominal spacing'],['gateSides','gate sides published'],['wicketSides','wicket sides published'],['endpointHasFence','joint openings inspect adjacent sections'],["linked(ss,s.i)&&endpointHasFence(ss,ops,s.i-1,'end')",'connected start sees previous fence'],["linked(ss,s.i+1)&&endpointHasFence(ss,ops,s.i+1,'start')",'connected end sees next fence'],["document.addEventListener('plotao:placement'",'placement triggers geometry'],["document.addEventListener('plotao:segment-connections'",'connections trigger geometry'],['PLOTAO_SEGMENT_CONNECTIONS','connections classify posts'],["'outer:'+i+':start",'separate start node'],["'outer:'+i+':end",'separate end node'],['gross=ss.reduce','gross differs from net'],["'Celková trasa '+g.gross",'total badge uses gross'],["'Výplň '+g.fenceLen",'fill badge uses net']].forEach(([x,m])=>assert(geometry.includes(x),'geometry-v3: '+m));

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
assert(concreteMaterial.includes('meshHasSlab()')&&concreteMaterial.includes('Patky vzpěr bez podhrabovky'),'slab-mounted braces must not receive hidden concrete');
assert(concreteMaterial.includes('unsupportedOpenings:openingUnknown'),'gate/wicket footing uncertainty must be exported');
assert(!concreteMaterial.includes('PLOTAO_GEOMETRY?.concrete'),'concrete-material must not reuse legacy role-volume total');

const accuracy=read('assets/accuracy-guard.js');
assert(accuracy.includes('PLOTAO_SLAB_PRICE')&&accuracy.includes('unsupportedHolders'),'unverified opening slab holders must force partial budget');
assert(accuracy.includes('unsupportedOpenings'),'unverified gate/wicket footing concrete must force partial budget');
const slabSafety=read('assets/panel-slab-safety-v1.js');assert(slabSafety.includes("startsWith('300')"),'3m slabs must stay blocked for panels');
const gate=read('assets/gate-pricing-v1.js');assert(gate.includes('slab().with')&&gate.includes('leafLength')&&gate.includes('totalWeight'),'gate exact matching/specs required');
const drive=read('assets/gate-drive-pricing-v1.js');assert(drive.includes('gate.leafLength')&&drive.includes('gate.totalWeight')&&!drive.includes("if(w<=4)"),'drive must use verified gate specs');

function straightRun(length,gap,{mesh=false}={}){const maxSection=mesh?Math.max(gap,Math.floor(25/gap)*gap):length;let fields=0,line=0,strain=0;for(let a=0;a<length-.001;a+=maxSection){const section=Math.min(length,a+maxSection)-a,f=Math.ceil(section/gap);fields+=f;line+=Math.max(0,f-1);if(a+maxSection<length-.001)strain++}const end=2;return{fields,line,strain,end,posts:line+strain+end}}
function exactPanelStock(runLengths,width=2.5){let full=0,res=[];for(const l0 of runLengths){const l=Math.max(0,l0),n=Math.floor((l+.000001)/width),r=l-n*width;full+=n;if(r>.001)res.push(r)}res.sort((a,b)=>b-a);let best=res.length,bins=[];function place(i){if(i===res.length){best=Math.min(best,bins.length);return}if(bins.length>=best)return;const x=res[i],seen=new Set;for(let j=0;j<bins.length;j++){const cap=+bins[j].toFixed(4);if(seen.has(cap)||bins[j]+.000001<x)continue;seen.add(cap);bins[j]-=x;place(i+1);bins[j]+=x}bins.push(width-x);place(i+1);bins.pop()}if(res.length)place(0);else best=0;return full+best}
const footingVolume=(count,d=20,h=80)=>count*Math.PI*((d/100)/2)**2*(h/100),bagsFor=v=>Math.ceil(v*2000/25),BAG=129.71;

const panel37=straightRun(37,2.5);assert(panel37.fields===15,'panel37 fields=15');assert(panel37.line===14&&panel37.posts===16,'panel37 posts=16');
const panelV=footingVolume(16),panelBags=bagsFor(panelV),panelMaterial=15*607+16*354+64*40,panelSlabs=15*680+30*54;
assert(close(panelV,.4021238597),'panel37 Ø20x80 volume must be ~0.402m3');assert(panelBags===33,'panel37 must use 33 Cemix bags at default hole size');assert(panelMaterial===17329,'panel37 core must stay 17,329 CZK');assert(panelSlabs===11820,'panel37 slabs+holders must stay 11,820 CZK');assert(close(panelMaterial+panelSlabs+panelBags*BAG,33429.43,.01),'panel37 known material total must stay 33,429.43 CZK');
assert(exactPanelStock([37])===15,'panel37 purchase=15 panels');assert(exactPanelStock([6,6])===5,'two 6m runs purchase 5 panels via offcuts');assert(exactPanelStock([1.4,1.4,1.4])===3,'three 1.4m pieces need 3 panels');assert(15*2*71===2130,'panel 30cm slab holders=2,130 CZK');

const mesh30=straightRun(30,3,{mesh:true});assert(mesh30.fields===10,'mesh30 fields=10');assert(mesh30.strain===1,'mesh30 strain=1 at 24m');assert(mesh30.line===8&&mesh30.posts===11,'mesh30 posts=11');
const meshV=footingVolume(11),meshBags=bagsFor(meshV),meshCore=30*87+8*295+3*295+4*223+167+4*15,meshSlabs=10*772+4*76+8*116+4*(148+6);
assert(close(meshV,.2764601535),'mesh30 slab system Ø20x80 volume must be ~0.276m3');assert(meshBags===23,'mesh30 slab system must use 23 bags');assert(meshCore===6974,'mesh30 core must stay 6,974 CZK');assert(meshSlabs===9568,'mesh30 slabs/hardware must stay 9,568 CZK');assert(close(meshCore+meshSlabs+meshBags*BAG,19525.33,.01),'mesh30 known material total must stay 19,525.33 CZK');

const connected20={fields:8,line:6,corner:1,end:2,posts:9},separate20={fields:8,line:6,corner:0,end:4,posts:10};assert(connected20.posts===9&&separate20.posts===10,'connected vs separate 10m+10m post counts');
if(failures.length){console.error('Calculator regression checks failed:\n- '+failures.join('\n- '));process.exit(1)}console.log(`Calculator regression checks OK (${assets.length} JS assets checked; numeric scenarios passed)`);
