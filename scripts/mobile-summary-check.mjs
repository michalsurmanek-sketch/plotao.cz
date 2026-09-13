import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const src=read('assets/mobile-summary-state-v1.js'),safe=read('assets/mobile-safe-area-v1.js'),manifest=read('scripts/pages-manifest.mjs'),ui=read('assets/ui-bootstrap-v1.js'),truth=read('assets/ui-truth-v1.js');

ok(src.includes("if(p==='Nelze spočítat')return{kind:'invalid',label:'Stav kalkulace',button:'Opravit zadání ↑'}"),'invalid mobile summary must stop presenting an estimate');
ok(src.includes("if(p==='Individuální nabídka')return{kind:'individual',label:'Stav kalkulace',button:'Zobrazit podklady →'}"),'individual pricing must be labelled as a state, not an estimate');
ok(src.includes("if(p.startsWith('Od ')||p.includes('+ individuálně'))return{kind:'partial',label:'Částečný rozpočet',button:'Zobrazit rozpis →'}"),'partial totals must be clearly labelled');
ok(src.includes("return{kind:'price',label:'Cena materiálu',button:'Zobrazit rozpis →'}"),'verified totals must be described as material price');
ok(src.includes("if(h&&(hv<40||hv>400))return h")&&src.includes("if(segments.length>12)return $('#segmentList')||$('#addSegment')")&&src.includes("const bad=$$('#segmentList input[type=number]').find(x=>+(x.value||0)<=0)")&&src.includes("window.PLOTAO_PLACEMENT?.valid===false"),'invalid CTA must route to the actual broken height, over-limit section editor, segment or opening input');
ok(src.includes("e.stopImmediatePropagation()"),'state-aware mobile CTA must replace the legacy unconditional result scroll');
ok(src.includes("strong.setAttribute('aria-live','polite')")&&src.includes("strong.setAttribute('aria-atomic','true')"),'sticky price/status updates must be announced accessibly');
ok(src.includes("new MutationObserver(()=>schedule(0)).observe(el")||src.includes("new MutationObserver(()=>schedule(0)).observe(el,"),'mobile summary must track asynchronous price/status mutations');
ok(safe.includes("viewport-fit=cover"),'mobile viewport must opt into safe-area geometry');
ok(truth.includes('body{padding-bottom:86px!important}'),'regression test must model the legacy important mobile padding that safe-area protection overrides');
ok(safe.includes("body{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}"),'page bottom padding must include the device safe-area inset and override the legacy important rule');
ok(safe.includes("html{scroll-padding-bottom:calc(108px + env(safe-area-inset-bottom))}"),'scroll targets must reserve room for the fixed mobile bar plus safe area');
ok(safe.includes(".mobile-price{padding-bottom:calc(12px + env(safe-area-inset-bottom))!important}"),'fixed mobile price bar must keep its own bottom safe-area padding with sufficient CSS priority');
ok(ui.includes("$('#continueBtn')?.addEventListener('click',()=>$('.result')?.scrollIntoView"),'legacy bootstrap still owns the generic scroll and therefore requires the capture override');
ok(truth.includes("if(label)label.textContent='Odhad ceny'"),'truth redesign still sets the static fallback label before state sync');
const truthPos=manifest.indexOf('/assets/ui-truth-v1.js'),statePos=manifest.indexOf('/assets/mobile-summary-state-v1.js'),safePos=manifest.indexOf('/assets/mobile-safe-area-v1.js');
ok(truthPos>=0&&statePos>truthPos,'state-aware mobile summary must load after the static UI redesign');
ok(safePos>statePos,'safe-area protection must load after the mobile summary layer');

if(fail.length){console.error('Mobile summary regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Mobile summary regression checks OK: state, CTA behavior and safe-area spacing stay truthful and usable');
