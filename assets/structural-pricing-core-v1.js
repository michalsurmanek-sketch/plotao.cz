(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_STRUCTURAL_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const concrete={b50one:450,b50both:515,b25one:340,b25both:390,color:{gray:{board:1,post:1},sand:{board:1.20,post:1.16},anthracite:{board:1.30,post:1.25}},postStyle:{smooth:1,design:1.20},posts:{50:[420,434,481],75:[457,481,516],100:[492,516,564],125:[530,564,578],150:[552,578,601],175:[578,625,674],200:[601,648,696],225:[648,696,842],250:[901,961,1082],275:[1381,1442,1682],300:[1562,1622,1802]}};
  const gabion={cLo:1500,cHi:3000,stoneQ:[1400,2500],stoneD:[2800,4500],density:1.7};
  function postUnit(materialH,role){const arr=concrete.posts[materialH];if(!arr)return null;const idx=role==='corner'?2:role==='end'?1:0;return arr[idx]}
  function computeConcretePrice(input={}){
    const requested=Math.max(40,+input.requestedHeight||153),materialH=Math.max(50,Math.ceil(requested/25)*25),cfg={side:'one',post:'smooth',color:'gray',...(input.config||{})},g=input.geometry||{};
    if(materialH>300)return{unsupported:true,reason:'height',requestedHeight:requested,materialHeight:materialH};
    const color=concrete.color[cfg.color],style=concrete.postStyle[cfg.post];if(!color)return{unsupported:true,reason:'color',requestedHeight:requested,materialHeight:materialH,color:cfg.color};if(!style)return{unsupported:true,reason:'post-style',requestedHeight:requested,materialHeight:materialH,post:cfg.post};
    const fields=Math.max(0,+g.fields||0),both=cfg.side==='both',full=Math.floor(materialH/50),half=materialH%50===25?1:0,b50=fields*full,b25=fields*half,u50=Math.round((both?concrete.b50both:concrete.b50one)*color.board),u25=Math.round((both?concrete.b25both:concrete.b25one)*color.board),counts={line:Math.max(0,(+g.line||0)+(+g.strain||0)),end:Math.max(0,+g.end||0),corner:Math.max(0,+g.corner||0)},pm=color.post*style,lp=Math.round(postUnit(materialH,'line')*pm),ep=Math.round(postUnit(materialH,'end')*pm),cp=Math.round(postUnit(materialH,'corner')*pm);
    if(!Number.isFinite(lp)||!Number.isFinite(ep)||!Number.isFinite(cp))return{unsupported:true,reason:'post-row',requestedHeight:requested,materialHeight:materialH};
    const boardCost=b50*u50+b25*u25,lineCost=counts.line*lp,endCost=counts.end*ep,cornerCost=counts.corner*cp,materialTotal=boardCost+lineCost+endCost+cornerCost;
    return{unsupported:false,complete:true,materialTotal,requestedHeight:requested,materialHeight:materialH,fields,b50,b25,u50,u25,counts,lineUnit:lp,endUnit:ep,cornerUnit:cp,boardCost,lineCost,endCost,cornerCost,side:cfg.side,color:cfg.color,post:cfg.post};
  }
  function computeGabionPrice(input={}){
    const height=Math.max(.4,(+input.height||153)/100),fence=Math.max(0,+input.fence||0),width=Math.max(0,+input.width||.30),kind=input.kind==='display'?'display':'quarry',sp=kind==='display'?gabion.stoneD:gabion.stoneQ,volume=fence*height*width,tons=volume*gabion.density,constructionLow=volume*gabion.cLo,constructionHigh=volume*gabion.cHi,stoneLow=tons*sp[0],stoneHigh=tons*sp[1],low=constructionLow+stoneLow,high=constructionHigh+stoneHigh;
    return{unsupported:false,low,high,volume,tons,height,fence,width,kind,constructionLow,constructionHigh,stoneLow,stoneHigh,density:gabion.density};
  }
  return{concrete,gabion,postUnit,computeConcretePrice,computeGabionPrice};
});
