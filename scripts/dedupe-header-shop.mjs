import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Header E-shop dedupe: production artifact is missing');
let html=fs.readFileSync(file,'utf8');
const headerMatch=html.match(/<header class="head">[\s\S]*?<\/header>/i);
if(!headerMatch)throw new Error('Header E-shop dedupe: homepage header missing');
let header=headerMatch[0];

// Rebuild the shop control from one canonical source. Remove every existing
// shop link/button first, then inject exactly one canonical link after the logo.
// This is a structural DOM fix, not CSS hiding.
header=header.replace(/<a\b[^>]*href=["']\/eshop\.html["'][^>]*>[\s\S]*?<\/a>/gi,'');
header=header.replace(/<button\b[^>]*(?:aria-label=["'][^"']*e-?shop[^"']*["'])[^>]*>[\s\S]*?<\/button>/gi,'');
header=header.replace(/<button\b[^>]*>[\s\S]*?E-shop[\s\S]*?<\/button>/gi,'');
const shop='<a class="shop-link" data-plotao-shop-link="1" href="/eshop.html" aria-label="Otevřít e-shop PLOTAO">E-shop</a>';
const logo=/(<a class="logo" href="\/">[\s\S]*?<\/a>)/i;
if(!logo.test(header))throw new Error('Header E-shop dedupe: homepage logo anchor missing');
header=header.replace(logo,`$1${shop}`);

const canonical=(header.match(/data-plotao-shop-link=["']1["']/gi)||[]).length;
const links=(header.match(/href=["']\/eshop\.html["']/gi)||[]).length;
const visible=(header.match(/>\s*E-shop\s*</gi)||[]).length;
if(canonical!==1||links!==1||visible!==1)throw new Error(`Header E-shop dedupe: expected exactly one canonical shop control, got canonical=${canonical}, links=${links}, visible=${visible}`);

html=html.replace(headerMatch[0],header);
fs.writeFileSync(file,html,'utf8');
console.log('Homepage header E-shop rebuilt structurally: exactly one canonical control remains');
