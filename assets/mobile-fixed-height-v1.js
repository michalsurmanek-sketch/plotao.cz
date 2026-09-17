(()=>{'use strict';
const $=s=>document.querySelector(s);
let previousHeight=null;
function selectedType(){return $('.type.on')?.dataset.id||''}
function fixedHeight(){
 if(selectedType()!=='mobile')return null;
 const variant=$('#extraFenceConfig [data-eg="variant"].on')?.dataset.ev||window.PLOTAO_EXTRA?.variant||'mesh';
 return variant==='barrier'?110:variant==='solid'?200:190;
}
function ensureNote(grid){
 let n=$('#mobileFixedHeightNote');
 if(!n){n=document.createElement('div');n.id='mobileFixedHeightNote';n.className='mobile-tip';n.style.cssText='display:none;grid-column:1/-1;margin:0;padding:12px 14px;border-radius:12px;background:#eaf8f0;color:#486157;font-size:13px;line-height:1.4';grid.prepend(n)}
 return n;
}
function sync(){
 const height=$('#height'),grid=height?.closest('.config-grid'),label=height?.closest('label');
 if(!height||!grid||!label)return;
 const value=fixedHeight(),note=ensureNote(grid);
 if(value!==null){
  if(previousHeight===null)previousHeight=height.value;
  label.hidden=true;
  height.value=String(value);
  note.textContent=value===110?'Výška mobilní zábrany je daná zvoleným provedením: 110 cm.':value===200?'Výška plného mobilního panelu je daná zvoleným provedením: 200 cm.':'Výška síťového mobilního panelu je daná zvoleným provedením: 190 cm.';
  note.style.display='block';
  height.dispatchEvent(new Event('input',{bubbles:true}));
  height.dispatchEvent(new Event('change',{bubbles:true}));
 }else{
  label.hidden=false;
  note.style.display='none';
  if(previousHeight!==null){height.value=previousHeight;previousHeight=null;height.dispatchEvent(new Event('input',{bubbles:true}));height.dispatchEvent(new Event('change',{bubbles:true}))}
 }
}
let syncPending=false;
function schedule(){
 if(syncPending)return;
 syncPending=true;
 queueMicrotask(()=>{syncPending=false;sync()});
}
document.addEventListener('plotao:extra',schedule);
document.addEventListener('plotao:ui-ready',schedule);
document.addEventListener('click',e=>{if(e.target.closest('.type,[data-eg="variant"]'))schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();

let desktopPartnerBgPromise=null;
function desktopPartnerBg(){
 if(!desktopPartnerBgPromise){
  const files=[1,2,3,4].map(n=>`/assets/images/partner-desktop-bg-${n}.txt?v=20260916`);
  desktopPartnerBgPromise=Promise.all(files.map(url=>fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('partner-bg');return r.text()})))
   .then(parts=>'data:image/webp;base64,'+parts.join(''));
 }
 return desktopPartnerBgPromise;
}

function applyMobilePartnerArtwork(){
 const partner=document.querySelector('.partner');
 if(!partner)return;
 const mobile=window.matchMedia('(max-width:760px)').matches;
 const cta=partner.querySelector('#partner');
 if(mobile){
  Array.from(partner.children).forEach(el=>el.style.setProperty('display','none','important'));
  partner.style.setProperty('display','block','important');
  partner.style.setProperty('position','relative','important');
  partner.style.setProperty('width','100%','important');
  partner.style.setProperty('aspect-ratio','3 / 2','important');
  partner.style.setProperty('min-height','0','important');
  partner.style.setProperty('height','auto','important');
  partner.style.setProperty('padding','0','important');
  partner.style.setProperty('border','0','important');
  partner.style.setProperty('border-radius','22px','important');
  partner.style.setProperty('overflow','hidden','important');
  partner.style.setProperty('background-image',"url('/assets/images/pro-vyrobce-bg.png?v=7601917')",'important');
  partner.style.setProperty('background-size','contain','important');
  partner.style.setProperty('background-position','center','important');
  partner.style.setProperty('background-repeat','no-repeat','important');
  partner.style.setProperty('background-color','#063428','important');
  if(cta){
   cta.style.setProperty('display','block','important');
   cta.style.setProperty('position','absolute','important');
   cta.style.setProperty('z-index','5','important');
   cta.style.setProperty('left','5.2%','important');
   cta.style.setProperty('top','72%','important');
   cta.style.setProperty('width','34%','important');
   cta.style.setProperty('height','12%','important');
   cta.style.setProperty('min-height','0','important');
   cta.style.setProperty('padding','0','important');
   cta.style.setProperty('margin','0','important');
   cta.style.setProperty('border','0','important');
   cta.style.setProperty('border-radius','12px','important');
   cta.style.setProperty('background','transparent','important');
   cta.style.setProperty('color','transparent','important');
   cta.style.setProperty('box-shadow','none','important');
   cta.style.setProperty('cursor','pointer','important');
   cta.style.setProperty('opacity','1','important');
  }
 }else{
  Array.from(partner.children).forEach(el=>el.style.removeProperty('display'));
  ['display','position','width','aspect-ratio','height','padding','border','border-radius','overflow'].forEach(p=>partner.style.removeProperty(p));
  partner.style.setProperty('min-height','360px','important');
  partner.style.setProperty('background-size','cover','important');
  partner.style.setProperty('background-position','center','important');
  partner.style.setProperty('background-repeat','no-repeat','important');
  partner.style.setProperty('background-color','#063428','important');
  desktopPartnerBg().then(bg=>{
   if(window.matchMedia('(min-width:761px)').matches&&partner.isConnected){
    partner.style.setProperty('background-image','url("'+bg+'")','important');
   }
  }).catch(()=>{});
  if(cta)['display','position','z-index','left','top','width','height','min-height','padding','margin','border','border-radius','background','color','box-shadow','cursor','opacity'].forEach(p=>cta.style.removeProperty(p));
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyMobilePartnerArtwork);else applyMobilePartnerArtwork();
window.addEventListener('resize',applyMobilePartnerArtwork);
})();
