import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const html=fs.readFileSync('index.html','utf8');
const marker=fs.readFileSync('deploy-marker.txt','utf8').trim();
const required=[...activeScripts,...requiredArtifact];
const missing=required.filter(x=>!html.includes(x));
const leaked=forbiddenArtifact.filter(x=>html.includes(x));
if(missing.length||leaked.length||!marker||marker==='unknown') throw new Error(`Pages artifact integrity failed; missing=${JSON.stringify(missing)}; legacy=${JSON.stringify(leaked)}; marker=${JSON.stringify(marker)}`);

const schemaMatch=html.match(/<script\s+type=["']application\/ld\+json["']\s+data-plotao-schema=["']1["']>([\s\S]*?)<\/script>/i);
if(!schemaMatch) throw new Error('Pages artifact missing Plotao structured data');
let schema;
try{schema=JSON.parse(schemaMatch[1])}catch{throw new Error('Pages artifact contains invalid Plotao structured data JSON')}
const graph=Array.isArray(schema?.['@graph'])?schema['@graph']:[];
const website=graph.find(x=>x?.['@type']==='WebSite');
const calculator=graph.find(x=>x?.['@type']==='WebApplication');
if(schema?.['@context']!=='https://schema.org'||website?.url!=='https://plotao.cz/'||calculator?.url!=='https://plotao.cz/#kalkulator'||calculator?.isAccessibleForFree!==true){
  throw new Error('Pages artifact structured data does not match the public Plotao website/calculator contract');
}

for(const token of ['<meta name="twitter:card" content="summary">','<meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz">','<meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">']){
  if(!html.includes(token))throw new Error(`Pages artifact missing social metadata: ${token}`);
}
const logoTags=[...html.matchAll(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi)].map(m=>m[0]);
if(!logoTags.length||logoTags.some(tag=>!(/\bwidth=["']2172["']/i.test(tag)&&/\bheight=["']724["']/i.test(tag)))){
  throw new Error('Pages artifact logo images must expose their intrinsic 2172x724 dimensions to prevent layout shift');
}
const logoPath='assets/logo-plotao.svg',logoSvg=fs.readFileSync(logoPath,'utf8'),logoSize=fs.statSync(logoPath).size;
if(logoSize>=500000)throw new Error(`Pages artifact logo is still oversized: ${logoSize} bytes`);
const logoPngMatch=logoSvg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
if(!logoPngMatch)throw new Error('Pages artifact logo is missing its embedded PNG');
const logoPng=Buffer.from(logoPngMatch[1],'base64');
if(!logoPng.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))throw new Error('Pages artifact logo contains an invalid PNG');
const chunkTypes=[];let logoOffset=8;
while(logoOffset+12<=logoPng.length){
  const length=logoPng.readUInt32BE(logoOffset),end=logoOffset+12+length;
  if(end>logoPng.length)throw new Error('Pages artifact logo contains a truncated PNG chunk');
  const type=logoPng.toString('ascii',logoOffset+4,logoOffset+8);chunkTypes.push(type);logoOffset=end;if(type==='IEND')break;
}
if(chunkTypes.includes('caBX'))throw new Error('Pages artifact logo still contains C2PA caBX metadata');
for(const requiredType of ['IHDR','IDAT','IEND'])if(!chunkTypes.includes(requiredType))throw new Error(`Pages artifact logo PNG is missing ${requiredType}`);

const scriptSources=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)].map(match=>match[1]);
const normalizedSources=scriptSources.map(src=>src.split('?')[0]);
const managedSources=normalizedSources.filter(src=>activeScripts.includes(src));
const duplicateSources=managedSources.filter((src,index)=>managedSources.indexOf(src)!==index);
if(duplicateSources.length) throw new Error(`Pages artifact contains duplicate managed scripts: ${JSON.stringify([...new Set(duplicateSources)])}`);
if(managedSources.length!==activeScripts.length||managedSources.some((src,index)=>src!==activeScripts[index])){
  throw new Error(`Pages artifact script order differs from manifest; expected=${JSON.stringify(activeScripts)} actual=${JSON.stringify(managedSources)}`);
}
const managedVersioned=scriptSources.filter(src=>activeScripts.includes(src.split('?')[0]));
for(const src of managedVersioned){
  const [clean,query='']=src.split('?');
  const expected=createHash('sha256').update(fs.readFileSync('.'+clean)).digest('hex').slice(0,12);
  const actual=new URLSearchParams(query).get('v');
  if(actual!==expected) throw new Error(`Pages artifact script cache version mismatch for ${clean}: expected=${expected} actual=${actual}`);
}

const posGeo=html.indexOf('/assets/geometry-v3.js'),posGuard=html.indexOf('/assets/geometry-validity-v1.js'),posPanel=html.indexOf('/assets/panel-pricing-v5.js');
if(!(posGeo>=0&&posGeo<posGuard&&posGuard<posPanel)) throw new Error('Geometry validity guard must load after geometry and before pricing modules');
console.log(`Pages artifact integrity OK: ${marker}; ${activeScripts.length} content-versioned modules, structured/social metadata, logo dimensions and optimized logo (${logoSize} bytes) verified`);
