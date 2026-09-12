(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_STRUCTURAL_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const concrete={b50one:424,b50both:472,b25one:351,b25both:388,posts:{50:[400,400,458],75:[435,458,491],100:[469,491,537],125:[504,537,550],150:[526,550,572],175:[550,595,641],200:[572,617,663],225:[617,663,802],250:[858,915,1030],275:[1315,1373,1602],300:[1487,1545,1716]}};
  const gabion={cLo:1200,cHi:2600,stoneQ:[1800,3200],stoneD:[2800,4500],density:1.7};
  function postUnit(materialH,role){const arr=concrete.posts[materialH];if(!arr)return null;const idx=role==='corner'?2:role==='end'?1:0;return arr[idx]}
  function computeConcretePrice(input={}){
    const requested=Math.max(40,+input.requestedHeight||153),materialH=Math.max(50,Math.ceil(requested/25)*25),cfg={side:'one',post:'smooth',color:'gray',...(input.config||{})},g=input.geometry||{};
    if(materialH>300)return{unsupported:true,reason:'height',requestedHeight:requested,materialHeight:materialH};
    if(cfg.color!=='gray')return{unsupported:true,reason:'color',requestedHeight:requested,materialHeight:materialH,color:cfg.color};
    if(cfg.post!=='smooth')return{unsupported:true,reason:'post-style',requestedHeight:requested,materialHeight:materialH,post:cfg.post};
    const fields=Math.max(0,+g.fields||0),both=cfg.side==='both',full=Math.floor(materialH/50),half=materialH%50===25?1:0,b50=fields*full,b25=fields*half,u50=both?concrete.b50both:concrete.b50one,u25=both?concrete.b25both:concrete.b25one,counts={line:Math.max(0,(+g.line||0)+(+g.strain||0)),end:Math.max(0,+g.end||0),corner:Math.max(0,+g.corner||0)},lp=postUnit(materialH,'line'),ep=postUnit(materialH,'end'),cp=postUnit(materialH,'corner');
    if(lp==null||ep==null||cp==null)return{unsupported:true,reason:'post-row',requestedHeight:requested,materialHeight:materialH};
    const boardCost=b50*u50+b25*u25,lineCost=counts.line*lp,endCost=counts.end*ep,cornerCost=counts.corner*cp,materialTotal=boardCost+lineCost+endCost+cornerCost;
    return{unsupported:false,complete:true,materialTotal,requestedHeight:requested,materialHeight:materialH,fields,b50,b25,u50,u25,counts,lineUnit:lp,endUnit:ep,cornerUnit:cp,boardCost,lineCost,endCost,cornerCost,side:cfg.side};
  }
  function computeGabionPrice(input={}){
    const height=Math.max(.4,(+input.height||153)/100),fence=Math.max(0,+input.fence||0),width=Math.max(0,+input.width||.30),kind=input.kind==='display'?'display':'quarry',sp=kind==='display'?gabion.stoneD:gabion.stoneQ,volume=fence*height*width,tons=volume*gabion.density,constructionLow=volume*gabion.cLo,constructionHigh=volume*gabion.cHi,stoneLow=tons*sp[0],stoneHigh=tons*sp[1],low=constructionLow+stoneLow,high=constructionHigh+stoneHigh;
    return{unsupported:false,low,high,volume,tons,height,fence,width,kind,constructionLow,constructionHigh,stoneLow,stoneHigh,density:gabion.density};
  }
  return{concrete,gabion,postUnit,computeConcretePrice,computeGabionPrice};
});
