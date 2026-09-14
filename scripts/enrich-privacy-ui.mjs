import fs from 'node:fs';
import path from 'node:path';

const root='dist';
if(!fs.existsSync(root))throw new Error('Privacy UI: dist/ is missing');

const privacyHref='/ochrana-osobnich-udaju.html';
const footerLink=`<a data-plotao-privacy-link="1" href="${privacyHref}">Ochrana osobních údajů</a>`;
let footerCount=0;

for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
  const full=path.join(root,file);
  let html=fs.readFileSync(full,'utf8');
  if(file!=='ochrana-osobnich-udaju.html'&&html.includes('class="foot-bottom"')&&!html.includes('data-plotao-privacy-link="1"')){
    html=html.replace(/(<div class="foot-bottom">\s*<span>[^<]*<\/span>)/i,`$1${footerLink}`);
    if(!html.includes('data-plotao-privacy-link="1"'))throw new Error(`Privacy UI: could not inject footer link into ${file}`);
    footerCount++;
  }
  fs.writeFileSync(full,html,'utf8');
}

const indexFile=path.join(root,'index.html');
let index=fs.readFileSync(indexFile,'utf8');
const notice='<p class="privacy-note" data-plotao-privacy-notice="1">Údaje použijeme k vyřízení poptávky a přípravě nabídky. <a href="/ochrana-osobnich-udaju.html">Jak chráníme osobní údaje</a>.</p>';
if(!index.includes('data-plotao-privacy-notice="1"')){
  index=index.replace('<button class="send" type="submit">Připravit poptávku</button>',`${notice}<button class="send" type="submit">Připravit poptávku</button>`);
}
if(!index.includes('data-plotao-privacy-notice="1"'))throw new Error('Privacy UI: lead-form privacy notice could not be injected');
if(!index.includes('data-plotao-privacy-style="1"')){
  const css='<style data-plotao-privacy-style="1">.privacy-note{margin:2px 0 12px;color:#5d6f65;font-size:12px;line-height:1.45}.privacy-note a{color:#087443;font-weight:800}.foot-bottom>[data-plotao-privacy-link="1"]{color:#d9e7df;text-decoration:underline;text-underline-offset:3px}</style>';
  index=index.replace('</head>',`${css}</head>`);
}
fs.writeFileSync(indexFile,index,'utf8');

if(!fs.existsSync(path.join(root,'ochrana-osobnich-udaju.html')))throw new Error('Privacy UI: public privacy page is missing from dist');
console.log(`Privacy UI prepared: lead notice + privacy page + ${footerCount} footer link(s)`);
