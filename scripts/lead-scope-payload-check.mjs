import fs from 'node:fs';
const src=fs.readFileSync('assets/lead-safety-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("function scopeLabel(v){return v==='delivery'?'Doprava':v==='turnkey'?'Na klíč':'Materiál'}"),'lead payload must use canonical scope labels without visual checkmarks');
ok(src.includes("if(scopeValue==='delivery')return{kind:'individuální nabídka'"),'delivery snapshots must be classified independently from rendered price timing');
ok(src.includes("if(scopeValue==='turnkey')return{kind:'individuální nabídka'"),'turnkey snapshots must be classified independently from rendered price timing');
ok(src.includes("scopeValue=includeFence?(scopeBtn?.dataset.v||'material'):'material'"),'snapshot must derive stable scope value before price classification');
ok(src.includes("scope:includeFence?scopeLabel(scopeValue):''"),'snapshot must export a canonical human-readable scope label');
ok(src.includes("displayedPrice:includeFence?(scopeValue==='material'?shown:'Individuální nabídka'):''"),'non-material snapshots must never carry a stale numeric material price');
ok(src.includes("ps=includeFence?priceStatus(scopeValue):{kind:'individuální nabídka',reason:''}"),'price state must be derived from the selected scope, not only from the DOM');
if(fail.length){console.error('Lead scope payload checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead scope payload checks OK: delivery/turnkey exports cannot inherit stale material totals or UI-only scope marks');
