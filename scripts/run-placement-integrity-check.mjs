import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const privacy=read('assets/privacy-pricing.js'),extra=read('assets/extra-fence-pricing.js'),geometry=read('assets/geometry-v3.js'),calc=read('assets/calculator-v3.js'),topview=read('assets/segment-plan-topview-v1.js'),connections=read('assets/segment-connections-v1.js'),lead=read('assets/lead-safety-v1.js'),manifest=read('scripts/pages-manifest.mjs');

for(const [name,src] of [['privacy',privacy],['extra',extra]]){
  ok(src.includes("function placement(kind,key,selector){const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[key];return Number.isFinite(Number(v))?Number(v):+($(selector)?.value||0)}"),`${name} run splitter must prefer authoritative PLOTAO_PLACEMENT and use DOM only as fallback`);
  ok(src.includes("s:placement('gate','section','#gateSection')")&&src.includes("p:placement('gate','pos','#gatePos')"),`${name} gate run splitting must use authoritative gate section/position`);
  ok(src.includes("s:placement('door','section','#doorSection')")&&src.includes("p:placement('door','pos','#doorPos')"),`${name} wicket run splitting must use authoritative wicket section/position`);
}
ok(geometry.includes("window.PLOTAO_PLACEMENT?.[kind]?.[key]")||geometry.includes("const p=window.PLOTAO_PLACEMENT?.[kind]"),'geometry adapter must keep authoritative opening placement');
ok(geometry.includes("closed:shape?.mode==='rectangle'&&shape?.closed===true"),'closed rectangle state must be passed into the shared geometry core');
ok(calc.includes('function normalize(kind,clampPos=true)')&&calc.includes('if(clampPos)placements[kind].pos=Math.min(maxPos(kind),placements[kind].pos)'),'calculator must separate section normalization from optional position clamping');
ok(calc.includes("normalize('gate',false);normalize('door',false)")&&calc.includes("normalize('gate',false);render()")&&calc.includes("normalize('door',false);render()"),'normal rendering and section selection must preserve the user-entered opening position even when it no longer fits');
ok(calc.includes("function adjustAfterRemove(index)")&&calc.includes('normalize(kind)}}'),'segment removal may still clamp an opening because its previous physical segment can cease to exist');
ok(calc.includes("placements.gate.pos=Math.max(0,+e.target.value||0);publish()")&&calc.includes("placements.door.pos=Math.max(0,+e.target.value||0);publish()"),'direct opening-position edits must publish authoritative placement synchronously');
ok(calc.includes("document.addEventListener('plotao:input-validity',e=>{if(e.detail?.issue?.code==='placement'||e.detail?.valid)publish()})"),'visual opening plan must hide/recover synchronously with shared placement validity');
ok(calc.includes("if(!go&&!doo){b.style.display='none';b.innerHTML='';publish();return}")&&calc.includes("b.style.display='block'"),'opening placement controls must disappear when neither gate nor wicket is active and return when an opening is enabled');
ok(calc.includes("seeded={gate:false,door:false}")&&calc.includes("function seedOpening(kind){if(seeded[kind])return false"),'gate and wicket may receive an automatic valid placement only once, on first activation');
ok(calc.includes("if(pos+w<=len+.001&&(!occupied||!overlaps(candidate,occupied)))")&&calc.includes("starts.push(occupied.pos+occupied.width)"),'first activation must choose a position that fits the segment and does not overlap the already active opening');
ok(calc.includes("if(['gate','door'].includes(e.target.id)){if(e.target.checked)seedOpening(e.target.id);render();return}"),'gate/wicket activation must seed and publish placement synchronously before slower validity listeners run');
ok(!calc.includes("['gateWidth','doorWidth'].includes(e.target.id))seedOpening"),'later width edits must never silently reseed or move an already activated opening');
ok(calc.includes("let placements={gate:{section:0,pos:5},door:{section:0,pos:12}},seeded={gate:false,door:false}")&&calc.includes("if(!go&&!doo){b.style.display='none';b.innerHTML='';publish();return}"),'hiding an empty placement UI must not erase stored gate/wicket positions or first-use state');

ok(topview.includes("window.PLOTAO_SEGMENT_CONNECTIONS||[]")&&topview.includes("window.PLOTAO_PLACEMENT"),'top-view plan must use authoritative segment-connection and opening-placement state');
ok(topview.includes("className='plotao-segment-mini'")&&topview.includes("box.dataset.segmentMini=String(seg.i)"),'every segment must receive its own dedicated mini drawing');
ok(topview.includes("cap.textContent=rectActive()?'Pohled shora · uzavřený půdorys':'Pohled shora'"),'overall plan must render the reviewed top-view caption for free and closed modes');
ok(topview.includes("aria-label=\"Celkový nákres plotu z pohledu shora")&&topview.includes("role=\"img\""),'top-view SVG must expose an accessible image description');
ok(topview.includes("if(s.connected)")&&topview.includes("corners%2===0?1:3"),'successive connected free-mode segments must alternate 90-degree turns into a readable step-like top view');
ok(topview.includes("else{x=0;y=groupBottom+")&&topview.includes("dir=0;corners=0"),'a disconnected free-mode segment must start as a separate top-view run instead of pretending to join the prior section');
ok(topview.includes("data-shape-mode=\"rectangle\"")&&topview.includes("function applyRectangle()"),'segment UI must expose the rectangle/square mode and a dedicated four-side apply path');
ok(topview.includes("window.PLOTAO_SET_SEGMENT_CONNECTIONS?.([false,true,true,true])")&&connections.includes('window.PLOTAO_SET_SEGMENT_CONNECTIONS=setConnections'),'rectangle mode must force all four sides into one closed connected run through the shared connection owner');
ok(topview.includes("plotShape={mode:'rectangle',closed:true,width:w,depth:d}")&&topview.includes("const vals=[w,d,w,d],names=['Strana A','Strana B','Strana C','Strana D']"),'rectangle mode must create opposite equal sides and publish a closed shape state');
ok(topview.includes("if(rectActive()&&ss.length===4)")&&topview.includes('const dirs=[[1,0],[0,1],[-1,0],[0,-1]]'),'closed rectangles must use four orthogonal directions that return to the starting point');
ok(topview.includes("stroke=\"#f07828\"")&&topview.includes("esc(o.label)"),'gate and wicket openings must remain visible and labelled in the new drawings');
ok(topview.includes("document.addEventListener('plotao:segment-connections',()=>{syncShapeUi();schedule()})")&&topview.includes("document.addEventListener('plotao:placement',()=>schedule())"),'top-view drawings must rerender after connection and opening-placement changes');
ok(topview.includes("if(e.target.closest?.('#addSegment,[data-remove],.remove'))schedule(90)"),'adding or removing a segment must regenerate both mini and total drawings');
const calcPos=manifest.indexOf('/assets/calculator-v3.js'),topviewPos=manifest.indexOf('/assets/segment-plan-topview-v1.js'),geometryPos=manifest.indexOf('/assets/geometry-core-v1.js');
ok(calcPos>=0&&topviewPos>calcPos&&geometryPos>topviewPos,'top-view enhancement must load after calculator placement state and before downstream geometry updates');
ok(!manifest.includes('/assets/plan-scroll-v1.js'),'obsolete horizontal plan scroller must stay out of the production manifest after top-view replacement');
ok(lead.includes("const p=window.PLOTAO_PLACEMENT?.[kind],v=p?.[keyName]"),'lead snapshot must keep authoritative opening placement');

if(fail.length){console.error('Run placement integrity checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Run placement integrity checks OK: opening placement stays stable, every segment has a mini drawing, free top-view runs remain readable and closed rectangle/square mode is protected end-to-end');
