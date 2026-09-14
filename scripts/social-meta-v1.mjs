import fs from 'node:fs';

const file='dist/index.html';
let html=fs.readFileSync(file,'utf8');
const image='https://plotao.cz/assets/og-plotao.svg';
const tags=[
  ['property','og:image',image],
  ['property','og:image:secure_url',image],
  ['property','og:image:type','image/svg+xml'],
  ['property','og:image:width','1200'],
  ['property','og:image:height','630'],
  ['property','og:image:alt','PLOTAO.cz – kalkulátor ceny plotu a materiálu'],
  ['name','twitter:card','summary_large_image'],
  ['name','twitter:image',image],
  ['name','twitter:image:alt','PLOTAO.cz – kalkulátor ceny plotu a materiálu']
];
for(const [,key] of tags){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  html=html.replace(new RegExp(`<meta\\s+(?:property|name)=["']${escaped}["'][^>]*>`,`gi`),'');
}
const rendered=tags.map(([kind,key,value])=>`<meta ${kind}="${key}" content="${value}">`).join('');
if(!html.includes('</head>'))throw new Error('Social metadata: </head> not found');
html=html.replace('</head>',rendered+'</head>');
fs.writeFileSync(file,html,'utf8');
console.log('Social metadata prepared: Open Graph + large Twitter image');
