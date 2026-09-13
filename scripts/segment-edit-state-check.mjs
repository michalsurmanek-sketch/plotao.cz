import fs from 'node:fs';
const src=fs.readFileSync('assets/ui-bootstrap-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("if(length)length.oninput=()=>{state.segments[i].length=length.value}"),'segment editor must preserve the exact user-entered length in UI state, including temporary empty/zero invalid values');
ok(!src.includes("state.segments[i].length=Math.max(.5,+length.value||.5)"),'segment editor must not silently coerce invalid edits to 0.5m before the user fixes them');
if(fail.length){console.error('Segment edit state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment edit state checks OK: invalid/raw lengths survive rerenders until the user explicitly fixes them');
