import fs from 'node:fs';

const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html')).sort();
const titles=new Map(),canonicals=new Map();

function attr(html,tag,name,valueAttr='content'){
  const tags=[...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`,'gi'))].map(m=>m[0]);
  for(const t of tags){
    const key=t.match(new RegExp(`\\b${name}=["']([^"']+)["']`,'i'))?.[1];
    if(!key)continue;
    const val=t.match(new RegExp(`\\b${valueAttr}=["']([^"']+)["']`,'i'))?.[1];
    if(val)return{key,val,tag:t};
  }
  return null;
}
function canonical(html){
  for(const m of html.matchAll(/<link\b[^>]*>/gi)){const t=m[0],rel=t.match(/\brel=["']([^"']+)["']/i)?.[1];if(rel?.toLowerCase()==='canonical')return t.match(/\bhref=["']([^"']+)["']/i)?.[1]||''}return'';
}

ok(pages.length>0,'no public HTML pages found');
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  ok(/<html\b[^>]*\blang=["']cs["']/i.test(html),`${file}: html lang must be cs`);
  const title=(html.match(/<title>([^<]+)<\/title>/i)?.[1]||'').trim();
  ok(title.length>=20,`${file}: title is missing or too short`);
  if(title){ok(!titles.has(title),`${file}: duplicate title also used by ${titles.get(title)}`);titles.set(title,file)}
  const desc=attr(html,'meta','name')?.key?.toLowerCase()==='description'?attr(html,'meta','name')?.val:'';
  const descDirect=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]).find(t=>/\bname=["']description["']/i.test(t));
  const description=descDirect?.match(/\bcontent=["']([^"']+)["']/i)?.[1]?.trim()||desc;
  ok(description.length>=70&&description.length<=200,`${file}: meta description should be 70–200 characters`);
  const can=canonical(html),expected=file==='index.html'?'https://plotao.cz/':`https://plotao.cz/${file}`;
  ok(can===expected,`${file}: canonical must be ${expected}`);
  if(can){ok(!canonicals.has(can),`${file}: duplicate canonical also used by ${canonicals.get(can)}`);canonicals.set(can,file)}
  const h1=(html.match(/<h1\b/gi)||[]).length;ok(h1===1,`${file}: expected exactly one H1, got ${h1}`);
  for(const img of html.match(/<img\b[^>]*>/gi)||[])ok(/\balt=["'][^"']*["']/i.test(img),`${file}: image missing alt attribute: ${img.slice(0,100)}`);
}

const landingPages=pages.filter(file=>file!=='index.html'&&file!=='typy-plotu.html');
for(const file of landingPages){
  const html=fs.readFileSync(file,'utf8');
  ok(/<a\\b[^>]*href=["']\/#kalkulator["'][^>]*>[^<]*(?:Spočítat|Otevřít|Připravit)/i.test(html),`${file}: primary calculator CTA must link directly to /#kalkulator`);
  ok(!/href=["']\/#calculator["']/i.test(html),`${file}: obsolete English calculator anchor must not return`);
}

const sitemap=fs.readFileSync('sitemap.xml','utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim());
const expectedUrls=pages.map(f=>f==='index.html'?'https://plotao.cz/':`https://plotao.cz/${f}`);
for(const u of expectedUrls)ok(urls.includes(u),`sitemap.xml: missing ${u}`);
for(const u of urls){ok(u.startsWith('https://plotao.cz/'),`sitemap.xml: foreign/non-HTTPS URL ${u}`);ok(expectedUrls.includes(u),`sitemap.xml: URL has no matching public HTML page: ${u}`)}
ok(new Set(urls).size===urls.length,'sitemap.xml: duplicate URL');
const lastmods=[...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m=>m[1]);
ok(lastmods.length===urls.length,'sitemap.xml: every URL must have lastmod');
for(const d of lastmods)ok(/^\d{4}-\d{2}-\d{2}$/.test(d),`sitemap.xml: invalid lastmod ${d}`);

const robots=fs.readFileSync('robots.txt','utf8');
ok(/User-agent:\s*\*/i.test(robots)&&/Allow:\s*\//i.test(robots),'robots.txt: public crawler allow rule missing');
ok(robots.includes('Sitemap: https://plotao.cz/sitemap.xml'),'robots.txt: canonical sitemap URL missing');

if(fail.length){console.error('SEO regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log(`SEO regression checks OK: ${pages.length} public pages, canonical/title/H1/image/sitemap integrity protected`);
