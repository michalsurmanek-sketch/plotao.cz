import fs from 'node:fs';
import {activeScripts} from './pages-manifest.mjs';

// Re-reviewed baseline: 61 modules including the existing header branding module.
// Guide scripts load only on the guide page; the homepage adds no new requests.
const MAX_SCRIPT_COUNT=61;
const MAX_TOTAL_BYTES=327*1024;
const MAX_SINGLE_BYTES=16*1024;
const fail=[];
const ok=(value,message)=>{if(!value)fail.push(message)};

const scripts=activeScripts.map(src=>{
  const file=src.replace(/^\//,'');
  ok(fs.existsSync(file),`performance budget references missing script: ${file}`);
  return{src,file,bytes:fs.existsSync(file)?fs.statSync(file).size:0};
});
const total=scripts.reduce((sum,item)=>sum+item.bytes,0);
const largest=[...scripts].sort((a,b)=>b.bytes-a.bytes)[0]||{src:'<none>',bytes:0};

ok(scripts.length<=MAX_SCRIPT_COUNT,`homepage script count ${scripts.length} exceeds budget ${MAX_SCRIPT_COUNT}`);
ok(total<=MAX_TOTAL_BYTES,`homepage JavaScript source size ${total} bytes exceeds budget ${MAX_TOTAL_BYTES}`);
for(const item of scripts)ok(item.bytes<=MAX_SINGLE_BYTES,`${item.src} is ${item.bytes} bytes and exceeds per-script budget ${MAX_SINGLE_BYTES}`);

if(fail.length){
  console.error('Performance budget checks failed:\n- '+fail.join('\n- '));
  process.exit(1);
}
console.log(`Performance budget OK: ${scripts.length}/${MAX_SCRIPT_COUNT} homepage scripts, ${total}/${MAX_TOTAL_BYTES} source bytes; largest ${largest.src} ${largest.bytes}/${MAX_SINGLE_BYTES} bytes`);
