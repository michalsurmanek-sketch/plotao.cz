import fs from 'node:fs';

const root='dist';
const landingPages=[
  'panelovy-plot.html','pletivovy-plot.html','betonovy-plot.html','hlinikovy-plot.html','plot-na-soukromi.html',
  'gabionovy-plot.html','kovovy-plot.html','zdeny-plot.html','mobilni-oploceni.html','specialni-oploceni.html'
];
const types=value=>Array.isArray(value)?value:[value];
const hasType=(node,type)=>types(node?.['@type']).includes(type);

for(const file of landingPages){
  const path=`${root}/${file}`;
  if(!fs.existsSync(path))throw new Error(`Structured data artifact check: missing ${path}`);
  const html=fs.readFileSync(path,'utf8');
  const flat=[];
  let count=0;
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    count++;
    let data;
    try{data=JSON.parse(match[1])}catch{throw new Error(`Structured data artifact check: invalid JSON-LD in ${file}`)}
    flat.push(...(Array.isArray(data?.['@graph'])?data['@graph']:[data]));
  }
  if(!count)throw new Error(`Structured data artifact check: no JSON-LD in ${file}`);
  if(flat.some(node=>hasType(node,'FAQPage')))throw new Error(`Structured data artifact check: deprecated FAQPage remained in ${file}`);
  if(!flat.some(node=>hasType(node,'BreadcrumbList')))throw new Error(`Structured data artifact check: BreadcrumbList missing in ${file}`);
}

console.log(`Structured data artifact OK: ${landingPages.length} discovery landing pages keep BreadcrumbList and expose no deprecated FAQPage nodes`);
