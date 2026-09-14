import {chromium} from 'playwright';

const baseUrl=process.env.PLOTAO_E2E_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});

async function verify(viewport,label){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  try{
    await page.goto(baseUrl+'/?e2e=segment-add-position',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.PLOTAO_UI_READY===true&&document.querySelector('#segmentList')&&document.querySelector('#addSegment'),null,{timeout:10000});
    const before=await page.locator('#segmentList .segment').count();
    const initial=await page.evaluate(()=>{
      const list=document.querySelector('#segmentList'),btn=document.querySelector('#addSegment');
      const lb=list.getBoundingClientRect(),bb=btn.getBoundingClientRect();
      return{directlyAfter:btn.previousElementSibling===list,sameParent:btn.parentElement===list.parentElement,below:bb.top>=lb.bottom-1,widthRatio:bb.width/Math.max(1,lb.width),classOk:btn.classList.contains('segment-add-bottom')};
    });
    if(!initial.directlyAfter||!initial.sameParent||!initial.below||initial.widthRatio<.95||!initial.classOk)throw new Error(`${label}: add-segment action must sit full-width directly below the section list: ${JSON.stringify(initial)}`);
    await page.locator('#addSegment').click();
    await page.waitForFunction(expected=>document.querySelectorAll('#segmentList .segment').length===expected,before+1,{timeout:5000});
    await page.waitForTimeout(120);
    const after=await page.evaluate(()=>{
      const list=document.querySelector('#segmentList'),btn=document.querySelector('#addSegment');
      const lb=list.getBoundingClientRect(),bb=btn.getBoundingClientRect();
      return{directlyAfter:btn.previousElementSibling===list,below:bb.top>=lb.bottom-1,widthRatio:bb.width/Math.max(1,lb.width)};
    });
    if(!after.directlyAfter||!after.below||after.widthRatio<.95)throw new Error(`${label}: add-segment action must remain below the list after adding a section: ${JSON.stringify(after)}`);
    console.log(`Segment add-position browser check ${label} OK`);
  }finally{
    await context.close();
  }
}

try{
  await verify({width:1440,height:1000},'desktop');
  await verify({width:390,height:844},'mobile-390');
}finally{
  await browser.close();
}
