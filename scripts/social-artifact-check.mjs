import fs from 'node:fs';

const root='dist';
const pages={
  'index.html':{image:'panelovy-3d.webp'},
  'typy-plotu.html':{image:'panelovy-3d.webp'},
  'panelovy-plot.html':{image:'panelovy-3d.webp'},
  'pletivovy-plot.html':{image:'pletivovy.webp'},
  'betonovy-plot.html':{image:'betonovy.webp'},
  'hlinikovy-plot.html':{image:'hlinikovy.webp'},
  'plot-na-soukromi.html':{image:'soukromi-lamely.webp'},
  'gabionovy-plot.html':{image:'gabionovy.webp'},
  'kovovy-plot.html':{image:'category-metal.webp'},
  'zdeny-plot.html':{image:'category-masonry.webp'},
  'mobilni-oploceni.html':{image:'category-mobile.webp'},
  'specialni-oploceni.html':{image:'category-other.webp'}
};

function webpSize(file){
  const b=fs.readFileSync(file);
  if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error(`Social artifact: invalid WebP ${file}`);
  const chunk=b.toString('ascii',12,16);
  if(chunk==='VP8X')return{width:1+b.readUIntLE(24,3),height:1+b.readUIntLE(27,3)};
  if(chunk==='VP8L'){
    if(b[20]!==0x2f)throw new Error(`Social artifact: invalid VP8L signature ${file}`);
    const bits=b.readUInt32LE(21);
    return{width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
  }
  if(chunk==='VP8 '){
    if(b[23]!==0x9d||b[24]!==0x01||b[25]!==0x2a)throw new Error(`Social artifact: invalid VP8 signature ${file}`);
    return{width:b.readUInt16LE(26)&0x3fff,height:b.readUInt16LE(28)&0x3fff};
  }
  throw new Error(`Social artifact: unsupported WebP chunk ${JSON.stringify(chunk)} in ${file}`);
}

function count(html,token){
  return html.split(token).length-1;
}

for(const [page,{image}] of Object.entries(pages)){
  const htmlFile=`${root}/${page}`;
  const imageFile=`${root}/assets/fence-types/${image}`;
  const imageUrl=`https://plotao.cz/assets/fence-types/${image}`;
  if(!fs.existsSync(htmlFile))throw new Error(`Social artifact: missing page ${page}`);
  if(!fs.existsSync(imageFile))throw new Error(`Social artifact: missing image ${image}`);
  const {width,height}=webpSize(imageFile);
  if(width<300||height<180)throw new Error(`Social artifact: card image too small ${image} (${width}x${height})`);
  const html=fs.readFileSync(htmlFile,'utf8');
  const required=[
    '<meta property="og:locale" content="cs_CZ">',
    '<meta property="og:site_name" content="PLOTAO.cz">',
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:secure_url" content="${imageUrl}">`,
    '<meta property="og:image:type" content="image/webp">',
    `<meta property="og:image:width" content="${width}">`,
    `<meta property="og:image:height" content="${height}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${imageUrl}">`
  ];
  for(const token of required)if(!html.includes(token))throw new Error(`Social artifact: ${page} missing ${token}`);
  for(const key of ['property="og:image"','property="og:image:secure_url"','property="og:image:width"','property="og:image:height"','name="twitter:card"','name="twitter:image"']){
    if(count(html,key)!==1)throw new Error(`Social artifact: ${page} must contain exactly one ${key}`);
  }
  const ogAlt=html.match(/<meta\b[^>]*property=["']og:image:alt["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  const twitterAlt=html.match(/<meta\b[^>]*name=["']twitter:image:alt["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  if(!ogAlt||!twitterAlt)throw new Error(`Social artifact: ${page} image alt metadata must be non-empty`);
  if(!/<meta\b[^>]*property=["']og:title["'][^>]*content=["'][^"']+["'][^>]*>/i.test(html))throw new Error(`Social artifact: ${page} missing og:title`);
  if(!/<meta\b[^>]*property=["']og:description["'][^>]*content=["'][^"']+["'][^>]*>/i.test(html))throw new Error(`Social artifact: ${page} missing og:description`);
  if(!/<meta\b[^>]*name=["']twitter:title["'][^>]*content=["'][^"']+["'][^>]*>/i.test(html))throw new Error(`Social artifact: ${page} missing twitter:title`);
  if(!/<meta\b[^>]*name=["']twitter:description["'][^>]*content=["'][^"']+["'][^>]*>/i.test(html))throw new Error(`Social artifact: ${page} missing twitter:description`);
}

console.log(`Social artifact checks OK: ${Object.keys(pages).length} discovery pages expose unique, reachable-build image metadata with verified WebP dimensions`);
