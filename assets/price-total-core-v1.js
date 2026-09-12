(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_PRICE_TOTAL_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function finite(v){v=Number(v);return Number.isFinite(v)&&v>=0?v:null}
  function exact(value,source){const n=finite(value);return n==null?null:{low:n,high:n,range:false,source}}
  function ranged(low,high,source){low=finite(low);high=finite(high);if(low==null||high==null)return null;if(high<low)[low,high]=[high,low];return{low,high,range:high>low,source}}

  function benchmarkFromState(type,state={}){
    const t=String(type||'');
    if(t==='panel'){
      const d=state.panel;if(!d||d.unsupported)return null;return exact(d.materialTotal,'panel-state');
    }
    if(t==='mesh'){
      const d=state.mesh;if(!d||d.unsupported)return null;return exact(d.materialTotal,'mesh-state');
    }
    if(t==='concrete'){
      const d=state.concrete;if(!d||d.unsupported)return null;return exact(d.materialTotal,'concrete-state');
    }
    if(t==='gabion'){
      const d=state.gabion;if(!d||d.unsupported)return null;return ranged(d.low,d.high,'gabion-state');
    }
    if(t==='aluminium'){
      const d=state.aluminium;if(!d||d.unsupported)return null;return exact(d.materialTotal,'aluminium-state');
    }
    if(t==='privacy'){
      const d=state.privacy;if(!d||d.unsupported)return null;return exact(d.materialTotal,'privacy-state');
    }
    return null;
  }

  function benchmarkIncludesRow(type,label){
    const t=String(type||''),x=String(label||'').toLowerCase();
    if(['panel','mesh','concrete','gabion'].includes(t)){
      if(x.includes('sloup')||x.includes('příslušen')||x.includes('prislusen')||x.includes('spoj')||x.includes('úchyt')||x.includes('uchyt'))return true;
    }
    if(t==='gabion'&&(x.includes('kámen')||x.includes('kamen')||x.includes('výplň')||x.includes('vypln')))return true;
    return false;
  }

  function aggregate({type,benchmark,rows=[]}={}){
    if(!benchmark)return null;
    let extras=0,fillFound=false;
    for(const row of Array.isArray(rows)?rows:[]){
      if(row?.off)continue;
      const label=String(row?.label||''),x=label.toLowerCase();
      if(x.includes('plotová výplň')||x.includes('plotova vypln')){fillFound=true;continue}
      if(!benchmarkIncludesRow(type,label)){
        const n=finite(row?.value);if(n!=null)extras+=n;
      }
    }
    return{low:benchmark.low+extras,high:benchmark.high+extras,range:!!benchmark.range&&benchmark.high>benchmark.low,extras,fillFound,source:benchmark.source||'unknown'};
  }

  return{finite,benchmarkFromState,benchmarkIncludesRow,aggregate};
});
