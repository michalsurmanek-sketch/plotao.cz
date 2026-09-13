import fs from 'node:fs';
const src=fs.readFileSync('assets/ui-bootstrap-v1.js','utf8'),lead=fs.readFileSync('assets/lead-core-v1.js','utf8'),server=fs.readFileSync('supabase/functions/submit-lead/validation.mjs','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("if(length)length.oninput=()=>{state.segments[i].length=length.value}"),'segment editor must preserve the exact user-entered length in UI state, including temporary invalid values');
ok(!src.includes("state.segments[i].length=Math.max(.5,+length.value||.5)"),'segment editor must not silently coerce invalid edits before the user fixes them');
ok(src.includes('min="0.01" max="1000" step="0.01"'),'segment editor HTML constraints must expose the canonical 0.01–1000m range');
ok(src.includes('maxlength="100" aria-label="Název úseku"'),'segment editor must enforce the same 100-character section-name limit as the backend');
ok(lead.includes("name:text(x?.name,100)||('Úsek '+(i+1))"),'lead normalization must use the same 100-character section-name bound');
ok(server.includes('tooLong(x.name,100)')&&server.includes('name:text(x.name||`Úsek ${i+1}`,100)'),'server must enforce and normalize the same 100-character section-name bound');
ok(src.includes("aria-label=\"Odebrat úsek '+(i+1)+'\""),'every remove button must identify the section it removes to assistive technology');
ok(src.includes('function esc(v){return String(v).replace(')&&src.includes('&amp;')&&src.includes('&lt;')&&src.includes('&gt;')&&src.includes('&quot;'),'segment names must keep HTML attribute escaping, including quotation marks, across rerenders');
ok(src.includes("function focusAfterRemove(index){const buttons=$$('#segmentList [data-remove]'),near=buttons[Math.min(index,buttons.length-1)],target=near&&!near.disabled?near:$('#addSegment')"),'segment removal must choose the nearest surviving remove action and fall back to Add Segment when only one section remains');
ok(src.includes("target.focus({preventScroll:true})")&&src.includes("renderSegments();focusAfterRemove(index)"),'segment removal must restore keyboard focus without forcing an extra page scroll');
if(fail.length){console.error('Segment edit state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment edit state checks OK: raw lengths, bounded safe names and keyboard focus survive segment rerenders');
