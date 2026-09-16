import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{solveGeometry}=require('../assets/geometry-core-v1.js'),{computePanelPrice}=require('../assets/panel-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
function geom(segments,openings=[]){return solveGeometry({type:'panel',gap:2.5,segments,openings})}
let g=geom([{len:37,connected:false}]);let p=computePanelPrice({geometry:g,variant:'p3d',color:'green',requestedHeight:153,slabHeight:20});
ok(!p.unsupported,'37m panel scenario must be priceable');
ok(p.height===153&&p.postLength===240,'153cm panel +20cm slab must use 240cm posts');
ok(p.fields===15&&p.panelPieces===15,'37m panel must have 15 fields and buy 15 panels');
ok(p.postCount===16,'37m panel must buy 16 ordinary posts');
ok(p.clipQty===64,'37m panel must use 64 clips');
ok(p.panelCost===16320,'37m panel cost must be 16,320 CZK');
ok(p.postCost===5664,'37m post cost must be 5,664 CZK');
ok(p.clipCost===2560,'37m clip cost must be 2,560 CZK');
ok(p.materialTotal===24544,'37m panel verified core must stay 24,544 CZK');

g=geom([{len:20,connected:false},{len:17,connected:true}]);p=computePanelPrice({geometry:g,variant:'p3d',color:'green',requestedHeight:153,slabHeight:20});
ok(p.panelPieces===15,'connected 20+17m panel must still buy 15 panels');
ok(p.postCount===16,'connected 20+17m must share corner and buy 16 ordinary posts');
ok(p.clipQty===68,'connected corner must add second-side clips at one corner');
ok(p.materialTotal===24704,'connected 20+17m panel core must stay 24,704 CZK');

g=geom([{len:20,connected:false},{len:17,connected:false}]);p=computePanelPrice({geometry:g,variant:'p3d',color:'green',requestedHeight:153,slabHeight:20});
ok(p.postCount===17,'separate 20+17m must buy 17 ordinary posts');
ok(p.clipQty===68,'separate 20+17m must keep 68 clips');
ok(p.materialTotal===25058,'separate 20+17m panel core must stay 25,058 CZK');

g=geom([{len:10,connected:false},{len:10,connected:true}],[{kind:'gate',s:1,p:0,w:4}]);p=computePanelPrice({geometry:g,variant:'p3d',color:'green',requestedHeight:153,slabHeight:20});
ok(g.gateSides===2,'connected-joint gate must have two real fence sides');
ok(p.openingSides===2,'panel pricing must inherit two gate-adjacent sides');
ok(p.postCount===7,'gate posts must not be counted as ordinary panel posts');
ok(p.clipQty===36,'connected-joint gate must use 28 ordinary-post clips + 8 opening-side clips');
ok(p.panelPieces===7,'16m net fill must buy seven panels after run/offcut optimization');

g=geom([{len:10,connected:false},{len:10,connected:false}],[{kind:'gate',s:1,p:0,w:4}]);p=computePanelPrice({geometry:g,variant:'p3d',color:'green',requestedHeight:153,slabHeight:20});
ok(g.gateSides===1&&p.openingSides===1,'separate gate must have only one local fence side');
ok(p.postCount===8,'separate sections around gate must keep one extra ordinary end post');
ok(p.clipQty===36,'separate gate must use 32 ordinary-post clips + 4 local opening-side clips');

p=computePanelPrice({geometry:geom([{len:10,connected:false}]),variant:'p3d',color:'green',requestedHeight:203,slabHeight:30});
ok(!p.unsupported&&p.postLength===300,'203cm 3D panel +30cm slab must use verified 300cm post');
p=computePanelPrice({geometry:geom([{len:10,connected:false}]),variant:'p2d',color:'green',requestedHeight:243,slabHeight:30});
ok(p.unsupported===true&&p.reason==='post','243cm 2D panel +30cm slab must become individual when need exceeds verified 300cm post');

if(fail.length){console.error('Panel pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Panel pricing scenario checks OK: production geometry + production panel pricing core');
