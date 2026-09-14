import {chromium} from 'playwright';

const baseUrl=process.env.PLOTAO_E2E_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
const assert=(value,message)=>{if(!value)throw new Error(message)};

try{
  await page.goto(baseUrl+'/?free-route-e2e=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.PLOTAO_UI_READY===true&&window.PLOTAO_SEGMENT_PLAN_READY===true,null,{timeout:10000});
  await page.locator('[data-shape-mode="free"]').click();

  while(await page.locator('#segmentList .segment').count()<4){
    await page.locator('#addSegment').click();
    await page.waitForTimeout(120);
  }
  while(await page.locator('#segmentList .segment').count()>4){
    await page.locator('#segmentList .segment').last().locator('[data-remove],.remove').click();
    await page.waitForTimeout(120);
  }

  const rows=page.locator('#segmentList .segment');
  for(const [i,length] of [20,10,20,10].entries()){
    const input=rows.nth(i).locator('input[type="number"]').first();
    await input.fill(String(length));
  }

  for(let i=1;i<4;i++){
    const connected=page.locator(`[data-segment-connected="${i}"]`);
    if(!(await connected.isChecked()))await connected.check();
  }
  await page.waitForFunction(()=>document.querySelectorAll('[data-segment-turn]').length===3,null,{timeout:5000});
  for(let i=1;i<4;i++)await page.locator(`[data-segment-turn="${i}"]`).selectOption('right');
  await page.waitForTimeout(150);

  const defaultState=await page.evaluate(()=>{
    const green=[...document.querySelectorAll('#planLines svg line[stroke="#087443"]')].slice(0,4).map(line=>({
      x1:+line.getAttribute('x1'),y1:+line.getAttribute('y1'),x2:+line.getAttribute('x2'),y2:+line.getAttribute('y2')
    }));
    return {turns:window.PLOTAO_SEGMENT_TURNS,green,geometry:window.PLOTAO_GEOMETRY,svg:document.querySelector('#planLines svg')?.innerHTML||''};
  });
  assert(JSON.stringify(defaultState.turns)===JSON.stringify([null,'right','right','right']),'four-section free route must default to three right turns');
  assert(defaultState.green.length===4,'free-route top view must draw four fence runs');
  const [a,b,c,d]=defaultState.green;
  const near=(x,y)=>Math.abs(x-y)<1;
  assert(near(a.y1,a.y2)&&near(c.y1,c.y2),'first and third runs must be horizontal after repeated right turns');
  assert(near(b.x1,b.x2)&&near(d.x1,d.x2),'second and fourth runs must be vertical after repeated right turns');
  assert(near(a.x1,d.x2)&&near(a.y1,d.y2),'20/10/20/10 with three right turns must return visually to the start instead of forming stairs');
  assert(defaultState.geometry?.closed!==true,'free-route visual return must not silently change material topology to closed mode');

  await page.locator('[data-segment-turn="2"]').selectOption('left');
  await page.waitForFunction(()=>window.PLOTAO_SEGMENT_TURNS?.[2]==='left',null,{timeout:5000});
  await page.waitForTimeout(100);
  const changed=await page.evaluate(()=>document.querySelector('#planLines svg')?.innerHTML||'');
  assert(changed!==defaultState.svg,'changing a corner from right to left must redraw the free-route plan');

  if(errors.length)throw new Error('browser errors: '+errors.join(' | '));
  console.log('Free-route browser check OK: clockwise turns no longer stair-step and each connected corner can switch right/left');
}finally{
  await context.close();
  await browser.close();
}
