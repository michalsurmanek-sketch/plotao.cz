import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/lead-transport-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const payload={schemaVersion:2,mode:'lead',name:'Jan Novák',phone:'+420777123456',email:'jan@example.cz',place:'Praha',note:'Test'};

ok(core.normalizeEndpoint('https://api.example.cz/leads')==='https://api.example.cz/leads','HTTPS endpoint must normalize');
ok(core.normalizeEndpoint('http://api.example.cz/leads')===null,'HTTP endpoint must be rejected');
ok(core.normalizeEndpoint('https://user:pass@api.example.cz/leads')===null,'credential-bearing endpoint must be rejected');
ok(core.normalizeEndpoint('https://api.example.cz/leads#secret')===null,'fragment-bearing endpoint must be rejected');
ok(core.normalizeOrigins(['https://api.example.cz/path','http://bad.example.cz']).length===1,'allowed origins must keep HTTPS origins only');

let r=core.prepare(payload,{endpoint:'https://api.example.cz/leads',allowedOrigins:['https://api.example.cz']},'2026-09-12T20:30:00.000Z');
ok(r.ok===true&&r.endpoint==='https://api.example.cz/leads','approved endpoint must prepare a request');
ok(r.request.method==='POST'&&r.request.credentials==='omit','lead delivery must use POST without browser credentials');
ok(r.request.headers['Content-Type']==='application/json'&&r.request.headers.Accept==='application/json','lead delivery must use explicit JSON headers');
const body=r.ok?JSON.parse(r.request.body):{};
ok(body.source==='plotao.cz'&&body.transportVersion===1&&body.submittedAt==='2026-09-12T20:30:00.000Z','transport envelope metadata must be stable');
ok(JSON.stringify(body.lead)===JSON.stringify(payload),'transport must carry the already validated/normalized lead content without rewriting it');

r=core.prepare(payload,{endpoint:'https://evil.example/leads',allowedOrigins:['https://api.example.cz']});
ok(r.ok===false&&r.code==='origin','endpoint outside the explicit allowlist must be blocked');
r=core.prepare(payload,{});
ok(r.ok===false&&r.code==='disabled','missing runtime endpoint must keep server delivery disabled');
r=core.prepare({...payload,schemaVersion:1},{endpoint:'https://api.example.cz/leads',allowedOrigins:['https://api.example.cz']});
ok(r.ok===false&&r.code==='payload','unexpected payload schema must be blocked before network access');

const adapter=fs.readFileSync('assets/lead-transport-v1.js','utf8'),safety=fs.readFileSync('assets/lead-safety-v1.js','utf8'),manifest=fs.readFileSync('scripts/pages-manifest.mjs','utf8'),index=fs.readFileSync('index.html','utf8');
ok(adapter.includes('core.prepare(payload,config())')&&adapter.includes('fetch(prepared.endpoint'),'browser transport must fetch only a core-approved endpoint');
ok(adapter.includes('new AbortController()')&&adapter.includes('setTimeout(()=>controller.abort(),10000)'),'browser transport must enforce a finite network timeout');
ok(!adapter.includes('credentials:\'include\'')&&!adapter.includes('credentials:"include"'),'browser transport must never opt into cookie credentials');
ok(safety.includes('function transportReady()')&&safety.includes("await copyDraft(result.data,b,'Odeslání se nepodařilo. Podklady nebyly ztraceny.')"),'form must preserve a safe copy fallback after delivery failure');
ok(safety.includes('sessionStorage.removeItem(key(result.data.mode))'),'only a successfully delivered mode draft may be cleared');
const corePos=manifest.indexOf('/assets/lead-transport-core-v1.js'),adapterPos=manifest.indexOf('/assets/lead-transport-v1.js'),safetyPos=manifest.indexOf('/assets/lead-safety-v1.js');
ok(corePos>=0&&corePos<adapterPos&&adapterPos<safetyPos,'production build must load transport core, then adapter, then form safety');
ok(!index.includes('PLOTAO_LEAD_TRANSPORT_CONFIG'),'production source must keep server delivery disabled until an approved backend config is deliberately added');

if(fail.length){console.error('Lead transport scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead transport scenario checks OK: HTTPS allowlist, disabled-by-default runtime, script order, timeout and fallback are protected');
