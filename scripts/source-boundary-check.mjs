import fs from 'node:fs';
import {forbiddenArtifact,legacyInlineSentinels} from './pages-manifest.mjs';

const assetFiles=fs.readdirSync('assets').filter(f=>f.endsWith('.js'));
const failures=[];
for(const file of assetFiles){
  const src=fs.readFileSync(`assets/${file}`,'utf8');
  for(const token of forbiddenArtifact){
    if(src.includes(token)) failures.push(`${file}: forbidden legacy artifact token leaked into active asset: ${token}`);
  }
}
const index=fs.readFileSync('index.html','utf8');
for(const token of legacyInlineSentinels){
  if(!index.includes(token)) failures.push(`index.html: expected legacy token disappeared; migrate prepare-pages.mjs before removing it: ${token}`);
}
if(failures.length){
  console.error('Source boundary checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`Source boundary checks OK: ${assetFiles.length} active JS assets contain no forbidden legacy artifact tokens`);
