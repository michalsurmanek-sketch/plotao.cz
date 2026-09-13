import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const guard=read('assets/input-validity-guard-v1.js'),manifest=read('scripts/pages-manifest.mjs');

ok(guard.includes("window.PLOTAO_INPUT_VALIDITY={current,invalid:()=>!!current()}"),'shared input validity API must expose current() and invalid()');
ok(guard.includes("if(!ss.length)return{code:'segments'")&&guard.includes("if(ss.length>12)return{code:'segments-count'")&&guard.includes("const bad=ss.findIndex(x=>x<=0)")&&guard.includes("if(h<40||h>400)return{code:'height'")&&guard.includes("if(window.PLOTAO_PLACEMENT?.valid===false)return{code:'placement'")&&guard.includes("if(ss.reduce((a,b)=>a+b,0)>1000+.001)return{code:'segments-total'"),'shared validity must match calculator segment, height, placement and total-length limits');
ok(guard.includes("['#panelVerifiedBox','#meshVerifiedBox','#aluminiumVerifiedBox','#privacyPriceBox','#metalPriceBox','#verifiedPriceBox','#extraPriceBox','#slabDetailBox','#concreteMaterialBox','#gatePriceBox','#gateDrivePriceBox'].forEach(hide)"),'invalid input must hide every precise/detail benchmark box');
ok(guard.includes("delete b.dataset.benchmark")&&guard.includes("delete b.dataset.mobileBenchmark")&&guard.includes("r.classList.add('off')"),'invalid input must clear stale generic/mobile fill benchmark ownership');
ok(guard.includes("if(t==='panel')window.PLOTAO_PANEL_PRICE=v")&&guard.includes("else if(t==='mesh')window.PLOTAO_MESH_PRICE=v")&&guard.includes("else if(t==='aluminium')window.PLOTAO_ALUMINIUM_PRICE=v")&&guard.includes("else if(t==='privacy')window.PLOTAO_PRIVACY_PRICE=v")&&guard.includes("else if(t==='metal')window.PLOTAO_METAL_PRICE=v")&&guard.includes("else if(t==='concrete')window.PLOTAO_CONCRETE_PRICE=v")&&guard.includes("else if(t==='gabion')window.PLOTAO_GABION_PRICE=v")&&guard.includes("window.PLOTAO_EXTRA_PRICE=v"),'invalid input must replace current structured detail price state before aggregation');
ok(guard.includes("window.PLOTAO_GATE_PRICE={type:t,invalid:true,gate:null,door:null,inputCode:s.code}")&&guard.includes("window.PLOTAO_GATE_DRIVE={active:false,invalid:true,unsupported:true,price:0,inputCode:s.code}"),'invalid input must clear exact gate/wicket and drive structured prices');
ok(guard.includes("neutralizeRow('vjezdová brána',s.note)")&&guard.includes("neutralizeRow('vstupní branka',s.note)")&&guard.includes("neutralizeRow('pohon brány',s.note)"),'invalid input must neutralize visible opening/drive rows');
ok(guard.includes("document.addEventListener('input',e=>{if(critical(e))apply()})")&&guard.includes("queueMicrotask(apply)")&&guard.includes("'plotao:panel-price','plotao:mesh-price'")&&guard.includes("'plotao:gate-price','plotao:gate-drive'"),'guard must react synchronously to critical inputs and downstream pricing emissions');

const guardPos=manifest.indexOf('/assets/input-validity-guard-v1.js'),drivePos=manifest.indexOf('/assets/gate-drive-pricing-v1.js'),scopePos=manifest.indexOf('/assets/scope-integrity.js'),totalPos=manifest.indexOf('/assets/price-total-core-v1.js'),bridgePos=manifest.indexOf('/assets/price-bridge.js');
ok(guardPos>drivePos&&guardPos<scopePos&&guardPos<totalPos&&guardPos<bridgePos,'shared invalid-input guard must load after detail pricing but before scope/total/price bridges');

if(fail.length){console.error('Input validity guard checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Input validity guard checks OK: true invalid inputs synchronously suppress precise detail states before total aggregation');
