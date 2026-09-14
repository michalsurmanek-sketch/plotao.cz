import fs from 'node:fs';

const file='index.html';
const html=fs.readFileSync(file,'utf8');
const cleaned=html
  .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ');
const fail=[];
const ok=(value,message)=>{if(!value)fail.push(message)};
const countTag=tag=>(cleaned.match(new RegExp(`<${tag}\\b`,'gi'))||[]).length;
const headings=[...cleaned.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match,index)=>({
  index,
  level:Number(match[1]),
  text:match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
}));
const counts=Object.fromEntries(Array.from({length:6},(_,i)=>[`h${i+1}`,headings.filter(h=>h.level===i+1).length]));

ok(counts.h1===1,`homepage must contain exactly one H1, found ${counts.h1}`);
ok(headings.length>1,'homepage must expose a useful heading hierarchy below H1');
ok(headings[0]?.level===1,'first semantic heading must be H1');
ok(headings[0]?.text==='Spočítejte materiál na celý plot. Hned.',`homepage H1 changed unexpectedly: ${JSON.stringify(headings[0]?.text||'')}`);
for(let i=1;i<headings.length;i++){
  const prev=headings[i-1],current=headings[i];
  if(current.level>prev.level+1){
    fail.push(`heading level jumps from H${prev.level} (${JSON.stringify(prev.text)}) to H${current.level} (${JSON.stringify(current.text)})`);
  }
}
ok(countTag('main')===1,`homepage must contain exactly one main landmark, found ${countTag('main')}`);
ok(/<main\b[^>]*\bid=["']kalkulator["']/i.test(cleaned),'main landmark must remain the calculator target #kalkulator');
ok(countTag('header')===1,`homepage must contain exactly one header landmark, found ${countTag('header')}`);
ok(countTag('footer')===1,`homepage must contain exactly one footer landmark, found ${countTag('footer')}`);
ok(countTag('nav')>=1,'homepage must expose at least one nav landmark for site navigation');
ok(!/<main\b[\s\S]*<main\b/i.test(cleaned),'homepage must not nest main landmarks');

if(fail.length){
  console.error('Semantic structure checks failed:\n- '+fail.join('\n- '));
  console.error('Heading sequence: '+headings.map(h=>`H${h.level} ${JSON.stringify(h.text)}`).join(' -> '));
  process.exit(1);
}
console.log(`Semantic structure OK: ${headings.length} headings (${Object.entries(counts).map(([tag,count])=>`${tag.toUpperCase()}=${count}`).join(', ')}), one header/main/footer and ${countTag('nav')} nav landmark(s); no heading-level jumps`);
