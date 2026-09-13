import fs from 'node:fs';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const html=fs.readFileSync('index.html','utf8');
const marker=fs.readFileSync('deploy-marker.txt','utf8').trim();
const required=[...activeScripts,...requiredArtifact];
const missing=required.filter(x=>!html.includes(x));
const leaked=forbiddenArtifact.filter(x=>html.includes(x));
if(missing.length||leaked.length||!marker||marker==='unknown') throw new Error(`Pages artifact integrity failed; missing=${JSON.stringify(missing)}; legacy=${JSON.stringify(leaked)}; marker=${JSON.stringify(marker)}`);

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

const scriptSources=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)].map(match=>match[1]);
const normalizedSources=scriptSources.map(src=>src.split('?')[0]);
const managedSources=normalizedSources.filter(src=>activeScripts.includes(src));
const duplicateSources=managedSources.filter((src,index)=>managedSources.indexOf(src)!==index);
if(duplicateSources.length) throw new Error(`Pages artifact contains duplicate managed scripts: ${JSON.stringify([...new Set(duplicateSources)])}`);
if(managedSources.length!==activeScripts.length||managedSources.some((src,index)=>src!==activeScripts[index])){
  throw new Error(`Pages artifact script order differs from manifest; expected=${JSON.stringify(activeScripts)} actual=${JSON.stringify(managedSources)}`);
}

const posGeo=html.indexOf('/assets/geometry-v3.js'),posGuard=html.indexOf('/assets/geometry-validity-v1.js'),posPanel=html.indexOf('/assets/panel-pricing-v5.js');
if(!(posGeo>=0&&posGeo<posGuard&&posGuard<posPanel)) throw new Error('Geometry validity guard must load after geometry and before pricing modules');
console.log(`Pages artifact integrity OK: ${marker}; ${activeScripts.length} active modules and structured data verified`);
