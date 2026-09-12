import fs from 'node:fs';

const path='index.html';
let html=fs.readFileSync(path,'utf8');
const sha=process.env.GITHUB_SHA||'unknown';
const changes=[];

function replaceRequired(name,from,to){
  if(!html.includes(from)) throw new Error(`Pages build transform missing source: ${name}`);
  html=html.replace(from,to);
  changes.push(name);
}
function replaceAllRequired(name,from,to){
  if(!html.includes(from)) throw new Error(`Pages build transform missing source: ${name}`);
  html=html.split(from).join(to);
  changes.push(name);
}
function ensureTag(tag){
  if(!html.includes(tag)){
    if(!html.includes('</body>')) throw new Error('Pages build: </body> not found');
    html=html.replace('</body>',tag+'</body>');
  }
}

for(const [oldPrice,label] of [[1680,'panel'],[720,'mesh'],[2650,'concrete'],[3180,'privacy'],[4650,'aluminium'],[3950,'gabion'],[3850,'metal'],[4250,'masonry'],[780,'mobile'],[2900,'other']]){
  replaceRequired(`legacy ${label} base price`,`price:${oldPrice}`,'price:0');
}

const replacements=[
  ['legacy slab base price','basePrice=base?baseCount*base[1]:0','basePrice=0'],
  ['legacy delivery price',"delivery=state.scope==='material'?0:2900",'delivery=0'],
  ['legacy work rate',"workRate=state.type==='concrete'?1450:980",'workRate=0'],
  ['legacy work total',"work=state.scope==='turnkey'?fenceLen*workRate*terrain*ground*access:0",'work=0'],
  ['legacy demolition total',"demolition=state.scope==='turnkey'?fenceLen*({none:0,light:260,heavy:780}[$('#demolition').value]):0",'demolition=0'],
  ['legacy corner work total',"cornerWork=state.scope==='turnkey'?corners*650:0",'cornerWork=0'],
  ['legacy concrete total',"concrete=state.scope==='turnkey'?concreteVolume*2850:0",'concrete=0'],
  ['legacy wicket price',"dp=door?9900+Math.max(0,dw-.9)*7000:0",'dp=0'],
  ['default scope',"scope:'turnkey'","scope:'material'"],
  ['price date','Ceník aktualizován 11. 9. 2026','Ceník aktualizován 12. 9. 2026'],
  ['legacy fake form submit',"form.onsubmit=e=>{e.preventDefault();alert('Formulář je připraven; databázové odeslání bude další krok.')}",'form.onsubmit=null'],
  ['gate default off','<input id="gate" type="checkbox" checked>','<input id="gate" type="checkbox">'],
  ['wicket default off','<input id="door" type="checkbox" checked>','<input id="door" type="checkbox">'],
  ['title','<title>Kalkulátor ceny plotu na klíč | Plotao.cz</title>','<title>Kalkulátor ceny plotu a materiálu | PLOTAO.cz</title>'],
  ['meta description','<meta name="description" content="Spočítejte orientační cenu plotu včetně materiálu, bran, dopravy, betonování a montáže. Kalkulátor umí více samostatných úseků oplocení.">','<meta name="description" content="Spočítejte ověřený materiálový rozpočet plotu podle typu, výšky a jednotlivých úseků. Pole, sloupky, podhrabové desky, beton a vybrané brány hned; doprava a montáž podle realizace.">'],
  ['og title','<meta property="og:title" content="Kalkulátor ceny plotu na klíč | Plotao.cz">','<meta property="og:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz">'],
  ['og description','<meta property="og:description" content="Spočítejte orientační cenu plotu včetně členění na jednotlivé úseky.">','<meta property="og:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů. Doprava a realizace individuálně.">'],
  ['eyebrow','<div class="eyebrow">▣ Kalkulátor plotu na klíč</div>','<div class="eyebrow">▣ Kalkulátor materiálu na plot</div>'],
  ['h1','<h1>Zjistěte cenu celého plotu. Hned.</h1>','<h1>Spočítejte materiál na celý plot. Hned.</h1>'],
  ['intro scope','<p>Jednotlivé úseky, brány, materiál, doprava i montáž v jednom výpočtu.</p>','<p>Ověřený materiál spočítáme hned. Dopravu a montáž naceníme podle místa, přístupu a skutečných podmínek realizace.</p>'],
  ['section 3 subtitle','<p class="subtitle">Doplňky a obtížnost se ihned promítnou do výpočtu</p>','<p class="subtitle">Brány se promítnou do materiálu; terén, podloží a přístup slouží jako podklady pro individuální realizační nabídku.</p>'],
  ['legacy gate price',"function gatePrice(type,width,drive){return({double:22500,sliding:31500,cantilever:38500}[type]||22500)+Math.max(0,width-3)*5200+(drive==='auto'?18500:0)}",'function gatePrice(type,width,drive){return 0}'],
  ['scope buttons','<button data-v="material">Materiál</button><button data-v="delivery">S dopravou</button><button data-v="turnkey" class="on">Na klíč</button>','<button data-v="material" class="on">Materiál</button><button data-v="delivery">S dopravou</button><button data-v="turnkey">Na klíč</button>']
];
for(const [name,from,to] of replacements) replaceRequired(name,from,to);

const tags=[
  '/assets/segment-connections-v1.js','/assets/calculator-v3.js','/assets/geometry-v3.js','/assets/geometry-validity-v1.js','/assets/gabion-options.js','/assets/aluminium-config.js','/assets/privacy-config.js','/assets/metal-config.js','/assets/concrete-config.js','/assets/extra-fence-config.js','/assets/options-router-v1.js','/assets/panel-slab-safety-v1.js','/assets/structural-pricing-v5.js','/assets/panel-pricing-v5.js','/assets/mesh-pricing-v2.js','/assets/aluminium-pricing.js','/assets/privacy-pricing.js','/assets/metal-pricing.js','/assets/extra-fence-pricing.js','/assets/slab-pricing-v2.js','/assets/concrete-material-v1.js','/assets/gate-pricing-v1.js','/assets/gate-drive-pricing-v1.js','/assets/scope-integrity.js','/assets/price-bridge.js','/assets/mobile-price-bridge.js','/assets/accuracy-guard.js','/assets/lead-safety-v1.js','/assets/step-scroll-v1.js','/assets/ui-truth-v1.js'
];
for(const src of tags) ensureTag(`<script src="${src}"></script>`);

if(!html.includes('<main class="wrap" id="kalkulator">')) replaceRequired('calculator anchor','<main class="wrap">','<main class="wrap" id="kalkulator">');
if(!html.includes('name="plotao-deploy"')){
  if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
  html=html.replace('</head>',`<meta name="plotao-deploy" content="${sha}"></head>`);
}

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');
console.log(`Pages build prepared: ${changes.length} required transforms, ${tags.length} modules, SHA ${sha}`);
