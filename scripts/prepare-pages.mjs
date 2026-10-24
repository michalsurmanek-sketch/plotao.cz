import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {deflateSync,inflateSync} from 'node:zlib';
import {activeScripts,requiredArtifact,forbiddenArtifact} from './pages-manifest.mjs';

const sharedFooterMarker='<!-- PLOTAO_SHARED_FOOTER -->';
const sharedFooterTemplate=fs.readFileSync('partials/plotao-footer.html','utf8').trim();
if(!sharedFooterTemplate.startsWith('<footer id="plotaoFooter2026"'))throw new Error('Shared footer partial is missing or malformed');
const path='index.html';
let html=fs.readFileSync(path,'utf8').replaceAll(sharedFooterMarker,sharedFooterTemplate);
const sha=process.env.GITHUB_SHA||'unknown';
const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {
      '@type':'WebSite',
      '@id':'https://plotao.cz/#website',
      url:'https://plotao.cz/',
      name:'PLOTAO.cz',
      inLanguage:'cs'
    },
    {
      '@type':'WebApplication',
      '@id':'https://plotao.cz/#calculator',
      url:'https://plotao.cz/#kalkulator',
      name:'Kalkulátor ceny plotu a materiálu',
      applicationCategory:'BusinessApplication',
      operatingSystem:'Web',
      isAccessibleForFree:true,
      inLanguage:'cs',
      description:'Kalkulátor materiálového rozpočtu oplocení podle typu, výšky, úseků a otvorů.'
    }
  ]
};

const PNG_SIGNATURE=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
function parsePng(buffer,label='image'){
  if(buffer.length<20||!buffer.subarray(0,8).equals(PNG_SIGNATURE))throw new Error(`${label} optimization: embedded image is not a valid PNG`);
  const chunks=[];let offset=8;
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),end=offset+12+length;
    if(end>buffer.length)throw new Error(`${label} optimization: truncated PNG chunk`);
    const type=buffer.toString('ascii',offset+4,offset+8);
    chunks.push({type,data:buffer.subarray(offset+8,offset+8+length),raw:buffer.subarray(offset,end)});
    offset=end;if(type==='IEND')break;
  }
  if(!chunks.some(c=>c.type==='IHDR')||!chunks.some(c=>c.type==='IDAT')||!chunks.some(c=>c.type==='IEND'))throw new Error(`${label} optimization: PNG is missing required chunks`);
  return chunks;
}
function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
  return (crc^0xffffffff)>>>0;
}
function makePngChunk(type,data){
  const name=Buffer.from(type,'ascii'),out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([name,data])),8+data.length);
  return out;
}
function optimizeEmbeddedPngSvg(file,label){
  const svg=fs.readFileSync(file,'utf8'),match=svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if(!match)throw new Error(`${label} optimization: embedded PNG not found`);
  const png=Buffer.from(match[1],'base64'),chunks=parsePng(png,label),idat=Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data));
  const raw=inflateSync(idat),rawHash=createHash('sha256').update(raw).digest('hex'),repacked=deflateSync(raw,{level:9});
  const removable=new Set(['caBX','eXIf','tEXt','zTXt','iTXt','tIME']);
  let idatWritten=false;const output=[PNG_SIGNATURE];
  for(const chunk of chunks){
    if(chunk.type==='IDAT'){
      if(!idatWritten){output.push(makePngChunk('IDAT',repacked));idatWritten=true}
      continue;
    }
    if(removable.has(chunk.type))continue;
    output.push(chunk.raw);
  }
  const optimizedPng=Buffer.concat(output),optimizedChunks=parsePng(optimizedPng,label);
  const optimizedRaw=inflateSync(Buffer.concat(optimizedChunks.filter(c=>c.type==='IDAT').map(c=>c.data)));
  const optimizedHash=createHash('sha256').update(optimizedRaw).digest('hex');
  if(rawHash!==optimizedHash||raw.length!==optimizedRaw.length)throw new Error(`${label} optimization changed decoded image data`);
  const optimizedSvg=svg.replace(match[1],optimizedPng.toString('base64'));
  if(Buffer.byteLength(optimizedSvg)>=Buffer.byteLength(svg))throw new Error(`${label} optimization did not reduce the production asset`);
  fs.writeFileSync(file,optimizedSvg,'utf8');
  return{kind:'embedded-png',before:Buffer.byteLength(svg),after:Buffer.byteLength(optimizedSvg),pngBefore:png.length,pngAfter:optimizedPng.length};
}
function prepareMainLogo(file){
  const svg=fs.readFileSync(file,'utf8'),size=Buffer.byteLength(svg);
  if(/data:image\/png;base64,/i.test(svg))return optimizeEmbeddedPngSvg(file,'Logo');
  if(!/viewBox=["']0 0 2172 724["']/i.test(svg))throw new Error('Logo validation: vector logo must preserve the 2172x724 canvas');
  if(/<image\b/i.test(svg)||/data:image\//i.test(svg))throw new Error('Logo validation: vector logo must not embed raster images');
  if(!svg.includes('#17202A')||!svg.includes('#F28817'))throw new Error('Logo validation: vector logo must preserve reviewed antracit/orange brand colors');
  if(size>=10000)throw new Error(`Logo validation: vector logo is unexpectedly large: ${size} bytes`);
  return{kind:'vector',before:size,after:size};
}

const legacy=forbiddenArtifact.filter(token=>html.includes(token));
if(legacy.length) throw new Error(`Pages build refuses legacy source: ${JSON.stringify(legacy)}`);
const sourceRequired=requiredArtifact.filter(token=>token!=='name="plotao-deploy"');
const missingSource=sourceRequired.filter(token=>!html.includes(token));
if(missingSource.length) throw new Error(`Pages build source missing current required content: ${JSON.stringify(missingSource)}`);

if(!html.includes('</body>')) throw new Error('Pages build: </body> not found');
html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,(tag,src)=>{
  const cleanSrc=src.split('?')[0];
  return activeScripts.includes(cleanSrc)?'':tag;
});
const assetVersion=src=>createHash('sha256').update(fs.readFileSync('.'+src)).digest('hex').slice(0,12);
const versionedScript=src=>`${src}?v=${assetVersion(src)}`;
// Classic defer scripts download without blocking HTML parsing, execute in manifest
// order, and still complete before DOMContentLoaded. This preserves global dependencies.
const orderedScripts=activeScripts.map(src=>`<script defer src="${versionedScript(src)}"></script>`).join('');
html=html.replace('</body>',orderedScripts+'</body>');

if(!html.includes('<main class="wrap" id="kalkulator">')) throw new Error('Pages build source missing calculator anchor');
html=html.replace(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/gi,tag=>{
  const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
  return cleaned.replace(/>$/, ' width="2172" height="724">');
});

const shopLink='<a class="shop-link" data-plotao-shop-link="1" href="/eshop.html" aria-label="Otevřít e-shop PLOTAO">E-shop</a>';
if(!html.includes('data-plotao-shop-link="1"')){
  html=html.replace(/(<header class="head">[\s\S]*?<a class="logo" href="\/">[\s\S]*?<\/a>)/i,`$1${shopLink}`);
}
if(!html.includes('data-plotao-shop-link="1"'))throw new Error('Pages build: homepage E-shop link injection failed');
const shopCss='<style data-plotao-shop-link-style="1">.head .shop-link{height:42px;display:inline-flex;align-items:center;justify-content:center;margin-left:auto;margin-right:8px;padding:0 16px;border-radius:999px;background:var(--o);color:#fff;text-decoration:none;font-weight:900;box-shadow:0 8px 20px #f0782833;white-space:nowrap}.head .shop-link:hover,.head .shop-link:focus-visible{filter:brightness(.97);outline:3px solid #f0782844;outline-offset:2px}@media(max-width:680px){.head .logo img{width:145px}.head .shop-link{height:40px;padding:0 10px;margin-right:6px;font-size:13px}.head .help{padding:8px 10px;font-size:12px;white-space:nowrap}}@media(max-width:430px){.head{gap:6px}.head .logo img{width:130px}.head .shop-link{height:38px;padding:0 9px;margin-right:0}.head .help{height:38px;padding:0 9px}}</style>';

const logoStats=prepareMainLogo('assets/logo-plotao.svg');
const faviconStats=optimizeEmbeddedPngSvg('assets/favicon.svg','Favicon');

html=html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-plotao-schema=["']1["']>[\s\S]*?<\/script>/gi,'');
const schemaTag=`<script type="application/ld+json" data-plotao-schema="1">${JSON.stringify(structuredData)}</script>`;
html=html.replace(/<meta\s+name=["']twitter:(?:card|title|description)["'][^>]*>/gi,'');
const socialMeta='<meta name="twitter:card" content="summary"><meta name="twitter:title" content="Kalkulátor ceny plotu a materiálu | PLOTAO.cz"><meta name="twitter:description" content="Ověřený materiálový rozpočet plotu podle typu, výšky, úseků a otvorů.">';

// Start only the small dependency-critical prefix early. Deferred execution remains
// in manifest order; preloads only remove download wait for the dependency prefix.
html=html.replace(/<link\s+rel=["']preload["'][^>]*data-plotao-critical=["'][^"']*["'][^>]*>/gi,'');
const criticalScripts=activeScripts.slice(0,8);
const criticalPreloads=criticalScripts.map(src=>`<link rel="preload" as="script" href="${versionedScript(src)}" data-plotao-critical="1">`).join('');

html=html.replace(/<meta name="plotao-deploy" content="[^"]*">/g,'');
if(!html.includes('</head>')) throw new Error('Pages build: </head> not found');
html=html.replace('</head>',criticalPreloads+schemaTag+socialMeta+shopCss+`<meta name="plotao-deploy" content="${sha}"></head>`);

fs.writeFileSync(path,html,'utf8');
fs.writeFileSync('deploy-marker.txt',sha+'\n','utf8');

const dist='dist';
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
const sharedHeaderTemplate=fs.readFileSync('partials/eshop-header.html','utf8').trim().replace(/<img\b[^>]*\bsrc=["']\/assets\/logo-plotao\.svg["'][^>]*>/i,tag=>{const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');return cleaned.replace(/>$/, ' width="2172" height="724">')});

// All shared-header destinations must select the same deployment, including
// Inspiration, which is an anchor on the shop landing page.
function versionSharedHeader(markup){
  return markup.replace(/href="(\/[^"]*)"/g,(attribute,href)=>{
    const url=new URL(href,'https://plotao.cz');
    if(!url.pathname.endsWith('.html')&&!(url.pathname==='/'&&url.searchParams.get('from')==='eshop'))return attribute;
    url.searchParams.set('v',sha.slice(0,12));
    return 'href="'+url.pathname+url.search+url.hash+'"';
  });
}

function sharedHeaderActiveHref(page,file){
  const sourceHeader=page.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0]||'';
  const nav=sourceHeader.match(/<nav\b[^>]*class=["'][^"']*\bmain-nav\b[^"']*["'][\s\S]*?<\/nav>/i)?.[0];
  const active=nav?.match(/<a\b(?=[^>]*\bclass=["'][^"']*\bactive\b[^"']*["'])[^>]*\bhref=["']([^"']+)["']/i);
  if(active)return active[1];
  const exact={
    'eshop.html':'/eshop.html','eshop-produkty.html':'/eshop-produkty.html',
    'eshop-panely.html':'/eshop-panely.html','komponenty.html':'/komponenty.html',
    'eshop-brany.html':'/eshop-brany.html','doprava.html':'/doprava.html',
    'kontakt.html':'/kontakt.html','inspirace.html':'/inspirace.html'
  };
  if(exact[file])return exact[file];
  if(/^eshop-(?:beton|gabiony|hlinik|pletivo|soukromi)\.html$/.test(file))return '/eshop-panely.html';
  if(/^navod-/.test(file)||file==='navody-a-rady.html')return '/navod-montaz-paneloveho-plotu.html';
  if(/^(?:betonovy|gabionovy|hlinikovy|kovovy|panelovy|pletivovy|zdeny)-plot\.html$/.test(file)||file==='specialni-oploceni.html'||file==='mobilni-oploceni.html'||file==='plot-na-soukromi.html')return '/eshop-panely.html';
  if(file==='typy-plotu.html')return '/eshop-produkty.html';
  return null;
}
function applySharedEshopHeader(page,file){
  // Private workspaces and partner response flows keep their dedicated shells.
  if(file==='admin.html'||file==='partner-odpoved.html')return page;
  const activeHref=sharedHeaderActiveHref(page,file);
  let renderedHeader=sharedHeaderTemplate;
  if(activeHref){
    const activeLink='<a href="'+activeHref+'">';
    if(!sharedHeaderTemplate.includes(activeLink))throw new Error('Shared e-shop header: active link is not in canonical template: '+activeHref+' ('+file+')');
    renderedHeader=sharedHeaderTemplate.replace(activeLink,'<a class="active" href="'+activeHref+'">');
  }
  renderedHeader=versionSharedHeader(renderedHeader);
  let rendered=page.replace(/<a\b(?=[^>]*\bclass=["'][^"']*\bannouncement\b[^"']*["'])[^>]*>[\s\S]*?<\/a>/gi,'');
  const oldHeader=rendered.match(/<header\b[^>]*>[\s\S]*?<\/header>/i);
  if(oldHeader)rendered=rendered.replace(oldHeader[0],'');
  const body=rendered.match(/<body\b[^>]*>/i);
  if(!body)throw new Error('Shared e-shop header: body element missing in '+file);
  let insertAt=body.index+body[0].length;
  const afterBody=rendered.slice(insertAt);
  const skip=afterBody.match(/^\s*<a\b(?=[^>]*\bclass=["'][^"']*\bskip\b[^"']*["'])[^>]*>[\s\S]*?<\/a>/i);
  if(skip)insertAt+=skip[0].length;
  rendered=rendered.slice(0,insertAt)+renderedHeader+rendered.slice(insertAt);
  const newHeader=rendered.match(/<header class="site-header">[\s\S]*?<\/header>/i)?.[0]||'';
  const announcementCount=(rendered.match(/<a\b(?=[^>]*\bclass=["'][^"']*\bannouncement\b[^"']*["'])/gi)||[]).length;
  const headerCount=(rendered.match(/<header class="site-header">/gi)||[]).length;
  if(announcementCount!==1||headerCount!==1)throw new Error('Shared e-shop header: expected one promo bar and one shared header in '+file);
  if(!newHeader.includes('Poradíme vám')||!newHeader.includes('Košík'))throw new Error('Shared e-shop header: required controls missing in '+file);
  return rendered;
}

function parseCssBlocks(css){
  const blocks=[];let i=0;
  while(i<css.length){
    while(i<css.length&&/\s/.test(css[i]))i++;
    if(css.startsWith('/*',i)){const end=css.indexOf('*/',i+2);i=end<0?css.length:end+2;continue}
    const start=i;let quote='',comment=false,open=-1;
    for(;i<css.length;i++){
      const ch=css[i],next=css[i+1];
      if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
      if(quote){if(ch==='\\')i++;else if(ch===quote)quote='';continue}
      if(ch==='/'&&next==='*'){comment=true;i++;continue}
      if(ch==='"'||ch==="'"){quote=ch;continue}
      if(ch==='{'){open=i;break}
      if(ch===';'){i++;break}
    }
    if(open<0)continue;
    const head=css.slice(start,open).trim();i=open+1;let depth=1;quote='';comment=false;
    const bodyStart=i;
    for(;i<css.length&&depth;i++){
      const ch=css[i],next=css[i+1];
      if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
      if(quote){if(ch==='\\')i++;else if(ch===quote)quote='';continue}
      if(ch==='/'&&next==='*'){comment=true;i++;continue}
      if(ch==='"'||ch==="'"){quote=ch;continue}
      if(ch==='{')depth++;
      else if(ch==='}')depth--;
    }
    if(depth===0)blocks.push({head,body:css.slice(bodyStart,i-1)});
  }
  return blocks;
}
const headerClassPattern=/(^|[.#\s>+~])(?:announcement(?:-content|-dot|-arrow)?|site-header|header-main|brand|search-area|search(?:-suggestions|-suggestion(?:-empty)?)?|header-actions|header-action|cart-count|mobile-tools|mobile-search-icon|menu-button|main-nav|sr-only|wrap)(?=$|[.#\s>+~:\[])/i;
function scopeHeaderCss(css){
  return parseCssBlocks(css).map(({head,body})=>{
    if(/^@(media|supports|container|layer)\b/i.test(head)){
      const nested=scopeHeaderCss(body);
      return nested?head+'{'+nested+'}':'';
    }
    if(/^:root$/i.test(head))return '#eshopContextHeader{'+body+'}';
    const selected=head.split(',').map(s=>s.trim()).filter(s=>s&&(/^(?:a|button|input|\*|\[hidden\])$/i.test(s)||headerClassPattern.test(s)||/^#(?:shopSearch|searchStatus)\b/i.test(s)));
    return selected.map(s=>'#eshopContextHeader '+s+'{'+body+'}').join('');
  }).filter(Boolean).join('\n');
}
const shopHeaderCss=(()=>{const source=fs.readFileSync('eshop.html','utf8');const styles=[...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>scopeHeaderCss(m[1])).filter(Boolean).join('\n');return '#eshopContextHeader{display:contents;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:normal}#eshopContextHeader[hidden]{display:none!important}#eshopContextHeader:not([hidden])~header.head{display:none!important}#eshopContextHeader:not([hidden])~.mobile-price{display:none!important}#eshopContextHeader .main-nav a[href^=\"/?from=eshop\"].active:after{bottom:-30px!important}\n'+styles+'\n#eshopContextHeader:not([hidden]) .announcement{position:fixed!important;inset:0 0 auto!important;z-index:1200!important}#eshopContextHeader:not([hidden]) .site-header{position:fixed!important;top:var(--eshop-context-announcement-height,43px)!important;left:0!important;right:0!important;z-index:1199!important}body.from-eshop{padding-top:calc(var(--eshop-context-announcement-height,43px) + var(--eshop-context-header-height,165px))!important}#eshopContextHeader .announcement-content>span.announcement-mobile-copy{display:none!important}@media(max-width:600px){#eshopContextHeader .announcement-content>span.announcement-desktop-copy{display:none!important}#eshopContextHeader .announcement-content>span.announcement-mobile-copy{display:flex!important;flex:1 1 auto!important;align-items:center!important;gap:5px!important;min-width:0!important;overflow:hidden!important;white-space:nowrap!important}#eshopContextHeader .announcement-mobile-text{display:block!important;flex:1 1 auto!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}#eshopContextHeader strong.announcement-free{display:block!important;flex:0 0 auto!important;color:#ff9a42!important;font-size:14px!important;font-weight:900!important;letter-spacing:.02em!important}}body.from-eshop #kalkulator{scroll-margin-top:calc(var(--eshop-context-announcement-height,43px) + var(--eshop-context-header-height,165px) + 16px)}@media(max-width:1100px){#eshopContextHeader .header-main{width:calc(100% - clamp(40px,10.5vw,108px))!important;padding-left:0!important;padding-right:0!important}}@media(max-width:800px){#eshopContextHeader .brand img{transform:translateX(-8.7%)!important}}@media(min-width:801px){#eshopContextHeader .header-main{padding:0!important}#eshopContextHeader .main-nav .wrap{padding:0!important;height:100%!important}#eshopContextHeader .main-nav a{line-height:1.2!important}#eshopContextHeader .header-action{line-height:1.55!important}#eshopContextHeader .announcement{line-height:1!important}}'})();
function applyCalculatorEshopHeader(page){
  page=page.replace(/<style id="eshop-context-nav-style">[\s\S]*?<\/style>/i,'');
  page=page.replace(/<script id="eshop-context-nav-loader">[\s\S]*?<\/script>/i,'');
  if(!page.includes('<header class="head">'))throw new Error('Calculator page: native homepage header missing');
  if(page.includes('id="eshopContextHeader"'))throw new Error('Calculator page: duplicate e-shop context header');
  const loader='<script id="eshop-context-header-loader">(()=>{const root=document.getElementById("eshopContextHeader");const show=true;if(!root)return;root.hidden=!show;if(!show)return;document.body.classList.add("from-eshop");const announcement=root.querySelector(".announcement"),siteHeader=root.querySelector(".site-header");const syncHeaderLayout=()=>{const bannerHeight=announcement?.getBoundingClientRect().height||0;const headerHeight=siteHeader?.getBoundingClientRect().height||0;document.documentElement.style.setProperty("--eshop-context-announcement-height",bannerHeight+"px");document.documentElement.style.setProperty("--eshop-context-header-height",headerHeight+"px");document.documentElement.style.setProperty("--eshop-context-top-offset",bannerHeight+headerHeight+"px")};syncHeaderLayout();window.addEventListener("resize",syncHeaderLayout);const main=root.querySelector(".header-main"),nav=root.querySelector(".main-nav"),searchToggle=root.querySelector(".mobile-search-icon"),menuButton=root.querySelector(".menu-button");const configLink=[...nav.querySelectorAll("a")].find(link=>{const url=new URL(link.href,location.href);return url.pathname==="/"&&url.searchParams.get("from")==="eshop"});if(configLink){const setConfigActive=()=>nav.querySelectorAll("a").forEach(link=>link.classList.toggle("active",link===configLink));setConfigActive();window.addEventListener("hashchange",setConfigActive)}const setSearchOpen=(open,focus=false)=>{main.classList.toggle("search-open",open);document.body.classList.toggle("eshop-search-open",open);searchToggle.setAttribute("aria-expanded",String(open));searchToggle.setAttribute("aria-label",open?"Zavřít vyhledávání":"Otevřít vyhledávání");if(open&&focus)root.querySelector("#shopSearch").focus();else if(!open)root.querySelector("#shopSearch").blur()};searchToggle?.addEventListener("click",event=>{event.stopImmediatePropagation();const open=!main.classList.contains("search-open");setSearchOpen(open,open)},true);menuButton?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?"Zavřít menu":"Otevřít menu")});nav?.addEventListener("click",event=>{if(event.target.closest("a")){nav.classList.remove("open");menuButton?.setAttribute("aria-expanded","false")}})})();</script>';
  const injected='<div id="eshopContextHeader" hidden>'+versionSharedHeader(sharedHeaderTemplate)+'</div>'+loader;
  page=page.replace('<header class="head">',injected+'<header class="head">');

  // Reuse the canonical header rules inside the calculator wrapper too.
  // The body-child selectors otherwise never match this nested header.
  const canonicalCss=fs.readFileSync('assets/eshop-header-unified.css','utf8')
    .replaceAll('body>header.site-header','#eshopContextHeader>header.site-header')
    .replaceAll('body>a.announcement','#eshopContextHeader>a.announcement')
    .replace(/bottom:-30px!important/g,'bottom:0!important');
  const contextReset='#eshopContextHeader{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:normal}#eshopContextHeader .header-main,#eshopContextHeader .main-nav .wrap{max-width:none!important}#eshopContextHeader .main-nav a[href^="/?from=eshop"].active:after{bottom:0!important}';

  page=page.replace('</head>','<style id="eshop-context-header-styles">'+shopHeaderCss+'\n'+canonicalCss+'\n'+contextReset+'</style></head>');
  return page;
}

function applySharedHeaderThemeColor(page,file){
  if(file==='admin.html'||file==='partner-odpoved.html')return page;
  page=page.replace(/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/gi,'');
  if(!page.includes('</head>'))throw new Error('Shared e-shop header: head element missing in '+file);
  return page.replace('</head>','<meta name="theme-color" content="#064737"></head>');
}
const sharedHeaderController='<script data-plotao-shared-header-controller="1">(()=>{const headers=[...document.querySelectorAll("header.site-header")];if(!headers.length)return;const setMenuOpen=(header,open)=>{const nav=header.querySelector(".main-nav"),menu=header.querySelector(".menu-button");if(!nav)return;nav.classList.toggle("open",open);if(menu){menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Zavřít menu":"Otevřít menu")}};document.addEventListener("click",event=>{const menu=event.target.closest("header.site-header .menu-button");if(menu){const header=menu.closest("header.site-header"),nav=header?.querySelector(".main-nav");if(!nav)return;setMenuOpen(header,!nav.classList.contains("open"));event.preventDefault();event.stopImmediatePropagation();return}const link=event.target.closest("header.site-header .main-nav a");if(link){setMenuOpen(link.closest("header.site-header"),false);return}headers.forEach(header=>{if(!header.contains(event.target))setMenuOpen(header,false)})},true);document.addEventListener("keydown",event=>{if(event.key==="Escape")headers.forEach(header=>setMenuOpen(header,false))});const header=document.querySelector("body>header.site-header");if(!header)return;const searchToggle=header.querySelector(".mobile-search-icon"),main=header.querySelector(".header-main"),search=header.querySelector("#shopSearch");searchToggle?.addEventListener("click",event=>{event.stopImmediatePropagation();const open=!main.classList.contains("search-open");main.classList.toggle("search-open",open);document.body.classList.toggle("eshop-search-open",open);searchToggle.setAttribute("aria-expanded",String(open));searchToggle.setAttribute("aria-label",open?"Zavřít vyhledávání":"Otevřít vyhledávání");if(open)search?.focus();else search?.blur()},true)})();</script>';
for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html')).sort()){
  let page=fs.readFileSync(file,'utf8').replaceAll(sharedFooterMarker,sharedFooterTemplate);
  page=page.replace('</head>','<style data-plotao-desktop-product-images="1">@media(min-width:801px){.product-card>.product-image{overflow:hidden;min-height:0;grid-template-rows:minmax(0,1fr)}.product-card>.product-image>img{display:block;min-width:0;min-height:0;max-height:100%}}</style></head>');
  page=page.replace(/<script\b[^>]*\bsrc=["']\/assets\/product-cards\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
  page=page.replace('</body>','<script defer src="'+versionedScript('/assets/product-cards.js')+'"></script><script defer src="'+versionedScript('/assets/cart-v1.js')+'"></script></body>');
  page=page.replace('</head>','<style data-plotao-header-divider="1">body>header,#eshopContextHeader>header.site-header{box-shadow:0 1px 0 #08744366!important}</style></head>');
  page=page.replace('</head>','<style data-plotao-scrollbars="1">html,*{scrollbar-color:#087443 #edf2ee}::-webkit-scrollbar{width:12px;height:12px}::-webkit-scrollbar-track{background:#edf2ee}::-webkit-scrollbar-thumb{background:#087443;border:3px solid #edf2ee;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#064737}::-webkit-scrollbar-corner{background:#edf2ee}@media(forced-colors:active){html,*{scrollbar-color:auto}}</style></head>');
  page=file==='index.html'?applyCalculatorEshopHeader(page):applySharedEshopHeader(page,file);
  page=applySharedHeaderThemeColor(page,file);
  if(file!=='index.html'&&file!=='admin.html'&&file!=='partner-odpoved.html'&&!/href=["'][^"']*eshop-header-unified\.css/i.test(page)){
    page=page.replace('</head>','<link rel="stylesheet" href="/assets/eshop-header-unified.css?v='+sha.slice(0,12)+'"></head>');
  }
  page=page.replace(/(href=["']\/assets\/eshop-header-unified\.css\?v=)[^"']+(["'])/g,(match,prefix,suffix)=>prefix+sha.slice(0,12)+suffix);
  if(page.includes('<header class="site-header">')&&!page.includes('data-plotao-shared-header-controller="1"'))page=page.replace('</body>',sharedHeaderController+'</body>');
  if(!page.includes('</head>'))throw new Error('Favicon loader: missing </head> in '+file);
  if(!page.includes('data-plotao-no-tap-flash="1"'))page=page.replace('</head>','<style data-plotao-no-tap-flash="1">html,body,body *{-webkit-tap-highlight-color:transparent!important}</style></head>');
  if(!page.includes('data-plotao-favicon-loader="1"'))page=page.replace('</head>','<script defer data-plotao-favicon-loader="1" src="'+versionedScript('/assets/favicon-loader-v1.js')+'"></script></head>');
  fs.writeFileSync(dist+'/'+file,page,'utf8');
}
for(const file of ['robots.txt','sitemap.xml','CNAME','deploy-marker.txt'])if(fs.existsSync(file))fs.copyFileSync(file,`${dist}/${file}`);
fs.cpSync('assets',`${dist}/assets`,{recursive:true});

const eshopFile=`${dist}/eshop.html`;
if(fs.existsSync(eshopFile)){
  let eshop=fs.readFileSync(eshopFile,'utf8');
  eshop=eshop.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
  if(!eshop.includes('</head>'))throw new Error('E-shop build: </head> not found');
  eshop=eshop.replace('</head>','<link rel="canonical" href="https://plotao.cz/eshop.html"></head>');
  fs.writeFileSync(eshopFile,eshop,'utf8');
  if(!eshop.includes('<link rel="canonical" href="https://plotao.cz/eshop.html">'))throw new Error('E-shop build: canonical injection failed');
}

if(logoStats.kind==='vector')console.log(`Logo vector validated: ${logoStats.after} bytes; no embedded raster payload`);
else console.log(`Logo optimized losslessly: ${logoStats.before} -> ${logoStats.after} bytes (embedded PNG ${logoStats.pngBefore} -> ${logoStats.pngAfter})`);
console.log(`Favicon optimized losslessly: ${faviconStats.before} -> ${faviconStats.after} bytes (embedded PNG ${faviconStats.pngBefore} -> ${faviconStats.pngAfter})`);
console.log(`Deferred script execution prepared: ${activeScripts.length} content-versioned modules; ${criticalScripts.length} critical preloads; manifest order preserved`);
console.log(`Public Pages tree prepared in ${dist}/ with ${fs.readdirSync(dist).length} top-level entries; repository internals excluded`);
console.log(`Pages build prepared from clean source: ${activeScripts.length} content-versioned modules, SHA ${sha}`);
