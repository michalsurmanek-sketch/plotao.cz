import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/gate-pricing-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const price=(c,k)=>core.computeVerifiedGate(c,k)?.price??null;

const panel3d={type:'panel',actualHeight:153,panelVariant:'3d',panelSurface:'green',gateWidth:4,doorWidth:1,gateType:'double',slabWith:false,slabHeight:0};
ok(price(panel3d,'gate')===8490,'3D green panel 4m gate at 153cm must stay 8,490 CZK');
ok(price(panel3d,'door')===3990,'3D green panel 1m wicket at 153cm must stay 3,990 CZK');
ok(price({...panel3d,panelSurface:'anthracite'},'gate')===8490,'3D anthracite panel gate must stay 8,490 CZK');
ok(price({...panel3d,panelSurface:'zinc'},'gate')===18321,'3D zinc panel gate must stay 18,321 CZK');
ok(price({...panel3d,panelSurface:'zinc'},'door')===7657,'3D zinc panel wicket must stay 7,657 CZK');
ok(price({...panel3d,gateWidth:3.5},'gate')===null,'non-benchmarked panel gate width must be individual');
ok(price({...panel3d,slabWith:true,slabHeight:20},'gate')===null,'panel gate with slab must be individual');

const panel2d={...panel3d,panelVariant:'2d',panelSurface:'green'};
ok(price({...panel2d,actualHeight:103},'gate')===15448,'2D green panel 4m gate at 103cm must stay 15,448 CZK');
ok(price({...panel2d,actualHeight:123},'gate')===17547,'2D green panel 4m gate at 123cm must stay 17,547 CZK');
ok(price({...panel2d,actualHeight:103},'door')===6141,'2D green panel 1m wicket at 103cm must stay 6,141 CZK');
ok(price({...panel2d,actualHeight:143},'door')===7243,'2D green panel 1m wicket at 143cm must stay 7,243 CZK');
ok(price({...panel2d,actualHeight:153},'gate')===null,'unsupported 2D height must stay individual');

const mesh={type:'mesh',actualHeight:125,meshVariant:'classic',meshSurface:'green',gateWidth:4,doorWidth:1,gateType:'double',slabWith:false,slabHeight:0};
ok(price(mesh,'gate')===8072,'classic green mesh 4m gate at 125cm must stay 8,072 CZK');
ok(price({...mesh,actualHeight:150},'gate')===9472,'classic green mesh 4m gate at 150cm must stay 9,472 CZK');
ok(price({...mesh,actualHeight:160},'gate')===10075,'classic green mesh 4m gate at 160cm must stay 10,075 CZK');
ok(price(mesh,'door')===4000,'classic green mesh wicket at 125cm must stay 4,000 CZK');
ok(price({...mesh,actualHeight:150},'door')===4477,'classic green mesh wicket at 150cm must stay 4,477 CZK');
ok(price({...mesh,actualHeight:160},'door')===4630,'classic green mesh wicket at 160cm must stay 4,630 CZK');
ok(price({...mesh,actualHeight:100,slabWith:true,slabHeight:20},'door')===4000,'100cm mesh +20cm slab wicket must stay 4,000 CZK');
ok(price({...mesh,actualHeight:125,slabWith:true,slabHeight:20},'door')===4477,'125cm mesh +20cm slab wicket must stay 4,477 CZK');
ok(price({...mesh,actualHeight:125,slabWith:true,slabHeight:20},'gate')===null,'mesh gate with slab must remain individual');
ok(price({...mesh,meshSurface:'anthracite'},'gate')===null,'non-benchmarked mesh surface must remain individual');
ok(price({...mesh,meshVariant:'welded'},'gate')===null,'non-classic mesh gate must remain individual');

ok(core.unsupportedNote({type:'panel',slabWith:true,panelVariant:'3d'},'gate').includes('podhrabová deska'),'slab gate note must explain height matching');
ok(core.unsupportedNote({type:'aluminium'},'door').includes('zakázková'),'non-panel/mesh wicket must remain explicitly custom priced');

if(fail.length){console.error('Gate pricing scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Gate pricing scenario checks OK: verified panel/mesh gates and wickets are protected by shared core');
