import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/gate-drive-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const pick=c=>core.selectVerifiedDrive(c);

let x=pick({active:false,gateType:'double',leafLength:1.9,totalWeight:35});
ok(x.active===false&&x.price===0,'manual/no-drive mode must stay excluded');

x=pick({active:true,gateType:'double',leafLength:1.91,totalWeight:35});
ok(x.name==='NICE WINGO2024KCE'&&x.price===11470,'1.91m / 35kg verified gate must use WINGO2024KCE at 11,470 CZK');
ok(x.maxLeaf===2&&x.maxWeight===200,'WINGO2024KCE limits must stay 2m / 200kg');

x=pick({active:true,gateType:'double',leafLength:2,totalWeight:200});
ok(x.name==='NICE WINGO2024KCE','exact compact-drive boundary must remain supported');

x=pick({active:true,gateType:'double',leafLength:2.01,totalWeight:200});
ok(x.name==='NICE WINGO3524KCE'&&x.price===14756,'leaf above 2m must escalate to WINGO3524KCE, not squeeze into compact drive');

x=pick({active:true,gateType:'double',leafLength:3.5,totalWeight:500});
ok(x.name==='NICE WINGO3524KCE'&&x.price===14756,'exact WINGO3524KCE boundary must remain supported');

x=pick({active:true,gateType:'double',leafLength:3.51,totalWeight:100});
ok(x.unsupported===true&&x.reason==='limits','leaf over 3.5m must become individual');
x=pick({active:true,gateType:'double',leafLength:2.5,totalWeight:501});
ok(x.unsupported===true&&x.reason==='limits','weight over 500kg must become individual');
x=pick({active:true,gateType:'sliding',leafLength:1.9,totalWeight:35});
ok(x.unsupported===true&&x.reason==='gate-type','non-double gate must not receive swing-drive price');
x=pick({active:true,gateType:'double',leafLength:0,totalWeight:35});
ok(x.unsupported===true&&x.reason==='specs','missing verified leaf length must remain individual');

if(fail.length){console.error('Gate drive pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Gate drive pricing scenario checks OK: verified NICE kits are selected only from measured leaf length and gate weight');
