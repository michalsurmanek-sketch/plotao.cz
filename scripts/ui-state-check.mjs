import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const price=read('assets/price-bridge.js'),accuracy=read('assets/accuracy-guard.js'),mobile=read('assets/mobile-price-bridge.js'),truth=read('assets/ui-truth-v1.js'),lead=read('assets/lead-safety-v1.js'),validity=read('assets/geometry-validity-v1.js'),geometry=read('assets/geometry-v3.js'),ui=read('assets/ui-bootstrap-v1.js'),index=read('index.html'),panelLanding=read('panelovy-plot.html'),concreteLanding=read('betonovy-plot.html');
ok(price.includes('if(mobile)mobile.textContent=text'),'main price bridge must mirror computed material total to mobile price');
ok(accuracy.includes('partialize(main);partialize(sticky)'),'partial budget must be mirrored to desktop and mobile');
ok(accuracy.includes('if(sticky)sticky.textContent=headline'),'invalid/individual headline must be mirrored to mobile');
ok(mobile.includes("if($('.price strong'))$('.price strong').textContent=text")&&mobile.includes("if($('.mobile-price strong'))$('.mobile-price strong').textContent=text"),'mobile fence benchmark must update desktop and sticky total together');
ok(truth.includes('Ověřený materiál spočítáme hned'),'intro must clearly distinguish verified material from services');
ok(truth.includes('Doprava a Na klíč = individuální doplnění'),'scope explanation must disclose individual delivery/turnkey pricing');
ok(truth.includes("id='scopeTruthNote'")||truth.includes("n.id='scopeTruthNote'"),'scope truth note must have a stable id and avoid duplicates');
ok(lead.includes('function priceStatus()'),'lead snapshot must classify current displayed price state');
ok(lead.includes('priceKind:ps.kind')&&lead.includes('priceReason:ps.reason'),'lead snapshot must preserve price state and accuracy explanation');
ok(lead.includes('Stav ceny: ')&&lead.includes('Důvod / co dopočítat: '),'copied lead text must expose price status and missing-price reason');
ok(lead.includes("$('#accuracyGuard')"),'lead price explanation must come from the visible accuracy guard');
ok(validity.includes("if(!invalid())return false"),'validity layer must release naturally when placement becomes valid');
ok(!validity.includes('locked=true')&&!validity.includes('invalidLock'),'validity layer must not keep a persistent invalid lock');
ok(geometry.includes('endpointHasFence')&&geometry.includes("linked(ss,s.i)&&endpointHasFence(ss,ops,s.i-1,'end')"),'geometry must inspect previous connected segment at opening boundary');
ok(geometry.includes("linked(ss,s.i+1)&&endpointHasFence(ss,ops,s.i+1,'start')"),'geometry must inspect next connected segment at opening boundary');

ok(index.includes('<script src="/assets/ui-bootstrap-v1.js"></script>'),'index must load the external UI bootstrap');
ok(!index.includes('<script>const types=[')&&!index.includes('function calc(){'),'legacy inline calculator must not return to index');
ok(ui.includes("['Plotová výplň','Podhrabové desky','Vjezdová brána','Vstupní branka','Montáž a zemní práce','Demontáž','Rohové napojení','Beton do patek','Doprava']"),'UI bootstrap must create the result rows used by pricing modules');
ok(ui.includes("['Úseky oplocení','Plotová pole','Sloupky celkem','Průběžné sloupky','Koncové sloupky','Rohové sloupky','Bránové sloupky','Brankové sloupky','Rohové spoje','Podhrabové desky','Beton podle typu patek','Vjezdová brána','Branka']"),'UI bootstrap must create the material rows used by geometry/material modules');
ok(ui.includes('renderTypes();renderOptions();renderSegments();syncToggles()'),'UI bootstrap must initialise type/options/segments/toggles before pricing modules run');
ok(ui.includes("window.PLOTAO_UI_READY=true")&&ui.includes("new CustomEvent('plotao:ui-ready')"),'UI bootstrap must publish readiness');
ok(!ui.includes('function calc(')&&!ui.includes('price:1680')&&!ui.includes('workRate=')&&!ui.includes('gatePrice('),'UI bootstrap must remain free of pricing formulas');

ok(panelLanding.includes('Ověřený materiálový rozpočet získáte hned')&&panelLanding.includes('dopravu a montáž naceníme podle místa a podmínek realizace'),'panel landing must distinguish verified material from individual realization pricing');
ok(!panelLanding.includes('dopravu i montáž.</p>'),'panel landing must not claim delivery and installation are instant calculator inputs');
ok(concreteLanding.includes('Materiálový benchmark získáte hned')&&concreteLanding.includes('dopravu a montáž naceníme podle místa, terénu a přístupu'),'concrete landing must distinguish material benchmark from realization pricing');
ok(!concreteLanding.includes('doprava a montáž v kalkulátoru Plotao'),'concrete landing meta copy must not claim instant delivery/installation pricing');
function boundarySides({connectedLeft=false,connectedRight=false,leftFence=false,rightFence=false,localLeft=false,localRight=false}){let sides=(localLeft?1:0)+(localRight?1:0);if(connectedLeft&&leftFence)sides++;if(connectedRight&&rightFence)sides++;return sides}
ok(boundarySides({connectedLeft:true,leftFence:true,localRight:true})===2,'gate at start of connected segment must count previous fence plus local right fence');
ok(boundarySides({connectedLeft:false,leftFence:true,localRight:true})===1,'gate at start of separate segment must not count previous fence');
ok(boundarySides({connectedRight:true,rightFence:true,localLeft:true})===2,'gate at end of connected segment must count next fence plus local left fence');
ok(boundarySides({connectedRight:false,rightFence:true,localLeft:true})===1,'gate at end of separate segment must not count next fence');
ok(boundarySides({connectedLeft:true,connectedRight:true,leftFence:true,rightFence:true})===2,'opening spanning a fully connected middle segment must count both neighbouring fence sides');
ok(boundarySides({connectedLeft:false,connectedRight:false,leftFence:true,rightFence:true})===0,'opening spanning a fully separate segment must not jump across either boundary');
if(fail.length){console.error('UI state regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('UI state regression checks OK');
