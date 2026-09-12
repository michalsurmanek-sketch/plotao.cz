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
const index=fs.readFileSync('index.html','utf8');
for(const token of forbiddenArtifact){
  if(index.includes(token)) failures.push(`index.html: forbidden legacy token returned to source: ${token}`);
}
if(failures.length){
  console.error('Source boundary checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`Source boundary checks OK: clean index source and ${assetFiles.length} active JS assets contain no forbidden legacy artifact tokens`);
