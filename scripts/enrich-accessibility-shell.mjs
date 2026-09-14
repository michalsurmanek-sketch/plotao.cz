import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Accessibility shell enrichment: dist/index.html is missing');
let html=fs.readFileSync(file,'utf8');

if(!html.includes('id="kalkulator"'))throw new Error('Accessibility shell enrichment: calculator main target is missing');
if(!html.includes('<body'))throw new Error('Accessibility shell enrichment: body element is missing');
if(!html.includes('</head>'))throw new Error('Accessibility shell enrichment: head closing tag is missing');

html=html.replace(/<a\b[^>]*data-plotao-skip-link=["']1["'][^>]*>[\s\S]*?<\/a>/gi,'');
html=html.replace(/<style\b[^>]*data-plotao-skip-style=["']1["'][^>]*>[\s\S]*?<\/style>/gi,'');
html=html.replace(/(<main\b[^>]*\bid=["']kalkulator["'][^>]*)(>)/i,(match,start,end)=>{
  const cleaned=start.replace(/\s+tabindex=["'][^"']*["']/i,'');
  return `${cleaned} tabindex="-1"${end}`;
});

const skip='<a class="plotao-skip-link" data-plotao-skip-link="1" href="#kalkulator">Přejít na kalkulátor</a>';
const style='<style data-plotao-skip-style="1">:where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:3px solid #f07828;outline-offset:3px}.plotao-skip-link{position:fixed;left:16px;top:16px;z-index:1000;padding:10px 14px;border-radius:10px;background:#fff;color:#163d2d;font-weight:800;text-decoration:none;box-shadow:0 8px 24px #0002;transform:translateY(-220%);transition:transform .15s ease}.plotao-skip-link:focus,.plotao-skip-link:focus-visible{transform:none;outline:3px solid #f07828;outline-offset:3px}@media(prefers-reduced-motion:reduce){.plotao-skip-link{transition:none}}</style>';
html=html.replace('</head>',style+'</head>');
html=html.replace(/<body([^>]*)>/i,`<body$1>${skip}`);

const skipCount=(html.match(/data-plotao-skip-link="1"/g)||[]).length;
const styleCount=(html.match(/data-plotao-skip-style="1"/g)||[]).length;
const globalFocus=':where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:3px solid #f07828;outline-offset:3px}';
if(skipCount!==1||styleCount!==1||!html.includes(globalFocus)||!/<main\b[^>]*id="kalkulator"[^>]*tabindex="-1"/i.test(html)){
  throw new Error(`Accessibility shell enrichment failed: skip=${skipCount} style=${styleCount} globalFocus=${html.includes(globalFocus)} focusableMain=${/<main\b[^>]*id="kalkulator"[^>]*tabindex="-1"/i.test(html)}`);
}

fs.writeFileSync(file,html,'utf8');
console.log('Accessibility shell OK: keyboard skip link, focusable #kalkulator and consistent focus-visible indicators are prepared without changing the default pointer layout');
