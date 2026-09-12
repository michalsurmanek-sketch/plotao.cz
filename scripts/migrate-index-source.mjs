import fs from 'node:fs';
import {activeScripts,forbiddenArtifact} from './pages-manifest.mjs';

const path='index.html';
let html=fs.readFileSync(path,'utf8');
const changes=[];

function replaceIfPresent(name,from,to){
  if(html.includes(from)){
    html=html.split(from).join(to);
    changes.push(name);
  }
}
function ensureTag(tag){
  if(!html.includes(tag)){
    if(!html.includes('</body>')) throw new Error('Index migration: </body> not found');
    html=html.replace('</body>',tag+'</body>');
    changes.push(`script ${tag}`);
  }
}

for(const [oldPrice,label] of [[1680,'panel'],[720,'mesh'],[2650,'concrete'],[3180,'privacy'],[4650,'aluminium'],[3950,'gabion'],[3850,'metal'],[4250,'masonry'],[780,'mobile'],[2900,'other']]){
  replaceIfPresent(`legacy ${label} base price`,`price:${oldPrice}`,'price:0');
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
  ['legacy gate price',"function gatePrice(type,width,drive){return({double:22500,sliding:31500,cantilever:38500}[type]||22500)+Math.max(0,width-3)*5200+(drive==='auto'?18500:0)}",'function gatePrice(){return 0}'],
  ['legacy fake submit',"form.onsubmit=e=>{e.preventDefault();alert('Formulář je připraven; databázové odeslání bude další krok.')}",'form.onsubmit=null'],
  ['default scope',"scope:'turnkey'","scope:'material'"],
  ['price date','Ceník aktualizován 11. 9. 2026','Ceník aktualizován 12. 9. 2026'],
  ['gate default','<input id="gate" type="checkbox" checked>','<input id="gate" type="checkbox">'],
  ['wicket default','<input id="door" type="checkbox" checked>','<input id="door" type="checkbox">'],
  ['title','<title>Kalkulátor ceny plotu na klíč | Plotao.cz</title>','<title>Kalkulátor ceny plotu a materiálu | PLOTAO.cz</title>'],
  ['meta description','<meta name="description" content="Spočítejte orientační cenu plotu včetně materiálu, bran, dopravy, betonování a montáže. Kalkulátor umí více samostatných úseků oplocení.">','<meta name="description" content="Spočítejte ověřený materiálový rozpočet plotu podle typu, výšky a jednotlivých úseků. Pole, sloupky, podhrabové desky, beton a vybrané brány hned; doprava a montáž podle realizace.">'],
  ['og title','<meta property="og:title" content="Kalkulátor ceny plotu na klíč | Plotao.cz">','<meta property="og:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz">'],
  ['og description','<meta property="og:description" content="Spočítejte orientační cenu plotu včetně členění na jednotlivé úseky.">','<meta property="og:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů. Doprava a realizace individuálně.">'],
  ['eyebrow','<div class="eyebrow">▣ Kalkulátor plotu na klíč</div>','<div class="eyebrow">▣ Kalkulátor materiálu na plot</div>'],
  ['h1','<h1>Zjistěte cenu celého plotu. Hned.</h1>','<h1>Spočítejte materiál na celý plot. Hned.</h1>'],
  ['intro','<p>Jednotlivé úseky, brány, materiál, doprava i montáž v jednom výpočtu.</p>','<p>Ověřený materiál spočítáme hned. Dopravu a montáž naceníme podle místa, přístupu a skutečných podmínek realizace.</p>'],
  ['section 3 subtitle','<p class="subtitle">Doplňky a obtížnost se ihned promítnou do výpočtu</p>','<p class="subtitle">Brány se promítnou do materiálu; terén, podloží a přístup slouží jako podklady pro individuální realizační nabídku.</p>'],
  ['scope buttons','<button data-v="material">Materiál</button><button data-v="delivery">S dopravou</button><button data-v="turnkey" class="on">Na klíč</button>','<button data-v="material" class="on">Materiál</button><button data-v="delivery">S dopravou</button><button data-v="turnkey">Na klíč</button>'],
  ['calculator anchor','<main class="wrap">','<main class="wrap" id="kalkulator">']
];
for(const [name,from,to] of replacements) replaceIfPresent(name,from,to);
for(const src of activeScripts) ensureTag(`<script src="${src}"></script>`);

// deploy SHA is build-specific and must never be persisted in source.
html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');

const legacy=forbiddenArtifact.filter(token=>html.includes(token));
if(legacy.length) throw new Error(`Index source migration left forbidden legacy tokens: ${JSON.stringify(legacy)}`);
if(!html.includes('<title>Kalkulátor ceny plotu a materiálu | PLOTAO.cz</title>')) throw new Error('Index source migration did not establish current title');
if(!html.includes('data-v="material" class="on"')) throw new Error('Index source migration did not establish Material default');
for(const src of activeScripts){if(!html.includes(`<script src="${src}"></script>`)) throw new Error(`Index source missing active script ${src}`)}

fs.writeFileSync(path,html,'utf8');
console.log(`Index source migration complete: ${changes.length} source changes; no forbidden legacy artifact tokens remain`);
