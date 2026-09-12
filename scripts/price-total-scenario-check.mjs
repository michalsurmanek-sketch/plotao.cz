import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../assets/price-total-core-v1.js');
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const adapter=fs.readFileSync('assets/price-bridge.js','utf8');
ok(adapter.includes('PLOTAO_PRICE_TOTAL_CORE')&&adapter.includes('benchmarkFromState')&&adapter.includes('core.aggregate'),'price bridge must use structured total core before DOM fallback');
ok(adapter.includes("source:'dom-fallback'"),'DOM parsing must remain only as explicit fallback');

let b=core.benchmarkFromState('panel',{panel:{materialTotal:30000}});
ok(b.low===30000&&b.high===30000&&!b.range&&b.source==='panel-state','panel total must come directly from structured panel state');
b=core.benchmarkFromState('mesh',{mesh:{materialTotal:18000}});
ok(b.low===18000&&b.source==='mesh-state','mesh total must come directly from structured mesh state');
b=core.benchmarkFromState('gabion',{gabion:{low:42000,high:65000}});
ok(b.low===42000&&b.high===65000&&b.range===true&&b.source==='gabion-state','gabion structured state must preserve low/high range');
b=core.benchmarkFromState('concrete',{concrete:{materialTotal:51000}});
ok(b.low===51000&&b.source==='concrete-state','concrete total must use structured concrete benchmark');
b=core.benchmarkFromState('aluminium',{aluminium:{materialTotal:74000,partial:true}});
ok(b.low===74000&&b.source==='aluminium-state','aluminium partial benchmark must still expose its known material total to blocked detail view');
b=core.benchmarkFromState('privacy',{privacy:{materialTotal:26000,partial:true}});
ok(b.low===26000&&b.source==='privacy-state','privacy known fill total must come from structured state');
ok(core.benchmarkFromState('panel',{panel:{unsupported:true,materialTotal:99999}})===null,'unsupported panel state must never leak a total');
ok(core.benchmarkFromState('gabion',{gabion:{low:65000,high:42000}}).low===42000,'reversed range inputs must normalize safely');

let a=core.aggregate({type:'panel',benchmark:{low:30000,high:30000,range:false,source:'panel-state'},rows:[
  {label:'Plotová výplň',value:999,off:false},
  {label:'Podhrabové desky',value:11820,off:false},
  {label:'Vjezdová brána',value:8490,off:false},
  {label:'Pohon brány',value:11470,off:false},
  {label:'Beton do patek',value:4280,off:false},
  {label:'Sloupky celkem',value:12345,off:false},
  {label:'Příslušenství',value:2222,off:false},
  {label:'Doprava',value:9000,off:true}
]});
ok(a.fillFound===true,'aggregator must detect plot-fill result row');
ok(a.extras===36060,'panel extras must add slabs + gate + drive + footing concrete exactly once');
ok(a.low===66060&&a.high===66060,'panel structured base + priced extras must aggregate correctly');

// Concrete benchmark already contains its posts, so visible structural labels must not be re-added.
a=core.aggregate({type:'concrete',benchmark:{low:50000,high:50000,range:false,source:'concrete-state'},rows:[
  {label:'Plotová výplň',value:0,off:false},
  {label:'Sloupky celkem',value:15000,off:false},
  {label:'Vjezdová brána',value:10000,off:false}
]});
ok(a.extras===10000&&a.low===60000,'concrete posts inside benchmark must not be double counted while gate remains extra');

// Gabion stone/fill are part of the range and must not be added again.
a=core.aggregate({type:'gabion',benchmark:{low:40000,high:60000,range:true,source:'gabion-state'},rows:[
  {label:'Plotová výplň',value:0,off:false},
  {label:'Kámen výplň',value:25000,off:false},
  {label:'Vstupní branka',value:6000,off:false}
]});
ok(a.extras===6000&&a.low===46000&&a.high===66000&&a.range===true,'gabion range must preserve included stone and add only external priced extras');

ok(core.aggregate({type:'panel',benchmark:null,rows:[]})===null,'missing benchmark must not synthesize a zero total');
const noFill=core.aggregate({type:'panel',benchmark:{low:100,high:100,range:false},rows:[{label:'Brána',value:50,off:false}]});
ok(noFill.fillFound===false,'bridge must refuse to overwrite main total when canonical fill row is missing');

if(fail.length){console.error('Price total scenario checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Price total scenario checks OK: structured benchmarks, ranges, extras and double-count protection are locked');
