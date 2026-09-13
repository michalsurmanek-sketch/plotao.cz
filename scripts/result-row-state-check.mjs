import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const slab=read('assets/slab-pricing-v2.js'),price=read('assets/price-bridge.js'),mobile=read('assets/mobile-price-bridge.js'),manifest=read('scripts/pages-manifest.mjs');

ok(slab.includes("if(!st.with){r.classList.add('off')")&&slab.includes("const small=r.querySelector('small');if(small)small.textContent=''"),'disabling slabs must clear the stale quantity/size note as well as the price');
ok(price.includes('function clearBenchmarkFill()'),'generic price bridge must expose an owned fill-row cleanup path');
ok(price.includes("if(target.dataset.benchmark==='1')")&&price.includes("target.textContent='Nezapočítáno'")&&price.includes("delete target.dataset.benchmark")&&price.includes("fill.classList.add('off')"),'generic benchmark cleanup must neutralize only its own fill-row value');
ok(price.includes("fill.querySelector('.benchmark-note')?.remove()"),'generic benchmark cleanup must remove its stale explanatory note');
ok(price.includes("fill.classList.remove('off')")&&price.includes("target.dataset.benchmark='1'"),'a valid generic benchmark must reactivate and claim the fill row before aggregation');
ok(price.includes("delete target.dataset.mobileBenchmark")&&price.includes("fill.querySelector('.mobile-benchmark-note')?.remove()"),'generic benchmark must explicitly take ownership from the mobile benchmark without leaving its note');
ok(price.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'generic fill cleanup must run immediately on type-option reset');

ok(mobile.includes('function clear()'),'mobile bridge must expose a stale-state cleanup path');
ok(mobile.includes("if(fill&&t&&t.dataset.mobileBenchmark==='1')")&&mobile.includes("t.textContent='Nezapočítáno'")&&mobile.includes("delete t.dataset.mobileBenchmark")&&mobile.includes("fill.classList.add('off')"),'mobile cleanup must neutralize only the DOPS value it owns');
ok(mobile.includes("delete target.dataset.benchmark")&&mobile.includes("fill.querySelector('.benchmark-note')?.remove()"),'mobile benchmark must explicitly take ownership from a generic benchmark');
ok(mobile.includes("target.dataset.mobileBenchmark='1'")&&mobile.includes("note.className='mobile-benchmark-note'"),'DOPS value must carry its own ownership marker and explanatory note');
ok(mobile.includes("fill?.querySelector('.mobile-benchmark-note')?.remove()"),'leaving DOPS must remove its stale note');
ok(mobile.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'mobile fill cleanup must run immediately on type-option reset');

const pricePos=manifest.indexOf('/assets/price-bridge.js'),mobilePos=manifest.indexOf('/assets/mobile-price-bridge.js');
ok(pricePos>=0&&mobilePos>pricePos,'mobile bridge must load after the generic price bridge so ownership handoff is deterministic');

if(fail.length){console.error('Result row state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Result row state checks OK: slab notes and fill benchmark ownership cannot leak across configuration transitions');
