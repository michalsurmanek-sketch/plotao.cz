import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/slab-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};const price=c=>core.computeSlabPrice(c);
const adapter=fs.readFileSync('assets/slab-pricing-v2.js','utf8');
ok(adapter.includes('PLOTAO_SLAB_PRICING_CORE')&&adapter.includes('computeSlabPrice'),'slab browser adapter must delegate material/holder totals to shared core');

let x=price({type:'panel',withSlab:true,size:'250x20',geometry:{fields:15,gateSides:0,wicketSides:0},runs:[37]});
ok(x.count===15&&x.slabCost===10200,'37m panel geometry with 15 nominal fields must use 15 panel slabs at 680 CZK');
ok(x.endH===30&&x.throughH===0&&x.holderCost===1620,'panel slabs must use two square-post end holders per field and no round through holders');
ok(x.total===11820&&x.complete===true,'37m panel slab + verified holders total must stay 11,820 CZK');
ok(x.productLength===2.45&&x.bay===2.5,'panel slab must preserve 2450mm product length inside nominal 2.5m bay');

x=price({type:'panel',withSlab:true,size:'250x20',geometry:{fields:15,gateSides:2,wicketSides:0},runs:[10,23]});
ok(x.unpricedOpeningHolders===2&&x.endH===28,'two panel opening sides must remove two uncertain gate-post holders from exact total');
ok(x.complete===false&&x.unsupportedHolders===true,'panel holders at gate posts must remain partial/individual');

x=price({type:'mesh',withSlab:true,size:'300x20',geometry:{fields:10,strain:1,end:2,corner:0,gateSides:0,wicketSides:0},runs:[30]});
ok(x.count===10&&x.sections===2,'30m mesh with one strain post must form two slab-holder sections');
ok(x.slabCost===7720&&x.endH===4&&x.throughH===8,'10 mesh slabs must use 4 end and 8 through holders across two sections');
ok(x.braceMountCount===4&&x.braceMountCost===616,'mesh end + strain braces must receive four 154 CZK slab brace-mount sets');
ok(x.total===9568,'30m mesh 300x20 slab benchmark must stay 9,568 CZK');
ok(x.productLength===2.95&&x.bay===3,'3m nominal mesh field must preserve 2950mm physical slab length');

x=price({type:'mesh',withSlab:true,size:'300x20',geometry:{fields:10,strain:1,end:2,corner:0,gateSides:2,wicketSides:0},runs:[4,26]});
ok(x.unpricedOpeningHolders===2&&x.complete===false,'mesh gate-side slab holders must remain excluded from exact holder total');
ok(x.braceMountCount===6,'opening sides must still add verified brace-mount hardware where geometry requires braces');

x=price({type:'mesh',withSlab:true,size:'300x20',geometry:{},runs:[3,3]});
ok(x.count===2&&x.sections===2,'two separate 3m runs must remain two holder sections when geometry fields are unavailable');
x=price({type:'mesh',withSlab:false,size:'300x20',geometry:{fields:10},runs:[30]});
ok(x.count===0&&x.total===0&&x.complete===true,'slab-disabled state must contribute zero price');
x=price({type:'gabion',withSlab:true,size:'300x20',geometry:{fields:10},runs:[30]});
ok(x.active===false,'slab module must stay inactive outside panel/mesh systems');

if(fail.length){console.error('Slab pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Slab pricing scenario checks OK: nominal bays, physical slab lengths, holder sections and opening uncertainty are protected');
