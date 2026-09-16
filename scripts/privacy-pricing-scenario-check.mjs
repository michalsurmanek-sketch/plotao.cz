import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{computePrivacyPrice}=require('../assets/privacy-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};

let p=computePrivacyPrice({material:'wpc',layout:'horizontal',color:'brown',gap:5,height:180,runs:[10]});
ok(!p.unsupported&&p.rows===24&&p.stockPer===6&&p.count===144,'10m horizontal WPC must use 24 rows × 6 stock pieces');
ok(p.materialTotal===24480,'10m horizontal brown WPC benchmark must stay 24,480 CZK');

p=computePrivacyPrice({material:'wpc',layout:'horizontal',color:'brown',gap:5,height:180,runs:[1.9,1.9]});
ok(p.stockPer===4,'privacy stock must be counted per separate run, not from pooled total length');
ok(p.count===96&&p.materialTotal===16320,'two 1.9m runs must preserve per-run offcut loss');

p=computePrivacyPrice({material:'wpc',layout:'vertical',color:'brown',gap:5,height:180,runs:[10]});
ok(p.visible===132&&p.stockLength===1.8&&p.materialTotal===22440,'10m vertical WPC at 180cm must use 132 full 1.8m boards');
p=computePrivacyPrice({material:'wpc',layout:'vertical',color:'brown',gap:5,height:181,runs:[10]});
ok(p.unsupported===true&&p.reason==='height','vertical WPC above 1.8m must remain individual');

p=computePrivacyPrice({material:'aluminium',layout:'horizontal',color:'anthracite',gap:5,height:180,runs:[10]});
ok(p.rows===15&&p.stockPer===5&&p.count===75&&p.materialTotal===56100,'10m horizontal aluminium privacy benchmark must stay 56,100 CZK');

p=computePrivacyPrice({material:'aluminium',layout:'vertical',color:'custom',gap:5,height:250,runs:[10]});
ok(p.visible===81&&p.stockLength===2.5&&p.unitPrice===1873&&p.materialTotal===151713,'custom vertical aluminium privacy must use verified 2.5m RAL stock');
p=computePrivacyPrice({material:'aluminium',layout:'vertical',color:'custom',gap:5,height:301,runs:[10]});
ok(p.unsupported===true&&p.reason==='height','vertical aluminium privacy above 3m must remain individual');

p=computePrivacyPrice({material:'wood',layout:'horizontal',color:'brown',gap:5,height:180,runs:[10]});
ok(p.unsupported===true&&p.reason==='material','wood privacy must remain individual');
p=computePrivacyPrice({material:'wpc',layout:'horizontal',color:'unknown',gap:5,height:180,runs:[10]});
ok(p.unsupported===true&&p.reason==='product','unmatched WPC color must remain individual');

if(fail.length){console.error('Privacy pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Privacy pricing scenario checks OK: per-run stock, WPC/aluminium heights and verified colors protected');
