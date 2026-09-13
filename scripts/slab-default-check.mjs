import fs from 'node:fs';
const src=fs.readFileSync('assets/options-router-v1.js','utf8'),ui=fs.readFileSync('assets/ui-bootstrap-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const meshSize=src.indexOf("optionalDefault('[data-mbs]','300x20')"),meshToggle=src.indexOf("optionalDefault('[data-mb]','without')");
const panelSize=src.indexOf("optionalDefault('[data-pbs]','250x20')"),panelToggle=src.indexOf("optionalDefault('[data-pb]','without')");
ok(meshSize>=0&&meshToggle>meshSize,'mesh first-use state must set the 3m slab size before hiding the optional slab controls');
ok(panelSize>=0&&panelToggle>panelSize,'panel first-use state must set the 2.5m slab size before hiding the optional slab controls');
ok(src.includes('defaultsDone.add(t)'),'first-use slab defaults must run only once per fence type and preserve later user choices');
ok(ui.includes("panelBase:'without',panelBaseSize:'250x20'"),'initial panel UI must already start without a slab and retain the 2.5m preset, avoiding first-paint correction');
ok(ui.includes("meshBase:'without',meshBaseSize:'300x20'"),'initial mesh UI must already start without a slab and retain the 3m preset, avoiding first-paint correction');
ok(!ui.includes("panelBase:'with'")&&!ui.includes("meshBase:'with'"),'UI bootstrap must not render optional slabs enabled before the safety router runs');
if(fail.length){console.error('Slab default checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Slab default checks OK: source UI and router both start panel with 2.5m preset, mesh with 3m preset, and optional slabs disabled');
