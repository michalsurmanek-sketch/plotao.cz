import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const slab=read('assets/slab-pricing-v2.js'),price=read('assets/price-bridge.js'),mobile=read('assets/mobile-price-bridge.js'),concrete=read('assets/concrete-material-v1.js'),geometry=read('assets/geometry-v3.js'),validity=read('assets/geometry-validity-v1.js'),gate=read('assets/gate-pricing-v1.js'),drive=read('assets/gate-drive-pricing-v1.js'),extraConfig=read('assets/extra-fence-config.js'),extraPrice=read('assets/extra-fence-pricing.js'),privacyConfig=read('assets/privacy-config.js'),concreteConfig=read('assets/concrete-config.js'),metalConfig=read('assets/metal-config.js'),aluminiumConfig=read('assets/aluminium-config.js'),gabionOptions=read('assets/gabion-options.js'),manifest=read('scripts/pages-manifest.mjs');

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

ok(concrete.includes('function clearVolume()')&&concrete.includes("$('#concreteAmount').textContent='—'")&&concrete.includes("if(b)b.textContent='—'"),'inactive or invalid footing calculations must clear both visible concrete volume surfaces');
ok(concrete.includes('function clearState(b){clearVolume();')&&concrete.includes('publish(null)'),'leaving panel/mesh or material scope must publish a cleared footing state');
ok(concrete.includes("function invalidState(b,note){clearVolume();setRow(null,note,'Nezapočítáno')")&&concrete.includes("if(window.PLOTAO_PLACEMENT?.valid===false)return'opravte umístění brány/branky'"),'invalid opening geometry must hide stale concrete volume instead of showing the previous valid value');
ok(concrete.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'footing material cleanup must run immediately on type-option reset');

ok(geometry.includes("if(t.startsWith('Úseky oplocení'))bb.textContent=segmentCount+' ks · '+g.gross.toLocaleString('cs-CZ',{maximumFractionDigits:1})+' m trasy'"),'valid geometry must populate the material segment count and gross route length');
ok(geometry.includes("else if(t.startsWith('Plotová pole'))bb.textContent=g.fields+' ks'"),'valid geometry must populate the material fence-field count');
ok(geometry.includes("if(acc){if(type()==='mesh')")&&geometry.includes("else acc.innerHTML=''"),'mesh-specific accessory material rows must be cleared outside mesh type');
ok(geometry.includes("document.addEventListener('plotao:options-reset',()=>schedule(0))"),'geometry material details must refresh immediately on type-option reset');
ok(validity.includes("if(t.includes('úseky oplocení'))b.textContent=segments+' ks · '+total.toLocaleString('cs-CZ',{maximumFractionDigits:1})+' m trasy'"),'invalid placement may preserve only the still-known segment count and gross route length');
ok(validity.includes("t.includes('plotová pole')||t.includes('plotova pole')||t.includes('sloup')||t.includes('rohové spoje')")&&validity.includes("b.textContent='—'"),'invalid placement must neutralize field/post/junction material counts instead of leaving the previous valid geometry');

ok(gate.includes('function matByLabel(label)')&&gate.includes("function setMaterial(label,text)"),'gate pricing must own the gate/wicket lines in the material summary');
ok(gate.includes("setMaterial('vjezdová brána',g.label)")&&gate.includes("setMaterial('branka',d.label)"),'verified gate and wicket products must appear in the material summary');
ok(gate.includes("setMaterial('vjezdová brána','individuálně')")&&gate.includes("setMaterial('branka','individuálně')"),'unsupported gate/wicket choices must stay explicitly individual in the material summary');
ok(gate.includes("setMaterial('vjezdová brána','—');setMaterial('branka','—')"),'invalid or pending opening transitions must clear stale material products');
ok(gate.includes('function resetPending()')&&gate.includes("note='přepočítávám podle nové konfigurace'")&&gate.includes("publish({type:type(),pending:true,gate:null,door:null})"),'gate and wicket rows must be neutralized immediately before a new type configuration is priced');
ok(gate.includes("document.addEventListener('plotao:options-reset',resetPending)"),'gate pricing must use the immediate pending reset on type-option changes');
ok(drive.includes("function materialRow(){return $$('#materialList .matline')")&&drive.includes("function setMaterial(text)"),'gate drive pricing must own a dedicated material summary line');
ok(drive.includes('setMaterial(d.name)'),'a verified automatic drive must expose its exact NICE kit in the material summary');
ok(drive.includes("setMaterial('individuálně')"),'unsupported active drive selection must stay explicitly individual in the material summary');
ok(drive.includes("setMaterial('—')"),'inactive, invalid or pending drive states must clear any previous material kit');
ok(drive.includes('function resetPending()')&&drive.includes("'přepočítávám pohon podle nové konfigurace'")&&drive.includes("publish({active:false,pending:true,unsupported:true,price:0})"),'gate drive row must drop the previous kit price while the new configuration is pending');
ok(drive.includes("document.addEventListener('plotao:options-reset',resetPending)"),'gate drive pricing must use the immediate pending reset on type-option changes');

ok(/window\.PLOTAO_EXTRA\s*=\s*null\s*;\s*document\.dispatchEvent\(new CustomEvent\('plotao:extra',\s*\{detail:null\}\)\)/.test(extraConfig),'leaving masonry/mobile/other must clear the stale extra-fence configuration global');
ok(extraConfig.includes("document.addEventListener('plotao:options-reset',render)"),'extra fence configuration must publish the newly selected type synchronously on option reset');
ok(/b\.style\.display\s*=\s*'none'\s*;\s*b\.innerHTML\s*=\s*''\s*;\s*publish\(t\)\s*;\s*return/.test(extraConfig),'hidden extra configuration must also clear its stale DOM content');
ok(extraPrice.includes('function resetPending()')&&extraPrice.includes('clearBox(b);publish(null);schedule(0)'),'extra fence pricing must clear its stale box and global before recomputing the new type');
ok(extraPrice.includes("document.addEventListener('plotao:options-reset',resetPending)"),'extra fence pricing must reset immediately on type-option changes');
ok(extraPrice.includes("if(!['masonry','mobile','other'].includes(t)){clearBox(b);publish(null);return}"),'extra fence price state must stay cleared outside its supported types');

ok(privacyConfig.includes("if(type()!=='privacy'){window.PLOTAO_PRIVACY=null")&&privacyConfig.includes("document.addEventListener('plotao:options-reset',sync)"),'privacy config must clear its active global outside privacy and switch synchronously');
ok(concreteConfig.includes("if(type()!=='concrete'){window.PLOTAO_CONCRETE=null")&&concreteConfig.includes("document.addEventListener('plotao:options-reset',sync)"),'concrete config must clear its active global outside concrete and switch synchronously');
ok(metalConfig.includes("if(type()!=='metal'){window.PLOTAO_METAL=null")&&metalConfig.includes("document.addEventListener('plotao:options-reset',sync)"),'metal config must clear its active global outside metal and switch synchronously');
ok(aluminiumConfig.includes("if(selectedType()!=='aluminium'){window.PLOTAO_ALUMINIUM=null")&&aluminiumConfig.includes("document.addEventListener('plotao:options-reset',()=>sync(false))"),'aluminium config must clear its active global outside aluminium and switch synchronously');
ok(gabionOptions.includes("const state={width:'0.30',stone:'quarry'}")&&gabionOptions.includes("document.addEventListener('plotao:options-reset',ensure)"),'gabion options must preserve user choices while switching synchronously');
ok(gabionOptions.includes("if(!selected()){if(b){b.style.display='none';b.innerHTML=''}return}"),'gabion options must remove stale visible content outside gabion');

const pricePos=manifest.indexOf('/assets/price-bridge.js'),mobilePos=manifest.indexOf('/assets/mobile-price-bridge.js');
ok(pricePos>=0&&mobilePos>pricePos,'mobile bridge must load after the generic price bridge so ownership handoff is deterministic');

if(fail.length){console.error('Result row state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Result row state checks OK: material geometry, openings and drive summary, price ownership and custom configuration states cannot leak across transitions');
