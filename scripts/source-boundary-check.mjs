import fs from 'node:fs';

const assetFiles=fs.readdirSync('assets').filter(f=>f.endsWith('.js'));
const forbiddenActive=[
  'price:1680','price:720','price:2650','price:3180','price:4650','price:3950','price:3850','price:4250','price:780','price:2900',
  'double:22500,sliding:31500,cantilever:38500',
  "delivery=state.scope==='material'?0:2900",
  "workRate=state.type==='concrete'?1450:980",
  "dp=door?9900+Math.max(0,dw-.9)*7000:0"
];
const failures=[];
for(const file of assetFiles){
  const src=fs.readFileSync(`assets/${file}`,'utf8');
  for(const token of forbiddenActive){
    if(src.includes(token)) failures.push(`${file}: legacy inline pricing token leaked into active asset: ${token}`);
  }
}
const index=fs.readFileSync('index.html','utf8');
const expectedInline=[
  'price:1680','price:720','price:2650',
  'double:22500,sliding:31500,cantilever:38500',
  "delivery=state.scope==='material'?0:2900",
  "workRate=state.type==='concrete'?1450:980"
];
for(const token of expectedInline){
  if(!index.includes(token)) failures.push(`index.html: expected legacy token disappeared; migrate prepare-pages.mjs before removing it: ${token}`);
}
if(failures.length){
  console.error('Source boundary checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`Source boundary checks OK: ${assetFiles.length} active JS assets contain no legacy inline pricing constants`);
