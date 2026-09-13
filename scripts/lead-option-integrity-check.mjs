import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const details=read('assets/lead-option-details-v1.js'),lead=read('assets/lead-safety-v1.js'),manifest=read('scripts/pages-manifest.mjs');

ok(lead.includes("$$('#options .on, #privacyConfig .on, #aluminiumConfig .on, #gabionOptionsBox .on, #metalConfig .on, #concreteConfig .on, #extraFenceConfig .on')"),'lead adapter must keep one explicit option collection boundary');
ok(lead.includes("const drive=window.PLOTAO_GATE_DRIVE")&&lead.includes("$('#gate')?.checked&&$('#gateDrive')?.value==='auto'&&drive?.active&&!drive?.unsupported&&drive.name"),'lead options must add a gate drive product only when the automatic kit is actually verified and active');
ok(lead.includes("const t='Pohon brány: '+drive.name")&&lead.includes('if(!items.includes(t))items.push(t)'),'verified NICE gate drive kit must be preserved in the normalized options snapshot without duplication');
ok(details.includes("for(const sel of ['#privacyConfig','#metalConfig','#concreteConfig','#extraFenceConfig'])")&&details.includes("if(!['panel','mesh'].includes(t))$$('#options .on').forEach(x=>x.classList.remove('on'))"),'hidden configuration choices must be cleared before lead snapshot collection');
ok(details.includes("p.id='aluminiumConfig'")&&details.includes("'Typ výplně: '+selectedText('#aluVariant')")&&details.includes("'Lamela: '+selectedText('#aluSlat')")&&details.includes("'Sloupky: '+selectedText('#aluPosts')"),'aluminium select choices must be exposed to the lead snapshot');
ok(details.includes("items.push('RAL: '+ral.value.trim())"),'custom aluminium RAL code must be preserved in lead details');
ok(details.includes("'Tloušťka koše: '+selectedText('#gabionWidth')")&&details.includes("'Kamenivo: '+selectedText('#gabionStone')"),'gabion basket width and stone choice must be preserved in lead details');
ok(details.includes("'Mezera výplně: '+gap+' mm'"),'privacy lead details must preserve the exact configured gap');
ok(details.includes('if(p.innerHTML!==next)p.innerHTML=next'),'lead detail proxies must not rewrite identical content and trigger mutation loops');
ok(details.includes("document.addEventListener('submit',e=>{if(e.target?.id==='form')sync()},true)"),'latest option state must be synchronized synchronously before the lead form snapshot is created');
ok(details.includes("if(t!=='aluminium'){p?.remove();return}")&&details.includes("if(t!=='gabion')")&&details.includes("if(t!=='privacy')"),'type-specific lead proxies must be removed when their fence type is no longer active');
const detailPos=manifest.indexOf('/assets/lead-option-details-v1.js'),leadPos=manifest.indexOf('/assets/lead-safety-v1.js');
ok(detailPos>=0&&leadPos>detailPos,'lead option synchronizer must load before lead snapshot adapter');

if(fail.length){console.error('Lead option integrity checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead option integrity checks OK: stale choices are isolated and detailed aluminium/gabion/privacy plus verified gate-drive selections are preserved');
