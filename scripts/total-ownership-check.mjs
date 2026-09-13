import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const price=read('assets/price-bridge.js'),mobile=read('assets/mobile-price-bridge.js'),accuracy=read('assets/accuracy-guard.js'),pending=read('assets/gate-total-pending-v1.js');

ok(price.includes("function clearOwnedTotal(){const main=$('.price strong'),mobile=$('.mobile-price strong');if(main?.dataset.benchmarkTotal==='1')"),'generic bridge must clear only a total it owns');
ok(price.includes("main.textContent='Přepočítávám…';delete main.dataset.benchmarkTotal")&&price.includes("if(mobile)mobile.textContent='Přepočítávám…'")&&price.includes("rp.textContent='Aktualizuji cenu podle nové konfigurace.'"),'losing a generic benchmark must neutralize desktop, sticky and range copy immediately');
ok(price.includes("main.dataset.benchmarkTotal='1';delete main.dataset.mobileTotal")&&price.includes("$('#mobileTotalNote')?.remove()"),'generic total must take explicit ownership from DOPS');
ok(price.includes("if(!bm){clearBenchmarkUi();return}")&&price.includes("else clearOwnedTotal()"),'missing, blocked or non-material generic pricing must not leave an old owned total visible');

ok(mobile.includes("function clearOwnedTotal(){const main=$('.price strong'),sticky=$('.mobile-price strong');if(main?.dataset.mobileTotal==='1')"),'DOPS bridge must clear only a total it owns');
ok(mobile.includes("main.textContent='Přepočítávám…';delete main.dataset.mobileTotal")&&mobile.includes("if(sticky)sticky.textContent='Přepočítávám…'")&&mobile.includes("rp.textContent='Aktualizuji cenu podle nové konfigurace.'"),'losing a DOPS total must neutralize desktop, sticky and range copy immediately');
ok(mobile.includes("main.dataset.mobileTotal='1';delete main.dataset.benchmarkTotal")&&mobile.includes("$('#benchmarkTotalNote')?.remove()"),'DOPS total must take explicit ownership from the generic benchmark');
ok(mobile.includes("if(scope()!=='material'||window.PLOTAO_ACCURACY_BLOCK){clearOwnedTotal();return}"),'DOPS material total must be neutralized when scope or accuracy no longer permits it');
ok(mobile.includes("function clear(){clearOwnedTotal();")&&mobile.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'leaving DOPS on a type reset must immediately schedule owned-total cleanup');

ok(accuracy.includes("delete main.dataset.benchmarkTotal;delete main.dataset.mobileTotal;main.dataset.accuracyBlocked='1'"),'accuracy guard must take ownership away from both price bridges before showing an invalid or individual state');
ok(accuracy.includes("function clearTotalBadges(){$('#benchmarkTotalNote')?.remove();$('#mobileTotalNote')?.remove()}")&&accuracy.includes('clearTotalBadges();if(sticky)sticky.textContent=headline'),'accuracy-owned invalid/individual headlines must remove both stale exact-total badges');
ok(pending.includes("delete main.dataset.benchmarkTotal;delete main.dataset.mobileTotal"),'gate pending state must clear both total ownership markers before showing recalculation');
ok(pending.includes("main.textContent='Přepočítávám…'")&&pending.includes("mobile.textContent='Přepočítávám…'"),'gate pending transition must keep desktop and sticky totals truthful');

if(fail.length){console.error('Total ownership checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Total ownership checks OK: generic, DOPS, accuracy and gate-pending states cannot leak old price, range copy or badges across transitions');
