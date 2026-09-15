(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_EXTRA_FENCE_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const mobile={panelLength:3.5,panelHeight:1.9,panelUnit:1286,footUnit:176,connectorUnit:78,solid:{panelLength:2.8,panelHeight:2,panelUnit:2536.16,footUnit:176,connectorUnit:78},barrier:{panelLength:2.17,panelHeight:1.1,panelUnit:2249.39,integratedHardware:true}};
  function cleanRuns(runs){return(Array.isArray(runs)?runs:[]).map(Number).filter(x=>Number.isFinite(x)&&x>.001)}
  function computeExtraFencePrice(input={}){
    const type=input.type||'',config=input.config||{},runs=cleanRuns(input.runs),length=Math.max(0,+input.length||runs.reduce((a,b)=>a+b,0)),height=Math.max(.4,(+input.height||150)/100);
    if(type==='masonry'){
      if(config.variant==='blocks'&&config.finish!=='premium')return{unsupported:false,kind:'masonry-reference',low:length*6000,high:length*11000,length,height};
      return{unsupported:true,kind:'masonry',reason:'configuration',length,height};
    }
    if(type==='mobile'){
      if(!['mesh','solid','barrier'].includes(config.variant))return{unsupported:true,kind:'mobile',reason:'variant',length,height};
      const spec=config.variant==='solid'?mobile.solid:config.variant==='barrier'?mobile.barrier:mobile;
      if(Math.abs(height-spec.panelHeight)>.001)return{unsupported:true,kind:'mobile',reason:'height',length,height,requiredHeight:spec.panelHeight};
      const counts=runs.map(x=>Math.ceil(x/spec.panelLength)),panels=counts.reduce((a,x)=>a+x,0),feet=spec.integratedHardware?0:counts.reduce((a,x)=>a+(x?x+1:0),0),connectors=spec.integratedHardware?0:counts.reduce((a,x)=>a+Math.max(0,x-1),0),panelCost=panels*spec.panelUnit,feetCost=feet*(spec.footUnit||0),connectorCost=connectors*(spec.connectorUnit||0),materialTotal=panelCost+feetCost+connectorCost;
      return{unsupported:false,kind:config.variant==='solid'?'mobile-solid':config.variant==='barrier'?'mobile-barrier':'mobile-mesh',materialTotal,panels,feet,connectors,panelCost,feetCost,connectorCost,counts,runs,length,height,panelHeight:spec.panelHeight,panelLength:spec.panelLength,panelUnit:spec.panelUnit,footUnit:spec.footUnit,connectorUnit:spec.connectorUnit};
    }
    if(type==='other')return{unsupported:true,kind:'other',reason:'atypical',length,height};
    return{unsupported:true,kind:type||'unknown',reason:'type',length,height};
  }
  return{mobile,cleanRuns,computeExtraFencePrice};
});
