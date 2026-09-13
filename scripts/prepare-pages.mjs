import fs from 'node:fs';
import {createHash} from 'node:crypto';
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

const legacy=forbiddenArtifact.filter(token=>html.includes(token));
if(legacy.length) throw new Error(`Pages build refuses legacy source: ${JSON.stringify(legacy)}`);
const sourceRequired=requiredArtifact.filter(token=>token!=='name="plotao-deploy"');
const missingSource=sourceRequired.filter(token=>!html.includes(token));
if(missingSource.length) throw new Error(`Pages build source missing current required content: ${JSON.stringify(missingSource)}`);

if(!html.includes('</body>')) throw new Error('Pages build: </body> not found');
// Remove every managed script tag, including a previously versioned one, and then
// inject the complete manifest once in deterministic dependency order.
html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,(tag,src)=>{
  const cleanSrc=src.split('?')[0];
  return activeScripts.includes(cleanSrc)?'':tag;
});
const assetVersion=src=>createHash('sha256').update(fs.readFileSync('.'+src)).digest('hex').slice(0,12);
const orderedScripts=activeScripts.map(src=>`<script src="${src}?v=${assetVersion(src)}"></script>`).join('');
html=html.replace('</body>',orderedScripts+'</body>');

if(!html.includes('<main class="wrap" id="kalkulator">')) throw new Error('Pages build source missing calculator anchor');

// Reserve the correct intrinsic aspect ratio for every brand logo to avoid layout shift.
html=html.replace(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi,tag=>{
  const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
  return cleaned.replace(/>$/, ' width="2172" height="724">');
});

// Structured data is generated into the deploy artifact so crawlers always receive
// the same canonical website/calculator identity as the visible production page.
html=html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-plotao-schema=["']1["']>[\s\S]*?<\/script>/gi,'');
const schemaTag=`<script type="application/ld+json" data-plotao-schema="1">${JSON.stringify(structuredData)}</script>`;

// Keep X/Twitter metadata deterministic even if the source template is edited later.
html=html.replace(/<meta\s+name=["']twitter:(?:card|title|description)["'][^>]*>/gi,'');
const socialMeta='<meta name="twitter:card" content="summary"><meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz"><meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">';

// Deploy identity is generated per build and never persisted in the repository source.
html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');
if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
html=html.replace('</head>',schemaTag+socialMeta+`<meta name="plotao-deploy" content="${sha}"></head>`);

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');
console.log(`Pages build prepared from clean source: ${activeScripts.length} content-versioned modules, SHA ${sha}`);
