import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/lead-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const base={mode:'lead',name:' Jan Novák ',phone:'+420 777 123 456',email:'JAN.NOVAK@EXAMPLE.CZ',place:' Uherské Hradiště ',note:' Prosím zavolat. ',fenceType:'Panelový plot',height:153,segments:[{name:'Předek',length:20,connection:'začátek'},{name:'Bok',length:17,connection:'navazuje rohem'}],options:['3D','Zelená'],gate:false,gateType:'double',gateWidth:4,gateDrive:'none',gateSection:0,gatePos:0,wicket:false,wicketWidth:1,wicketSection:0,wicketPos:0,scopeValue:'material',scope:'Materiál',displayedPrice:'42 000 Kč',priceKind:'ověřená cena',priceReason:'',placeFromCalculator:'Uherské Hradiště'};
const adapter=fs.readFileSync('assets/lead-safety-v1.js','utf8');
ok(adapter.includes('PLOTAO_LEAD_CORE')&&adapter.includes('normalizeLead')&&adapter.includes('validateLead')&&adapter.includes('core.toText'),'lead browser adapter must delegate payload normalization, validation and text export to shared core');
ok(adapter.includes('PLOTAO_SEGMENT_CONNECTIONS'),'lead browser adapter must preserve segment connectivity in snapshots');
ok(adapter.includes("mode:form.dataset.mode||'lead'")&&adapter.includes("scopeValue:scopeBtn?.dataset.v||'material'"),'browser snapshot must preserve modal mode and stable scope value');

let d=core.normalizeLead(base,'2026-09-12T20:00:00.000Z');
ok(d.schemaVersion===2,'lead payload schema version must reflect mode-aware schema');
ok(d.mode==='lead'&&d.scopeValue==='material','normalized payload must preserve stable lead mode and scope value');
ok(d.name==='Jan Novák'&&d.phone==='+420777123456'&&d.email==='jan.novak@example.cz','contact fields must normalize whitespace, phone punctuation and email case');
ok(d.place==='Uherské Hradiště'&&d.note==='Prosím zavolat.','place and note must be trimmed');
ok(d.segments.length===2&&d.segments[1].connection==='navazuje rohem','segment connectivity must survive normalization');

let v=core.validateLead(d);
ok(v.valid===true&&v.errors.length===0,'complete ordinary material lead must validate');

v=core.validateLead({...base,phone:'1234'});
ok(v.valid===false&&v.errors.some(e=>e.code==='phone'),'short phone must be rejected');
v=core.validateLead({...base,email:'jan@localhost'});
ok(v.valid===false&&v.errors.some(e=>e.code==='email'),'email without public domain suffix must be rejected');
v=core.validateLead({...base,name:'J'});
ok(v.valid===false&&v.errors.some(e=>e.code==='name'),'one-character name must be rejected');
v=core.validateLead({...base,segments:[{name:'Předek',length:0,connection:'začátek'}]});
ok(v.valid===false&&v.errors.some(e=>e.code==='segments'),'customer lead must contain at least one positive fence segment');
v=core.validateLead({...base,priceKind:'neplatné zadání'});
ok(v.valid===false&&v.errors.some(e=>e.code==='invalid-price'),'invalid calculator state must block customer lead preparation');

v=core.validateLead({...base,scopeValue:'delivery',scope:'S dopravou',place:'',placeFromCalculator:''});
ok(v.valid===false&&v.errors.some(e=>e.code==='place-required'),'delivery lead without municipality/ZIP must be rejected');
v=core.validateLead({...base,scopeValue:'turnkey',scope:'Na klíč',place:'',placeFromCalculator:''});
ok(v.valid===false&&v.errors.some(e=>e.code==='place-required'),'turnkey lead without municipality/ZIP must be rejected');
v=core.validateLead({...base,scopeValue:'material',scope:'Materiál',place:'',placeFromCalculator:''});
ok(v.valid===true,'material-only customer lead may omit realization place');

v=core.validateLead({...base,gate:true,gateWidth:4,gateSection:0,gatePos:16});
ok(v.valid===true,'4m gate ending exactly at 20m segment boundary must validate');
v=core.validateLead({...base,gate:true,gateWidth:4,gateSection:0,gatePos:16.1});
ok(v.valid===false&&v.errors.some(e=>e.code==='gate-placement'),'gate extending beyond its segment must be rejected');
v=core.validateLead({...base,wicket:true,wicketWidth:1,wicketSection:1,wicketPos:16.2});
ok(v.valid===false&&v.errors.some(e=>e.code==='wicket-placement'),'wicket extending beyond its segment must be rejected');
v=core.validateLead({...base,gate:true,gateWidth:4,gateSection:99,gatePos:1});
ok(v.valid===false&&v.errors.some(e=>e.code==='gate-placement'||e.code==='gate-section'),'out-of-range gate section must not create a silently valid customer lead');

// Help mode needs valid contact, but must not be blocked by an unfinished calculator configuration.
v=core.validateLead({...base,mode:'help',fenceType:'',height:0,segments:[],priceKind:'neplatné zadání',gate:true,gateSection:99,place:''});
ok(v.valid===true,'help request with valid contact must not require a completed fence calculation');
v=core.validateLead({...base,mode:'help',phone:'1234',fenceType:'',height:0,segments:[]});
ok(v.valid===false&&v.errors.some(e=>e.code==='phone'),'help mode must still validate contact information');

// Partner mode is a contractor/company contact, not a customer fence quote.
v=core.validateLead({...base,mode:'partner',place:'Zlínský kraj',fenceType:'',height:0,segments:[],priceKind:'neplatné zadání',gate:true,gateSection:99});
ok(v.valid===true,'partner request must ignore customer fence geometry and price state');
v=core.validateLead({...base,mode:'partner',place:'',placeFromCalculator:'',fenceType:'',height:0,segments:[]});
ok(v.valid===false&&v.errors.some(e=>e.code==='partner-area'),'partner request must require an area of operation');

const weird=core.normalizeLead({...base,segments:[{name:' A   B ',length:5000,connection:'začátek'},{name:'C',length:-4,connection:'nonsense'}],options:['3D','3D','  Zelená  ']});
ok(weird.segments[0].name==='A B'&&weird.segments[0].length===1000,'segment name must collapse whitespace and length must clamp to calculator maximum');
ok(weird.segments[1].length===0&&weird.segments[1].connection==='navazuje rohem','negative segment and unknown connection must normalize safely');
ok(weird.options.length===2&&weird.options[1]==='Zelená','lead options must be trimmed and deduplicated');

const out=core.toText({...base,gate:true,gateWidth:4,gateSection:0,gatePos:8,gateDrive:'auto'});
ok(out.includes('PLOTAO.CZ – podklady poptávky')&&out.includes('+420777123456')&&out.includes('Panelový plot')&&out.includes('Brána: double · 4 m · auto · úsek 1 · pozice 8 m'),'customer clipboard export must use normalized customer payload');
ok(out.includes('Předek 20 m')&&out.includes('Bok 17 m · navazuje rohem'),'customer clipboard export must preserve all normalized fence sections');
const helpOut=core.toText({...base,mode:'help'});
ok(helpOut.startsWith('PLOTAO.CZ – žádost o radu'),'help export must be clearly identified as help, not a quote lead');
const partnerOut=core.toText({...base,mode:'partner',place:'Zlínský kraj',fenceType:'',segments:[]});
ok(partnerOut.startsWith('PLOTAO.CZ – zájem montážní firmy')&&partnerOut.includes('Oblast působnosti: Zlínský kraj')&&!partnerOut.includes('Plot:'),'partner export must not masquerade as a customer fence calculation');

if(fail.length){console.error('Lead scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead scenario checks OK: customer, help and partner modes plus contact/geometry validation are protected');
