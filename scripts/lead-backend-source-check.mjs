import fs from 'node:fs';
import { validateEnvelope } from '../supabase/functions/submit-lead/validation.mjs';

const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const baseLead={schemaVersion:2,mode:'lead',name:'Jan Novák',phone:'+420 777 123 456',email:'JAN@EXAMPLE.CZ',place:'',note:'',fenceType:'Panelový plot',height:153,segments:[{name:'Úsek 1',length:20,connection:'začátek'}],options:['3D panel'],gate:false,gateType:'',gateWidth:0,gateDrive:'',gateSection:0,gatePos:0,wicket:false,wicketWidth:0,wicketSection:0,wicketPos:0,scopeValue:'material',scope:'Materiál',displayedPrice:'30 000 Kč',priceKind:'ověřená cena',priceReason:'',placeFromCalculator:''};
const env=lead=>({transportVersion:1,source:'plotao.cz',submittedAt:'2026-09-12T20:30:00.000Z',lead});

let r=validateEnvelope(env(baseLead));
ok(r.ok===true,'valid material lead must pass');
ok(r.ok&&r.lead.email==='jan@example.cz'&&r.lead.phone==='+420777123456','contact normalization must be deterministic');
r=validateEnvelope(env({...baseLead,scopeValue:'delivery',place:''}));
ok(r.ok===false&&r.errors.includes('place'),'delivery lead must require place');
r=validateEnvelope(env({...baseLead,priceKind:'neplatné zadání'}));
ok(r.ok===false&&r.errors.includes('priceKind'),'invalid price state must be rejected');
r=validateEnvelope(env({...baseLead,segments:Array.from({length:13},(_,i)=>({name:'Úsek '+(i+1),length:1,connection:i?'navazuje rohem':'začátek'}))}));
ok(r.ok===false&&r.errors.includes('segments'),'backend must reject more than 12 customer fence segments');
r=validateEnvelope(env({...baseLead,segments:[{name:'A',length:600,connection:'začátek'},{name:'B',length:500,connection:'samostatný úsek'}]}));
ok(r.ok===false&&r.errors.includes('segments'),'backend must reject total fence length over 1000m');
r=validateEnvelope(env({...baseLead,gate:true,gateWidth:4,gateSection:0,gatePos:17}));
ok(r.ok===false&&r.errors.includes('gatePlacement'),'backend must reject a gate extending past its selected section');
r=validateEnvelope(env({...baseLead,gate:true,gateWidth:4,gateSection:0,gatePos:8,wicket:true,wicketWidth:1,wicketSection:0,wicketPos:10}));
ok(r.ok===false&&r.errors.includes('openingsOverlap'),'backend must reject overlapping gate and wicket even if both fit individually');
r=validateEnvelope(env({...baseLead,gate:true,gateWidth:4,gateSection:0,gatePos:8,wicket:true,wicketWidth:1,wicketSection:0,wicketPos:12}));
ok(r.ok===true,'adjacent non-overlapping gate and wicket must remain valid');
r=validateEnvelope(env({schemaVersion:2,mode:'help',name:'Jan Novák',phone:'777123456',email:'jan@example.cz',place:'',note:'Potřebuji poradit s výškou.'}));
ok(r.ok===true&&r.lead.mode==='help'&&!('fenceType' in r.lead),'help must not acquire fence payload');
r=validateEnvelope(env({schemaVersion:2,mode:'partner',name:'Firma Plot',phone:'777123456',email:'firma@example.cz',place:'Zlínský kraj',note:'Montujeme panely.'}));
ok(r.ok===true&&r.lead.mode==='partner'&&!('fenceType' in r.lead),'partner must not acquire customer fence payload');
r=validateEnvelope(env({schemaVersion:2,mode:'help',name:'A'.repeat(121),phone:'777123456',email:'jan@example.cz',place:'',note:'Dost dlouhý dotaz'}));
ok(r.ok===false&&r.errors.includes('name'),'oversized text must be rejected rather than silently truncated');

const validation=fs.readFileSync('supabase/functions/submit-lead/validation.mjs','utf8');
const index=fs.readFileSync('supabase/functions/submit-lead/index.ts','utf8');
const sql=fs.readFileSync('supabase/schema/plotao-leads.sql','utf8');
const config=fs.readFileSync('supabase/config.toml','utf8');
const browserConfig=fs.readFileSync('assets/lead-transport-config-v1.js','utf8');
const deno=JSON.parse(fs.readFileSync('supabase/functions/submit-lead/deno.json','utf8'));

ok(validation.includes('v.length<1||v.length>12')&&validation.includes('if(total>1000+.001)return null'),'server validation must mirror calculator segment count and total-length boundaries');
ok(validation.includes('function validateOpening(')&&validation.includes("errors.push('openingsOverlap')"),'server validation must independently enforce opening placement and non-overlap');
ok(validation.includes('const integer=')&&validation.includes("gateSection=integer(l.gateSection,0,11,-1)")&&validation.includes("wicketSection=integer(l.wicketSection,0,11,-1)"),'opening section indexes must be bounded integers, not arbitrary numeric values');
ok(index.includes("const ALLOWED_ORIGIN = 'https://plotao.cz'"),'Edge Function must pin production origin');
ok(!index.includes("Access-Control-Allow-Origin': '*'"),'Edge Function must never use wildcard CORS');
ok(index.includes("{ auth: 'none', cors: 'disabled' }")&&config.includes('[functions.submit-lead]')&&config.includes('verify_jwt = false'),'public form function must use explicit custom security with verify_jwt=false');
ok(index.includes('MAX_BODY_BYTES = 64 * 1024')&&index.includes('readBodyLimited'),'request body size limit must be enforced before JSON parsing');
ok(index.includes("Deno.env.get('PLOTAO_RATE_SALT')")&&index.includes("crypto.subtle.digest('SHA-256'")&&index.includes('RATE_LIMIT = 8'),'salted hash rate limiting must be present');
ok(!index.includes('SUPABASE_SERVICE_ROLE_KEY')&&!index.includes('SUPABASE_SECRET_KEYS'),'backend source must not read or embed privileged keys directly');
ok(index.includes('ctx.supabaseAdmin')&&index.includes(".from('plotao_leads')"),'Edge Function must store through the server admin client');
ok(sql.includes('alter table public.plotao_leads enable row level security')&&sql.includes('revoke all on table public.plotao_leads from anon, authenticated'),'lead table must enable RLS and revoke browser-role grants');
ok(sql.includes('grant select, insert, update on table public.plotao_leads to service_role'),'server role must have only required lead-table operations');
ok(sql.includes('Raw IP addresses are never stored'),'rate-limit schema must document no raw IP retention');
ok(deno.imports?.['@supabase/server']==='npm:@supabase/server@1.6.0','Supabase server dependency must be exactly pinned');
ok(browserConfig.includes('enabled:false')&&browserConfig.includes("endpoint:''")&&browserConfig.includes('allowedOrigins:[]'),'production browser transport must remain explicitly disabled before verified backend activation');

if(fail.length){console.error('Lead backend source checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead backend source checks OK: geometry validation, RLS, exact CORS, body limits, rate limiting, pinned dependency and disabled browser activation are protected');
