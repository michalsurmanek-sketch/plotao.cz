import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='dist';
if(!fs.existsSync(root))throw new Error('Privacy UI: dist/ is missing');
const privacyPage='ochrana-osobnich-udaju.html';
const noPublicFooterPages=new Set([privacyPage,'nabidka-rozhodnuti.html']);
const publicHtml=fs.readdirSync(root).filter(name=>name.endsWith('.html')&&name!=='admin.html').sort();
let injectedCount=0;
const sharedFooterPath=path.join('partials','plotao-footer.html');
const sharedFooterSource=fs.readFileSync(sharedFooterPath,'utf8').trim();
if(!sharedFooterSource.startsWith('<footer id="plotaoFooter2026"')||!sharedFooterSource.includes('data-plotao-privacy-link="1"'))throw new Error('Unified footer: shared footer partial is missing its canonical markup or privacy link');
const canonicalFooter=sharedFooterSource.replace('href="#kalkulator"','href="/#kalkulator"').replace(/href="#partner"/g,'href="/#partner"');
const indexFile=path.join(root,'index.html');let index=fs.readFileSync(indexFile,'utf8');
const notice='<p class="privacy-note" data-plotao-privacy-notice="1">Údaje použijeme pouze k vyřízení vašeho požadavku. <a href="/ochrana-osobnich-udaju.html">Jak chráníme osobní údaje</a>.</p>';
if(!index.includes('data-plotao-privacy-notice="1"'))index=index.replace('<button class="send" type="submit">Připravit poptávku</button>',`${notice}<button class="send" type="submit">Připravit poptávku</button>`);
if(!index.includes('data-plotao-privacy-notice="1"'))throw new Error('Privacy UI: lead-form privacy notice could not be injected');
if(!index.includes('data-plotao-privacy-style="1"'))index=index.replace('</head>','<style data-plotao-privacy-style="1">.privacy-note{margin:2px 0 12px;color:#5d6f65;font-size:12px;line-height:1.45}.privacy-note a{color:#087443;font-weight:800}</style></head>');
if(!index.includes('data-plotao-footer-2026-css="1"'))index=index.replace('</head>','<link data-plotao-footer-2026-css="1" rel="stylesheet" href="/assets/footer-2026.css"></head>');
index=index.replace('<span>Orientačně</span><strong id="stickyTotal">—</strong>','<span>Cena materiálu</span><strong id="stickyTotal">—</strong>').replace('<button id="continueBtn">Výsledek →</button>','<button id="continueBtn">Zobrazit rozpis →</button>');
const indexFooterPattern=/<footer\b[^>]*>[\s\S]*?<\/footer>/i;
if(indexFooterPattern.test(index))index=index.replace(indexFooterPattern,canonicalFooter);
else index=index.replace(/<\/body>/i,canonicalFooter+'</body>');
if(!index.includes('id="plotaoFooter2026"'))throw new Error('Unified footer: canonical footer could not be placed on homepage');
fs.writeFileSync(indexFile,index,'utf8');

function splitCssBlocks(css){
  const blocks=[];let i=0;
  while(i<css.length){
    while(i<css.length&&/\s/.test(css[i]))i++;
    if(css.startsWith('/*',i)){const end=css.indexOf('*/',i+2);i=end<0?css.length:end+2;continue}
    const start=i;let quote='',comment=false,open=-1;
    for(;i<css.length;i++){const ch=css[i],next=css[i+1];if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}if(quote){if(ch==='\\')i++;else if(ch===quote)quote='';continue}if(ch==='/'&&next==='*'){comment=true;i++;continue}if(ch==='"'||ch==="'"){quote=ch;continue}if(ch==='{'){open=i;break}if(ch===';'){i++;break}}
    if(open<0)continue;
    const head=css.slice(start,open).trim();i=open+1;let depth=1;quote='';comment=false;const bodyStart=i;
    for(;i<css.length&&depth;i++){const ch=css[i],next=css[i+1];if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}if(quote){if(ch==='\\')i++;else if(ch===quote)quote='';continue}if(ch==='/'&&next==='*'){comment=true;i++;continue}if(ch==='"'||ch==="'"){quote=ch;continue}if(ch==='{')depth++;else if(ch==='}')depth--}
    if(depth===0)blocks.push({head,body:css.slice(bodyStart,i-1)});
  }
  return blocks;
}
const footerClassPattern=/(^|[.#\s>+~])(?:pf|pf-top|pf-logo|pf-sub|pf-brand|pf-slogan|pf-rule|pf-nav|thumb|ico|pf-benefits|pf-news|news-title|pf-bottom|social|pf-icon|pf-benefit-icon|pf-social-icon)(?=$|[.#\s>+~:\[])/i;
function stripFooterCss(css){
  return splitCssBlocks(css).map(({head,body})=>{
    if(/^@(media|supports|container|layer)\b/i.test(head)){const nested=stripFooterCss(body);return nested?head+'{'+nested+'}':''}
    if(/^@keyframes\s+plotao-footer-icon-pulse\b/i.test(head))return '';
    if(head.startsWith('@'))return head+'{'+body+'}';
    const selectors=head.split(',').map(selector=>selector.trim()).filter(selector=>selector&&!/#plotaoFooter2026\b/.test(selector)&&!footerClassPattern.test(selector)&&!/(^|[.#\s>+~])footer(?=$|[.#\s>+~:\[])/i.test(selector));
    return selectors.length?selectors.join(',')+'{'+body+'}':'';
  }).filter(Boolean).join('\n');
}
const unifiedFooterCss=fs.readFileSync(path.join(root,'assets','plotao-footer-unified.css'),'utf8');
if(!unifiedFooterCss.includes('#plotaoFooter2026')||unifiedFooterCss.includes('.mobile-price')||unifiedFooterCss.includes('.more '))throw new Error('Unified footer: footer CSS scoping validation failed');
const footerCssVersion=createHash('sha256').update(unifiedFooterCss).digest('hex').slice(0,12);
let unifiedFooterCount=0;
for(const file of publicHtml){
  const full=path.join(root,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi,(tag,css)=>tag.replace(css,stripFooterCss(css)));
  if(/<footer\b[^>]*>[\s\S]*?<\/footer>/i.test(html))html=html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i,canonicalFooter);
  else html=html.replace(/<\/body>/i,canonicalFooter+'</body>');
  if(!html.includes('data-plotao-unified-footer="1"')){
    html=html.replace(canonicalFooter,canonicalFooter.replace('<footer id="plotaoFooter2026">','<footer id="plotaoFooter2026" data-plotao-unified-footer="1">'));
  }
  if(!html.includes('</head>'))throw new Error('Unified footer: missing </head> in '+file);
  if(!html.includes('data-plotao-unified-footer-css="1"'))html=html.replace('</head>','<link data-plotao-unified-footer-css="1" rel="stylesheet" href="/assets/plotao-footer-unified.css?v='+footerCssVersion+'"></head>');
  if(!html.includes('data-plotao-unified-footer="1"'))throw new Error('Unified footer: canonical footer missing in '+file);
  const actualFooter=html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0];
  const expectedFooter=canonicalFooter.replace('<footer id="plotaoFooter2026">','<footer id="plotaoFooter2026" data-plotao-unified-footer="1">');
  if(actualFooter!==expectedFooter)throw new Error('Unified footer: rendered footer differs from shared source on '+file);
  fs.writeFileSync(full,html,'utf8');
  unifiedFooterCount++;
}
console.log(`Unified main-page footer applied to ${unifiedFooterCount}/${publicHtml.length} pages`);
const privacyFile=path.join(root,privacyPage);if(!fs.existsSync(privacyFile))throw new Error('Privacy UI: public privacy page is missing from dist');
const linkedPages=publicHtml.filter(file=>!noPublicFooterPages.has(file)&&fs.readFileSync(path.join(root,file),'utf8').includes('data-plotao-privacy-link="1"'));const expectedLinked=publicHtml.filter(file=>!noPublicFooterPages.has(file));if(linkedPages.length!==expectedLinked.length){const missing=expectedLinked.filter(file=>!linkedPages.includes(file));throw new Error(`Privacy UI: public pages missing privacy footer link: ${missing.join(', ')}`)}
console.log(`Privacy UI + approved footer prepared; privacy footer link on ${linkedPages.length}/${expectedLinked.length} public pages (${injectedCount} injected)`);
