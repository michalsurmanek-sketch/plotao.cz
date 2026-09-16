import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{solveGeometry}=require('../assets/geometry-core-v1.js'),{computeMeshPrice}=require('../assets/mesh-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
function geom(gap,segments,openings=[]){return solveGeometry({type:'mesh',gap,segments,openings})}
let g=geom(3,[{len:30,connected:false}]);let p=computeMeshPrice({geometry:g,variant:'classic',surface:'green',requestedHeight:150,withSlab:true,slabHeight:20});
ok(!p.unsupported,'30m classic mesh + slab must be priceable');
ok(g.fields===10&&g.strain===1&&g.line===8&&g.end===2,'30m / 3m mesh geometry must stay 10 fields, 8 line, 1 strain, 2 end');
ok(p.linePostDiameter===48&&p.linePostLength===220,'150cm mesh +20cm slab must use Ø48 220cm line posts');
ok(p.terminalPosts===3&&p.terminalPostLength===220,'mesh slab system must use three Ø48 terminal/strain posts at 220cm');
ok(p.braces===4&&p.braceLength===200,'mesh slab system must use four 200cm braces');
ok(p.meshCost===2490&&p.lineCost===2360&&p.termCost===885&&p.braceCost===892,'mesh slab structural cost breakdown must stay stable');
ok(p.wireM===32&&p.wireRolls===1&&p.tensioners===4&&p.accessoryCost===227,'classic 150cm mesh must use 32m center wire, 1 roll and 4 tensioners');
ok(p.materialTotal===6854,'30m classic mesh + slab verified core must stay 6,854 CZK before slabs/concrete');

g=geom(2.5,[{len:30,connected:false}]);p=computeMeshPrice({geometry:g,variant:'classic',surface:'green',requestedHeight:150,withSlab:false,slabHeight:0});
ok(g.line===10&&g.strain===1,'30m classic mesh without slab at 2.5m spacing must have 10 line + 1 strain post');
ok(p.linePostDiameter===38&&p.linePostLength===200,'classic mesh without slab must use Ø38 200cm line posts');
ok(p.terminalPostLength===200&&p.braceLength===200,'classic mesh without slab must use verified 200cm terminal posts/braces');
ok(p.materialTotal===6016,'30m classic mesh without slab verified core must stay 6,016 CZK');

g=geom(2.5,[{len:30,connected:false}]);p=computeMeshPrice({geometry:g,variant:'welded',surface:'green',requestedHeight:150,withSlab:false,slabHeight:0});
ok(!p.unsupported,'30m welded green mesh must be priceable');
ok(g.line===10&&g.strain===1,'30m welded mesh at 2.5m spacing must have 10 line + 1 strain post');
ok(p.linePostDiameter===48&&p.linePostLength===200,'150cm welded mesh must use 200cm grooved Ø48 posts');
ok(p.clips===162&&p.packs===2&&p.accessoryCost===376,'30m welded 150cm mesh must use 162 Bekaclip clips / 2 packs');
ok(p.materialTotal===9032,'30m welded green verified core must stay 9,032 CZK');

g=geom(3,[{len:10,connected:false},{len:10,connected:true}],[{kind:'gate',s:1,p:0,w:4}]);p=computeMeshPrice({geometry:g,variant:'classic',surface:'green',requestedHeight:150,withSlab:true,slabHeight:20});
ok(g.gateSides===2&&p.openingSides===2,'connected-joint mesh gate must have two real fence sides');
ok(p.braces===4,'connected-joint gate must use two outer-end braces + two real opening-side braces');
ok(p.tensioners===4,'connected-joint gate center-wire tensioners must follow two outer ends + two opening sides');

g=geom(3,[{len:10,connected:false},{len:10,connected:false}],[{kind:'gate',s:1,p:0,w:4}]);p=computeMeshPrice({geometry:g,variant:'classic',surface:'green',requestedHeight:150,withSlab:true,slabHeight:20});
ok(g.gateSides===1&&p.openingSides===1,'separate mesh gate must have only one local fence side');
ok(p.braces===4,'separate gate must use three real ordinary ends + one local opening-side brace');
ok(p.tensioners===4,'separate gate tensioners must follow three ends + one local opening side');

p=computeMeshPrice({geometry:geom(3,[{len:20,connected:false}]),variant:'welded',surface:'green',requestedHeight:200,withSlab:true,slabHeight:20});
ok(p.unsupported===true&&p.reason==='post','200cm welded mesh +20cm slab must become individual without verified 270cm grooved post');
p=computeMeshPrice({geometry:geom(3,[{len:20,connected:false}]),variant:'classic',surface:'anthracite',requestedHeight:150,withSlab:false,slabHeight:0});
ok(p.unsupported===true&&p.reason==='surface','complete anthracite classic mesh system must remain individual until matching accessories/posts are verified');

if(fail.length){console.error('Mesh pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Mesh pricing scenario checks OK: production geometry + production mesh pricing core');
