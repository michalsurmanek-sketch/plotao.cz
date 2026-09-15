import fs from 'node:fs';

const root='dist';
const landingPages=[
  'panelovy-plot.html','pletivovy-plot.html','betonovy-plot.html','hlinikovy-plot.html','plot-na-soukromi.html',
  'gabionovy-plot.html','kovovy-plot.html','zdeny-plot.html','mobilni-oploceni.html','specialni-oploceni.html'
];
const typeList=value=>Array.isArray(value)?value:[value];
const isType=(node,type)=>typeList(node?.['@type']).includes(type);

let removed=0;
for(const file of landingPages){
  const path=`${root}/${file}`;
  if(!fs.existsSync(path))throw new Error(`Structured data sanitization: missing ${path}`);
  let html=fs.readFileSync(path,'utf8');
  let scripts=0;
  html=html.replace(/<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,(full,before,after,json)=>{
    scripts++;
    let data;
    try{data=JSON.parse(json)}catch{throw new Error(`Structured data sanitization: invalid JSON-LD in ${file}`)}
    if(isType(data,'FAQPage')){
      removed++;
      return '';
    }
    if(Array.isArray(data?.['@graph'])){
      const beforeCount=data['@graph'].length;
      data['@graph']=data['@graph'].filter(node=>!isType(node,'FAQPage'));
      removed+=beforeCount-data['@graph'].length;
    }
    return `<script${before}type="application/ld+json"${after}>${JSON.stringify(data)}</script>`;
  });
  if(!scripts)throw new Error(`Structured data sanitization: no JSON-LD found in ${file}`);

  const parsed=[];
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    let data;
    try{data=JSON.parse(match[1])}catch{throw new Error(`Structured data sanitization: output JSON-LD invalid in ${file}`)}
    parsed.push(...(Array.isArray(data?.['@graph'])?data['@graph']:[data]));
  }
  if(parsed.some(node=>isType(node,'FAQPage')))throw new Error(`Structured data sanitization: FAQPage remained in ${file}`);
  if(!parsed.some(node=>isType(node,'BreadcrumbList')))throw new Error(`Structured data sanitization: BreadcrumbList missing in ${file}`);
  fs.writeFileSync(path,html,'utf8');
}

console.log(`Structured data sanitized: removed ${removed} deprecated FAQPage node(s) from ${landingPages.length} discovery landing pages; BreadcrumbList preserved`);
await import('./enrich-config-headers.mjs');
await import('./unify-config-icons.mjs');
await import('./dedupe-header-shop.mjs');
