import fs from 'node:fs';
import {forbiddenArtifact} from './pages-manifest.mjs';

const assetFiles=fs.readdirSync('assets').filter(f=>f.endsWith('.js'));
const failures=[];
for(const file of assetFiles){
  const src=fs.readFileSync(`assets/${file}`,'utf8');
  for(const token of forbiddenArtifact){
    if(src.includes(token)) failures.push(`${file}: forbidden legacy artifact token leaked into active asset: ${token}`);
  }
}
let index=fs.readFileSync('index.html','utf8');
for(const token of forbiddenArtifact){
  if(index.includes(token)) failures.push(`index.html: forbidden legacy token returned to source: ${token}`);
}
if(failures.length){
  console.error('Source boundary checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}

// Production cache bust: every deployment gets a unique footer stylesheet URL,
// so mobile browsers cannot keep serving an older footer/mobile-price layout.
const deployVersion=(process.env.GITHUB_SHA||Date.now().toString(36)).slice(0,12);
index=index.replace(/\/assets\/footer-2026\.css(?:\?v=[^"']*)?/g,`/assets/footer-2026.css?v=${deployVersion}`);
fs.writeFileSync('index.html',index,'utf8');

console.log(`Source boundary checks OK: clean index source and ${assetFiles.length} active JS assets contain no forbidden legacy artifact tokens; footer CSS version=${deployVersion}`);
