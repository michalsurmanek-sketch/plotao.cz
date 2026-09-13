import fs from 'node:fs';
const src=fs.readFileSync('assets/accuracy-guard.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("document.addEventListener('click',e=>schedule(e.target.closest?.('.type,#scope button')?0:140))"),'type and scope changes must run the accuracy guard immediately');
ok(src.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'type option reset must immediately invalidate stale totals before slower pricing modules finish');
ok(src.includes("if(sticky)sticky.textContent=headline"),'immediate accuracy blocking must mirror the safe headline into the mobile sticky price');
ok(src.includes("main.dataset.accuracyBlocked='1'"),'individual or invalid transitions must mark the desktop total as accuracy-blocked');
if(fail.length){console.error('Price transition checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Price transition checks OK: stale exact totals are blocked immediately on type/scope changes');
