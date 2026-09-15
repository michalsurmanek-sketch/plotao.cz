import fs from 'node:fs';

const htmlFile='dist/index.html';
const jsFile='dist/assets/extra-fence-config.js';
if(!fs.existsSync(htmlFile)||!fs.existsSync(jsFile))throw new Error('Atypical UI enrichment: production artifact is missing');
let html=fs.readFileSync(htmlFile,'utf8');
let js=fs.readFileSync(jsFile,'utf8');

html=html.replace(/<style data-plotao-atypical-style="1">[\s\S]*?<\/style>/g,'').replace(/<template id="otherFenceTpl">[\s\S]*?<\/template>/g,'');

const style=`<style data-plotao-atypical-style="1">#extraFenceConfig[data-type="other"]{margin-top:18px!important;padding:24px!important;border:1px solid #d7eadf!important;border-radius:24px!important;background:linear-gradient(180deg,#f7fcf9,#eff9f3)!important;box-shadow:0 10px 34px #0f523412}#extraFenceConfig[data-type="other"] .atyp-head h3{margin:0;font-size:28px;line-height:1.08;letter-spacing:-.55px;color:#17251e}#extraFenceConfig[data-type="other"] .atyp-head p{margin:7px 0 18px;color:#68786f;font-size:16px;line-height:1.4}#extraFenceConfig[data-type="other"] .atyp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}#extraFenceConfig[data-type="other"] .atyp-card{position:relative;display:block;min-width:0;padding:10px;border:1px solid #dce8e1;border-radius:18px;background:#fff;color:#17251e;text-align:left;overflow:hidden;box-shadow:0 5px 16px #17251e0b;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease}#extraFenceConfig[data-type="other"] .atyp-card:hover{transform:translateY(-2px);border-color:#9fc9b1;box-shadow:0 9px 22px #12372612}#extraFenceConfig[data-type="other"] .atyp-card.on{padding:9px;border:2px solid #087443;background:#f7fcf9;box-shadow:0 8px 22px #08744318}#extraFenceConfig[data-type="other"] .atyp-card.on:after{content:"✓";position:absolute;top:16px;right:16px;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:#087443;color:#fff;font-size:18px;font-weight:900;box-shadow:0 2px 8px #0002}#extraFenceConfig[data-type="other"] .atyp-card img{display:block;width:100%;height:160px;object-fit:cover;border-radius:13px;background:#eef3ef}#extraFenceConfig[data-type="other"] .atyp-card strong{display:block;margin:11px 3px 3px;font-size:18px;line-height:1.2}#extraFenceConfig[data-type="other"] .atyp-card small{display:block;margin:0 3px 4px;color:#68786f;font-size:12px;line-height:1.35;font-weight:700}@media(max-width:680px){#extraFenceConfig[data-type="other"]{padding:18px!important;border-radius:20px!important}#extraFenceConfig[data-type="other"] .atyp-head h3{font-size:23px}#extraFenceConfig[data-type="other"] .atyp-head p{font-size:14px;margin-bottom:14px}#extraFenceConfig[data-type="other"] .atyp-grid{gap:9px}#extraFenceConfig[data-type="other"] .atyp-card{padding:8px;border-radius:15px}#extraFenceConfig[data-type="other"] .atyp-card.on{padding:7px}#extraFenceConfig[data-type="other"] .atyp-card img{height:112px;border-radius:11px}#extraFenceConfig[data-type="other"] .atyp-card strong{font-size:15px;margin-top:8px}#extraFenceConfig[data-type="other"] .atyp-card small{font-size:11px}#extraFenceConfig[data-type="other"] .atyp-card.on:after{top:12px;right:12px;width:27px;height:27px}}</style>`;

const tpl=`<template id="otherFenceTpl"><div class="atyp-head"><h3>Speciální a atypické oplocení</h3><span hidden>Atypické oplocení</span><p>Vyberte typ řešení, pro který připravíme individuální nabídku.</p></div><div class="atyp-grid" role="group" aria-label="Typ speciálního oplocení"><button type="button" class="atyp-card" data-eg="variant" data-ev="noise"><img src="/assets/fence-types/privacy-wpc.webp" alt="Protihlukové oplocení" loading="lazy" decoding="async"><strong>Protihlukové oplocení</strong><small>Plné clonicí systémy pro omezení hluku</small></button><button type="button" class="atyp-card" data-eg="variant" data-ev="security"><img src="/assets/fence-types/pletivo-bezpecnostni.webp" alt="Bezpečnostní oplocení" loading="lazy" decoding="async"><strong>Bezpečnostní oplocení</strong><small>Zvýšené zabezpečení areálů a objektů</small></button><button type="button" class="atyp-card" data-eg="variant" data-ev="pool"><img src="/assets/fence-types/alu-horizontal.webp" alt="Bazénové oplocení" loading="lazy" decoding="async"><strong>Bazénové oplocení</strong><small>Bezpečné oddělení bazénu a zahrady</small></button><button type="button" class="atyp-card" data-eg="variant" data-ev="animal"><img src="/assets/fence-types/pletivo-chovatelske.webp" alt="Chovatelské oplocení" loading="lazy" decoding="async"><strong>Chovatelské oplocení</strong><small>Výběhy, kotce a oplocení pro zvířata</small></button><button type="button" class="atyp-card" data-eg="variant" data-ev="sport"><img src="/assets/fence-types/panelovy-2d.webp" alt="Sportovní a vysoké oplocení" loading="lazy" decoding="async"><strong>Sportovní / vysoké oplocení</strong><small>Hřiště, areály a vysoké ochranné stěny</small></button><button type="button" class="atyp-card" data-eg="variant" data-ev="custom"><img src="/assets/fence-types/category-other.webp" alt="Atypické oplocení na míru" loading="lazy" decoding="async"><strong>Atypické řešení na míru</strong><small>Vlastní kombinace, náčrt nebo nestandardní řešení</small></button></div></template>`;

if(!html.includes('</head>')||!html.includes('</body>'))throw new Error('Atypical UI enrichment: HTML anchors missing');
html=html.replace('</head>',style+'</head>').replace('</body>',tpl+'</body>');

const oldPublish="window.PLOTAO_EXTRA=t==='other'?{type:t,variant:'custom'}:{type:t,...s};";
const newPublish="window.PLOTAO_EXTRA={type:t,...s};";
if(!js.includes(oldPublish))throw new Error('Atypical UI enrichment: publish contract anchor missing');
js=js.replace(oldPublish,newPublish);

const oldOther="html='<h3 style=\"margin:0 0 8px\">Atypické oplocení</h3><p style=\"margin:0;color:#68786f;font-size:12px;line-height:1.45\">Atypický plot nemá univerzální kusový ceník. Kalkulátor jej proto jasně označí jako individuální nabídku.</p>';";
if(!js.includes(oldOther))throw new Error('Atypical UI enrichment: other branch anchor missing');
js=js.replace(oldOther,"html=$('#otherFenceTpl').innerHTML;");

const bindAnchor="b.innerHTML=html;\n    const s=state[t];";
if(!js.includes(bindAnchor))throw new Error('Atypical UI enrichment: binding anchor missing');
js=js.replace(bindAnchor,"b.innerHTML=html;\n    const s=state[t];\n    b.querySelectorAll('[data-eg]').forEach(x=>x.classList.toggle('on',s[x.dataset.eg]===x.dataset.ev));");

fs.writeFileSync(htmlFile,html,'utf8');
fs.writeFileSync(jsFile,js,'utf8');

for(const text of ['Protihlukové oplocení','Bezpečnostní oplocení','Bazénové oplocení','Chovatelské oplocení','Sportovní / vysoké oplocení','Atypické řešení na míru'])if(!html.includes(text))throw new Error('Atypical UI enrichment missing: '+text);
if((html.match(/id="otherFenceTpl"/g)||[]).length!==1||(html.match(/data-plotao-atypical-style="1"/g)||[]).length!==1)throw new Error('Atypical UI enrichment duplicated');
console.log('Atypical configurator UI enriched with six selectable visual categories');
