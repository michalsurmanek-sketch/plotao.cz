(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_PRIVACY_PRICING_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const refs={
    wpcBrown:{width:.071,length:1.8,unit:208,label:'WPC Original Wood 71×11×1800'},
    wpcGray:{width:.071,length:1.8,unit:160,label:'WPC šedé 71×11×1800'},
    aluStd:{width:.12,lengths:{2:748,2.5:935,3:1122},label:'ALcentrum Lamela 120'},
    aluCustom:{width:.12,lengths:{2:1498,2.5:1873,3:2247},label:'ALcentrum Lamela 120 · zakázkový RAL'}
  };
  function ref(c){if(c.material==='wpc'){if(c.color==='brown')return refs.wpcBrown;if(c.color==='gray')return refs.wpcGray;return null}if(c.material==='aluminium'){if(c.color==='brown'||c.color==='anthracite')return refs.aluStd;if(c.color==='custom')return refs.aluCustom;return null}return null}
  function chooseAlu(r,height){const ks=Object.keys(r.lengths||{}).map(Number).sort((a,b)=>a-b),k=ks.find(x=>x>=height);return k==null?null:{length:k,unit:r.lengths[k]}}
  function computePrivacyPrice(input={}){
    const c={material:'wpc',cover:'full',layout:'horizontal',color:'brown',gap:5,height:180,runs:[],...input};
    if(c.material==='pvc'||c.material==='wood')return{unsupported:true,reason:'material'};
    const r=ref(c);if(!r)return{unsupported:true,reason:'product'};
    const runs=(Array.isArray(c.runs)?c.runs:[]).map(Number).filter(x=>Number.isFinite(x)&&x>.001),height=Math.max(.4,(+c.height||180)/100),gap=Math.max(0,Math.min(.1,(+c.gap||0)/1000)),pitch=r.width+gap,totalLen=runs.reduce((a,x)=>a+x,0),area=totalLen*height;
    let count=0,unit=0,stockLength=0,rows=0,stockPer=0,visible=0;
    if(c.layout==='vertical'){
      for(const run of runs)visible+=Math.max(1,Math.ceil((run+gap)/pitch));
      if(c.material==='wpc'){
        if(height>r.length+.001)return{unsupported:true,reason:'height',area,gap,pitch};
        count=visible;unit=r.unit;stockLength=r.length;
      }else{
        const stock=chooseAlu(r,height);if(!stock)return{unsupported:true,reason:'height',area,gap,pitch};
        count=visible;unit=stock.unit;stockLength=stock.length;
      }
    }else{
      stockLength=c.material==='wpc'?r.length:2;
      rows=Math.max(1,Math.ceil((height+gap)/pitch));
      for(const run of runs)stockPer+=Math.ceil(run/stockLength);
      count=rows*stockPer;unit=c.material==='wpc'?r.unit:r.lengths[2];
    }
    return{unsupported:false,partial:true,materialTotal:count*unit,material:c.material,color:c.color,count,unitPrice:unit,stockLength,rows,stockPer,visible,area,gap,pitch,totalLen,label:r.label,layout:c.layout};
  }
  return{refs,ref,chooseAlu,computePrivacyPrice};
});
