import fs from 'node:fs';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const path='index.html';
let html=fs.readFileSync(path,'utf8');
const sha=process.env.GITHUB_SHA||'unknown';

const legacy=forbiddenArtifact.filter(token=>html.includes(token));
if(legacy.length) throw new Error(`Pages build refuses legacy source: ${JSON.stringify(legacy)}`);
const sourceRequired=requiredArtifact.filter(token=>token!=='name="plotao-deploy"');
const missingSource=sourceRequired.filter(token=>!html.includes(token));
if(missingSource.length) throw new Error(`Pages build source missing current required content: ${JSON.stringify(missingSource)}`);

if(!html.includes('</body>')) throw new Error('Pages build: </body> not found');
// Source HTML may already contain some active modules. Remove every managed tag first,
// then inject the complete manifest once so dependency order is deterministic.
for(const src of activeScripts){
  const escaped=src.replace(/[.*+?^${}()|[\]\\]/g,'\\for(const src of activeScripts){
  const tag=`<script src="${src}"></script>`;
  html=html.split(tag).join('');
}
const orderedScripts=activeScripts.map(src=>`<script src="${src}"></script>`).join('');');
  html=html.replace(new RegExp(`<script\\\\b[^>]*\\\\bsrc=["']${escaped}(?:\\\\?[^"']*)?["'][^>]*><\\\\/script>`,'gi'),'');
}
const version=sha.slice(0,12);
const orderedScripts=activeScripts.map(src=>`<script src="${src}?v=${version}"></script>`).join('');
html=html.replace('</body>',orderedScripts+'</body>');

if(!html.includes('<main class="wrap" id="kalkulator">')) throw new Error('Pages build source missing calculator anchor');

// Deploy identity is generated per build and never persisted in the repository source.
html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');
if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
html=html.replace('</head>',`<meta name="plotao-deploy" content="${sha}"></head>`);

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');
console.log(`Pages build prepared from clean source: ${activeScripts.length} ordered modules, SHA ${sha}`);
