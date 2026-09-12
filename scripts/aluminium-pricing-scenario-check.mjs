import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{computeAluminiumPrice}=require('../assets/aluminium-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};

let p=computeAluminiumPrice({variant:'horizontal',privacy:'medium',slat:'standard',color:'anthracite',height:153,fields:15,fence:37});
ok(!p.unsupported&&p.rows===2&&p.count===30,'37m/15 fields horizontal standard aluminium must use 2 rows and 30 stock profiles');
ok(p.materialTotal===12840,'horizontal standard aluminium benchmark must stay 12,840 CZK');

p=computeAluminiumPrice({variant:'horizontal',privacy:'full',slat:'standard',color:'anthracite',height:153,fields:15,fence:37});
ok(p.rows===3&&p.count===45&&p.materialTotal===19260,'full-privacy horizontal standard aluminium must stay 3 rows / 45 profiles / 19,260 CZK');

p=computeAluminiumPrice({variant:'vertical',privacy:'medium',slat:'standard',color:'anthracite',height:153,fields:4,fence:10});
ok(p.stockLength===2&&p.count===124&&p.unitPrice===428&&p.materialTotal===53072,'vertical standard aluminium 10m/153cm must use 124×2m stock at 428 CZK');

p=computeAluminiumPrice({variant:'vertical',privacy:'medium',slat:'standard',color:'ral',height:153,fields:4,fence:10});
ok(p.stockLength===2&&p.unitPrice===859&&p.materialTotal===106516,'custom RAL vertical aluminium must use verified RAL stock price');

p=computeAluminiumPrice({variant:'vertical',privacy:'medium',slat:'standard',color:'anthracite',height:250,fields:4,fence:10});
ok(p.stockLength===2.5&&p.unitPrice===536&&p.materialTotal===66464,'250cm vertical aluminium must step to 2.5m verified stock');

p=computeAluminiumPrice({variant:'vertical',privacy:'medium',slat:'standard',color:'anthracite',height:301,fields:4,fence:10});
ok(p.unsupported===true&&p.reason==='height','vertical aluminium above 3m must remain individual');

p=computeAluminiumPrice({variant:'louver',privacy:'medium',slat:'standard',color:'anthracite',height:180,fields:4,fence:10});
ok(p.materialTotal===95832&&p.pricingUnit==='sqm','10m × 1.8m Louvre benchmark must stay 95,832 CZK');

p=computeAluminiumPrice({variant:'solid',privacy:'medium',slat:'standard',color:'anthracite',height:180,fields:4,fence:10});
ok(p.materialTotal===82764&&p.pricingUnit==='sqm','10m × 1.8m solid aluminium benchmark must stay 82,764 CZK');

p=computeAluminiumPrice({variant:'combined',privacy:'medium',slat:'standard',color:'anthracite',height:180,fields:4,fence:10});
ok(p.unsupported===true&&p.reason==='combined','combined aluminium must remain individual without a verified bill of materials');
p=computeAluminiumPrice({variant:'horizontal',privacy:'medium',slat:'standard',color:'wood',height:180,fields:4,fence:10});
ok(p.unsupported===true&&p.reason==='wood','wood decor aluminium must remain individual without matched stock prices');

if(fail.length){console.error('Aluminium pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Aluminium pricing scenario checks OK: stock lengths, privacy pitch, RAL and unsupported boundaries protected');
