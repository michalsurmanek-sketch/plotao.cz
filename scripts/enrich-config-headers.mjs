import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Configurator header enrichment: dist/index.html is missing');
let html=fs.readFileSync(file,'utf8');
if(!html.includes('</head>'))throw new Error('Configurator header enrichment: head closing tag is missing');

html=html.replace(/<style\b[^>]*data-plotao-config-headers=["']1["'][^>]*>[\s\S]*?<\/style>/gi,'');

const css=`<style data-plotao-config-headers="1">
/* Shared configurator intro – visually aligned with the reviewed mobile-fence header. */
#aluminiumConfigBox>.mobile-config-title,
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title,
#extraFenceConfig[data-type="other"]>.atyp-head{margin:0 0 24px!important;min-height:84px}

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

#gabionOptionsBox{position:relative!important}
#gabionOptionsBox:before{content:"⚙";position:absolute;left:26px;top:26px;width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443;font:700 34px/1 Arial,sans-serif;z-index:2}
#gabionOptionsBox>.title:first-child{position:relative!important;padding-top:118px!important;margin:0 0 10px!important}
#gabionOptionsBox>.title:first-child:before{content:"Konfigurace gabionového plotu"!important;position:absolute!important;left:88px!important;right:0!important;top:1px!important;font-size:30px!important;line-height:1.06!important;font-weight:900!important;letter-spacing:-.6px!important;color:#17251e!important}
#gabionOptionsBox>.title:first-child:after{content:"Vyberte typ systému, rozměr konstrukce a kamennou výplň."!important;position:absolute!important;left:88px!important;right:0!important;top:68px!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important;font-weight:400!important}

#extraFenceConfig[data-type="other"]>.atyp-head{position:relative;padding-left:88px}
#extraFenceConfig[data-type="other"]>.atyp-head:before{content:"⚙";position:absolute;left:0;top:0;width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443;font:700 34px/1 Arial,sans-serif}
#extraFenceConfig[data-type="other"]>.atyp-head h3{margin:0!important;font-size:30px!important;line-height:1.06!important;letter-spacing:-.6px!important;color:#17251e!important}
#extraFenceConfig[data-type="other"]>.atyp-head p{margin:10px 0 0!important;color:#68786f!important;font-size:18px!important;line-height:1.35!important}

@media(max-width:680px){
#aluminiumConfigBox>.mobile-config-title{grid-template-columns:64px minmax(0,1fr);column-gap:16px;margin-bottom:20px!important}
#aluminiumConfigBox>.mobile-config-title:before,
#metalConfig>h3:before,#concreteConfig>h3:before,
#gabionOptionsBox:before,
#extraFenceConfig[data-type="other"]>.atyp-head:before{width:64px!important;height:64px!important;font-size:31px!important}
#aluminiumConfigBox>.mobile-config-title h3,
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title h3,
#metalConfig>h3,#concreteConfig>h3,
#gabionOptionsBox>.title:first-child:before,
#extraFenceConfig[data-type="other"]>.atyp-head h3{font-size:28px!important;line-height:1.04!important}
#aluminiumConfigBox>.mobile-config-title p,
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title p,
#metalConfig>h3:after,#concreteConfig>h3:after,
#gabionOptionsBox>.title:first-child:after,
#extraFenceConfig[data-type="other"]>.atyp-head p{font-size:16px!important;line-height:1.35!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title{gap:16px!important;margin-bottom:20px!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon{width:64px!important;height:64px!important;flex-basis:64px!important}
#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"])>.mobile-config-title .mobile-config-icon svg{width:31px!important;height:31px!important}
#metalConfig>h3,#concreteConfig>h3{min-height:94px!important;padding-left:80px!important;margin-bottom:20px!important}
#gabionOptionsBox:before{left:18px!important;top:18px!important}
#gabionOptionsBox>.title:first-child{padding-top:126px!important}
#gabionOptionsBox>.title:first-child:before{left:80px!important;top:0!important}
#gabionOptionsBox>.title:first-child:after{left:80px!important;top:64px!important}
#extraFenceConfig[data-type="other"]>.atyp-head{padding-left:80px;margin-bottom:20px!important}
}
</style>`;

html=html.replace('</head>',css+'</head>');
fs.writeFileSync(file,html,'utf8');

for(const token of ['data-plotao-config-headers="1"','Konfigurace gabionového plotu'])if(!html.includes(token))throw new Error('Configurator header enrichment missing: '+token);
console.log('Configurator header styling unified across aluminium, mobile, masonry, metal, concrete, gabion and atypical sections');
