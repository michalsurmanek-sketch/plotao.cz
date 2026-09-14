import fs from 'node:fs';
import path from 'node:path';

const htmlFiles=fs.readdirSync('.').filter(file=>file.endsWith('.html')).sort();
const publicFiles=new Set([...htmlFiles,'robots.txt','sitemap.xml','CNAME']);
const failures=[];
const forbiddenPrefixes=['/scripts/','/docs/','/supabase/','/.github/','/.git/'];
const decode=value=>{try{return decodeURIComponent(value)}catch{return value}};

function targetFor(source,href){
  const raw=href.split('#')[0].split('?')[0];
  if(!raw)return source;
  if(raw.startsWith('/'))return decode(raw.slice(1))||'index.html';
  return decode(path.posix.normalize(path.posix.join(path.posix.dirname(source),raw)));
}
function fragmentFor(href){const i=href.indexOf('#');return i<0?'':decode(href.slice(i+1));}
function existsPublic(target){
  if(!target)return true;
  if(target.endsWith('/'))target+= 'index.html';
  if(target==='')target='index.html';
  if(target.startsWith('assets/'))return fs.existsSync(target)&&fs.statSync(target).isFile();
  return publicFiles.has(target)&&fs.existsSync(target);
}

for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]));
  for(const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)){
    const href=match[1].trim();
    if(!href||href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('https://')||href.startsWith('http://'))continue;
    if(href.startsWith('javascript:')||href.startsWith('data:')){failures.push(`${file}: unsafe/non-navigational href ${href}`);continue;}
    const clean='/'+targetFor(file,href);
    if(forbiddenPrefixes.some(prefix=>clean.startsWith(prefix))){failures.push(`${file}: public link exposes internal path ${href}`);continue;}
    const target=targetFor(file,href);
    if(!existsPublic(target)){failures.push(`${file}: broken local href ${href} -> ${target}`);continue;}
    const fragment=fragmentFor(href);
    if(fragment){
      const targetHtml=target||file;
      if(targetHtml.endsWith('.html')){
        const targetSource=targetHtml===file?html:fs.readFileSync(targetHtml,'utf8');
        const targetIds=targetHtml===file?ids:new Set([...targetSource.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]));
        if(!targetIds.has(fragment))failures.push(`${file}: missing fragment #${fragment} in ${targetHtml}`);
      }
    }
  }
}

if(failures.length){console.error('Public link integrity failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Public link integrity OK: ${htmlFiles.length} HTML pages contain no broken local links, missing fragments or links into private repository paths`);
