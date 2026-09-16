(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_ALUMINIUM_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const unit={
    narrow:{width:30,lengths:{2:{std:276,ral:552},2.5:{std:345,ral:690},3:{std:414,ral:828}}},
    standard:{width:60,lengths:{2:{std:428,ral:859},2.5:{std:536,ral:1074},3:{std:643,ral:1289}}},
    wide90:{width:90,lengths:{2:{std:612,ral:1222},2.5:{std:766,ral:1528},3:{std:918,ral:1833}}},
    wide:{width:120,lengths:{2:{std:750,ral:1498},2.5:{std:935,ral:1873},3:{std:1122,ral:2247}}}
  };
  function privacyGap(p,w){if(p==='full')return 8;if(p==='airy')return Math.max(35,Math.round(w*.65));return Math.max(20,Math.round(w*.35))}
  function chooseLength(u,heightM){const ks=Object.keys(u.lengths||{}).map(Number).sort((a,b)=>a-b),k=ks.find(x=>x>=heightM);return k==null?null:{length:k,prices:u.lengths[k]}}
  function computeAluminiumPrice(input={}){
    const c={variant:'horizontal',privacy:'medium',slat:'standard',color:'anthracite',posts:'included',ral:'',height:153,fields:0,fence:0,...input};
    const u=unit[c.slat]||unit.standard,height=Math.max(40,+c.height||153),heightM=height/100,fields=Math.max(0,+c.fields||0),fence=Math.max(0,+c.fence||0),gap=privacyGap(c.privacy,u.width),pitch=u.width+gap,custom=c.color==='ral',wood=c.color==='wood',area=fence*heightM;
    if(c.variant==='combined')return{unsupported:true,reason:'combined',area,gap,pitch};
    if(wood)return{unsupported:true,reason:'wood',area,gap,pitch};
    if(c.variant==='louver')return{unsupported:false,partial:true,materialTotal:area*5324,unitPrice:5324,pricingUnit:'sqm',area,gap,pitch,variant:c.variant,slat:c.slat,color:c.color};
    if(c.variant==='solid')return{unsupported:false,partial:true,materialTotal:area*4598,unitPrice:4598,pricingUnit:'sqm',area,gap,pitch,variant:c.variant,slat:c.slat,color:c.color};
    if(c.variant==='vertical'){
      const stock=chooseLength(u,heightM);if(!stock)return{unsupported:true,reason:'height',area,gap,pitch};
      const count=Math.max(1,Math.ceil((fence*1000)/pitch)),price=custom?stock.prices.ral:stock.prices.std,cost=count*price;
      return{unsupported:false,partial:true,materialTotal:cost,count,unitPrice:price,stockLength:stock.length,area,gap,pitch,variant:c.variant,slat:c.slat,color:c.color};
    }
    const rows=Math.max(1,Math.ceil(height/pitch)),count=Math.max(0,fields*rows),stock=u.lengths[2],price=custom?stock.ral:stock.std,cost=count*price;
    return{unsupported:false,partial:true,materialTotal:cost,count,unitPrice:price,stockLength:2,rows,area,gap,pitch,variant:c.variant,slat:c.slat,color:c.color};
  }
  return{unit,privacyGap,chooseLength,computeAluminiumPrice};
});
