import fs from 'node:fs';
const src=fs.readFileSync('assets/input-validity-guard-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("function issueElement(s){if(s?.field)return $('#'+s.field);if(s?.code==='height')return $('#height')"),'shared validity must route invalid height to the height input');
ok(src.includes("if(s?.code==='segment-length')return $$('#segmentList input[type=number]').find(x=>+(x.value||0)<.01)||null"),'shared validity must route sub-0.01m/empty segment length to the actual invalid length input');
ok(src.includes("if(s?.code==='segments-total')return $$('#segmentList input[type=number]').at(-1)||null"),'over-1000m validity must route to an actionable segment length input');
ok(src.includes("el.setAttribute('aria-invalid','true')"),'the routed invalid input must expose aria-invalid');
ok(src.includes("s.code==='segments-total'&&$('#segmentLimitStatus')")&&src.includes("el.setAttribute('aria-describedby','segmentLimitStatus')"),'over-1000m input must be linked to the local total-length explanation');
ok(src.includes("function recover(){clearInvalidField();"),'validity recovery must remove field-level invalid state');
if(fail.length){console.error('Input field accessibility checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Input field accessibility checks OK: height, segment minimum and total-length errors mark actionable controls');
