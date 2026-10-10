import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('assets/geometry-core-v1.js','utf8');
const sandbox={module:{exports:{}},exports:{},globalThis:{}};
vm.runInNewContext(src,sandbox,{filename:'geometry-core-v1.js'});
const core=sandbox.module.exports;
if(!core?.solveGeometry)throw new Error('geometry core did not expose solveGeometry');

const segments=[
  {len:20,connected:false},
  {len:10,connected:true},
  {len:20,connected:true},
  {len:10,connected:true}
];
const open=core.solveGeometry({type:'panel',gap:2.5,segments,openings:[],closed:false});
const closed=core.solveGeometry({type:'panel',gap:2.5,segments,openings:[],closed:true});
const inferred=core.solveGeometry({type:'panel',gap:2.5,segments:segments.map((s,i)=>({...s,turn:i===0?null:'right'})),openings:[],closed:false});

const fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)};
ok(open?.corner===3&&open?.end===2&&open?.corners===3,'same four runs in open mode must keep 3 corner posts and 2 end posts');
ok(closed?.closed===true,'closed geometry must expose closed=true');
ok(closed?.corner===4,'closed rectangle must have 4 corner posts');
ok(closed?.end===0,'closed rectangle must not have end posts');
ok(closed?.corners===4,'closed rectangle must expose 4 corner joints');
ok(inferred?.closed===true&&inferred?.corners===4&&inferred?.corner===4&&inferred?.end===0,'4 connected sides with right turns must infer a closed 4-corner loop');
ok(closed?.gross===60,'20 × 10 rectangle must have 60 m perimeter');
ok(closed?.total===open.total-1,'closing the final corner must replace two end posts with one corner post');

if(fail.length){console.error('Closed plot geometry checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Closed plot geometry OK: explicit and inferred loops close to 4 corners with no end posts');
