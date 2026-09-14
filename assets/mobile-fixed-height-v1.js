(()=>{'use strict';
const $=s=>document.querySelector(s);
let previousHeight=null;
function selectedType(){return $('.type.on')?.dataset.id||''}
function fixedHeight(){
 const c=window.PLOTAO_EXTRA;
 if(selectedType()!=='mobile'||c?.type!=='mobile')return null;
 return c.variant==='barrier'?110:190;
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
  note.textContent=value===110?'Výška mobilní zábrany je daná zvoleným provedením: 110 cm.':'Výška mobilního panelu je daná zvoleným provedením: 190 cm.';
  note.style.display='block';
  height.dispatchEvent(new Event('input',{bubbles:true}));
  height.dispatchEvent(new Event('change',{bubbles:true}));
 }else{
  label.hidden=false;
  note.style.display='none';
  if(previousHeight!==null){height.value=previousHeight;previousHeight=null;height.dispatchEvent(new Event('input',{bubbles:true}));height.dispatchEvent(new Event('change',{bubbles:true}))}
 }
}
function schedule(){clearTimeout(schedule.t);schedule.t=setTimeout(sync,30)}
document.addEventListener('plotao:extra',schedule);
document.addEventListener('plotao:ui-ready',schedule);
document.addEventListener('click',e=>{if(e.target.closest('.type,[data-eg="variant"]'))schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
})();
