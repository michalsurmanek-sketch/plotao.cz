import fs from 'node:fs';
const src=fs.readFileSync('assets/scope-integrity.js','utf8'),price=fs.readFileSync('assets/price-bridge.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("const sc=scope(),labels={material:'Materiál',delivery:'Doprava',turnkey:'Na klíč'}"),'scope UI must use explicit canonical labels');
ok(src.includes("b.textContent=base+(b.dataset.v===sc?' ✓':'')"),'only the active scope button may carry the confirmation mark');
ok(!src.includes("if(mb)mb.textContent='Materiál ✓'"),'material must not stay falsely checked when another scope is active');
ok(src.includes("sc==='delivery'?'Podklady pro materiál + dopravu':'Podklady pro nabídku na klíč'"),'non-material result headings must describe supporting inputs rather than imply an exact final price');
ok(src.includes("window.PLOTAO_SCOPE_INCOMPLETE=sc!=='material'"),'delivery and turnkey must remain explicitly incomplete pricing scopes');
ok(src.includes("scopeEl?.addEventListener('click',e=>{if(e.target.closest('button')){userChosen=true;render()}})"),'scope rows must switch synchronously in the same click that selects a new scope');
ok(price.includes("document.addEventListener('plotao:scope-integrity',()=>schedule(0))"),'main material total must recalculate immediately after the scope rows reach their authoritative state');
ok(!price.includes("'plotao:scope-integrity'].forEach(ev=>document.addEventListener(ev,()=>schedule(40)))"),'scope transition must not fall back to the generic delayed benchmark event path');
if(fail.length){console.error('Scope truth checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Scope truth checks OK: active scope is truthful and scope-to-price transitions are synchronous');
