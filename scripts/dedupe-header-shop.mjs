import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Header E-shop dedupe: production artifact is missing');
let html=fs.readFileSync(file,'utf8');
const headerMatch=html.match(/<header class="head">[\s\S]*?<\/header>/i);
if(!headerMatch)throw new Error('Header E-shop dedupe: homepage header missing');
let header=headerMatch[0];
header=header.replace(/<a\b[^>]*data-plotao-shop-link=["']1["'][^>]*>[\s\S]*?<\/a>/gi,'');
const visibleShopLabels=(header.match(/E-shop/gi)||[]).length;
if(visibleShopLabels!==1)throw new Error(`Header E-shop dedupe: expected exactly one visible E-shop control after cleanup, got ${visibleShopLabels}`);
html=html.replace(headerMatch[0],header);
fs.writeFileSync(file,html,'utf8');
console.log('Homepage header E-shop deduplicated and guarded: exactly one visible control remains');
