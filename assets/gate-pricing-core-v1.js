(function(root,factory){
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.PLOTAO_GATE_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
const prices={panelGate:{"2d-green-103":15448,"2d-green-123":17547,"3d-green-153":8490,"3d-anthracite-153":8490,"3d-zinc-153":18321},panelDoor:{"2d-green-103":6141,"2d-green-143":7243,"3d-green-153":3990,"3d-anthracite-153":3990,"3d-zinc-153":7657},meshGate:{"green-125":8072,"green-150":9472,"green-160":10075},meshDoor:{"slab20-100":4000,"slab20-125":4477,"green-125":4000,"green-150":4477,"green-160":4630}};
function exact(a,b,tol=.02){return Math.abs(Number(a)-Number(b))<=tol}

function panelGate(c){
if(c.slabWith||c.gateType!=='double'||!exact(c.gateWidth,4))return null;
const h=Number(c.actualHeight);
if(c.panelVariant==='2d'){
if(c.panelSurface!=='green')return null;
if(h===103)return{price:prices.panelGate['2d-green-103'],label:'Ploty Dobrý 2D · 4,0 × 1,00 m · RAL 6005'};
if(h===123)return{price:prices.panelGate['2d-green-123'],label:'Ploty Dobrý 2D · 4,0 × 1,20 m · RAL 6005'};
return null;
}
if(h!==153)return null;
if(c.panelSurface==='green')return{price:prices.panelGate['3d-green-153'],label:'BAUHAUS 3D · 4,0 × 1,53 m · RAL 6005'};
if(c.panelSurface==='anthracite')return{price:prices.panelGate['3d-anthracite-153'],label:'BAUHAUS 3D · 4,0 × 1,53 m · RAL 7016'};
if(c.panelSurface==='zinc')return{price:prices.panelGate['3d-zinc-153'],label:'BRAVO 3D ZN · 4,0 × 1,53 m'};
return null;
}

function panelDoor(c){
if(c.slabWith||!exact(c.doorWidth,1))return null;
const h=Number(c.actualHeight);
if(c.panelVariant==='2d'){
if(c.panelSurface!=='green')return null;
if(h===103)return{price:prices.panelDoor['2d-green-103'],label:'Ploty Dobrý 2D · 1,0 × 1,00 m · RAL 6005'};
if(h===143)return{price:prices.panelDoor['2d-green-143'],label:'Ploty Dobrý 2D · 1,0 × 1,40 m · RAL 6005'};
return null;
}
if(h!==153)return null;
if(c.panelSurface==='green')return{price:prices.panelDoor['3d-green-153'],label:'BAUHAUS 3D · 1,0 × 1,53 m · RAL 6005'};
if(c.panelSurface==='anthracite')return{price:prices.panelDoor['3d-anthracite-153'],label:'BAUHAUS 3D · 1,0 × 1,53 m · RAL 7016'};
if(c.panelSurface==='zinc')return{price:prices.panelDoor['3d-zinc-153'],label:'BRAVO 3D ZN · 1,0 × 1,53 m'};
return null;
}

function meshGate(c){
if(c.meshVariant!=='classic'||c.meshSurface!=='green'||c.gateType!=='double'||!exact(c.gateWidth,4)||c.slabWith)return null;
const h=Number(c.actualHeight);
if(h===125)return{price:prices.meshGate['green-125'],label:'UNIVERSAL · 4,0 × 1,20 m · zelená · pro pletivo 125 cm',leafLength:1.91,totalWeight:35};
if(h===150)return{price:prices.meshGate['green-150'],label:'UNIVERSAL · 4,0 × 1,45 m · zelená · pro pletivo 150 cm',leafLength:1.91,totalWeight:44};
if(h===160)return{price:prices.meshGate['green-160'],label:'UNIVERSAL · 4,0 × 1,55 m · zelená · pro pletivo 160 cm',leafLength:1.91,totalWeight:30};
return null;
}

function meshDoor(c){
if(c.meshVariant!=='classic'||c.meshSurface!=='green'||!exact(c.doorWidth,1))return null;
const h=Number(c.actualHeight);
if(c.slabWith){
if(Number(c.slabHeight)===20&&h===100)return{price:prices.meshDoor['slab20-100'],label:'IDEAL · 1,0 × 1,20 m · zelená · pro pletivo 100 cm + podhrab 20 cm'};
if(Number(c.slabHeight)===20&&h===125)return{price:prices.meshDoor['slab20-125'],label:'IDEAL · 1,0 × 1,45 m · zelená · pro pletivo 125 cm + podhrab 20 cm'};
return null;
}
if(h===125)return{price:prices.meshDoor['green-125'],label:'IDEAL · 1,0 × 1,20 m · zelená · pro pletivo 125 cm'};
if(h===150)return{price:prices.meshDoor['green-150'],label:'IDEAL · 1,0 × 1,45 m · zelená · pro pletivo 150 cm'};
if(h===160)return{price:prices.meshDoor['green-160'],label:'IDEAL · 1,0 × 1,55 m · zelená · pro pletivo 160 cm'};
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

return{prices,exact,panelGate,panelDoor,meshGate,meshDoor,computeVerifiedGate,unsupportedNote};
});
