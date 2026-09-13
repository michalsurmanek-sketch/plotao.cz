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
  return{before:Buffer.byteLength(svg),after:Buffer.byteLength(optimizedSvg),pngBefore:png.length,pngAfter:optimizedPng.length};
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
const orderedScripts=activeScripts.map(src=>`<script src="${src}?v=${assetVersion(src)}"></script>`).join('');
html=html.replace('</body>',orderedScripts+'</body>');

if(!html.includes('<main class="wrap" id="kalkulator">')) throw new Error('Pages build source missing calculator anchor');

html=html.replace(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi,tag=>{
  const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
  return cleaned.replace(/>$/, ' width="2172" height="724">');
});

// Preserve decoded pixels exactly while stripping non-rendering PNG metadata and
// repacking the existing scanline stream for production-only transfer savings.
const logoStats=optimizeEmbeddedPngSvg('assets/logo-plotao.svg','Logo');
const faviconStats=optimizeEmbeddedPngSvg('assets/favicon.svg','Favicon');

html=html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-plotao-schema=["']1["']>[\s\S]*?<\/script>/gi,'');
const schemaTag=`<script type="application/ld+json" data-plotao-schema="1">${JSON.stringify(structuredData)}</script>`;

html=html.replace(/<meta\s+name=["']twitter:(?:card|title|description)["'][^>]*>/gi,'');
const socialMeta='<meta name="twitter:card" content="summary"><meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz"><meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">';

html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');
if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
html=html.replace('</head>',schemaTag+socialMeta+`<meta name="plotao-deploy" content="${sha}"></head>`);

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');
console.log(`Logo optimized losslessly: ${logoStats.before} -> ${logoStats.after} bytes (embedded PNG ${logoStats.pngBefore} -> ${logoStats.pngAfter})`);
console.log(`Favicon optimized losslessly: ${faviconStats.before} -> ${faviconStats.after} bytes (embedded PNG ${faviconStats.pngBefore} -> ${faviconStats.pngAfter})`);
console.log(`Pages build prepared from clean source: ${activeScripts.length} content-versioned modules, SHA ${sha}`);
