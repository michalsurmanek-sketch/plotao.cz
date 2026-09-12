import fs from 'node:fs';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const html=fs.readFileSync('index.html','utf8');
const marker=fs.readFileSync('deploy-marker.txt','utf8').trim();
const required=[...activeScripts,...requiredArtifact];
const missing=required.filter(x=>!html.includes(x));
const leaked=forbiddenArtifact.filter(x=>html.includes(x));
if(missing.length||leaked.length||!marker||marker==='unknown') throw new Error(`Pages artifact integrity failed; missing=${JSON.stringify(missing)}; legacy=${JSON.stringify(leaked)}; marker=${JSON.stringify(marker)}`);
const posGeo=html.indexOf('/assets/geometry-v3.js'),posGuard=html.indexOf('/assets/geometry-validity-v1.js'),posPanel=html.indexOf('/assets/panel-pricing-v5.js');
if(!(posGeo>=0&&posGeo<posGuard&&posGuard<posPanel)) throw new Error('Geometry validity guard must load after geometry and before pricing modules');
console.log(`Pages artifact integrity OK: ${marker}; ${activeScripts.length} active modules verified`);
