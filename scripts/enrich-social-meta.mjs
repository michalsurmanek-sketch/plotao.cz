import fs from 'node:fs';

const root='dist';
const socialPages={
  'index.html':{image:'panelovy-3d.webp',alt:'Panelový 3D plot – ukázka typu oplocení v kalkulátoru PLOTAO.cz'},
  'typy-plotu.html':{image:'panelovy-3d.webp',alt:'Přehled typů oplocení a kalkulace na PLOTAO.cz'},
  'panelovy-plot.html':{image:'panelovy-3d.webp',alt:'Panelový 3D plot – panelové oplocení PLOTAO.cz'},
  'pletivovy-plot.html':{image:'pletivovy.webp',alt:'Pletivový plot – pletivové oplocení PLOTAO.cz'},
  'betonovy-plot.html':{image:'betonovy.webp',alt:'Betonový plot – betonové oplocení PLOTAO.cz'},
  'hlinikovy-plot.html':{image:'hlinikovy.webp',alt:'Hliníkový plot – hliníkové oplocení PLOTAO.cz'},
  'plot-na-soukromi.html':{image:'soukromi-lamely.webp',alt:'Plot na soukromí s lamelovou výplní – PLOTAO.cz'},
  'gabionovy-plot.html':{image:'gabionovy.webp',alt:'Gabionový plot – gabionové oplocení PLOTAO.cz'},
  'kovovy-plot.html':{image:'category-metal.webp',alt:'Kovový plot – kovové oplocení PLOTAO.cz'},
  'zdeny-plot.html':{image:'category-masonry.webp',alt:'Zděný plot – zděné oplocení PLOTAO.cz'},
  'mobilni-oploceni.html':{image:'category-mobile.webp',alt:'Mobilní oplocení – přenosné plotové panely PLOTAO.cz'},
  'specialni-oploceni.html':{image:'category-other.webp',alt:'Speciální a atypické oplocení – PLOTAO.cz'}
};

function webpSize(file){
  const b=fs.readFileSync(file);
  if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error(`Social metadata: ${file} is not a valid WebP`);
  const chunk=b.toString('ascii',12,16);
  if(chunk==='VP8X')return{width:1+b.readUIntLE(24,3),height:1+b.readUIntLE(27,3),chunk};
  if(chunk==='VP8L'){
    if(b[20]!==0x2f)throw new Error(`Social metadata: invalid VP8L signature in ${file}`);
    const bits=b.readUInt32LE(21);
    return{width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1,chunk};
  }
  if(chunk==='VP8 '){
    if(b[23]!==0x9d||b[24]!==0x01||b[25]!==0x2a)throw new Error(`Social metadata: invalid VP8 frame signature in ${file}`);
    return{width:b.readUInt16LE(26)&0x3fff,height:b.readUInt16LE(28)&0x3fff,chunk};
  }
  throw new Error(`Social metadata: unsupported WebP chunk ${JSON.stringify(chunk)} in ${file}`);
}

function titleOf(html){
  return html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim()||'';
}
function descriptionOf(html){
  return html.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i)?.[1]?.trim()||'';
}

let count=0;
for(const [page,{image,alt}] of Object.entries(socialPages)){
  const htmlPath=`${root}/${page}`;
  const imagePath=`${root}/assets/fence-types/${image}`;
  const imageUrl=`https://plotao.cz/assets/fence-types/${image}`;
  if(!fs.existsSync(htmlPath))throw new Error(`Social metadata: page is missing: ${htmlPath}`);
  if(!fs.existsSync(imagePath))throw new Error(`Social metadata: image is missing: ${imagePath}`);
  const {width,height}=webpSize(imagePath);
  if(width<300||height<180)throw new Error(`Social metadata: ${image} is too small for a reviewed card (${width}x${height})`);

  let html=fs.readFileSync(htmlPath,'utf8');
  if(!html.includes('</head>'))throw new Error(`Social metadata: </head> missing in ${page}`);
  const title=titleOf(html),description=descriptionOf(html);
  if(!title||!description)throw new Error(`Social metadata: ${page} must expose title and meta description before enrichment`);

  html=html
    .replace(/<meta\b[^>]*\bproperty=["']og:(?:image(?::(?:secure_url|type|width|height|alt))?|locale|site_name)["'][^>]*>/gi,'')
    .replace(/<meta\b[^>]*\bname=["']twitter:(?:card|image|image:alt)["'][^>]*>/gi,'');

  const hasTwitterTitle=/<meta\b[^>]*\bname=["']twitter:title["'][^>]*>/i.test(html);
  const hasTwitterDescription=/<meta\b[^>]*\bname=["']twitter:description["'][^>]*>/i.test(html);
  const tags=[
    '<meta property="og:locale" content="cs_CZ">',
    '<meta property="og:site_name" content="PLOTAO.cz">',
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:secure_url" content="${imageUrl}">`,
    '<meta property="og:image:type" content="image/webp">',
    `<meta property="og:image:width" content="${width}">`,
    `<meta property="og:image:height" content="${height}">`,
    `<meta property="og:image:alt" content="${alt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    ...(hasTwitterTitle?[]:[`<meta name="twitter:title" content="${title}">`]),
    ...(hasTwitterDescription?[]:[`<meta name="twitter:description" content="${description}">`]),
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${alt}">`
  ].join('');

  html=html.replace('</head>',tags+'</head>');
  fs.writeFileSync(htmlPath,html,'utf8');

  const finalHtml=fs.readFileSync(htmlPath,'utf8');
  for(const token of [
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="${width}">`,
    `<meta property="og:image:height" content="${height}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${imageUrl}">`
  ])if(!finalHtml.includes(token))throw new Error(`Social metadata: ${page} output missing ${token}`);
  count++;
}

console.log(`Social metadata OK: ${count} public discovery pages have verified page-specific WebP Open Graph and large Twitter cards`);
