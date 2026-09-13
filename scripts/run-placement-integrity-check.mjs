import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const privacy=read('assets/privacy-pricing.js'),extra=read('assets/extra-fence-pricing.js'),geometry=read('assets/geometry-v3.js'),calc=read('assets/calculator-v3.js'),lead=read('assets/lead-safety-v1.js');

for(const [name,src] of [['privacy',privacy],['extra',extra]]){
  ok(src.includes("function placement(kind,key,selector){const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[key];return Number.isFinite(Number(v))?Number(v):+($(selector)?.value||0)}"),`${name} run splitter must prefer authoritative PLOTAO_PLACEMENT and use DOM only as fallback`);
  ok(src.includes("s:placement('gate','section','#gateSection')")&&src.includes("p:placement('gate','pos','#gatePos')"),`${name} gate run splitting must use authoritative gate section/position`);
  ok(src.includes("s:placement('door','section','#doorSection')")&&src.includes("p:placement('door','pos','#doorPos')"),`${name} wicket run splitting must use authoritative wicket section/position`);
}
ok(geometry.includes("window.PLOTAO_PLACEMENT?.[kind]?.[key]")||geometry.includes("const p=window.PLOTAO_PLACEMENT?.[kind]"),'geometry adapter must keep authoritative opening placement');
ok(calc.includes('function normalize(kind,clampPos=true)')&&calc.includes('if(clampPos)placements[kind].pos=Math.min(maxPos(kind),placements[kind].pos)'),'calculator must separate section normalization from optional position clamping');
ok(calc.includes("normalize('gate',false);normalize('door',false)")&&calc.includes("normalize('gate',false);render()")&&calc.includes("normalize('door',false);render()"),'normal rendering and section selection must preserve the user-entered opening position even when it no longer fits');
ok(calc.includes("function adjustAfterRemove(index)")&&calc.includes('normalize(kind)}}'),'segment removal may still clamp an opening because its previous physical segment can cease to exist');
ok(calc.includes("placements.gate.pos=Math.max(0,+e.target.value||0);publish()")&&calc.includes("placements.door.pos=Math.max(0,+e.target.value||0);publish()"),'direct opening-position edits must publish authoritative placement synchronously');
ok(calc.includes("document.addEventListener('plotao:input-validity',e=>{if(e.detail?.issue?.code==='placement'||e.detail?.valid)publish()})"),'visual opening plan must hide/recover synchronously with shared placement validity');
ok(lead.includes("const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[keyName]"),'lead snapshot must keep authoritative opening placement');

if(fail.length){console.error('Run placement integrity checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Run placement integrity checks OK: explicit opening positions are preserved, published synchronously and only clamped when a segment is removed');
