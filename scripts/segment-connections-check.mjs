import fs from 'node:fs';
const src=fs.readFileSync('assets/segment-connections-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("function expose(){window.PLOTAO_SEGMENT_CONNECTIONS=[...links]}"),'connection module must expose its adjusted authoritative state without forcing an event');
ok(src.includes("addEventListener('change',e=>{links[i]=e.target.checked;render()})"),'connection toggle must delegate to render() and emit one authoritative update');
ok(!src.includes("links[i]=e.target.checked;render();publish()"),'connection toggle must not publish a duplicate plotao:segment-connections event after render()');
ok(src.includes("if(i>0&&i<links.length)links[i]=false"),'removing a middle section must reset the newly adjacent section to separate instead of assuming a physical corner connection');
ok(src.includes("links.splice(i,1)")&&src.includes("if(links.length)links[0]=false"),'section removal must keep connection indices aligned and the first section permanently disconnected from any predecessor');
ok(src.includes("if(i>0&&i<links.length)links[i]=false;expose()}schedule(60)"),'adjusted connection indices must be visible synchronously to calculator-v3 before the delayed visual rerender');
ok(src.includes("const add=e.target.closest('#addSegment');if(add){const count=$$('#segmentList .segment').length;if(count<12)"),'add-section capture path must respect the same 12-section UI limit before exposing provisional topology');
ok(src.includes("links=links.slice(0,count);links.push(true);if(links.length)links[0]=false;expose()}schedule(60)"),'new section must be exposed synchronously as connected-by-corner before downstream click handlers can recalculate geometry');
ok(src.includes("expose();document.dispatchEvent(new CustomEvent('plotao:segment-connections'"),'the single authoritative connection event must still be emitted by publish() after DOM and topology settle');
ok(!src.includes("links.push(true);publish()"),'provisional add-section topology must not emit a duplicate event before the DOM contains the new section');
if(fail.length){console.error('Segment connection checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment connection checks OK: add/remove topology is exposed synchronously while authoritative events still emit once after render');
