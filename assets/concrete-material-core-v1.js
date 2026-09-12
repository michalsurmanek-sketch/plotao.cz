(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_CONCRETE_MATERIAL_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const BAG_KG=25,KG_M3=2000,UNIT=129.71;
  function clamp(n,min,max,fallback){n=Number(n);return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback))}
  function counts(input){
    const c=input||{},g=c.geometry||{},type=c.type||'',meshHasSlab=!!c.meshHasSlab;
    const posts=Math.max(0,(g.line||0)+(g.strain||0)+(g.end||0)+(g.corner||0));
    const openingSides=Math.max(0,(g.gateSides||0)+(g.wicketSides||0));
    const braces=type==='mesh'&&!meshHasSlab?Math.max(0,(g.end||0)+(g.corner||0)*2+(g.strain||0)*2+openingSides):0;
    const openingPosts=Math.max(0,(g.gate||0)+(g.wicket||0));
    return{posts,braces,openingPosts,total:posts+braces};
  }
  function volumeFor(n,diameter=20,depth=80){
    const d=clamp(diameter,10,50,20)/100,h=clamp(depth,30,120,80)/100;
    return Math.max(0,Number(n)||0)*Math.PI*(d/2)**2*h;
  }
  function computeConcreteMaterial(input){
    const c={type:'',scope:'material',meshHasSlab:false,geometry:{},mode:'bag',diameter:20,depth:80,...(input||{})};
    if(c.scope!=='material'||!['panel','mesh'].includes(c.type))return{active:false};
    const diameter=clamp(c.diameter,10,50,20),depth=clamp(c.depth,30,120,80),ct=counts(c),volume=volumeFor(ct.total,diameter,depth),unsupportedOpenings=ct.openingPosts>0;
    if(!ct.total)return{active:true,price:0,volume:0,complete:true,counts:ct,mode:c.mode,diameter,depth};
    if(c.mode!=='bag')return{active:true,volume,unsupported:true,unsupportedOpenings,mode:'custom',diameter,depth,counts:ct};
    const bags=Math.ceil(volume*KG_M3/BAG_KG),price=bags*UNIT;
    return{active:true,price,volume,bags,mode:'bag',complete:!unsupportedOpenings,unsupportedOpenings,unit:UNIT,diameter,depth,counts:ct};
  }
  return{BAG_KG,KG_M3,UNIT,counts,volumeFor,computeConcreteMaterial};
});
