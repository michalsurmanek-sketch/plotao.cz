import fs from 'node:fs';
import {createHash} from 'node:crypto';

const file='dist/index.html',gabionFile='dist/assets/gabion-options.js',summaryFile='dist/assets/mobile-summary-state-v1.js';
if(!fs.existsSync(file)||!fs.existsSync(gabionFile)||!fs.existsSync(summaryFile))throw new Error('Configurator UI enrichment: production artifact is missing');
let html=fs.readFileSync(file,'utf8');
if(!html.includes('</head>'))throw new Error('Configurator UI enrichment: head closing tag is missing');

const refresh=(src,path)=>{
  const v=createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0,12);
  const esc=src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`(<script\\b[^>]*\\bsrc=["'])${esc}(?:\\?[^"']*)?(["'][^>]*><\\/script>)`,'i');
  if(!re.test(html))throw new Error('Configurator UI enrichment: versioned script tag missing for '+src);
  html=html.replace(re,`$1${src}?v=${v}$2`);
};

let gabion=fs.readFileSync(gabionFile,'utf8');
const gabionAnchor='b.innerHTML=\'<div class="title"><b>1</b>';
const gabionIntro='b.innerHTML=\'<div class="config-intro"><span class="config-intro-icon" aria-hidden="true">⚙</span><div><h3>Konfigurace gabionového plotu</h3><p>Vyberte typ systému, rozměr konstrukce a kamennou výplň.</p></div></div><div class="title"><b>1</b>';
if(!gabion.includes(gabionAnchor))throw new Error('Configurator UI enrichment: gabion render anchor missing');
gabion=gabion.replace(gabionAnchor,gabionIntro);
fs.writeFileSync(gabionFile,gabion,'utf8');
refresh('/assets/gabion-options.js',gabionFile);

let summary=fs.readFileSync(summaryFile,'utf8');
const oldState="if(p==='Individuální nabídka')return{kind:'individual',label:'Stav kalkulace',button:'Zobrazit podklady →'};";
const newState="if(p==='Individuální nabídka'){const c=$('.type.on')?.dataset.id==='other'&&window.PLOTAO_EXTRA?.variant==='custom';return c?{kind:'individual',label:'Stav poptávky',button:'Doplnit podklady →',value:p}:{kind:'individual',label:'Další krok',button:'Pokračovat v zadání ↑',value:'Doplňte parametry'}};";
if(!summary.includes(oldState))throw new Error('Configurator UI enrichment: mobile individual-state anchor missing');
summary=summary.replace(oldState,newState);
const strongAnchor="if(strong){strong.setAttribute('aria-live','polite');";
if(!summary.includes(strongAnchor))throw new Error('Configurator UI enrichment: mobile summary value anchor missing');
summary=summary.replace(strongAnchor,"if(strong){if(s.value)strong.textContent=s.value;strong.setAttribute('aria-live','polite');");
const handleAnchor="if(s.kind==='invalid'){const target=invalidTarget();scroll(target,true);return}scroll($('.result')||$('#kalkulator'))";
if(!summary.includes(handleAnchor))throw new Error('Configurator UI enrichment: mobile summary click anchor missing');
summary=summary.replace(handleAnchor,"if(s.kind==='invalid'){const target=invalidTarget();scroll(target,true);return}if(s.kind==='individual'){const c=$('.type.on')?.dataset.id==='other'&&window.PLOTAO_EXTRA?.variant==='custom';scroll(c?$('[data-atyp-detail]'):$('.type.on'));return}scroll($('.result')||$('#kalkulator'))");
fs.writeFileSync(summaryFile,summary,'utf8');
refresh('/assets/mobile-summary-state-v1.js',summaryFile);

html=html.replace(/<style\b[^>]*data-plotao-config-headers=["']1["'][^>]*>[\s\S]*?<\/style>/gi,'');
const css=`<style data-plotao-config-headers="1">
#aluminiumConfigBox>.mobile-config-title,#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title,#extraFenceConfig[data-type="other"]>.atyp-head,.config-intro{margin:0 0 24px!important;min-height:84px}
#aluminiumConfigBox>.mobile-config-title{display:grid!important;grid-template-columns:68px minmax(0,1fr);column-gap:20px;align-items:start}
#aluminiumConfigBox>.mobile-config-title:before{content:"⚙";grid-column:1;grid-row:1/3;width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443;font:700 34px/1 Arial,sans-serif}
#aluminiumConfigBox>.mobile-config-title h3{grid-column:2;margin:0!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
#aluminiumConfigBox>.mobile-config-title p{grid-column:2;margin:9px 0 0!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title{gap:20px!important;align-items:flex-start!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon{width:68px!important;height:68px!important;flex:0 0 68px!important;background:#dff4e8!important;color:#087443!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon svg{width:34px!important;height:34px!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title h3{margin:0!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title p{margin:10px 0 0!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important}
#metalConfig>h3,#concreteConfig>h3{position:relative!important;min-height:82px!important;padding:0 0 0 88px!important;margin:0 0 24px!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
#metalConfig>h3:before,#concreteConfig>h3:before{content:"⚙"!important;position:absolute!important;left:0!important;top:0!important;width:68px!important;height:68px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#dff4e8!important;color:#087443!important;font:700 34px/1 Arial,sans-serif!important}
#metalConfig>h3:after,#concreteConfig>h3:after{display:block!important;margin-top:10px!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important;font-weight:400!important;letter-spacing:0!important}
.config-intro{display:grid;grid-template-columns:68px minmax(0,1fr);column-gap:20px;align-items:start}
.config-intro-icon{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443;font:700 34px/1 Arial,sans-serif}
.config-intro h3{margin:0!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
.config-intro p{margin:10px 0 0!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important}
#gabionOptionsBox>.title:first-of-type{padding-top:0!important;margin-top:0!important}
#gabionOptionsBox>.title:first-of-type:before,#gabionOptionsBox>.title:first-of-type:after,#gabionOptionsBox:before{content:none!important;display:none!important}
#extraFenceConfig[data-type="other"]>.atyp-head{position:relative;padding-left:88px}
#extraFenceConfig[data-type="other"]>.atyp-head:before{content:"⚙";position:absolute;left:0;top:0;width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443;font:700 34px/1 Arial,sans-serif}
#extraFenceConfig[data-type="other"]>.atyp-head h3{margin:0!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
#extraFenceConfig[data-type="other"]>.atyp-head p{margin:10px 0 0!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important}
@media(max-width:680px){
#aluminiumConfigBox>.mobile-config-title,.config-intro{grid-template-columns:64px minmax(0,1fr);column-gap:16px;margin-bottom:20px!important}
#aluminiumConfigBox>.mobile-config-title:before,.config-intro-icon,#metalConfig>h3:before,#concreteConfig>h3:before,#extraFenceConfig[data-type="other"]>.atyp-head:before{width:64px!important;height:64px!important;font-size:31px!important}
#aluminiumConfigBox>.mobile-config-title h3,#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title h3,#metalConfig>h3,#concreteConfig>h3,.config-intro h3,#extraFenceConfig[data-type="other"]>.atyp-head h3{font-size:28px!important;line-height:1.04!important}
#aluminiumConfigBox>.mobile-config-title p,#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title p,#metalConfig>h3:after,#concreteConfig>h3:after,.config-intro p,#extraFenceConfig[data-type="other"]>.atyp-head p{font-size:16px!important;line-height:1.35!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title{gap:16px!important;margin-bottom:20px!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon{width:64px!important;height:64px!important;flex-basis:64px!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon svg{width:31px!important;height:31px!important}
#metalConfig>h3,#concreteConfig>h3{min-height:94px!important;padding-left:80px!important;margin-bottom:20px!important}
#extraFenceConfig[data-type="other"]>.atyp-head{padding-left:80px;margin-bottom:20px!important}}
</style>`;
html=html.replace('</head>',css+'</head>');
fs.writeFileSync(file,html,'utf8');
for(const token of ['data-plotao-config-headers="1"','Konfigurace gabionového plotu','Doplňte parametry'])if(!html.includes(token)&&!gabion.includes(token)&&!summary.includes(token))throw new Error('Configurator UI enrichment missing: '+token);
console.log('Configurator headers flow safely; gabion title no longer overlaps and mobile individual state points to the next actionable input');
