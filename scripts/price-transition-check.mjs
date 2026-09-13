import fs from 'node:fs';
const src=fs.readFileSync('assets/accuracy-guard.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("document.addEventListener('click',e=>schedule(e.target.closest?.('.type,#scope button')?0:140))"),'type and scope changes must run the accuracy guard immediately');
ok(src.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'type option reset must immediately invalidate stale totals before slower pricing modules finish');
ok(src.includes("function sharedInvalid(){const api=window.PLOTAO_INPUT_VALIDITY;if(!api?.current)return null")&&src.includes("const s=api.current();if(!s)return false"),'main accuracy state must prefer the shared synchronous validity API and distinguish valid from unavailable');
ok(src.includes("#height,#segmentList input[type=number],#gate,#door,#gateWidth,#doorWidth,#gatePos,#doorPos,#gateSection,#doorSection"),'height, segment and opening edits must all be classified as critical price-validity inputs');
ok(src.includes("document.addEventListener('input',e=>schedule(criticalInput(e)?0:70))")&&src.includes("document.addEventListener('change',e=>schedule(criticalInput(e)?0:70))"),'critical geometry/opening edits must block or release the main price without the normal debounce delay');
ok(src.includes("document.addEventListener('plotao:input-validity',()=>schedule(0))"),'shared invalid-to-valid recovery must refresh the main price state immediately');
ok(src.includes("if(sticky)sticky.textContent=headline"),'immediate accuracy blocking must mirror the safe headline into the mobile sticky price');
ok(src.includes("main.dataset.accuracyBlocked='1'"),'individual or invalid transitions must mark the desktop total as accuracy-blocked');
if(fail.length){console.error('Price transition checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Price transition checks OK: stale exact totals are blocked and released immediately on shared geometry/input validity changes');
