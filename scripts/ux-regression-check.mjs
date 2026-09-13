import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const scroll=read('assets/step-scroll-v1.js'),a11y=read('assets/choice-accessibility-v1.js'),manifest=read('scripts/pages-manifest.mjs');

for(const [type,id] of Object.entries({privacy:'#privacyConfig',aluminium:'#aluminiumConfigBox',gabion:'#gabionOptionsBox',metal:'#metalConfig',concrete:'#concreteConfig',masonry:'#extraFenceConfig',mobile:'#extraFenceConfig',other:'#extraFenceConfig'}))ok(scroll.includes(type+":'"+id+"'")||scroll.includes(type+':"'+id+'"'),'next-step scroll must target the visible '+type+' configuration');
ok(scroll.includes('scrollToEl(nextAfterType,180)'),'type scroll target must be resolved after dynamic configuration modules render');
ok(scroll.includes("getComputedStyle(el).display!=='none'")&&scroll.includes('getClientRects().length>0'),'next-step scroll must ignore hidden configuration anchors');
ok(scroll.includes("window.matchMedia?.('(prefers-reduced-motion: reduce)')"),'smooth scrolling must respect reduced-motion preference without assuming matchMedia exists');

ok(a11y.includes("setAttribute('aria-pressed'")&&a11y.includes("classList.contains('on')"),'choice buttons must expose selected state through aria-pressed');
ok(a11y.includes("setAttribute('aria-label','Odebrat úsek '")&&a11y.includes("setAttribute('title','Odebrat úsek '"),'segment remove buttons must have a meaningful accessible name');
ok(a11y.includes("$$('.type img').forEach(img=>img.setAttribute('alt',''))"),'decorative type images must not duplicate the button label for screen readers');
ok(a11y.includes("$$('.type .check').forEach(x=>x.setAttribute('aria-hidden','true'))"),'visual selection checkmarks must stay hidden from assistive technology');
ok(a11y.includes("price.setAttribute('aria-live','polite')")&&a11y.includes("price.setAttribute('aria-atomic','true')"),'dynamic calculator price must be announced as one polite live-region update');
ok(a11y.includes("new MutationObserver(()=>schedule(0)).observe(root,{childList:true,subtree:true})"),'accessibility state must survive dynamic option/config rerenders');
const a11yPos=manifest.indexOf('/assets/choice-accessibility-v1.js'),scrollPos=manifest.indexOf('/assets/step-scroll-v1.js');
ok(a11yPos>=0&&scrollPos>a11yPos,'production manifest must load the accessibility synchronizer before step scrolling');

if(fail.length){console.error('UX regression checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('UX regression checks OK: dynamic next-step scroll and calculator choice accessibility are protected');
