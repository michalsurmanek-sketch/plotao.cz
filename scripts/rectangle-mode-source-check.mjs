import fs from 'node:fs';

const topview=fs.readFileSync('assets/segment-plan-topview-v1.js','utf8');
const geometry=fs.readFileSync('assets/geometry-v3.js','utf8');
const core=fs.readFileSync('assets/geometry-core-v1.js','utf8');
const connections=fs.readFileSync('assets/segment-connections-v1.js','utf8');
const browser=fs.readFileSync('scripts/browser-e2e.mjs','utf8');
const fail=[];
const ok=(value,message)=>{if(!value)fail.push(message)};

ok(topview.includes('data-shape-mode="rectangle"')&&topview.includes('Obdélník / čtverec'),'plot UI must keep the rectangle/square mode');
ok(topview.includes('id="plotRectWidth"')&&topview.includes('id="plotRectDepth"'),'rectangle mode must keep width and depth inputs');
ok(topview.includes('id="plotRectApply"')&&topview.includes('id="plotSquareApply"'),'rectangle mode must keep both rectangle and square actions');
ok(topview.includes("const vals=[w,d,w,d],names=['Strana A','Strana B','Strana C','Strana D']"),'rectangle mode must generate four named opposite-equal sides');
ok(topview.includes("window.PLOTAO_SET_SEGMENT_CONNECTIONS?.([false,true,true,true])"),'rectangle mode must connect sides B-D into one continuous perimeter');
ok(topview.includes("plotShape={mode:'rectangle',closed:true,width:w,depth:d}"),'rectangle mode must publish a closed shape state');
ok(topview.includes("if(rectActive()&&ss.length===4)")&&topview.includes('const dirs=[[1,0],[0,1],[-1,0],[0,-1]]'),'closed top view must return to the starting point through four orthogonal sides');
ok(topview.includes('perimeter>1000.001'),'rectangle mode must respect the calculator 1000 m perimeter boundary');
ok(connections.includes('window.PLOTAO_SET_SEGMENT_CONNECTIONS=setConnections'),'shared connection owner must expose the reviewed rectangle setter');
ok(geometry.includes("closed:shape?.mode==='rectangle'&&shape?.closed===true"),'geometry adapter must pass closed rectangle state to shared geometry');
ok(core.includes('const closed=!!input.closed')&&core.includes("if(closed)add('closure','corner')"),'shared geometry core must model the closing corner');
ok(core.includes('const prevLinked=i=>i>0?linked(i):closed')&&core.includes('const nextLinked=i=>i<segments.length-1?linked(i+1):closed'),'closed geometry must wrap first/last segment adjacency');
ok(browser.includes("await page.locator('[data-shape-mode=\"rectangle\"]').click()"),'browser E2E must actually enter rectangle mode');
ok(browser.includes("fill('20')")&&browser.includes("fill('15')")&&browser.includes('window.PLOTAO_GEOMETRY?.corner===4')&&browser.includes('window.PLOTAO_GEOMETRY?.end===0'),'browser E2E must verify a 20 × 15 closed rectangle with four corner and zero end posts');
ok(browser.includes("fill('12')")&&browser.includes("#plotSquareApply")&&browser.includes('gross===48'),'browser E2E must verify the 12 × 12 square shortcut');

if(fail.length){
  console.error('Rectangle/square mode source checks failed:\n- '+fail.join('\n- '));
  process.exit(1);
}
console.log('Rectangle/square mode source OK: controls, four-side closure, shared geometry and browser scenarios are protected');
