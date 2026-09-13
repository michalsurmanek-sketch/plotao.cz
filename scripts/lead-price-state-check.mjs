import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/lead-core-v1.js'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const base={mode:'lead',name:'Jan Novák',phone:'+420777123456',email:'jan@example.cz',place:'Uherské Hradiště',note:'',fenceType:'Panelový plot',height:153,segments:[{name:'Předek',length:20,connection:'začátek'}],options:['3D'],gate:false,gateType:'double',gateWidth:4,gateDrive:'none',gateSection:0,gatePos:0,wicket:false,wicketWidth:1,wicketSection:0,wicketPos:0,scopeValue:'material',scope:'Materiál',displayedPrice:'42 000 Kč',priceKind:'ověřená cena',priceReason:'',placeFromCalculator:'Uherské Hradiště'};
let r=core.validateLead({...base,displayedPrice:'Přepočítávám…',priceKind:'neplatné zadání',priceReason:'Počkejte na dokončení přepočtu ceny.'});
ok(!r.valid&&r.errors.some(e=>e.code==='price-pending'&&e.message==='Počkejte na dokončení přepočtu ceny.'),'pending material price must block lead preparation with a truthful wait message rather than an invalid-input accusation');
r=core.validateLead({...base,displayedPrice:'Nelze spočítat',priceKind:'neplatné zadání',priceReason:'Výška plotu musí být 40–400 cm.'});
ok(!r.valid&&r.errors.some(e=>e.code==='invalid-price'&&e.message==='Nejdřív opravte neplatné zadání kalkulátoru.'),'genuinely invalid calculator state must keep the invalid-price validation path');
r=core.validateLead(base);
ok(r.valid,'ordinary verified material price must remain valid after pending-state specialization');
if(fail.length){console.error('Lead price-state checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead price-state checks OK: pending, invalid and verified customer price states remain distinct');
