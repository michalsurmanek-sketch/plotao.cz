(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_EXTRA_FENCE_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const mobile={panelLength:3.5,panelHeight:1.9,panelUnit:1286,footUnit:176,connectorUnit:78};
  function cleanRuns(runs){return(Array.isArray(runs)?runs:[]).map(Number).filter(x=>Number.isFinite(x)&&x>.001)}
  function computeExtraFencePrice(input={}){
    const type=input.type||'',config=input.config||{},runs=cleanRuns(input.runs),length=Math.max(0,+input.length||runs.reduce((a,b)=>a+b,0)),height=Math.max(.4,(+input.height||150)/100);
    if(type==='masonry'){
      if(config.variant==='blocks'&&config.finish!=='premium')return{unsupported:false,kind:'masonry-reference',low:length*6000,high:length*11000,length,height};
      return{unsupported:true,kind:'masonry',reason:'configuration',length,height};
    }
    if(type==='mobile'){
      if(config.variant!=='mesh')return{unsupported:true,kind:'mobile',reason:'variant',length,height};
      if(Math.abs(height-mobile.panelHeight)>.001)return{unsupported:true,kind:'mobile',reason:'height',length,height,requiredHeight:mobile.panelHeight};
      const counts=runs.map(x=>Math.ceil(x/mobile.panelLength)),panels=counts.reduce((a,x)=>a+x,0),feet=counts.reduce((a,x)=>a+(x?x+1:0),0),connectors=counts.reduce((a,x)=>a+Math.max(0,x-1),0),panelCost=panels*mobile.panelUnit,feetCost=feet*mobile.footUnit,connectorCost=connectors*mobile.connectorUnit,materialTotal=panelCost+feetCost+connectorCost;
      return{unsupported:false,kind:'mobile-mesh',materialTotal,panels,feet,connectors,panelCost,feetCost,connectorCost,counts,runs,length,height,panelHeight:mobile.panelHeight};
    }
    if(type==='other')return{unsupported:true,kind:'other',reason:'atypical',length,height};
    return{unsupported:true,kind:type||'unknown',reason:'type',length,height};
  }
  return{mobile,cleanRuns,computeExtraFencePrice};
});
