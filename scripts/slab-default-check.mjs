import fs from 'node:fs';
const src=fs.readFileSync('assets/options-router-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const meshSize=src.indexOf("optionalDefault('[data-mbs]','300x20')"),meshToggle=src.indexOf("optionalDefault('[data-mb]','without')");
const panelSize=src.indexOf("optionalDefault('[data-pbs]','250x20')"),panelToggle=src.indexOf("optionalDefault('[data-pb]','without')");
ok(meshSize>=0&&meshToggle>meshSize,'mesh first-use state must set the 3m slab size before hiding the optional slab controls');
ok(panelSize>=0&&panelToggle>panelSize,'panel first-use state must set the 2.5m slab size before hiding the optional slab controls');
ok(src.includes('defaultsDone.add(t)'),'first-use slab defaults must run only once per fence type and preserve later user choices');
if(fail.length){console.error('Slab default checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Slab default checks OK: panel starts with 2.5m slab preset, mesh with 3m preset, both optional slabs disabled');
