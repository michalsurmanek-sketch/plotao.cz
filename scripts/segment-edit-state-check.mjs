import fs from 'node:fs';
const src=fs.readFileSync('assets/ui-bootstrap-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("if(length)length.oninput=()=>{state.segments[i].length=length.value}"),'segment editor must preserve the exact user-entered length in UI state, including temporary invalid values');
ok(!src.includes("state.segments[i].length=Math.max(.5,+length.value||.5)"),'segment editor must not silently coerce invalid edits before the user fixes them');
ok(src.includes('min="0.01" max="1000" step="0.01"'),'segment editor HTML constraints must expose the canonical 0.01–1000m range');
ok(src.includes("aria-label=\"Odebrat úsek '+(i+1)+'\""),'every remove button must identify the section it removes to assistive technology');
ok(src.includes('function esc(v){return String(v).replace(')&&src.includes('&amp;')&&src.includes('&lt;')&&src.includes('&gt;')&&src.includes('&quot;'),'segment names must keep HTML attribute escaping, including quotation marks, across rerenders');
if(fail.length){console.error('Segment edit state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment edit state checks OK: raw lengths, accessible remove labels and safe segment-name rendering survive rerenders');
