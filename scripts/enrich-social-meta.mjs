import fs from 'node:fs';

const htmlPath='dist/index.html';
const imagePath='dist/assets/fence-types/panelovy-3d.webp';
const imageUrl='https://plotao.cz/assets/fence-types/panelovy-3d.webp';
const imageAlt='Panelový 3D plot – ukázka typu oplocení v kalkulátoru PLOTAO.cz';

if(!fs.existsSync(htmlPath))throw new Error('Social metadata: dist/index.html is missing');
if(!fs.existsSync(imagePath))throw new Error(`Social metadata: image is missing: ${imagePath}`);

function webpSize(file){
  const b=fs.readFileSync(file);
  if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error('Social metadata: social image is not a valid WebP');
  const chunk=b.toString('ascii',12,16);
  if(chunk!=='VP8X')throw new Error(`Social metadata: expected VP8X WebP, got ${chunk}`);
  const width=1+b.readUIntLE(24,3),height=1+b.readUIntLE(27,3);
  return{width,height};
}

const {width,height}=webpSize(imagePath);
if(width!==480||height!==300)throw new Error(`Social metadata: reviewed image dimensions changed (${width}x${height}); review social crop before deploy`);

let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('</head>'))throw new Error('Social metadata: </head> missing');

html=html
  .replace(/<meta\b[^>]*\bproperty=["']og:(?:image(?::(?:secure_url|type|width|height|alt))?|locale|site_name)["'][^>]*>/gi,'')
  .replace(/<meta\b[^>]*\bname=["']twitter:(?:card|image|image:alt)["'][^>]*>/gi,'');

const tags=[
  '<meta property="og:locale" content="cs_CZ">',
  '<meta property="og:site_name" content="PLOTAO.cz">',
  `<meta property="og:image" content="${imageUrl}">`,
  `<meta property="og:image:secure_url" content="${imageUrl}">`,
  '<meta property="og:image:type" content="image/webp">',
  `<meta property="og:image:width" content="${width}">`,
  `<meta property="og:image:height" content="${height}">`,
  `<meta property="og:image:alt" content="${imageAlt}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:image" content="${imageUrl}">`,
  `<meta name="twitter:image:alt" content="${imageAlt}">`
].join('');

html=html.replace('</head>',tags+'</head>');
fs.writeFileSync(htmlPath,html,'utf8');

const required=[
  `<meta property="og:image" content="${imageUrl}">`,
  `<meta property="og:image:width" content="${width}">`,
  `<meta property="og:image:height" content="${height}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:image" content="${imageUrl}">`
];
const finalHtml=fs.readFileSync(htmlPath,'utf8');
for(const token of required)if(!finalHtml.includes(token))throw new Error(`Social metadata: output missing ${token}`);

console.log(`Social metadata OK: ${imageUrl} (${width}x${height}) wired to Open Graph and Twitter cards`);
