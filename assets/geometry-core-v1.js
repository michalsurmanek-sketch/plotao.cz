(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PLOTAO_GEOMETRY_CORE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const prio={line:1,strain:2,end:3,corner:4,wicket:5,gate:6};
const near=(a,b)=>Math.abs(a-b)<.001;
function solveGeometry(input={}){
  const type=input.type||'panel',gap=Math.max(.1,+input.gap||2.5),segments=(input.segments||[]).map((s,i)=>({i,len:Math.max(0,+s.len||0),connected:i>0&&s.connected!==false})),openings=(input.openings||[]).map(o=>({kind:o.kind==='door'||o.kind==='wicket'?'wicket':'gate',s:Math.max(0,+o.s||0),p:Math.max(0,+o.p||0),w:Math.max(0,+o.w||0)})),nodes=new Map,runs=[];
  const closed=!!input.closed&&segments.length>2&&segments.slice(1).every(s=>s.connected);
  const linked=i=>i>0&&!!segments[i]?.connected;
  const prevLinked=i=>i>0?linked(i):closed;
  const nextLinked=i=>i<segments.length-1?linked(i+1):closed;
  const prevIndex=i=>i>0?i-1:segments.length-1;
  const nextIndex=i=>i<segments.length-1?i+1:0;
  const key=(i,p)=>near(p,0)?(prevLinked(i)?(i===0?'closure':'joint:'+(i-1)):'outer:'+i+':start'):near(p,segments[i]?.len||0)?(nextLinked(i)?(i===segments.length-1?'closure':'joint:'+i):'outer:'+i+':end'):'s:'+i+':'+p.toFixed(4);
  const endpointHasFence=(i,side)=>{const s=segments[i];if(!s||s.len<=.001)return false;const oo=openings.filter(o=>o.s===i);if(side==='start')return !oo.some(o=>o.p<=.001&&o.p+o.w>.001);return !oo.some(o=>o.p<s.len-.001&&o.p+o.w>=s.len-.001)};
  const add=(k,role)=>{const old=nodes.get(k);if(!old||prio[role]>prio[old])nodes.set(k,role)};
  if(!segments.length)return null;
  for(let i=0;i<segments.length;i++){if(!prevLinked(i))add('outer:'+i+':start','end');if(!nextLinked(i))add('outer:'+i+':end','end');if(i<segments.length-1&&linked(i+1))add('joint:'+i,'corner')}
  if(closed)add('closure','corner');
  for(const o of openings){const s=segments[o.s];if(!s)continue;add(key(o.s,o.p),o.kind);add(key(o.s,o.p+o.w),o.kind)}
  let fields=0,fenceLen=0,gateSides=0,wicketSides=0;
  for(const s of segments){const os=openings.filter(o=>o.s===s.i).sort((a,b)=>a.p-b.p);let cursor=0,rr=[];for(const o of os){if(o.p>cursor+.001)rr.push([cursor,o.p]);cursor=Math.max(cursor,o.p+o.w)}if(cursor<s.len-.001)rr.push([cursor,s.len]);for(const o of os){let sides=(rr.some(r=>near(r[1],o.p))?1:0)+(rr.some(r=>near(r[0],o.p+o.w))?1:0);if(near(o.p,0)&&prevLinked(s.i)&&endpointHasFence(prevIndex(s.i),'end'))sides++;if(near(o.p+o.w,s.len)&&nextLinked(s.i)&&endpointHasFence(nextIndex(s.i),'start'))sides++;if(o.kind==='gate')gateSides+=sides;else wicketSides+=sides}
    for(const [a,b] of rr){const l=b-a;if(l<=.001)continue;const cuts=[];if(type==='mesh'){const maxSection=Math.max(gap,Math.floor(25/gap)*gap);for(let pa=a;pa<b-.001;pa+=maxSection)cuts.push([pa,Math.min(b,pa+maxSection)])}else cuts.push([a,b]);runs.push({s:s.i,a,b,l,pieces:cuts.length,sections:cuts.map(x=>x[1]-x[0])});fenceLen+=l;for(let q=0;q<cuts.length;q++){const[pa,pb]=cuts[q],sl=pb-pa,f=Math.ceil(sl/gap);fields+=f;for(let k=1;k<f;k++)add(key(s.i,pa+gap*k),'line');if(q<cuts.length-1)add(key(s.i,pb),'strain')}}}
  const c={line:0,strain:0,end:0,corner:0,gate:0,wicket:0};for(const r of nodes.values())c[r]++;const total=Object.values(c).reduce((a,b)=>a+b,0),corners=segments.slice(1).filter(s=>s.connected).length+(closed?1:0),gross=segments.reduce((a,s)=>a+s.len,0);
  return{...c,total,fields,fenceLen,gross,gap,runs,gateSides,wicketSides,corners,segments,closed};
}
return{solveGeometry};
});
