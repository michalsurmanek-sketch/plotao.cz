import fs from 'node:fs';

const file='dist/index.html';
if(!fs.existsSync(file))throw new Error('Configurator icon unification: dist/index.html is missing');
let html=fs.readFileSync(file,'utf8');
if(!html.includes('</head>'))throw new Error('Configurator icon unification: head closing tag is missing');

html=html.replace(/<style\b[^>]*data-plotao-config-icons=["']1["'][^>]*>[\s\S]*?<\/style>/gi,'');

// Exact gear geometry used by the mobile-fence configurator.
const gear=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#087443" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="5"/><path d="M16 3.5v3M16 25.5v3M28.5 16h-3M6.5 16h-3M24.8 7.2l-2.1 2.1M9.3 22.7l-2.1 2.1M24.8 24.8l-2.1-2.1M9.3 9.3L7.2 7.2"/><circle cx="16" cy="16" r="10" stroke-dasharray="2 3"/></svg>`;
const icon=`url("data:image/svg+xml,${encodeURIComponent(gear)}")`;
const badge=`background-color:#dff4e8!important;background-image:${icon}!important;background-position:center!important;background-repeat:no-repeat!important;background-size:34px 34px!important;color:transparent!important;font-size:0!important;`;

const css=`<style data-plotao-config-icons="1">
/* One shared configurator badge: exact mobile-fence gear icon everywhere. */
.mobile-config-icon,.config-intro-icon,.config-header-icon,.config-hero__icon,.mesh-config-icon,.panel-config-icon{${badge}}
.mobile-config-icon>svg,.config-intro-icon>svg,.config-header-icon>svg,.config-hero__icon>svg,.mesh-config-icon>svg,.panel-config-icon>svg{visibility:hidden!important}
#aluminiumConfigBox>.mobile-config-title:before,#metalConfig>h3:before,#concreteConfig>h3:before,#extraFenceConfig[data-type="other"]>.atyp-head:before{content:""!important;${badge}}
@media(max-width:680px){.mobile-config-icon,.config-intro-icon,.config-header-icon,.config-hero__icon,.mesh-config-icon,.panel-config-icon,#aluminiumConfigBox>.mobile-config-title:before,#metalConfig>h3:before,#concreteConfig>h3:before,#extraFenceConfig[data-type="other"]>.atyp-head:before{background-size:31px 31px!important}}
</style>`;

html=html.replace('</head>',css+'</head>');
fs.writeFileSync(file,html,'utf8');
if(!html.includes('data-plotao-config-icons="1"')||!html.includes('stroke-dasharray'))throw new Error('Configurator icon unification missing');
console.log('Configurator icons unified to the exact mobile-fence gear badge');
