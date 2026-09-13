import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const privacy=read('assets/privacy-pricing.js'),extra=read('assets/extra-fence-pricing.js'),geometry=read('assets/geometry-v3.js'),lead=read('assets/lead-safety-v1.js');

for(const [name,src] of [['privacy',privacy],['extra',extra]]){
  ok(src.includes("function placement(kind,key,selector){const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[key];return Number.isFinite(Number(v))?Number(v):+($(selector)?.value||0)}"),`${name} run splitter must prefer authoritative PLOTAO_PLACEMENT and use DOM only as fallback`);
  ok(src.includes("s:placement('gate','section','#gateSection')")&&src.includes("p:placement('gate','pos','#gatePos')"),`${name} gate run splitting must use authoritative gate section/position`);
  ok(src.includes("s:placement('door','section','#doorSection')")&&src.includes("p:placement('door','pos','#doorPos')"),`${name} wicket run splitting must use authoritative wicket section/position`);
}
ok(geometry.includes("window.PLOTAO_PLACEMENT?.[kind]?.[key]")||geometry.includes("const p=window.PLOTAO_PLACEMENT?.[kind]"),'geometry adapter must keep authoritative opening placement');
ok(lead.includes("const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[keyName]"),'lead snapshot must keep authoritative opening placement');

if(fail.length){console.error('Run placement integrity checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Run placement integrity checks OK: geometry, privacy, extra-fence pricing and lead snapshots share authoritative opening placement');
