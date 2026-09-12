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

// Legacy inline pricing may still exist in index.html while it is being migrated.
// Its presence is reported, not required: removing a legacy token from source is progress
// and must never make CI fail or force prepare-pages to keep obsolete code alive.
const index=fs.readFileSync('index.html','utf8');
const remaining=legacyInlineSentinels.filter(token=>index.includes(token));
if(failures.length){
  console.error('Source boundary checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log(`Source boundary checks OK: ${assetFiles.length} active JS assets contain no forbidden legacy artifact tokens; ${remaining.length}/${legacyInlineSentinels.length} legacy inline sentinels remain in index.html`);
