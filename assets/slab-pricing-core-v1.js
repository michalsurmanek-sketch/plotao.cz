(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_SLAB_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const prices={panel:{'250x20':{productLength:2.45,bay:2.5,price:680,label:'2450×200×50',h:20},'250x30':{productLength:2.45,bay:2.5,price:812,label:'2450×300×50',h:30}},mesh:{'250x20':{productLength:2.5,bay:2.5,price:686,label:'2500×200×50',h:20},'250x30':{productLength:2.5,bay:2.5,price:829,label:'2500×300×50',h:30},'300x20':{productLength:2.95,bay:3,price:772,label:'2950×200×50',h:20},'300x30':{productLength:2.95,bay:3,price:913,label:'2950×300×50',h:30}}};
  const holder={panel:{20:{end:54,through:null},30:{end:71,through:null}},mesh:{20:{end:76,through:116},30:{end:96,through:162}}},braceHolder={holder:148,screw:6};
  function computeSlabPrice(input){
    const c={type:'',withSlab:false,size:null,geometry:{},runs:[],...(input||{})};
    if(!['panel','mesh'].includes(c.type))return{active:false};
    if(!c.withSlab)return{active:true,count:0,total:0,complete:true};
    const table=prices[c.type],p=table[c.size]||table[Object.keys(table)[0]],g=c.geometry||{},runs=(c.runs||[]).filter(x=>Number(x)>.001).map(Number),openingSides=Math.max(0,(g.gateSides||0)+(g.wicketSides||0));
    let count=0,sections=0;
    if(Number.isFinite(g.fields)&&g.fields>=0){count=g.fields;sections=runs.length+(c.type==='mesh'?Math.max(0,g.strain||0):0)}
    else{const counts=runs.map(l=>Math.ceil(l/p.bay));count=counts.reduce((a,x)=>a+x,0);sections=counts.filter(Boolean).length}
    sections=Math.min(count,Math.max(0,sections));
    const slabCost=count*p.price,unpricedOpeningHolders=Math.min(openingSides,sections*2);
    let holderCost=0,endH=0,throughH=0,braceMountCount=0,braceMountCost=0;
    if(c.type==='panel'){
      const hp=holder.panel[p.h];endH=Math.max(0,count*2-unpricedOpeningHolders);holderCost=endH*hp.end;
    }else{
      const hp=holder.mesh[p.h];endH=Math.max(0,sections*2-unpricedOpeningHolders);throughH=Math.max(0,count-sections);const endCost=endH*hp.end,throughCost=throughH*hp.through;braceMountCount=Math.max(0,(g.end||0)+(g.corner||0)*2+(g.strain||0)*2+openingSides);braceMountCost=braceMountCount*(braceHolder.holder+braceHolder.screw);holderCost=endCost+throughCost+braceMountCost;
    }
    return{active:true,count,total:slabCost+holderCost,slabCost,holderCost,size:c.size,unit:p.price,productLength:p.productLength,bay:p.bay,actualLabel:p.label,height:p.h,endH,throughH,sections,braceMountCount,braceMountCost,complete:!unpricedOpeningHolders,unsupportedHolders:unpricedOpeningHolders>0,unpricedOpeningHolders};
  }
  return{prices,holder,braceHolder,computeSlabPrice};
});
