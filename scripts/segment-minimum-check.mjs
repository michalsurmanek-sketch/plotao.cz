import fs from 'node:fs';
import {createRequire} from 'node:module';
import {validateEnvelope} from '../supabase/functions/submit-lead/validation.mjs';
const require=createRequire(import.meta.url),core=require('../assets/lead-core-v1.js');
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const ui=read('assets/ui-bootstrap-v1.js'),guard=read('assets/input-validity-guard-v1.js'),accuracy=read('assets/accuracy-guard.js'),mobile=read('assets/mobile-summary-state-v1.js'),lead=read('assets/lead-safety-v1.js'),server=read('supabase/functions/submit-lead/validation.mjs');

ok(ui.includes('min="0.01" max="1000" step="0.01"'),'segment number input must expose the same 0.01m minimum used by validation');
ok(guard.includes("const bad=ss.findIndex(x=>x<.01)")&&guard.includes("find(x=>+(x.value||0)<.01)"),'shared realtime validity must reject and focus sub-0.01m sections');
ok(accuracy.includes("bad=lens.findIndex(x=>x<.01)")&&accuracy.includes("const empty=lens.findIndex(x=>x<.01)"),'main accuracy guard and startup fallback must enforce the same segment minimum');
ok(mobile.includes("find(x=>+(x.value||0)<.01)"),'mobile repair routing must target the actual sub-minimum section');
ok(lead.includes("if(ss.some(x=>x.length<.01))return'Každý úsek musí mít délku alespoň 0,01 m.'")&&lead.includes("find(x=>+(x.value||0)<.01)"),'lead snapshot and error focus must enforce the same segment minimum');
ok(server.includes('const length=num(x.length,.01,1000,-1)'),'server envelope validation must keep the 0.01m lower bound');

const base={mode:'lead',name:'Jan Novák',phone:'777123456',email:'jan@example.cz',place:'',note:'',fenceType:'Panelový plot',height:153,segments:[{name:'Úsek 1',length:1,connection:'začátek'}],options:['3D'],gate:false,gateType:'double',gateWidth:4,gateDrive:'none',gateSection:0,gatePos:0,wicket:false,wicketWidth:1,wicketSection:0,wicketPos:0,scopeValue:'material',scope:'Materiál',displayedPrice:'100 Kč',priceKind:'ověřená cena',priceReason:'',placeFromCalculator:''};
let r=core.validateLead({...base,segments:[{name:'Úsek 1',length:.005,connection:'začátek'}]});
ok(r.valid===false&&r.errors.some(e=>e.code==='segment-length'),'lead core must reject a 0.005m section');
r=core.validateLead({...base,segments:[{name:'Úsek 1',length:.01,connection:'začátek'}]});
ok(r.valid===true,'lead core must accept a section exactly at 0.01m');
const env=leadData=>({transportVersion:1,source:'plotao.cz',submittedAt:'2026-09-13T12:00:00.000Z',lead:{schemaVersion:2,...leadData}});
let s=validateEnvelope(env({...base,segments:[{name:'Úsek 1',length:.005,connection:'začátek'}]}));
ok(s.ok===false&&s.errors.includes('segments'),'server must reject a 0.005m section');
s=validateEnvelope(env({...base,segments:[{name:'Úsek 1',length:.01,connection:'začátek'}]}));
ok(s.ok===true,'server must accept a section exactly at 0.01m');

if(fail.length){console.error('Segment minimum checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Segment minimum checks OK: UI, pricing, lead and server all use the same 0.01m lower bound');
