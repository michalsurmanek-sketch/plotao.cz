import {chromium} from 'playwright';

const baseUrl=process.env.PLOTAO_E2E_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
try{
  await page.goto(baseUrl+'/?focus-e2e=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.PLOTAO_UI_READY===true,null,{timeout:10000});
  let reached=false;
  for(let i=0;i<120;i++){
    await page.keyboard.press('Tab');
    const id=await page.evaluate(()=>document.activeElement?.id||'');
    if(id==='addSegment'){reached=true;break}
  }
  if(!reached)throw new Error('Keyboard traversal did not reach #addSegment within 120 Tab presses');
  const state=await page.locator('#addSegment').evaluate(el=>{
    const style=getComputedStyle(el);
    return{
      focusVisible:el.matches(':focus-visible'),
      outlineStyle:style.outlineStyle,
      outlineWidth:parseFloat(style.outlineWidth)||0,
      outlineColor:style.outlineColor,
      outlineOffset:parseFloat(style.outlineOffset)||0
    };
  });
  if(!state.focusVisible)throw new Error('#addSegment is focused by keyboard but does not match :focus-visible');
  if(state.outlineStyle==='none'||state.outlineWidth<2)throw new Error(`Keyboard focus outline is not visibly rendered: ${JSON.stringify(state)}`);
  if(state.outlineOffset<2)throw new Error(`Keyboard focus outline offset is too small: ${JSON.stringify(state)}`);
  console.log(`Focus-visible browser check OK: #addSegment keyboard focus has ${state.outlineWidth}px ${state.outlineStyle} outline (${state.outlineColor}), offset ${state.outlineOffset}px`);
}finally{
  await context.close();
  await browser.close();
}
