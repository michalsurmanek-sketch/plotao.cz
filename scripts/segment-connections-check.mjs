import fs from 'node:fs';
const src=fs.readFileSync('assets/segment-connections-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("addEventListener('change',e=>{links[i]=e.target.checked;render()})"),'connection toggle must delegate to render() and emit one authoritative update');
ok(!src.includes("links[i]=e.target.checked;render();publish()"),'connection toggle must not publish a duplicate plotao:segment-connections event after render()');
ok(src.includes("if(i>0&&i<links.length)links[i]=false"),'removing a middle section must reset the newly adjacent section to separate instead of assuming a physical corner connection');
ok(src.includes("links.splice(i,1)")&&src.includes("if(links.length)links[0]=false"),'section removal must keep connection indices aligned and the first section permanently disconnected from any predecessor');
if(fail.length){console.error('Segment connection checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment connection checks OK: one event per toggle and safe topology after section removal');
