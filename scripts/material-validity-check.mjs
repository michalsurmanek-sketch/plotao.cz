import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const slab=read('assets/slab-pricing-v2.js'),concrete=read('assets/concrete-material-v1.js');

ok(slab.includes("function placement(kind,key,selector){const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[key];return Number.isFinite(Number(v))?Number(v):+($(selector)?.value||0)}"),'slab runs must prefer authoritative PLOTAO_PLACEMENT state');
ok(slab.includes("s:placement('gate','section','#gateSection')")&&slab.includes("p:placement('gate','pos','#gatePos')")&&slab.includes("s:placement('door','section','#doorSection')")&&slab.includes("p:placement('door','pos','#doorPos')"),'slab gate/wicket runs must use authoritative section and position values');
ok(slab.includes("if(h<40||h>400)return'opravte výšku plotu'")&&slab.includes("if(ss.length>12)return'maximálně 12 úseků'")&&slab.includes("if(ss.some(x=>x.len<=0))return'opravte délku úseku'")&&slab.includes("if(ss.reduce((sum,x)=>sum+x.len,0)>1000+.001)return'maximálně 1000 m celkem'"),'slab pricing must share calculator height, section-count, positive-length and 1000m limits');
ok(slab.includes("if(window.PLOTAO_PLACEMENT?.valid===false)return'opravte umístění brány/branky'"),'slab pricing must reject invalid opening placement');
ok(slab.includes("window.PLOTAO_SLAB_PRICE={invalid:true,reason:note}"),'invalid slab input must publish invalid state instead of retaining a precise slab total');
ok(slab.includes("document.addEventListener('input',()=>schedule(0))")&&slab.includes("document.addEventListener('plotao:placement',()=>schedule(0))"),'slab invalidation must react immediately to typed input and authoritative placement changes');

ok(concrete.includes("function inputReason(){const h=+($('#height')?.value||0),ss=segments()"),'footing concrete must independently validate current calculator inputs');
ok(concrete.includes("if(h<40||h>400)return'opravte výšku plotu'")&&concrete.includes("if(ss.length>12)return'maximálně 12 úseků'")&&concrete.includes("if(ss.some(x=>x.len<=0))return'opravte délku úseku'")&&concrete.includes("if(ss.reduce((sum,x)=>sum+x.len,0)>1000+.001)return'maximálně 1000 m celkem'"),'footing concrete must share calculator height, section-count, positive-length and 1000m limits');
ok(concrete.includes("if(window.PLOTAO_PLACEMENT?.valid===false)return'opravte umístění brány/branky'"),'footing concrete must reject invalid opening placement');
ok(concrete.includes("function invalidState(b,note){clearVolume();setRow(null,note,'Nezapočítáno')")&&concrete.includes("publish({invalid:true,reason:note,price:0,volume:0})"),'invalid footing input must clear visible volume/price and publish a zero invalid state');
ok(concrete.includes("document.addEventListener('input',e=>{if(!e.target.closest('#concreteMaterialBox'))schedule(0)})"),'footing material must immediately invalidate when calculator inputs are typed');
ok(concrete.includes("document.addEventListener('plotao:placement',()=>schedule(0))"),'footing material must immediately invalidate when opening placement becomes invalid');

if(fail.length){console.error('Material validity checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Material validity checks OK: slab and footing details cannot retain precise values across invalid calculator input or stale opening placement');
