import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const root='dist';
if(!fs.existsSync(root)||!fs.statSync(root).isDirectory())throw new Error('Pages artifact dist/ directory is missing');
const html=fs.readFileSync(`${root}/index.html`,'utf8');
const marker=fs.readFileSync(`${root}/deploy-marker.txt`,'utf8').trim();
const required=[...activeScripts,...requiredArtifact];
const missing=required.filter(x=>!html.includes(x));
const leaked=forbiddenArtifact.filter(x=>html.includes(x));
if(missing.length||leaked.length||!marker||marker==='unknown') throw new Error(`Pages artifact integrity failed; missing=${JSON.stringify(missing)}; legacy=${JSON.stringify(leaked)}; marker=${JSON.stringify(marker)}`);

const topLevel=new Set(fs.readdirSync(root));
for(const forbidden of ['scripts','docs','supabase','.github','.git'])if(topLevel.has(forbidden))throw new Error(`Pages public dist must not expose repository-internal ${forbidden}/`);
const htmlFiles=fs.readdirSync('.').filter(f=>f.endsWith('.html')).sort();
for(const file of htmlFiles)if(!topLevel.has(file))throw new Error(`Pages public dist missing HTML page: ${file}`);
for(const requiredFile of ['assets','robots.txt','sitemap.xml','CNAME','deploy-marker.txt'])if(!topLevel.has(requiredFile))throw new Error(`Pages public dist missing ${requiredFile}`);
const allowedTop=new Set([...htmlFiles,'assets','robots.txt','sitemap.xml','CNAME','deploy-marker.txt']);
for(const entry of topLevel)if(!allowedTop.has(entry))throw new Error(`Pages public dist contains unexpected top-level entry: ${entry}`);

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

const socialImageUrl='https://plotao.cz/assets/fence-types/panelovy-3d.webp';
const socialImageAlt='Panelový 3D plot – ukázka typu oplocení v kalkulátoru PLOTAO.cz';
const socialTokens=[
  '<meta property="og:locale" content="cs_CZ">',
  '<meta property="og:site_name" content="PLOTAO.cz">',
  `<meta property="og:image" content="${socialImageUrl}">`,
  `<meta property="og:image:secure_url" content="${socialImageUrl}">`,
  '<meta property="og:image:type" content="image/webp">',
  '<meta property="og:image:width" content="480">',
  '<meta property="og:image:height" content="300">',
  `<meta property="og:image:alt" content="${socialImageAlt}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz">',
  '<meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">',
  `<meta name="twitter:image" content="${socialImageUrl}">`,
  `<meta name="twitter:image:alt" content="${socialImageAlt}">`
];
for(const token of socialTokens)if(!html.includes(token))throw new Error(`Pages artifact missing social metadata: ${token}`);
const socialImageFile=`${root}/assets/fence-types/panelovy-3d.webp`;
if(!fs.existsSync(socialImageFile))throw new Error('Pages artifact social image is missing');
const webp=fs.readFileSync(socialImageFile);
if(webp.length<30||webp.toString('ascii',0,4)!=='RIFF'||webp.toString('ascii',8,12)!=='WEBP'||webp.toString('ascii',12,16)!=='VP8X')throw new Error('Pages artifact social image is not the reviewed VP8X WebP');
const socialWidth=1+webp.readUIntLE(24,3),socialHeight=1+webp.readUIntLE(27,3);
if(socialWidth!==480||socialHeight!==300)throw new Error(`Pages artifact social image dimensions changed: ${socialWidth}x${socialHeight}`);

const logoTags=[...html.matchAll(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi)].map(m=>m[0]);
if(!logoTags.length||logoTags.some(tag=>!(/\bwidth=["']2172["']/i.test(tag)&&/\bheight=["']724["']/i.test(tag)))){
  throw new Error('Pages artifact logo images must expose their intrinsic 2172x724 dimensions to prevent layout shift');
}

function verifyVectorLogo(file){
  const svg=fs.readFileSync(file,'utf8'),size=fs.statSync(file).size;
  if(size>=10000)throw new Error(`Pages artifact main logo must stay lightweight vector; got ${size} bytes`);
  if(!/viewBox=["']0 0 2172 724["']/i.test(svg))throw new Error('Pages artifact main logo must preserve its 2172x724 canvas');
  if(/<image\b/i.test(svg)||/data:image\//i.test(svg))throw new Error('Pages artifact main logo must not embed raster image data');
  if(!svg.includes('fill="#17202A"')||!svg.includes('fill="#F28817"'))throw new Error('Pages artifact main logo must preserve reviewed #17202A / #F28817 brand colors');
  if(!svg.includes('transform="translate(-2.5185 34.8437) scale(2.394203 2.408047)"'))throw new Error('Pages artifact main logo geometry transform changed; review visual alignment before deploy');
  const paths=(svg.match(/<path\b/g)||[]).length;
  if(paths!==2)throw new Error(`Pages artifact main logo must keep the reviewed two-path vector geometry; got ${paths} paths`);
  return size;
}

const PNG_SIGNATURE=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
function verifyEmbeddedPngSvg(file,label,maxSize){
  const svg=fs.readFileSync(file,'utf8'),size=fs.statSync(file).size;
  if(size>=maxSize)throw new Error(`Pages artifact ${label} is still oversized: ${size} bytes`);
  const match=svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if(!match)throw new Error(`Pages artifact ${label} is missing its embedded PNG`);
  const png=Buffer.from(match[1],'base64');
  if(!png.subarray(0,8).equals(PNG_SIGNATURE))throw new Error(`Pages artifact ${label} contains an invalid PNG`);
  const chunkTypes=[];let offset=8;
  while(offset+12<=png.length){
    const length=png.readUInt32BE(offset),end=offset+12+length;
    if(end>png.length)throw new Error(`Pages artifact ${label} contains a truncated PNG chunk`);
    const type=png.toString('ascii',offset+4,offset+8);chunkTypes.push(type);offset=end;if(type==='IEND')break;
  }
  for(const forbidden of ['caBX','eXIf','tEXt','zTXt','iTXt','tIME'])if(chunkTypes.includes(forbidden))throw new Error(`Pages artifact ${label} still contains removable ${forbidden} metadata`);
  for(const requiredType of ['IHDR','IDAT','IEND'])if(!chunkTypes.includes(requiredType))throw new Error(`Pages artifact ${label} PNG is missing ${requiredType}`);
  return size;
}
const logoSize=verifyVectorLogo(`${root}/assets/logo-plotao.svg`);
const faviconSize=verifyEmbeddedPngSvg(`${root}/assets/favicon.svg`,'favicon',45763);

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
  const expected=createHash('sha256').update(fs.readFileSync(root+clean)).digest('hex').slice(0,12);
  const actual=new URLSearchParams(query).get('v');
  if(actual!==expected) throw new Error(`Pages artifact script cache version mismatch for ${clean}: expected=${expected} actual=${actual}`);
}

const preloadSources=[...html.matchAll(/<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']script["'][^>]*\bdata-plotao-critical=["']1["'][^>]*>/gi)].map(tag=>tag[0].match(/\bhref=["']([^"']+)["']/i)?.[1]||'');
const expectedPreloads=activeScripts.slice(0,8).map(src=>{
  const version=createHash('sha256').update(fs.readFileSync(root+src)).digest('hex').slice(0,12);
  return `${src}?v=${version}`;
});
if(preloadSources.length!==expectedPreloads.length||preloadSources.some((src,index)=>src!==expectedPreloads[index])){
  throw new Error(`Critical script preloads differ from the protected 8-script dependency prefix; expected=${JSON.stringify(expectedPreloads)} actual=${JSON.stringify(preloadSources)}`);
}
for(const src of preloadSources)if(!scriptSources.includes(src))throw new Error(`Critical preload does not match an executed script URL: ${src}`);

const posGeo=html.indexOf('/assets/geometry-v3.js'),posGuard=html.indexOf('/assets/geometry-validity-v1.js'),posPanel=html.indexOf('/assets/panel-pricing-v5.js');
if(!(posGeo>=0&&posGeo<posGuard&&posGuard<posPanel)) throw new Error('Geometry validity guard must load after geometry and before pricing modules');
console.log(`Pages artifact integrity OK: ${marker}; strict public dist has ${topLevel.size} top-level entries, ${activeScripts.length} content-versioned modules, ${preloadSources.length} critical preloads, social image ${socialWidth}x${socialHeight}, vector logo (${logoSize} bytes) and favicon (${faviconSize} bytes)`);
