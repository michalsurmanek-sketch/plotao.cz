import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const price=read('assets/price-bridge.js'),accuracy=read('assets/accuracy-guard.js'),mobile=read('assets/mobile-price-bridge.js'),truth=read('assets/ui-truth-v1.js');
ok(price.includes('if(mobile)mobile.textContent=text'),'main price bridge must mirror computed material total to mobile price');
ok(accuracy.includes('partialize(main);partialize(sticky)'),'partial budget must be mirrored to desktop and mobile');
ok(accuracy.includes('if(sticky)sticky.textContent=headline'),'invalid/individual headline must be mirrored to mobile');
ok(mobile.includes("if($('.price strong'))$('.price strong').textContent=text")&&mobile.includes("if($('.mobile-price strong'))$('.mobile-price strong').textContent=text"),'mobile fence benchmark must update desktop and sticky total together');
ok(truth.includes('Ověřený materiál spočítáme hned'),'intro must clearly distinguish verified material from services');
ok(truth.includes('Doprava a Na klíč = individuální doplnění'),'scope explanation must disclose individual delivery/turnkey pricing');
ok(truth.includes("id='scopeTruthNote'")||truth.includes("n.id='scopeTruthNote'"),'scope truth note must have a stable id and avoid duplicates');
if(fail.length){console.error('UI state regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('UI state regression checks OK');
