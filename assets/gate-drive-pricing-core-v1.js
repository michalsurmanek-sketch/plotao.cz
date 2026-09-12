(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_GATE_DRIVE_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const products=[
    {name:'NICE WINGO2024KCE',price:11470,maxLeaf:2,maxWeight:200},
    {name:'NICE WINGO3524KCE',price:14756,maxLeaf:3.5,maxWeight:500}
  ];

  function selectVerifiedDrive(config){
    const c={active:false,gateType:'double',leafLength:0,totalWeight:0,...(config||{})};
    if(!c.active)return{active:false,price:0};
    if(c.gateType!=='double')return{active:true,unsupported:true,reason:'gate-type'};
    const leaf=Math.max(0,Number(c.leafLength)||0),total=Math.max(0,Number(c.totalWeight)||0);
    if(!leaf||!total)return{active:true,unsupported:true,reason:'specs'};
    const product=products.find(p=>leaf<=p.maxLeaf&&total<=p.maxWeight);
    if(!product)return{active:true,unsupported:true,reason:'limits',leaf,total};
    const compact=product.maxLeaf<=2;
    return{
      active:true,price:product.price,name:product.name,leaf,total,
      maxLeaf:product.maxLeaf,maxWeight:product.maxWeight,
      note:'ověřená sada; konkrétní brána má křídlo '+leaf.toLocaleString('cs-CZ')+' m a celkovou hmotnost '+total.toLocaleString('cs-CZ')+' kg, '+(compact?'takže bezpečně splňuje limit 2 m / 200 kg na křídlo':'tedy pod limitem 3,5 m / 500 kg na křídlo')
    };
  }

  return{products,selectVerifiedDrive};
});
