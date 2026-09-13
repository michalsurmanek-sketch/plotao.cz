import fs from 'node:fs';
const src=fs.readFileSync('assets/lead-safety-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("[['#lead','lead'],['#help','help'],['#partner','partner']].forEach(([sel,m])=>$(sel)?.addEventListener('click',()=>restoreMode(form,m)))"),'modal mode draft restoration must run synchronously on click');
ok(!src.includes("setTimeout(()=>restoreMode(form,m),0)"),'partner/customer place isolation must not wait until a later event-loop tick');
ok(src.includes("else if(m!=='partner'&&form.elements.place){form.elements.place.value=$('#place')?.value||''}"),'partner mode must never inherit calculator realization place');
if(fail.length){console.error('Modal draft isolation checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Modal draft isolation checks OK: partner area never flashes or inherits customer realization place');
