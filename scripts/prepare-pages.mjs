import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {deflateSync,inflateSync} from 'node:zlib';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const path='index.html';
let html=fs.readFileSync(path,'utf8');
const sha=process.env.GITHUB_SHA||'unknown';
const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {
      '@type':'WebSite',
      '@id':'https://plotao.cz/#website',
      url:'https://plotao.cz/',
      name:'PLOTAO.cz',
      inLanguage:'cs'
    },
    {
      '@type':'WebApplication',
      '@id':'https://plotao.cz/#calculator',
      url:'https://plotao.cz/#kalkulator',
      name:'Kalkulátor ceny plotu a materiálu',
      applicationCategory:'BusinessApplication',
      operatingSystem:'Web',
      isAccessibleForFree:true,
      inLanguage:'cs',
      description:'Kalkulátor materiálového rozpočtu oplocení podle typu, výšky, úseků a otvorů.'
    }
  ]
};

const PNG_SIGNATURE=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
function parsePng(buffer,label='image'){
  if(buffer.length<20||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error(`${label} optimization: embedded image is not a valid PNG`);
  const chunks=[];let offset=8;
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),end=offset+12+length;
    if(end>buffer.length)throw new Error(`${label} optimization: truncated PNG chunk`);
    const type=buffer.toString('ascii',offset+4,offset+8);
    chunks.push({type,data:buffer.subarray(offset+8,offset+8+length),raw:buffer.subarray(offset,end)});
    offset=end;if(type==='IEND')break;
  }
  if(!chunks.some(c=>c.type==='IHDR')||!chunks.some(c=>c.type==='IDAT')||!chunks.some(c=>c.type==='IEND'))throw new Error(`${label} optimization: PNG is missing required chunks`);
  return chunks;
}
function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
  return (crc^0xffffffff)>>>0;
}
function makePngChunk(type,data){
  const name=Buffer.from(type,'ascii'),out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([name,data])),8+data.length);
  return out;
}
function optimizeEmbeddedPngSvg(file,label){
  const svg=fs.readFileSync(file,'utf8'),match=svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if(!match)throw new Error(`${label} optimization: embedded PNG not found`);
  const png=Buffer.from(match[1],'base64'),chunks=parsePng(png,label),idat=Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data));
  const raw=inflateSync(idat),rawHash=createHash('sha256').update(raw).digest('hex'),repacked=deflateSync(raw,{level:9});
  const removable=new Set(['caBX','eXIf','tEXt','zTXt','iTXt','tIME']);
  let idatWritten=false;const output=[PNG_SIGNATURE];
  for(const chunk of chunks){
    if(chunk.type==='IDAT'){
      if(!idatWritten){output.push(makePngChunk('IDAT',repacked));idatWritten=true}
      continue;
    }
    if(removable.has(chunk.type))continue;
    output.push(chunk.raw);
  }
  const optimizedPng=Buffer.concat(output),optimizedChunks=parsePng(optimizedPng,label);
  const optimizedRaw=inflateSync(Buffer.concat(optimizedChunks.filter(c=>c.type==='IDAT').map(c=>c.data)));
  const optimizedHash=createHash('sha256').update(optimizedRaw).digest('hex');
  if(rawHash!==optimizedHash||raw.length!==optimizedRaw.length)throw new Error(`${label} optimization changed decoded image data`);
  const optimizedSvg=svg.replace(match[1],optimizedPng.toString('base64'));
  if(Buffer.byteLength(optimizedSvg)>=Buffer.byteLength(svg))throw new Error(`${label} optimization did not reduce the production asset`);
  fs.writeFileSync(file,optimizedSvg,'utf8');
  return{kind:'embedded-png',before:Buffer.byteLength(svg),after:Buffer.byteLength(optimizedSvg),pngBefore:png.length,pngAfter:optimizedPng.length};
}
function prepareMainLogo(file){
  const svg=fs.readFileSync(file,'utf8'),size=Buffer.byteLength(svg);
  if(/data:image\/png;base64,/i.test(svg))return optimizeEmbeddedPngSvg(file,'Logo');
  if(!/viewBox=["']0 0 2172 724["']/i.test(svg))throw new Error('Logo validation: vector logo must preserve the 2172x724 canvas');
  if(/<image\b/i.test(svg)||/data:image\//i.test(svg))throw new Error('Logo validation: vector logo must not embed raster images');
  if(!svg.includes('#17202A')||!svg.includes('#F28817'))throw new Error('Logo validation: vector logo must preserve reviewed antracit/orange brand colors');
  if(size>=10000)throw new Error(`Logo validation: vector logo is unexpectedly large: ${size} bytes`);
  return{kind:'vector',before:size,after:size};
}

const legacy=forbiddenArtifact.filter(token=>html.includes(token));
if(legacy.length) throw new Error(`Pages build refuses legacy source: ${JSON.stringify(legacy)}`);
const sourceRequired=requiredArtifact.filter(token=>token!=='name="plotao-deploy"');
const missingSource=sourceRequired.filter(token=>!html.includes(token));
if(missingSource.length) throw new Error(`Pages build source missing current required content: ${JSON.stringify(missingSource)}`);

if(!html.includes('</body>')) throw new Error('Pages build: </body> not found');
html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,(tag,src)=>{
  const cleanSrc=src.split('?')[0];
  return activeScripts.includes(cleanSrc)?'':tag;
});
const assetVersion=src=>createHash('sha256').update(fs.readFileSync('.'+src)).digest('hex').slice(0,12);
const versionedScript=src=>`${src}?v=${assetVersion(src)}`;
// Classic defer scripts download without blocking HTML parsing, execute in manifest
// order, and still complete before DOMContentLoaded. This preserves global dependencies.
const orderedScripts=activeScripts.map(src=>`<script defer src="${versionedScript(src)}"></script>`).join('');
html=html.replace('</body>',orderedScripts+'</body>');

if(!html.includes('<main class="wrap" id="kalkulator">')) throw new Error('Pages build source missing calculator anchor');
html=html.replace(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi,tag=>{
  const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
  return cleaned.replace(/>$/, ' width="2172" height="724">');
});

const shopLink='<a class="shop-link" data-plotao-shop-link="1" href="/eshop.html" aria-label="Otevřít e-shop PLOTAO">E-shop</a>';
if(!html.includes('data-plotao-shop-link="1"')){
  html=html.replace(/(<header class="head">[\s\S]*?<a class="logo" href="\/">[\s\S]*?<\/a>)/i,`$1${shopLink}`);
}
if(!html.includes('data-plotao-shop-link="1"'))throw new Error('Pages build: homepage E-shop link injection failed');
const shopCss='<style data-plotao-shop-link-style="1">.head .shop-link{height:42px;display:inline-flex;align-items:center;justify-content:center;margin-left:auto;margin-right:8px;padding:0 16px;border-radius:999px;background:var(--o);color:#fff;text-decoration:none;font-weight:900;box-shadow:0 8px 20px #f0782833;white-space:nowrap}.head .shop-link:hover,.head .shop-link:focus-visible{filter:brightness(.97);outline:3px solid #f0782844;outline-offset:2px}@media(max-width:680px){.head .logo img{width:145px}.head .shop-link{height:40px;padding:0 10px;margin-right:6px;font-size:13px}.head .help{padding:8px 10px;font-size:12px;white-space:nowrap}}@media(max-width:430px){.head{gap:6px}.head .logo img{width:130px}.head .shop-link{height:38px;padding:0 9px;margin-right:0}.head .help{height:38px;padding:0 9px}}</style>';

const logoStats=prepareMainLogo('assets/logo-plotao.svg');
const faviconStats=optimizeEmbeddedPngSvg('assets/favicon.svg','Favicon');

html=html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-plotao-schema=["']1["']>[\s\S]*?<\/script>/gi,'');
const schemaTag=`<script type="application/ld+json" data-plotao-schema="1">${JSON.stringify(structuredData)}</script>`;
html=html.replace(/<meta\s+name=["']twitter:(?:card|title|description)["'][^>]*>/gi,'');
const socialMeta='<meta name="twitter:card" content="summary"><meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz"><meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">';

// Start only the small dependency-critical prefix early. Deferred execution remains
// in manifest order; preloads only remove download wait for the dependency prefix.
html=html.replace(/<link\s+rel=["']preload["'][^>]*data-plotao-critical=["'][^"']*["'][^>]*>/gi,'');
const criticalScripts=activeScripts.slice(0,8);
const criticalPreloads=criticalScripts.map(src=>`<link rel="preload" as="script" href="${versionedScript(src)}" data-plotao-critical="1">`).join('');

html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');
if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
html=html.replace('</head>',criticalPreloads+schemaTag+socialMeta+shopCss+`<meta name="plotao-deploy" content="${sha}"></head>`);

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');

const dist='dist';
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html')).sort())fs.copyFileSync(file,`${dist}/${file}`);
for(const file of ['robots.txt','sitemap.xml','CNAME','deploy-marker.txt'])if(fs.existsSync(file))fs.copyFileSync(file,`${dist}/${file}`);
fs.cpSync('assets',`${dist}/assets`,{recursive:true});

const eshopFile=`${dist}/eshop.html`;
if(fs.existsSync(eshopFile)){
  let eshop=fs.readFileSync(eshopFile,'utf8');
  eshop=eshop.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
  if(!eshop.includes('</head>'))throw new Error('E-shop build: </head> not found');
  eshop=eshop.replace('</head>','<link rel="canonical" href="https://plotao.cz/eshop.html"></head>');
  fs.writeFileSync(eshopFile,eshop,'utf8');
  if(!eshop.includes('<link rel="canonical" href="https://plotao.cz/eshop.html">'))throw new Error('E-shop build: canonical injection failed');
}

if(logoStats.kind==='vector')console.log(`Logo vector validated: ${logoStats.after} bytes; no embedded raster payload`);
else console.log(`Logo optimized losslessly: ${logoStats.before} -> ${logoStats.after} bytes (embedded PNG ${logoStats.pngBefore} -> ${logoStats.pngAfter})`);
console.log(`Favicon optimized losslessly: ${faviconStats.before} -> ${faviconStats.after} bytes (embedded PNG ${faviconStats.pngBefore} -> ${faviconStats.pngAfter})`);
console.log(`Deferred script execution prepared: ${activeScripts.length} content-versioned modules; ${criticalScripts.length} critical preloads; manifest order preserved`);
console.log(`Public Pages tree prepared in ${dist}/ with ${fs.readdirSync(dist).length} top-level entries; repository internals excluded`);
console.log(`Pages build prepared from clean source: ${activeScripts.length} content-versioned modules, SHA ${sha}`);