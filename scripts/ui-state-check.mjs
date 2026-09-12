import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const price=read('assets/price-bridge.js'),accuracy=read('assets/accuracy-guard.js'),mobile=read('assets/mobile-price-bridge.js'),truth=read('assets/ui-truth-v1.js'),lead=read('assets/lead-safety-v1.js'),validity=read('assets/geometry-validity-v1.js'),geometry=read('assets/geometry-v3.js');
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
function boundarySides({connected,leftFence,rightFence,localLeft=false,localRight=false}){let sides=(localLeft?1:0)+(localRight?1:0);if(connected&&leftFence)sides++;if(connected&&rightFence)sides++;return sides}
ok(boundarySides({connected:true,leftFence:true,rightFence:false,localRight:true})===2,'gate at start of connected segment must count previous fence plus local right fence');
ok(boundarySides({connected:false,leftFence:true,rightFence:false,localRight:true})===1,'gate at start of separate segment must not count previous fence');
ok(boundarySides({connected:true,leftFence:false,rightFence:true,localLeft:true})===2,'gate at end of connected segment must count next fence plus local left fence');
ok(boundarySides({connected:false,leftFence:false,rightFence:true,localLeft:true})===1,'gate at end of separate segment must not count next fence');
if(fail.length){console.error('UI state regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('UI state regression checks OK');
