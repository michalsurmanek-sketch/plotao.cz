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

async function selectType(page,id,visibleSelector){
  await page.locator(`.type[data-id="${id}"]`).click();
  await page.waitForFunction(type=>document.querySelector(`.type[data-id="${type}"]`)?.getAttribute('aria-pressed')==='true',id,{timeout:5000});
  await page.waitForFunction(type=>new URL(location.href).searchParams.get('type')===type,id,{timeout:5000});
  await page.waitForFunction(type=>document.activeElement?.dataset?.id===type,id,{timeout:5000});
  if(visibleSelector)await page.locator(visibleSelector).waitFor({state:'visible',timeout:5000});
}

async function runScenario(name,viewport,scenario){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  await page.emulateMedia({reducedMotion:'reduce'});
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
  const skip=page.locator('[data-plotao-skip-link="1"]');
  assert(await skip.count()===1,'desktop must expose exactly one keyboard skip link');
  assert((await skip.getAttribute('href'))==='#kalkulator','skip link must target the calculator main landmark');
  assert((await page.locator('#kalkulator').getAttribute('tabindex'))==='-1','calculator main must be programmatically focusable for skip navigation');
  await skip.focus();
  await page.waitForFunction(()=>document.activeElement?.getAttribute('data-plotao-skip-link')==='1',null,{timeout:5000});
  await page.waitForFunction(()=>{
    const el=document.querySelector('[data-plotao-skip-link="1"]');
    if(!el)return false;
    const box=el.getBoundingClientRect();
    return box.top>=0&&box.top<100&&box.bottom>0;
  },null,{timeout:2000});
  const skipBox=await skip.boundingBox();
  assert(Boolean(skipBox&&skipBox.y>=0&&skipBox.y<100),'focused skip link must become visible near the top of the viewport');
  await skip.press('Enter');
  await page.waitForFunction(()=>location.hash==='#kalkulator'&&document.activeElement?.id==='kalkulator',null,{timeout:5000});
  assert((await page.evaluate(()=>document.activeElement?.id))==='kalkulator','activating skip link must move keyboard focus to the calculator main landmark');

  assert((await page.locator('.type[data-id="panel"]').getAttribute('aria-pressed'))==='true','panel must be selected initially');
  assert((await text(page.locator('.price strong'))) !== '—','default panel price must be calculated');

  await selectType(page,'mesh','#fenceVisualRoot[data-type="mesh"]');
  await page.locator('#options [data-mv="welded"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.mv==='welded',null,{timeout:5000});
  assert((await page.locator('#options [data-mv="welded"]').getAttribute('aria-pressed'))==='true','mesh welded choice must expose selected state');

  await selectType(page,'concrete','#concreteConfig');
  await page.locator('#concreteConfig [data-cv="both"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.cv==='both',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#concreteConfig .compact')?.getAttribute('aria-label')==='Provedení betonových desek',null,{timeout:5000});

  await selectType(page,'privacy','#privacyConfig');
  await page.waitForFunction(()=>document.querySelector('#privacyConfig .compact')?.getAttribute('aria-label')==='Materiál soukromého plotu',null,{timeout:5000});
  assert(await page.locator('#privacyConfig [role="group"][aria-label="Materiál soukromého plotu"]').count()===1,'privacy material group must be labelled');
  const gap=page.locator('#privacyGap');
  await gap.fill('150');
  await gap.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#privacyGap')?.value==='100',null,{timeout:5000});
  assert((await gap.inputValue())==='100','privacy gap must display the bounded 100 mm value after commit');

  await selectType(page,'aluminium','#aluminiumConfigBox');
  const aluColor=page.locator('#aluColor');
  await aluColor.focus();
  await aluColor.selectOption('ral');
  await page.waitForFunction(()=>document.activeElement?.id==='aluColor',null,{timeout:5000});
  assert(!(await page.locator('#aluRal').isDisabled()),'custom RAL input must enable after selecting another RAL');

  await selectType(page,'gabion','#gabionOptionsBox');
  await page.locator('#gabionWidth').selectOption('0.50');
  assert((await page.locator('#gabionWidth').inputValue())==='0.50','gabion width selection must remain visible');

  await selectType(page,'metal','#metalConfig');
  await page.locator('#metalConfig [data-mv="laser"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.mv==='laser',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#metalConfig .compact')?.getAttribute('aria-label')==='Typ kovové výplně',null,{timeout:5000});
  assert(await page.locator('#metalConfig [role="group"][aria-label="Typ kovové výplně"]').count()===1,'metal variant group must be labelled');

  await selectType(page,'masonry','#extraFenceConfig');
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig .mobile-product h3')?.textContent==='Betonové tvárnice',null,{timeout:5000});
  assert(await page.locator('#extraFenceConfig img[src*="masonry-blocks-main.webp"]').isVisible(),'masonry configurator must show the generated main product image');
  assert(await page.locator('#extraFenceConfig .mobile-thumbs img').count()===4,'masonry concrete-block variant must show four generated detail images');
  assert(await page.locator('#extraFenceConfig .masonry-finish').count()===1,'surface choice must be visible for concrete blocks');
  await page.locator('#extraFenceConfig [data-ev="brick"]').click();
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig .mobile-product h3')?.textContent==='Cihlový plot',null,{timeout:5000});
  assert(await page.locator('#extraFenceConfig .masonry-finish').count()===0,'surface choice must be hidden for brick and non-block masonry variants');
  assert(await page.locator('#extraFenceConfig img[src*="masonry-brick-main.webp"]').isVisible(),'brick variant must show the generated main product image');
  assert(await page.locator('#extraFenceConfig .mobile-thumbs img').count()===4,'brick variant must show four generated detail images');
  await page.locator('#extraFenceConfig [data-ev="stone"]').click();
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig .mobile-product h3')?.textContent==='Kamenný plot',null,{timeout:5000});
  assert(await page.locator('#extraFenceConfig img[src*="masonry-stone-main.webp"]').isVisible(),'stone variant must show the generated main product image');
  assert(await page.locator('#extraFenceConfig .mobile-thumbs img').count()===4,'stone variant must show four generated detail images');
  await page.locator('#extraFenceConfig [data-ev="split"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.ev==='split',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig .mobile-choices')?.getAttribute('aria-label')==='Konstrukce zděného plotu'&&!document.querySelector('#extraFenceConfig .masonry-finish'),null,{timeout:5000});

  await selectType(page,'mobile','#extraFenceConfig [data-ev="mesh"]');
  assert(await page.locator('#extraFenceConfig [data-ev="mesh"]').count()===1,'mobile configurator must expose its mesh variant');

  await selectType(page,'other','#extraFenceConfig');
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig')?.textContent?.includes('Atypické oplocení'),null,{timeout:5000});
  assert((await text(page.locator('#extraFenceConfig'))).includes('individuální nabídku'),'atypical branch must render its individual-offer explanation');

  await selectType(page,'panel','#fenceVisualRoot[data-type="panel"]');
  await page.locator('#options [data-pv="2d"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.pv==='2d',null,{timeout:5000});
  assert((await page.locator('#options [data-pv="2d"]').getAttribute('aria-pressed'))==='true','panel 2D choice must expose selected state');

  const before=await page.locator('#segmentList .segment').count();
  await page.locator('#addSegment').click();
  await page.waitForFunction(expected=>document.querySelectorAll('#segmentList .segment').length===expected,before+1,{timeout:5000});
  assert(await page.locator('#segmentList .segment').count()===before+1,'add segment must create exactly one new section');

  await page.locator('[data-shape-mode="rectangle"]').click();
  await page.locator('#plotRectFields').waitFor({state:'visible'});
  await page.locator('#plotRectWidth').fill('20');
  await page.locator('#plotRectDepth').fill('15');
  await page.locator('#plotRectApply').click();
  await page.waitForFunction(()=>window.PLOTAO_PLOT_SHAPE?.mode==='rectangle'&&window.PLOTAO_PLOT_SHAPE?.closed===true,null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelectorAll('#segmentList .segment').length===4,null,{timeout:5000});
  await page.waitForFunction(()=>window.PLOTAO_GEOMETRY?.closed===true&&window.PLOTAO_GEOMETRY?.corner===4&&window.PLOTAO_GEOMETRY?.end===0&&window.PLOTAO_GEOMETRY?.corners===4&&window.PLOTAO_GEOMETRY?.gross===70,null,{timeout:5000});
  const rectangle=await page.evaluate(()=>({
    names:[...document.querySelectorAll('#segmentList [data-segment-name]')].map(x=>x.value),
    lengths:[...document.querySelectorAll('#segmentList .segment input[type=number]')].map(x=>Number(x.value)),
    links:window.PLOTAO_SEGMENT_CONNECTIONS,
    shape:window.PLOTAO_PLOT_SHAPE,
    geometry:window.PLOTAO_GEOMETRY
  }));
  assert(JSON.stringify(rectangle.names)===JSON.stringify(['Strana A','Strana B','Strana C','Strana D']),'rectangle mode must name its four sides A–D');
  assert(JSON.stringify(rectangle.lengths)===JSON.stringify([20,15,20,15]),'20 × 15 rectangle must create 20/15/20/15 m sides');
  assert(JSON.stringify(rectangle.links)===JSON.stringify([false,true,true,true]),'rectangle sides B–D must connect by corners');
  assert(rectangle.geometry?.closed===true&&rectangle.geometry?.corner===4&&rectangle.geometry?.end===0&&rectangle.geometry?.corners===4,'closed rectangle material geometry must have 4 corners and 0 end posts');
  assert(rectangle.geometry?.gross===70,'20 × 15 rectangle perimeter must equal 70 m');
  assert((await text(page.locator('#plotRectStatus'))).includes('4 rohy'),'rectangle status must explain the four closed corners');
  assert(await page.locator('.plotao-segment-mini').count()===4,'rectangle mode must render one mini drawing per side');
  assert((await page.locator('#planLines svg').getAttribute('aria-label'))?.includes('uzavřený obdélník'),'top-view SVG must identify the closed rectangle');
  assert(await page.locator('#addSegment').isDisabled(),'closed rectangle must lock adding a fifth side');

  await page.locator('#plotRectWidth').fill('12');
  await page.locator('#plotSquareApply').click();
  await page.waitForFunction(()=>window.PLOTAO_GEOMETRY?.closed===true&&window.PLOTAO_GEOMETRY?.gross===48&&window.PLOTAO_GEOMETRY?.corner===4,null,{timeout:5000});
  assert((await page.locator('#plotRectDepth').inputValue())==='12','square shortcut must copy width into depth');
  assert((await text(page.locator('#plotRectStatus'))).includes('Uzavřený čtverec'),'equal sides must be described as a closed square');
});

await runScenario('mobile-390',{width:390,height:844},async page=>{
  assert(await page.locator('.mobile-price').isVisible(),'mobile sticky price bar must be visible at 390px');
  await selectType(page,'mobile','#extraFenceConfig [data-ev="mesh"]');
  await page.locator('#extraFenceConfig [data-ev="solid"]').click();
  await page.waitForFunction(()=>document.activeElement?.dataset?.ev==='solid',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#extraFenceConfig [data-ev="solid"]')?.getAttribute('aria-pressed')==='true',null,{timeout:5000});
  assert((await page.locator('#extraFenceConfig [data-ev="solid"]').getAttribute('aria-pressed'))==='true','mobile solid choice must expose selected state');

  await page.waitForFunction(()=>document.querySelector('#height')?.value==='200'&&document.querySelector('#height')?.closest('label')?.hidden===true,null,{timeout:5000});
  assert(!(await page.locator('#height').isVisible()),'mobile height field must be hidden because subtype fixes the height');
  assert((await page.locator('#height').inputValue())==='200','solid mobile panel must use its fixed 200 cm height');
  await page.locator('#extraFenceConfig [data-ev="barrier"]').click();
  await page.waitForFunction(()=>document.querySelector('#height')?.value==='110',null,{timeout:5000});
  assert((await page.locator('#height').inputValue())==='110','mobile barrier must use its fixed 110 cm height');
  assert((await text(page.locator('#mobileFixedHeightNote'))).includes('110 cm'),'mobile UI must explain the fixed barrier height');

  await page.locator('#lead').click();
  const modal=page.locator('#modal');
  await modal.waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#modal')?.getAttribute('role')==='dialog'&&document.querySelector('#modal')?.getAttribute('aria-modal')==='true',null,{timeout:5000});
  assert((await modal.getAttribute('role'))==='dialog','lead modal must expose dialog role');
  assert((await modal.getAttribute('aria-modal'))==='true','lead modal must expose aria-modal=true');
  const privacyNotice=modal.locator('[data-plotao-privacy-notice="1"]');
  assert(await privacyNotice.isVisible(),'lead modal must show the privacy information notice before submission');
  assert((await text(privacyNotice)).includes('Údaje použijeme k vyřízení poptávky'),'lead privacy notice must explain why contact data are used');
  const privacyLink=privacyNotice.locator('a[href="/ochrana-osobnich-udaju.html"]');
  assert(await privacyLink.isVisible(),'lead privacy notice must expose a visible privacy-page link');
  assert((await privacyLink.getAttribute('href'))==='/ochrana-osobnich-udaju.html','lead privacy link must target the canonical privacy page');
  await page.keyboard.press('Escape');
  await modal.waitFor({state:'hidden'});

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=1,`page must not create horizontal viewport overflow at 390px (overflow ${overflow}px)`);

  await page.goto(baseUrl+'/ochrana-osobnich-udaju.html',{waitUntil:'networkidle'});
  const privacyH1=page.locator('h1');
  assert(await privacyH1.isVisible(),'privacy page H1 must be visible in browser');
  assert((await text(privacyH1))==='Ochrana osobních údajů','privacy page must expose the expected H1');
  const privacyBody=await text(page.locator('body'));
  assert(privacyBody.includes('AO Holding s.r.o.'),'privacy page must identify AO Holding s.r.o. as controller');
  const controllerEmail=page.locator('a[href="mailto:info@slevao.cz"]');
  assert(await controllerEmail.isVisible(),'privacy page must expose a visible verified controller email');
  assert((await text(controllerEmail))==='info@slevao.cz','privacy controller email text must match the verified address');
  assert(privacyBody.includes('Poptávkový formulář PLOTAO.cz není určen pro žádosti týkající se ochrany osobních údajů.'),'privacy page must not route data-subject requests into the disabled lead form');
  assert(await page.locator('a[href="/#kalkulator"]').first().isVisible(),'privacy page must offer a visible route back to the calculator');
});

if(failures.length){
  console.error('Browser E2E failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Browser E2E OK: all 10 fence types plus desktop, 390px mobile, closed rectangle/square plot mode, keyboard skip navigation and privacy flows passed without browser-console or same-origin request failures');