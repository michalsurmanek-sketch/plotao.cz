(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_GATE_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function exact(a,b,tol=.02){return Math.abs(Number(a)-Number(b))<=tol}

  function panelGate(c){
    if(c.slabWith||c.gateType!=='double'||!exact(c.gateWidth,4))return null;
    const h=Number(c.actualHeight);
    if(c.panelVariant==='2d'){
      if(c.panelSurface!=='green')return null;
      if(h===103)return{price:15448,label:'Ploty Dobrý 2D · 4,0 × 1,00 m · RAL 6005'};
      if(h===123)return{price:17547,label:'Ploty Dobrý 2D · 4,0 × 1,20 m · RAL 6005'};
      return null;
    }
    if(h!==153)return null;
    if(c.panelSurface==='green')return{price:8490,label:'BAUHAUS 3D · 4,0 × 1,53 m · RAL 6005'};
    if(c.panelSurface==='anthracite')return{price:8490,label:'BAUHAUS 3D · 4,0 × 1,53 m · RAL 7016'};
    if(c.panelSurface==='zinc')return{price:18321,label:'BRAVO 3D ZN · 4,0 × 1,53 m'};
    return null;
  }

  function panelDoor(c){
    if(c.slabWith||!exact(c.doorWidth,1))return null;
    const h=Number(c.actualHeight);
    if(c.panelVariant==='2d'){
      if(c.panelSurface!=='green')return null;
      if(h===103)return{price:6141,label:'Ploty Dobrý 2D · 1,0 × 1,00 m · RAL 6005'};
      if(h===143)return{price:7243,label:'Ploty Dobrý 2D · 1,0 × 1,40 m · RAL 6005'};
      return null;
    }
    if(h!==153)return null;
    if(c.panelSurface==='green')return{price:3990,label:'BAUHAUS 3D · 1,0 × 1,53 m · RAL 6005'};
    if(c.panelSurface==='anthracite')return{price:3990,label:'BAUHAUS 3D · 1,0 × 1,53 m · RAL 7016'};
    if(c.panelSurface==='zinc')return{price:7657,label:'BRAVO 3D ZN · 1,0 × 1,53 m'};
    return null;
  }

  function meshGate(c){
    if(c.meshVariant!=='classic'||c.meshSurface!=='green'||c.gateType!=='double'||!exact(c.gateWidth,4)||c.slabWith)return null;
    const h=Number(c.actualHeight);
    if(h===125)return{price:8072,label:'UNIVERSAL · 4,0 × 1,20 m · zelená · pro pletivo 125 cm',leafLength:1.91,totalWeight:35};
    if(h===150)return{price:9472,label:'UNIVERSAL · 4,0 × 1,45 m · zelená · pro pletivo 150 cm',leafLength:1.91,totalWeight:44};
    if(h===160)return{price:10075,label:'UNIVERSAL · 4,0 × 1,55 m · zelená · pro pletivo 160 cm',leafLength:1.91,totalWeight:30};
    return null;
  }

  function meshDoor(c){
    if(c.meshVariant!=='classic'||c.meshSurface!=='green'||!exact(c.doorWidth,1))return null;
    const h=Number(c.actualHeight);
    if(c.slabWith){
      if(Number(c.slabHeight)===20&&h===100)return{price:4000,label:'IDEAL · 1,0 × 1,20 m · zelená · pro pletivo 100 cm + podhrab 20 cm'};
      if(Number(c.slabHeight)===20&&h===125)return{price:4477,label:'IDEAL · 1,0 × 1,45 m · zelená · pro pletivo 125 cm + podhrab 20 cm'};
      return null;
    }
    if(h===125)return{price:4000,label:'IDEAL · 1,0 × 1,20 m · zelená · pro pletivo 125 cm'};
    if(h===150)return{price:4477,label:'IDEAL · 1,0 × 1,45 m · zelená · pro pletivo 150 cm'};
    if(h===160)return{price:4630,label:'IDEAL · 1,0 × 1,55 m · zelená · pro pletivo 160 cm'};
    return null;
  }

  function computeVerifiedGate(config,kind){
    const c={
      type:'',actualHeight:150,gateWidth:4,doorWidth:1,gateType:'double',slabWith:false,slabHeight:0,
      panelSurface:'green',panelVariant:'3d',meshSurface:'green',meshVariant:'classic',...(config||{})
    };
    if(c.type==='panel')return kind==='gate'?panelGate(c):panelDoor(c);
    if(c.type==='mesh')return kind==='gate'?meshGate(c):meshDoor(c);
    return null;
  }

  function unsupportedNote(config,kind){
    const c=config||{};
    if(c.slabWith&&kind==='gate')return'podhrabová deska mění výškové napojení otvoru; bez přesně spárované brány tuto kombinaci neoceňujeme';
    if(c.slabWith&&c.type==='panel')return'panel s podhrabovou deskou vyžaduje výškově spárovanou bránu/branku; současný kusový benchmark je jen pro sestavu bez desky';
    if(c.type==='panel'&&c.panelVariant==='2d')return'2D varianta: tento rozměr, výška nebo povrch nemá přesně spárovaný produkt v benchmarku';
    if(c.type==='panel'||c.type==='mesh')return'rozměr, skutečně použitá výška, typ nebo povrch bez přesně ověřené kusové ceny';
    return(kind==='gate'?'brána':'branka')+' pro tento typ plotu je zakázková a nemá univerzální cenu';
  }

  return{exact,panelGate,panelDoor,meshGate,meshDoor,computeVerifiedGate,unsupportedNote};
});
