import fs from 'node:fs';
const src=fs.readFileSync('assets/scope-integrity.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("const sc=scope(),labels={material:'Materiál',delivery:'Doprava',turnkey:'Na klíč'}"),'scope UI must use explicit canonical labels');
ok(src.includes("b.textContent=base+(b.dataset.v===sc?' ✓':'')"),'only the active scope button may carry the confirmation mark');
ok(!src.includes("if(mb)mb.textContent='Materiál ✓'"),'material must not stay falsely checked when another scope is active');
ok(src.includes("sc==='delivery'?'Podklady pro materiál + dopravu':'Podklady pro nabídku na klíč'"),'non-material result headings must describe supporting inputs rather than imply an exact final price');
ok(src.includes("window.PLOTAO_SCOPE_INCOMPLETE=sc!=='material'"),'delivery and turnkey must remain explicitly incomplete pricing scopes');
if(fail.length){console.error('Scope truth checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Scope truth checks OK: only the active scope is marked and non-material headings stay truthful');
