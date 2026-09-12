import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/concrete-material-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};const close=(a,b,eps=.001)=>Math.abs(a-b)<=eps;

let x=core.computeConcreteMaterial({type:'panel',scope:'material',geometry:{line:14,end:2,corner:0,strain:0,gate:0,wicket:0,gateSides:0,wicketSides:0},diameter:20,depth:80,mode:'bag'});
ok(x.counts.posts===16&&x.counts.braces===0&&x.counts.total===16,'panel 14 line + 2 end posts must produce 16 concrete footings');
ok(close(x.volume,16*Math.PI*.1*.1*.8),'20x80cm panel footing volume must use cylinder geometry');
ok(x.bags===33&&close(x.price,33*129.71),'16 reference footings must require 33 Cemix bags at verified unit price');

x=core.computeConcreteMaterial({type:'mesh',scope:'material',meshHasSlab:false,geometry:{line:9,end:2,corner:0,strain:1,gate:0,wicket:0,gateSides:0,wicketSides:0},diameter:20,depth:80,mode:'bag'});
ok(x.counts.posts===12,'mesh posts must include line + end + strain posts');
ok(x.counts.braces===4&&x.counts.total===16,'mesh without slab must add end and strain brace footings');

x=core.computeConcreteMaterial({type:'mesh',scope:'material',meshHasSlab:true,geometry:{line:9,end:2,corner:0,strain:1,gate:0,wicket:0,gateSides:0,wicketSides:0},diameter:20,depth:80,mode:'bag'});
ok(x.counts.braces===0&&x.counts.total===12,'mesh with slab must not create separate brace concrete footings');
ok(x.bags===25&&close(x.price,25*129.71),'12 reference footings must round upward to 25 bags');

x=core.computeConcreteMaterial({type:'mesh',scope:'material',meshHasSlab:false,geometry:{line:4,end:2,corner:1,strain:1,gate:1,wicket:1,gateSides:2,wicketSides:2},mode:'bag'});
ok(x.counts.posts===8&&x.counts.braces===10,'mesh brace count must include end, double corner, double strain and opening sides');
ok(x.unsupportedOpenings===true&&x.complete===false,'gate/wicket footing dimensions must remain explicitly unsupported');
ok(x.counts.openingPosts===2,'gate and wicket must be tracked as two individual opening posts without silently adding standard footings');

x=core.computeConcreteMaterial({type:'panel',scope:'material',geometry:{line:1,end:1},diameter:5,depth:200,mode:'custom'});
ok(x.diameter===10&&x.depth===120,'footing controls must clamp to visible 10–50cm / 30–120cm limits');
ok(x.unsupported===true&&x.mode==='custom','custom/batching-plant concrete must not invent a local price');

x=core.computeConcreteMaterial({type:'gabion',scope:'material',geometry:{line:10},mode:'bag'});
ok(x.active===false,'concrete footing material module must stay inactive outside panel/mesh systems');
x=core.computeConcreteMaterial({type:'panel',scope:'turnkey',geometry:{line:10},mode:'bag'});
ok(x.active===false,'footing material price must stay excluded outside material-only scope');

if(fail.length){console.error('Concrete material scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Concrete material scenario checks OK: footing counts, cylinder volume, brace rules and bag rounding are protected');
