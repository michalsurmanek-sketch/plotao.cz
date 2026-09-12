import fs from 'node:fs';
const path='index.html';
let html=fs.readFileSync(path,'utf8');
const external='<script src="/assets/ui-bootstrap-v1.js"></script>';
if(html.includes(external)&&!html.includes('<script>const types=[')){console.log('Inline UI already extracted');process.exit(0)}
const start=html.indexOf('<script>const types=[');
if(start<0)throw new Error('Inline calculator script start not found');
const endToken='form.onsubmit=null;</script>';
const end=html.indexOf(endToken,start);
if(end<0)throw new Error('Inline calculator script end not found');
const before=html.slice(0,start),after=html.slice(end+endToken.length);
html=before+external+after;
if(html.includes('function calc(){'))throw new Error('Legacy inline calc still present after extraction');
if(html.includes('<script>const types=['))throw new Error('Legacy inline types bootstrap still present after extraction');
if(!html.includes(external))throw new Error('External UI bootstrap was not inserted');
fs.writeFileSync(path,html,'utf8');
console.log(`Inline calculator UI extracted: removed ${end+endToken.length-start} source characters`);
