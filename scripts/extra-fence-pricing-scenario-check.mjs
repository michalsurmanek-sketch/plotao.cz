import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{computeExtraFencePrice,mobile}=require('../assets/extra-fence-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};

ok(mobile.panelLength===3.5&&mobile.panelHeight===1.9,'verified DOPS benchmark must stay tied to 3.5m × 1.9m panel dimensions');
let p=computeExtraFencePrice({type:'mobile',config:{variant:'mesh'},runs:[10],length:10,height:190});
ok(!p.unsupported&&p.panels===3&&p.feet===4&&p.connectors===2,'10m mobile mesh run must use 3 panels, 4 feet and 2 connectors');
ok(p.panelCost===3858&&p.feetCost===704&&p.connectorCost===156,'mobile mesh component costs must stay verified');
ok(p.materialTotal===4718,'10m mobile mesh benchmark must stay 4,718 CZK');

p=computeExtraFencePrice({type:'mobile',config:{variant:'mesh'},runs:[5,5],length:10,height:190});
ok(p.panels===4&&p.feet===6&&p.connectors===2,'two separate 5m mobile runs must not share panels or end feet');
ok(p.materialTotal===6356,'two separate 5m mobile runs must stay 6,356 CZK');

p=computeExtraFencePrice({type:'mobile',config:{variant:'mesh'},runs:[10],length:10,height:153});
ok(p.unsupported===true&&p.reason==='height'&&p.requiredHeight===1.9,'153cm request must not receive the verified 190cm DOPS price');
p=computeExtraFencePrice({type:'mobile',config:{variant:'mesh'},runs:[10],length:10,height:250});
ok(p.unsupported===true&&p.reason==='height','250cm request must not reuse the 190cm DOPS benchmark');

p=computeExtraFencePrice({type:'mobile',config:{variant:'solid'},runs:[10],length:10,height:190});
ok(p.unsupported===true&&p.reason==='variant','unverified solid mobile system must remain individual');

p=computeExtraFencePrice({type:'masonry',config:{variant:'blocks',finish:'standard'},length:10,height:180});
ok(!p.unsupported&&p.kind==='masonry-reference'&&p.low===60000&&p.high===110000,'10m masonry block reference must stay 60,000–110,000 CZK');
p=computeExtraFencePrice({type:'masonry',config:{variant:'blocks',finish:'premium'},length:10,height:180});
ok(p.unsupported===true&&p.reason==='configuration','premium masonry must remain individual');

p=computeExtraFencePrice({type:'other',config:{},length:10,height:180});
ok(p.unsupported===true&&p.reason==='atypical','atypical fence must remain individual');

if(fail.length){console.error('Extra fence pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Extra fence pricing scenario checks OK: mobile dimensions/per-run hardware and masonry reference protected');
