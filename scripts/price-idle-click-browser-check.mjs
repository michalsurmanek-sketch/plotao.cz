import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 for(const type of ['mesh','panel']){
  await page.goto((process.env.PLOTAO_E2E_URL||'https://plotao.cz')+'/?type='+type,{waitUntil:'networkidle'});
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{
   window.idlePriceEvents=[];window.idlePriceTexts=[];
   for(const name of ['plotao:geometry','plotao:mesh-price','plotao:panel-price'])document.addEventListener(name,()=>window.idlePriceEvents.push(name));
   new MutationObserver(()=>window.idlePriceTexts.push(document.querySelector('.price strong')?.textContent)).observe(document.querySelector('.price strong'),{childList:true,subtree:true,characterData:true});
  });
  const price=await page.locator('.price strong').innerText();
  for(const selector of ['h1','#fenceVisualRoot .pc-main>img','#fenceVisualRoot .pc-tip']){
   await page.locator(selector).click();
   await page.waitForTimeout(700);
  }
  const idle=await page.evaluate(()=>({events:window.idlePriceEvents,texts:window.idlePriceTexts}));
  if(idle.events.length||idle.texts.some(s=>s!==price))throw Error(type+' unrelated click recalculated: '+JSON.stringify(idle));
  await page.locator('#segmentList input[type=number]').first().fill('20');
  await page.locator('#height').click();
  await page.waitForTimeout(1200);
  if(await page.locator('.price strong').innerText()===price)throw Error(type+' length change did not update price');
  console.log(type+': text/image clicks keep price stable; length change updates price');
 }
}finally{await browser.close()}
