import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{computeConcretePrice,computeGabionPrice}=require('../assets/structural-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)},close=(a,b,eps=.001)=>Math.abs(a-b)<=eps;

const geometry={fields:10,line:9,strain:0,end:2,corner:0};
let p=computeConcretePrice({requestedHeight:153,config:{side:'one',post:'smooth',color:'gray'},geometry});
ok(!p.unsupported&&p.materialHeight===175,'153cm concrete request must round up to 175cm material height');
ok(p.b50===30&&p.b25===10,'10 fields at 175cm must use 30 full + 10 half boards');
ok(p.boardCost===16900&&p.lineCost===5202&&p.endCost===1250,'175cm one-sided concrete component costs must stay verified');
ok(p.materialTotal===23352,'175cm one-sided concrete benchmark must stay 23,352 CZK');

p=computeConcretePrice({requestedHeight:153,config:{side:'both',post:'smooth',color:'gray'},geometry});
ok(p.boardCost===19350&&p.materialTotal===25802,'175cm two-sided concrete benchmark must stay 25,802 CZK');

p=computeConcretePrice({requestedHeight:176,config:{side:'one',post:'smooth',color:'gray'},geometry});
ok(p.materialHeight===200&&p.b50===40&&p.b25===0,'176cm request must step to 200cm with four full boards per field');

p=computeConcretePrice({requestedHeight:301,config:{side:'one',post:'smooth',color:'gray'},geometry});
ok(p.unsupported===true&&p.reason==='height','concrete above 300cm verified material height must remain individual');
p=computeConcretePrice({requestedHeight:150,config:{side:'one',post:'smooth',color:'anthracite'},geometry});
ok(p.unsupported===true&&p.reason==='color','unverified concrete color must remain individual');
p=computeConcretePrice({requestedHeight:150,config:{side:'one',post:'design',color:'gray'},geometry});
ok(p.unsupported===true&&p.reason==='post-style','design concrete posts must remain individual');

let g=computeGabionPrice({height:153,fence:10,width:.30,kind:'quarry'});
ok(close(g.volume,4.59)&&close(g.tons,7.803),'10m × 1.53m × 0.30m gabion must be 4.59m3 / 7.803t');
ok(close(g.low,17809.2)&&close(g.high,33277.5),'quarry-stone gabion range must stay 17,809.2–33,277.5 CZK');

g=computeGabionPrice({height:153,fence:10,width:.30,kind:'display'});
ok(close(g.low,28733.4)&&close(g.high,48883.5),'display-stone gabion range must stay 28,733.4–48,883.5 CZK');
ok(g.density===1.7,'gabion stone density benchmark must stay 1.7 t/m3');

if(fail.length){console.error('Structural pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Structural pricing scenario checks OK: concrete rounding/components and gabion volume/ranges protected');
