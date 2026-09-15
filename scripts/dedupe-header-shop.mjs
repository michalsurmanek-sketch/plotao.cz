import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Header E-shop dedupe: production artifact is missing');
let html=fs.readFileSync(file,'utf8');
const headerMatch=html.match(/<header class="head">[\s\S]*?<\/header>/i);
if(!headerMatch)throw new Error('Header E-shop dedupe: homepage header missing');
let header=headerMatch[0];

// Keep the canonical build-injected E-shop link and remove any legacy/header control
// (button or secondary link) that also renders E-shop text. This is structural,
// not a CSS hide, so the duplicate cannot remain focusable or clickable.
header=header.replace(/<button\b[^>]*>[\s\S]*?E-shop[\s\S]*?<\/button>/gi,'');
header=header.replace(/<a\b(?![^>]*data-plotao-shop-link=["']1["'])[^>]*>[\s\S]*?E-shop[\s\S]*?<\/a>/gi,'');

const canonical=(header.match(/<a\b[^>]*data-plotao-shop-link=["']1["'][^>]*href=["']\/eshop\.html["'][^>]*>[\s\S]*?<\/a>/gi)||[]).length;
const visible=(header.match(/E-shop/gi)||[]).length;
if(canonical!==1||visible!==1)throw new Error(`Header E-shop dedupe: expected one canonical visible E-shop control, got canonical=${canonical}, visible=${visible}`);

html=html.replace(headerMatch[0],header);
fs.writeFileSync(file,html,'utf8');
console.log('Homepage header E-shop permanently deduplicated: one canonical control, no hidden/overlaid duplicate');
