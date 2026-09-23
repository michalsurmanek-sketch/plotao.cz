import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto((process.env.PLOTAO_E2E_URL||'https://plotao.cz')+'/?type=mesh',{waitUntil:'networkidle'});
  await page.locator('#height').fill('150');
  await page.locator('[data-mesh-zinc]').click();
  await page.locator('.mesh-more summary').click();
  for(const [variant,name,priced] of [['forest','Lesnické','forest'],['breeder','Chovatelské','animal'],['security','Bezpečnostní','security'],['forest','Lesnické','forest']]){
   await page.locator('[data-mv="'+variant+'"]').click();
   await page.waitForTimeout(1200);
   const actual=await page.evaluate(()=>({selected:[...document.querySelectorAll('#options [data-mv].on')].map(b=>b.dataset.mv),zinc:document.querySelector('[data-mesh-zinc]')?.classList.contains('on'),title:document.querySelector('.pc-main h3')?.textContent,price:window.PLOTAO_MESH_PRICE,badge:document.querySelector('.pc-head>span')?.textContent,total:document.querySelector('.price strong')?.textContent}));
   if(actual.selected.join()!==variant||actual.zinc||!actual.title.includes(name)||actual.price.variant!==priced||actual.price.unsupported||!actual.badge.includes('Ověřen')||!actual.total.includes('Kč'))throw Error(width+' '+variant+': '+JSON.stringify(actual));
  }
  await page.locator('#height').fill('350');
  await page.waitForTimeout(1200);
  if(!(await page.locator('.pc-head>span').innerText()).includes('Individuální'))throw Error('Unsupported height must show individual badge');
  console.log(width+': forest, breeder, security and unsupported height stay synchronized');
  await page.close();
 }
}finally{await browser.close()}
