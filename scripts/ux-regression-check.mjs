import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const scroll=read('assets/step-scroll-v1.js'),accuracy=read('assets/accuracy-guard.js'),a11y=read('assets/choice-accessibility-v1.js'),modal=read('assets/modal-accessibility-v1.js'),segmentLimit=read('assets/segment-limit-ui-v1.js'),leadMode=read('assets/lead-mode-ui-v1.js'),ui=read('assets/ui-bootstrap-v1.js'),extra=read('assets/extra-fence-config.js'),privacy=read('assets/privacy-config.js'),aluminium=read('assets/aluminium-config.js'),metal=read('assets/metal-config.js'),concrete=read('assets/concrete-config.js'),manifest=read('scripts/pages-manifest.mjs');

for(const [type,id] of Object.entries({privacy:'#privacyConfig',aluminium:'#aluminiumConfigBox',gabion:'#gabionOptionsBox',metal:'#metalConfig',concrete:'#concreteConfig',masonry:'#extraFenceConfig',mobile:'#extraFenceConfig',other:'#extraFenceConfig'}))ok(scroll.includes(type+":'"+id+"'")||scroll.includes(type+':"'+id+'"'),'next-step scroll must target the visible '+type+' configuration');
ok(scroll.includes('scrollToEl(nextAfterType,180)'),'type scroll target must be resolved after dynamic configuration modules render');
ok(scroll.includes("const $=s=>s?document.querySelector(s):null"),'step scrolling must never pass an empty selector to querySelector for types without a custom configuration');
ok(scroll.includes("getComputedStyle(el).display!=='none'")&&scroll.includes('getClientRects().length>0'),'next-step scroll must ignore hidden configuration anchors');
ok(scroll.includes("window.matchMedia?.('(prefers-reduced-motion: reduce)')"),'smooth scrolling must respect reduced-motion preference without assuming matchMedia exists');

ok(a11y.includes("setAttribute('aria-pressed'")&&a11y.includes("classList.contains('on')"),'choice buttons must expose selected state through aria-pressed');
ok(a11y.includes("#extraFenceConfig [data-eg]")&&a11y.includes("$('.mobile-choices').forEach")&&a11y.includes("'Konstrukce zděného plotu':'Varianta mobilního oplocení'"),'specialized mobile fence choices must expose grouped aria semantics and selected state');
ok(a11y.includes("function labelGroups(root,labels)")&&a11y.includes("group.setAttribute('role','group')")&&a11y.includes("group.setAttribute('aria-label',label)"),'dynamic compact option groups must expose a reusable accessible group label');
ok(a11y.includes("labelGroups('#privacyConfig',['Materiál soukromého plotu','Míra soukromí','Směr výplně','Barva nebo dekor'])"),'privacy option groups must have explicit accessible names');
ok(a11y.includes("labelGroups('#metalConfig',['Typ kovové výplně','Průhlednost kovového plotu','Povrch kovového plotu'])"),'metal option groups must have explicit accessible names');
ok(a11y.includes("labelGroups('#concreteConfig',['Provedení betonových desek','Typ betonových sloupků','Barva betonového plotu'])"),'concrete option groups must have explicit accessible names');
ok(a11y.includes("if($('.type.on')?.dataset.id==='masonry')labelGroups('#extraFenceConfig',['Povrch zděného plotu'])"),'masonry option groups must be labelled only when that shared extra configurator represents masonry');
ok(a11y.includes("setAttribute('aria-label','Odebrat úsek '")&&a11y.includes("setAttribute('title','Odebrat úsek '"),'segment remove buttons must have a meaningful accessible name');
ok(a11y.includes("$$('.type img').forEach(img=>img.setAttribute('alt',''))"),'decorative type images must not duplicate the button label for screen readers');
ok(a11y.includes("$$('.type .check').forEach(x=>x.setAttribute('aria-hidden','true'))"),'visual selection checkmarks must stay hidden from assistive technology');
ok(a11y.includes("price.setAttribute('aria-live','polite')")&&a11y.includes("price.setAttribute('aria-atomic','true')"),'dynamic calculator price must be announced as one polite live-region update');
ok(a11y.includes("new MutationObserver(()=>schedule(0)).observe(root,{childList:true,subtree:true})"),'accessibility state must survive dynamic option/config rerenders');
ok(ui.includes("function focusChoice(attr,value){queueMicrotask(()=>{const target=$$('[data-'+attr+']').find(x=>x.dataset[attr]===value)")&&ui.includes("target.focus({preventScroll:true})"),'rerendered calculator choices must restore keyboard focus to the same logical button without a scroll jump');
ok(ui.includes("state[key]=value;renderOptions();focusChoice(attr,value)") ,'panel/mesh option choices must restore focus after renderOptions recreates their buttons');
ok(ui.includes("state.type=value;syncUrlType(value);renderTypes();renderOptions();focusChoice('id',value)") ,'fence type choices must synchronize URL and restore focus after renderTypes recreates the type buttons');
ok(extra.includes("function focusChoice(group,value){queueMicrotask(()=>{const target=$('#extraFenceConfig [data-eg=\"'+group+'\"][data-ev=\"'+value+'\"]')")&&extra.includes('target.focus({preventScroll:true})'),'masonry/mobile dynamic choices must restore focus after their configuration rerender');
ok(extra.includes('s[group]=value;render();focusChoice(group,value)'),'extra fence option click must restore focus to the same logical choice after render');
ok((extra.match(/loading=\"lazy\" decoding=\"async\"/g)||[]).length>=3,'mobile product imagery must decode asynchronously and stay lazy-loaded below the fold');
ok(privacy.includes("function focusChoice(group,value){queueMicrotask(()=>{const target=$('#privacyConfig [data-pg=\"'+group+'\"][data-pv=\"'+value+'\"]')")&&privacy.includes('sync();focusChoice(g,v)'),'privacy choices must restore focus after their configuration rerender');
ok(privacy.includes('function clampGap(value)')&&privacy.includes('Math.max(0,Math.min(100,n))')&&privacy.includes("gap?.addEventListener('change',e=>{state.gap=clampGap(e.target.value);e.target.value=String(state.gap);publish()})"),'privacy gap input must display the same bounded value that pricing actually receives after the edit is committed');
ok(aluminium.includes("function focusField(id){queueMicrotask(()=>{const target=$('#'+id)")&&aluminium.includes('sync(true);focusField(id)'),'aluminium selects must restore focus after their forced configuration rerender');
ok(metal.includes("function focusChoice(group,value){queueMicrotask(()=>{const target=$('#metalConfig [data-mg=\"'+group+'\"][data-mv=\"'+value+'\"]')")&&metal.includes('sync();focusChoice(group,value)'),'metal choices must restore focus after their configuration rerender');
ok(concrete.includes("function focusChoice(group,value){queueMicrotask(()=>{const target=$('#concreteConfig [data-cg=\"'+group+'\"][data-cv=\"'+value+'\"]')")&&concrete.includes('sync();focusChoice(group,value)'),'concrete choices must restore focus after their configuration rerender');

ok(modal.includes("modal.setAttribute('role','dialog')")&&modal.includes("modal.setAttribute('aria-modal','true')"),'lead modal must expose true modal-dialog semantics');
ok(modal.includes("modal.setAttribute('aria-hidden',open?'false':'true')"),'lead modal must keep aria-hidden synchronized with visual open state');
ok(modal.includes("document.body.classList.toggle('plotao-modal-open',open)")&&modal.includes('body.plotao-modal-open{overflow:hidden;overscroll-behavior:none}'),'open modal must lock background page scrolling, including mobile overscroll');
ok(modal.includes("new MutationObserver(()=>sync(modal)).observe(modal,{attributes:true,attributeFilter:['class']})"),'modal semantics and scroll lock must follow every open/close path');

ok(segmentLimit.includes('const LIMIT=12,MAX_TOTAL=1000'),'segment UI must expose the same maximum section count and total length as lead/backend validation');
ok(segmentLimit.includes('btn.disabled=full')&&segmentLimit.includes("btn.setAttribute('aria-disabled',full?'true':'false')"),'add-segment control must become genuinely disabled and accessible at the limit');
ok(segmentLimit.includes("btn.textContent=full?'Maximum 12 úseků':'+ Přidat úsek'"),'segment limit must be visible instead of silently ignoring further clicks');
ok(segmentLimit.includes("new MutationObserver(sync).observe(root,{childList:true})"),'segment limit control must re-enable automatically after a section is removed');
ok(segmentLimit.includes("s.setAttribute('aria-live','polite')"),'segment limit explanation must be announced to assistive technology');
ok(segmentLimit.includes("btn.setAttribute('aria-describedby','segmentLimitStatus')")&&segmentLimit.includes("btn.style.cursor=full?'not-allowed':''"),'disabled segment control must be visibly explained and linked to its status message');
ok(segmentLimit.includes("list.setAttribute('aria-invalid',over?'true':'false')")&&segmentLimit.includes("root.addEventListener('input',sync)"),'total-length validity must update live beside the section inputs');
ok(segmentLimit.includes('Kalkulátor podporuje maximálně 1000 m celkem.'),'1000m calculator boundary must be explained locally instead of only in the result card');
ok(segmentLimit.includes("maximumFractionDigits:2"),'local total-length error must preserve hundredth-metre precision at the 1000m boundary');
ok((accuracy.match(/maximumFractionDigits:2/g)||[]).length===2,'main accuracy guard must preserve hundredth-metre precision in both shared and fallback total-length errors');

ok(leadMode.includes("phone.type='tel'")&&leadMode.includes("phone.autocomplete='tel'")&&leadMode.includes("phone.inputMode='tel'"),'phone field must expose mobile telephone keyboard and autofill semantics');
ok(leadMode.includes("email.type='email'")&&leadMode.includes("email.autocomplete='email'")&&leadMode.includes("email.inputMode='email'"),'email field must expose browser validation, autofill and mobile keyboard semantics');
ok(leadMode.includes("email.autocapitalize='none'")&&leadMode.includes('email.spellcheck=false'),'email input must not be autocapitalized or spell-corrected on mobile');
ok(leadMode.includes('name.required=true')&&leadMode.includes('phone.required=true')&&leadMode.includes('email.required=true'),'all lead modes must require the same core contact identity fields before submission');
ok(leadMode.includes("name.autocomplete='name'")&&leadMode.includes("name.enterKeyHint='next'"),'name field must support contact autofill and efficient mobile keyboard progression');

const limitPos=manifest.indexOf('/assets/segment-limit-ui-v1.js'),a11yPos=manifest.indexOf('/assets/choice-accessibility-v1.js'),scrollPos=manifest.indexOf('/assets/step-scroll-v1.js');
ok(limitPos>manifest.indexOf('/assets/ui-bootstrap-v1.js'),'production manifest must load segment limit UI after bootstrap creates the section controls');
ok(a11yPos>=0&&scrollPos>a11yPos,'production manifest must load the accessibility synchronizer before step scrolling');

if(fail.length){console.error('UX regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('UX regression checks OK: dynamic next-step scroll, focus restoration and labelled groups across core/extra/privacy/aluminium/metal/concrete choices, truthful privacy gap input, modal behavior, explicit segment/length limits, lazy mobile imagery, mobile lead inputs and calculator accessibility are protected');
