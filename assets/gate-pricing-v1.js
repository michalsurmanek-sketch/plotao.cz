(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],money=n=>Math.round(n).toLocaleString('cs-CZ')+' Kč';
  const core=window.PLOTAO_GATE_PRICING_CORE;
  if(!core){console.error('PLOTAO gate pricing core is missing');return}

  function type(){return $('.type.on')?.dataset.id||''}
  function requestedH(){return Math.max(40,+($('#height')?.value||150))}
  function actualH(){if(type()==='panel')return +(window.PLOTAO_PANEL_PRICE?.height||requestedH());if(type()==='mesh')return +(window.PLOTAO_MESH_PRICE?.height||requestedH());return requestedH()}
  function gateOn(){return!!$('#gate')?.checked}
  function doorOn(){return!!$('#door')?.checked}
  function gateWidth(){return+($('#gateWidth')?.value||4)}
  function doorWidth(){return+($('#doorWidth')?.value||1)}
  function gateType(){return $('#gateType')?.value||'double'}
  function panelSurface(){return $('#options [data-pc].on')?.dataset.pc||'green'}
  function panelVariant(){return $('#options [data-pv].on')?.dataset.pv||'3d'}
  function meshSurface(){return $('#options [data-ms].on')?.dataset.ms||'green'}
  function meshVariant(){return $('#options [data-mv].on')?.dataset.mv||'classic'}
  function slab(){
    const t=type();
    if(t==='panel'){
      const on=$('#options [data-pb].on')?.dataset.pb==='with',size=$('#options [data-pbs].on')?.dataset.pbs||'250x20';
      return{with:on,height:size.endsWith('30')?30:20};
    }
    if(t==='mesh'){
      const on=$('#options [data-mb].on')?.dataset.mb==='with',size=$('#options [data-mbs].on')?.dataset.mbs||'300x20';
      return{with:on,height:size.endsWith('30')?30:20};
    }
    return{with:false,height:0};
  }
  function config(){const sb=slab();return{type:type(),actualHeight:actualH(),gateWidth:gateWidth(),doorWidth:doorWidth(),gateType:gateType(),slabWith:sb.with,slabHeight:sb.height,panelSurface:panelSurface(),panelVariant:panelVariant(),meshSurface:meshSurface(),meshVariant:meshVariant()}}
  function rowByLabel(label){return $$('.resultbody .row').find(r=>(r.querySelector('span')?.childNodes?.[0]?.textContent||r.querySelector('span')?.textContent||'').trim().toLowerCase().includes(label))||null}
  function setRow(label,val,note,offText='Individuální nabídka'){
    const r=rowByLabel(label);if(!r)return;
    const b=r.querySelector('b,strong')||r.lastElementChild;if(b)b.textContent=val==null?offText:money(val);
    r.classList.toggle('off',val==null);
    let s=r.querySelector('span small');if(!s){s=document.createElement('small');r.querySelector('span')?.appendChild(s)}
    if(s)s.textContent=note||'';
  }
  function box(){let b=$('#gatePriceBox');if(!b){b=document.createElement('div');b.id='gatePriceBox';b.style.cssText='display:none;margin-top:14px;padding:14px;border:1px solid #ffffff26;border-radius:13px;background:#ffffff0d;color:#fff';($('#materialList')||$('.resultbody'))?.insertAdjacentElement('afterend',b)}return b}
  function verified(c,kind){return core.computeVerifiedGate(c,kind)}

  function render(){
    const b=box();if(!b)return;
    const c=config(),parts=[];
    if(gateOn()){
      const g=verified(c,'gate');
      if(g){setRow('vjezdová brána',g.price,g.label);parts.push('<div style="display:flex;justify-content:space-between;gap:12px"><span>Vjezdová brána</span><b>'+money(g.price)+'</b></div>')}
      else{setRow('vjezdová brána',null,core.unsupportedNote(c,'gate'));parts.push('<div style="display:flex;justify-content:space-between;gap:12px"><span>Vjezdová brána</span><b>individuální nabídka</b></div>')}
    }else setRow('vjezdová brána',null,'brána není zvolena','Nezapočítáno');
    if(doorOn()){
      const d=verified(c,'door');
      if(d){setRow('vstupní branka',d.price,d.label);parts.push('<div style="display:flex;justify-content:space-between;gap:12px"><span>Vstupní branka</span><b>'+money(d.price)+'</b></div>')}
      else{setRow('vstupní branka',null,core.unsupportedNote(c,'door'));parts.push('<div style="display:flex;justify-content:space-between;gap:12px"><span>Vstupní branka</span><b>individuální nabídka</b></div>')}
    }else setRow('vstupní branka',null,'branka není zvolena','Nezapočítáno');
    if(!parts.length){b.style.display='none';window.PLOTAO_GATE_PRICE={type:c.type,gate:null,door:null};document.dispatchEvent(new CustomEvent('plotao:gate-price'));return}
    b.style.display='block';
    b.innerHTML='<div style="font-size:13px;font-weight:900;margin-bottom:8px">Brána a branka · přesný kusový benchmark</div><div style="display:grid;gap:6px;font-size:12px">'+parts.join('')+'</div><p style="margin:9px 0 0;color:#b9d8c9;font-size:11px;line-height:1.4">Brána se páruje se skutečně použitou vyráběnou výškou plotu, podhrabovou deskou a konkrétním produktem. U klasického pletiva výrobce například uvádí, že 120cm branka pasuje k 125cm pletivu bez desky nebo 100cm pletivu s 20cm podhrabem; 145cm branka obdobně k 150cm pletivu bez desky nebo 125cm pletivu s 20cm podhrabem. Šířky ani jiné výšky se neinterpolují.</p>';
    window.PLOTAO_GATE_PRICE={type:c.type,actualHeight:c.actualHeight,slab:{with:c.slabWith,height:c.slabHeight},gate:gateOn()?verified(c,'gate'):null,door:doorOn()?verified(c,'door'):null};
    document.dispatchEvent(new CustomEvent('plotao:gate-price'));
  }
  function schedule(delay=60){clearTimeout(schedule.t);schedule.t=setTimeout(render,delay)}
  function init(){render();document.addEventListener('input',()=>schedule(60));document.addEventListener('change',()=>schedule(60));document.addEventListener('click',()=>schedule(100));document.addEventListener('plotao:panel-price',()=>schedule(40));document.addEventListener('plotao:mesh-price',()=>schedule(40));document.addEventListener('plotao:placement',()=>schedule(40));document.addEventListener('plotao:slab-price',()=>schedule(40));document.addEventListener('plotao:options-reset',()=>schedule(10))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
