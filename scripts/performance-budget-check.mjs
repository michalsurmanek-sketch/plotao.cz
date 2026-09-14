import fs from 'node:fs';
import {activeScripts} from './pages-manifest.mjs';

// Keep the homepage calculator from growing silently. These limits leave modest
// headroom above the measured baseline (59 scripts / 254002 bytes / 11835-byte
// largest module) while forcing an explicit review before meaningful growth.
const MAX_SCRIPT_COUNT=59;
const MAX_TOTAL_BYTES=280*1024;
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
