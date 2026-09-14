import {chromium} from 'playwright';

const baseUrl=process.env.PLOTAO_E2E_URL||'http://127.0.0.1:4173';
const baseOrigin=new URL(baseUrl).origin;
const failures=[];
const assert=(value,message)=>{if(!value)throw new Error(message)};
const text=async locator=>(await locator.textContent()||'').trim();

async function waitForReady(page){
  await page.goto(baseUrl+'/?e2e=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.PLOTAO_UI_READY===true,null,{timeout:10000});
  await page.waitForFunction(()=>{
    const value=document.querySelector('.price strong')?.textContent?.trim();
    return Boolean(value&&value!=='—'&&!value.includes('NaN'));
  },null,{timeout:10000});
}

async function runScenario(name,viewport,scenario){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push('pageerror: '+error.message));
  page.on('console',message=>{if(message.type()==='error')browserErrors.push('console: '+message.text())});
  page.on('requestfailed',request=>{if(request.url().startsWith(baseOrigin))browserErrors.push('requestfailed: '+request.url()+' '+(request.failure()?.errorText||''))});
  try{
    await waitForReady(page);
    await scenario(page);
    if(browserErrors.length)throw new Error(browserErrors.join('\n'));
    console.log(`Browser E2E ${name} OK`);
  }catch(error){
    failures.push(`${name}: ${error.stack||error.message||error}`);
  }finally{
    await context.close();
    await browser.close();
  }
}

await runScenario('desktop',{width:1440,height:1000},async page=>{
  assert(await page.locator('h1').isVisible(),'desktop H1 must be visible');
  assert((await page.locator('.type[data-id="panel"]').getAttribute('aria-pressed'))==='true','panel must be selected initially');
  assert((await text(page.locator('.price strong'))) !== '—','default panel price must be calculated');

  await page.locator('.type[data-id="privacy"]').click();
  await page.locator('#privacyConfig').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.activeElement?.dataset?.id==='privacy',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#privacyConfig .compact')?.getAttribute('aria-label')==='Materiál soukromého plotu',null,{timeout:5000});
  assert(await page.locator('#privacyConfig [role="group"][aria-label="Materiál soukromého plotu"]').count()===1,'privacy material group must be labelled');
  const gap=page.locator('#privacyGap');
  await gap.fill('150');
  await gap.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#privacyGap')?.value==='100',null,{timeout:5000});
  assert((await gap.inputValue())==='100','privacy gap must display the bounded 100 mm value after commit');

  await page.locator('.type[data-id="aluminium"]').click();
  await page.locator('#aluminiumConfigBox').waitFor({state:'visible'});
  await page.locator('#aluColor').selectOption('ral');
  await page.waitForFunction(()=>document.activeElement?.id==='aluColor',null,{timeout:5000});
  assert(!(await page.locator('#aluRal').isDisabled()),'custom RAL input must enable after selecting another RAL');

  await page.locator('.type[data-id="metal"]').click();
  await page.locator('#metalConfig').waitFor({state:'visible'});
  await page.locator('#metalConfig [data-mv="laser"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.mv==='laser',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#metalConfig .compact')?.getAttribute('aria-label')==='Typ kovové výplně',null,{timeout:5000});
  assert(await page.locator('#metalConfig [role="group"][aria-label="Typ kovové výplně"]').count()===1,'metal variant group must be labelled');

  const before=await page.locator('#segmentList .segment').count();
  await page.locator('#addSegment').click();
  await page.waitForFunction(expected=>document.querySelectorAll('#segmentList .segment').length===expected,before+1,{timeout:5000});
  assert(await page.locator('#segmentList .segment').count()===before+1,'add segment must create exactly one new section');
});

await runScenario('mobile-390',{width:390,height:844},async page=>{
  assert(await page.locator('.mobile-price').isVisible(),'mobile sticky price bar must be visible at 390px');
  await page.locator('.type[data-id="mobile"]').click();
  await page.locator('#extraFenceConfig .mobile-choices').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.activeElement?.dataset?.id==='mobile',null,{timeout:5000});
  await page.locator('#extraFenceConfig [data-ev="solid"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.ev==='solid',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig [data-ev="solid"]')?.getAttribute('aria-pressed')==='true',null,{timeout:5000});
  assert((await page.locator('#extraFenceConfig [data-ev="solid"]').getAttribute('aria-pressed'))==='true','mobile solid choice must expose selected state');

  await page.locator('#height').fill('180');
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('height')==='180',null,{timeout:5000});
  assert((await page.locator('#height').inputValue())==='180','mobile height field must accept a valid value');

  await page.locator('#lead').click();
  const modal=page.locator('#modal');
  await modal.waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#modal')?.getAttribute('role')==='dialog'&&document.querySelector('#modal')?.getAttribute('aria-modal')==='true',null,{timeout:5000});
  assert((await modal.getAttribute('role'))==='dialog','lead modal must expose dialog role');
  assert((await modal.getAttribute('aria-modal'))==='true','lead modal must expose aria-modal=true');
  await page.keyboard.press('Escape');
  await modal.waitFor({state:'hidden'});

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=1,`page must not create horizontal viewport overflow at 390px (overflow ${overflow}px)`);
});

if(failures.length){
  console.error('Browser E2E failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Browser E2E OK: desktop and 390px mobile flows passed without browser-console or same-origin request failures');
