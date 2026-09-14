import fs from 'node:fs';
import path from 'node:path';

const root='dist';
if(!fs.existsSync(root))throw new Error('Privacy UI: dist/ is missing');

const privacyPage='ochrana-osobnich-udaju.html';
const privacyHref='/ochrana-osobnich-udaju.html';
const footerLink=`<a data-plotao-privacy-link="1" href="${privacyHref}">Ochrana osobních údajů</a>`;
const publicHtml=fs.readdirSync(root).filter(name=>name.endsWith('.html')).sort();
let injectedCount=0;

for(const file of publicHtml){
  const full=path.join(root,file);
  let html=fs.readFileSync(full,'utf8');
  if(file!==privacyPage&&!html.includes('data-plotao-privacy-link="1"')){
    if(html.includes('class="foot-bottom"')){
      html=html.replace(/(<div class="foot-bottom">\s*<span>[^<]*<\/span>)/i,`$1${footerLink}`);
    }else if(/<footer\b[^>]*>[\s\S]*?<\/footer>/i.test(html)){
      html=html.replace(/<\/footer>/i,` · ${footerLink}</footer>`);
    }else{
      throw new Error(`Privacy UI: public page has no supported footer for privacy link: ${file}`);
    }
    if(!html.includes('data-plotao-privacy-link="1"'))throw new Error(`Privacy UI: could not inject footer link into ${file}`);
    injectedCount++;
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

const privacyFile=path.join(root,privacyPage);
if(!fs.existsSync(privacyFile))throw new Error('Privacy UI: public privacy page is missing from dist');
const linkedPages=publicHtml.filter(file=>file!==privacyPage&&fs.readFileSync(path.join(root,file),'utf8').includes('data-plotao-privacy-link="1"'));
const expectedLinked=publicHtml.filter(file=>file!==privacyPage);
if(linkedPages.length!==expectedLinked.length){
  const missing=expectedLinked.filter(file=>!linkedPages.includes(file));
  throw new Error(`Privacy UI: public pages missing privacy footer link: ${missing.join(', ')}`);
}

console.log(`Privacy UI prepared: lead notice + privacy page + privacy footer link on ${linkedPages.length}/${expectedLinked.length} public pages (${injectedCount} injected this build)`);
