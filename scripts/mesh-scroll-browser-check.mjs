import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto((process.env.PLOTAO_E2E_URL||'https://plotao.cz')+'/?type=mesh#kalkulator',{waitUntil:'networkidle'});
  const zinc=page.locator('#fenceVisualRoot[data-type=mesh] [data-mesh-zinc]');
  await zinc.waitFor({state:'visible'});
  await zinc.click();
  await page.waitForFunction(()=>{const b=document.querySelector('#fenceVisualRoot[data-type=mesh] [data-mesh-zinc].on');return b&&Math.abs(b.getBoundingClientRect().top-5)<2},null,{timeout:10000});
  await page.waitForTimeout(500);
  const top=await zinc.evaluate(b=>b.getBoundingClientRect().top);
  if(Math.abs(top-5)>2)throw Error('Zinc scroll shifted at '+width+': '+top);
  console.log('Zinc click scroll verified at '+width+'px: top='+top);
  await page.close();
 }
} finally {await browser.close()}
