(()=>{
  const $=s=>document.querySelector(s);
  const defaults={masonry:{variant:'blocks',finish:'standard'},mobile:{variant:'mesh'},other:{variant:'custom'},hedge:{variant:'evergreen'}};
  let state=JSON.parse(JSON.stringify(defaults));

  function type(){return $('.type.on')?.dataset.id||''}

  function ensureStyle(){
    if($('#plotaoMobileFenceStyle'))return;
    const s=document.createElement('style');
    s.id='plotaoMobileFenceStyle';
    const q='#extraFenceConfig:is([data-type="mobile"],[data-type="masonry"],[data-type="hedge"])';
    s.textContent=`${q}{display:block!important;margin-top:18px!important;padding:24px!important;border:1px solid #d7eadf!important;border-radius:24px!important;background:linear-gradient(180deg,#f7fcf9 0%,#eff9f3 100%)!important;box-shadow:0 10px 34px rgba(15,82,52,.07)}${q} .mobile-config-title{display:flex!important;align-items:flex-start!important;gap:14px!important;margin-bottom:20px!important}${q} .mobile-config-icon{width:52px;height:52px;flex:0 0 52px;border-radius:50%;display:grid;place-items:center;background:#dff4e8;color:#087443}${q} .mobile-config-icon svg{width:28px;height:28px;display:block}${q} .mobile-config-title h3{margin:1px 0 0;font-size:28px;line-height:1.08;letter-spacing:-.55px;color:#17251e}${q} .mobile-config-title p{margin:7px 0 0;color:#68786f;font-size:16px;line-height:1.35}${q} .mobile-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}${q} .mobile-choices button{min-height:92px;display:flex;align-items:center;gap:13px;position:relative;text-align:left;border:1px solid #dce8e1;border-radius:17px;background:#fff;padding:14px 16px;color:#17251e;box-shadow:0 5px 16px rgba(23,37,30,.045);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease}${q} .mobile-choices button:hover{transform:translateY(-1px);border-color:#a8cbb7;box-shadow:0 8px 20px rgba(23,37,30,.07)}${q} .mobile-choices button:focus-visible{outline:3px solid rgba(8,116,67,.23);outline-offset:2px}${q} .mobile-choices button.on{background:linear-gradient(135deg,#078a4d 0%,#087443 100%);border-color:#087443;color:#fff;box-shadow:0 10px 23px rgba(8,116,67,.18)}${q} .mobile-choice-icon{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center}${q} .mobile-choice-icon svg{width:31px;height:31px;display:block}${q} .mobile-choices span strong{display:block;font-size:17px;line-height:1.18}${q} .mobile-choices span small{display:block;margin-top:5px;color:#68786f;font-size:13px;font-weight:700}${q} .mobile-choices button.on span small{color:#dcf3e6}${q} .mobile-choice-check{margin-left:auto;display:grid;place-items:center;width:31px;height:31px;flex:0 0 31px;border-radius:50%;background:#fff;color:#087443;font-size:19px;font-weight:900}${q} .mobile-product{margin-top:0;padding:19px;border:1px solid #dce9e1;border-radius:20px;background:#fff;box-shadow:0 7px 24px rgba(23,37,30,.045)}${q} .mobile-product-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}${q} .mobile-product-head>strong{font-size:19px;letter-spacing:-.2px}${q} .mobile-product-head>span{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;background:#e4f7ec;color:#087443;font-size:12px;font-weight:900;white-space:nowrap}${q} .mobile-product-main{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(230px,.92fr);gap:20px;align-items:center}${q} .mobile-product-main>img{width:100%;height:235px;object-fit:contain;border-radius:15px;background:linear-gradient(180deg,#eef5f1,#e7f0eb)}${q} .mobile-product-main h3{font-size:23px;line-height:1.2;margin:0 0 9px;letter-spacing:-.3px;color:#17251e}${q} .mobile-product-main p{margin:0;color:#68786f;font-size:16px;line-height:1.52}${q} .mobile-thumbs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:13px}${q} .mobile-thumbs figure{margin:0;padding:0 0 7px;border:1px solid #edf2ef;border-radius:12px;background:#fff;overflow:hidden}${q} .mobile-thumbs img{display:block;width:100%;height:92px;object-fit:cover;background:#edf3ef}${q} .mobile-thumbs figcaption{text-align:center;font-size:12px;margin-top:7px;padding:0 4px;color:#394d42}${q} .mobile-tip{display:flex;align-items:flex-start;gap:11px;margin-top:15px;padding:15px 17px;border-radius:15px;background:linear-gradient(90deg,#e7f8ee 0%,#effaf4 100%);color:#486157;font-size:14px;line-height:1.47}${q} .mobile-tip-icon{width:28px;height:28px;flex:0 0 28px;color:#079052}${q} .mobile-tip-icon svg{width:28px;height:28px;display:block}@media(max-width:760px){${q}{padding:18px!important;border-radius:20px!important}${q} .mobile-config-title h3{font-size:22px}${q} .mobile-config-title p{font-size:14px}${q} .mobile-config-icon{width:45px;height:45px;flex-basis:45px}${q} .mobile-choices{grid-template-columns:1fr;gap:9px}${q} .mobile-choices button{min-height:67px;padding:11px 13px}${q} .mobile-product{padding:14px}${q} .mobile-product-main{grid-template-columns:1fr;gap:13px}${q} .mobile-product-main>img{height:190px}${q} .mobile-product-main h3{font-size:20px}${q} .mobile-product-main p{font-size:14px}${q} .mobile-thumbs{grid-template-columns:1fr 1fr}${q} .mobile-thumbs img{height:96px}${q} .mobile-product-head{align-items:flex-start}${q} .mobile-product-head>strong{font-size:17px}${q} .mobile-tip{font-size:13px;padding:13px}}`;
    document.head.appendChild(s);
  }

  function ensure(){
    let b=$('#extraFenceConfig');
    if(!b){
      b=document.createElement('div');
      b.id='extraFenceConfig';
      b.style.cssText='display:none;margin-top:14px;padding:16px;border:1px solid #cfe2d6;border-radius:18px;background:linear-gradient(180deg,#f5fbf7 0%,#eef8f2 100%)';
      $('#options')?.insertAdjacentElement('afterend',b);
    }
    return b;
  }

  function btn(group,val,label,st){return '<button type="button" data-eg="'+group+'" data-ev="'+val+'" class="'+(st[group]===val?'on':'')+'">'+label+'</button>'}

  function icon(kind){
    if(kind==='mesh')return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="4" width="22" height="24" rx="1.5"/><path d="M10.5 4v24M16 4v24M21.5 4v24M5 10h22M5 16h22M5 22h22"/></svg>';
    if(kind==='solid')return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 5h20v22H6zM10 5v22M22 5v22"/></svg>';
    return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h24v18H4zM8 7v18M24 7v18M12 10v12M16 10v12M20 10v12"/></svg>';
  }

  function gearIcon(){return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="16" cy="16" r="5"/><path d="M16 3.5v3M16 25.5v3M28.5 16h-3M6.5 16h-3M24.8 7.2l-2.1 2.1M9.3 22.7l-2.1 2.1M24.8 24.8l-2.1-2.1M9.3 9.3L7.2 7.2"/><circle cx="16" cy="16" r="10" stroke-dasharray="2 3"/></svg>'}
  function bulbIcon(){return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21c-2.2-1.6-3.5-4.1-3.5-6.8A8.5 8.5 0 0 1 16 5.7a8.5 8.5 0 0 1 8.5 8.5c0 2.8-1.3 5.3-3.5 6.8-1.2.9-1.7 1.7-1.8 3H12.8c-.1-1.3-.6-2.1-1.8-3Z"/><path d="M13 27h6M14 30h4M16 2v1.5M4.5 8.5l1.4.8M27.5 8.5l-1.4.8M3 16h2M27 16h2"/></svg>'}
  function mobileBtn(val,title,sub,st){return '<button type="button" data-eg="variant" data-ev="'+val+'" class="'+(st.variant===val?'on':'')+'"><i class="mobile-choice-icon">'+icon(val)+'</i><span><strong>'+title+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</span>'+(st.variant===val?'<b class="mobile-choice-check" aria-hidden="true">✓</b>':'')+'</button>'}

  function focusChoice(group,value){queueMicrotask(()=>{const target=$('#extraFenceConfig [data-eg="'+group+'"][data-ev="'+value+'"]');if(!target?.focus)return;try{target.focus({preventScroll:true})}catch{target.focus()}})}

  function publish(t){
    if(!['masonry','mobile','other','hedge'].includes(t)){
      window.PLOTAO_EXTRA=null;
      document.dispatchEvent(new CustomEvent('plotao:extra',{detail:null}));
      return;
    }
    const s=state[t];
    window.PLOTAO_EXTRA=t==='other'?{type:t,variant:'custom'}:{type:t,...s};
    document.dispatchEvent(new CustomEvent('plotao:extra',{detail:window.PLOTAO_EXTRA}));
  }

  function tip(text){return '<div class="mobile-tip"><span class="mobile-tip-icon" aria-hidden="true">'+bulbIcon()+'</span><span>'+text+'</span></div>'}

  function thumbs(prefix,alts){
    return '<div class="mobile-thumbs">'+
      '<figure><img src="/assets/fence-types/'+prefix+'-detail.webp" alt="'+alts[0]+'" loading="lazy" decoding="async"><figcaption>Detail panelu</figcaption></figure>'+
      '<figure><img src="/assets/fence-types/'+prefix+'-base.webp" alt="'+alts[1]+'" loading="lazy" decoding="async"><figcaption>Plastový podstavec</figcaption></figure>'+
      '<figure><img src="/assets/fence-types/'+prefix+'-clamp.webp" alt="'+alts[2]+'" loading="lazy" decoding="async"><figcaption>Spojovací prvek</figcaption></figure>'+
      '<figure><img src="/assets/fence-types/'+prefix+'-installation.webp" alt="'+alts[3]+'" loading="lazy" decoding="async"><figcaption>Ukázka sestavy</figcaption></figure>'+
    '</div>';
  }

  function mobileProduct(s){
    if(s.variant==='mesh')return '<div class="mobile-product"><div class="mobile-product-head"><strong>Vybraný typ panelu</strong><span>✓ Nejčastější volba</span></div><div class="mobile-product-main"><img src="/assets/fence-types/mobile-mesh-main.webp" alt="Síťový panel mobilního oplocení 3,5 × 1,9 m" loading="lazy" decoding="async"><div><h3>Síťový panel 3,5 × 1,9 m</h3><p>Nejrozšířenější varianta pro dočasné oplocení stavenišť, akcí a pozemků. Stabilní, snadná montáž a demontáž.</p></div></div>'+thumbs('mobile-mesh',['Detail svařované sítě panelu','Plastový podstavec mobilního oplocení','Spojovací prvek mobilního oplocení','Ukázka sestavy mobilního oplocení'])+tip('Ověřený kusový benchmark pro síťovou variantu platí pro panel 3,5 × 1,9 m. Jinou výšku kalkulátor správně ponechá jako individuální nabídku.')+'</div>';

    if(s.variant==='solid')return '<div class="mobile-product"><div class="mobile-product-head"><strong>Vybraný typ panelu</strong><span>✓ Více soukromí</span></div><div class="mobile-product-main"><img src="/assets/fence-types/mobile-solid-main.webp" alt="Plný panel mobilního oplocení 2,8 × 2,0 m" loading="lazy" decoding="async"><div><h3>Plný panel 2,8 × 2,0 m</h3><p>Plná varianta mobilního oplocení pro stavby, akce a dočasné oddělení prostoru. Poskytuje vyšší soukromí, lepší clonění a čistý vzhled sestavy.</p></div></div>'+thumbs('mobile-solid',['Detail plného panelu','Plastový podstavec plného mobilního panelu','Spojovací prvek plného mobilního panelu','Ukázka sestavy plných mobilních panelů'])+tip('Ověřený kusový benchmark pro plnou variantu platí pro panel 2,8 × 2,0 m. Jiné rozměry kalkulátor správně ponechá jako individuální nabídku.')+'</div>';

    return window.PLOTAO_BARRIER_PRODUCT({variant:'standard'},tip);
  }


  const hedgeVariants={
    evergreen:{title:'Stálezelený',sub:'Zeleň po celý rok',description:'Živý plot ze stálezelených rostlin pro přirozené oddělení zahrady a soukromí během celého roku.'},
    deciduous:{title:'Listnatý opadavý',sub:'Proměny během roku',description:'Přírodní oplocení z opadavých listnatých dřevin. Vzhled a míra zastínění se mění s ročním obdobím.'},
    mixed:{title:'Smíšený',sub:'Kombinace rostlin',description:'Živý plot kombinující více druhů rostlin. Skladbu přizpůsobíme prostoru, požadovanému vzhledu a podmínkám zahrady.'}
  };
  function hedgeIcon(v){const p=v==='evergreen'?'M16 3 7 14h5l-7 10h9v5h4v-5h9l-7-10h5Z':v==='deciduous'?'M7 25C1 10 13 3 27 5c2 14-5 24-18 18M5 28 22 11M12 21v-7m0 7h7':'M9 3 3 12h4l-5 9h7v8m0-8h5M21 27V16m0 6c-10-2-8-17 2-18 10 5 8 18-2 18';return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+p+'"/></svg>'}
  function hedgeProduct(s){
    const selected=hedgeVariants[s.variant];
    const choices=Object.entries(hedgeVariants).map(([value,item])=>'<button type="button" data-eg="variant" data-ev="'+value+'" aria-pressed="'+(s.variant===value)+'" class="'+(s.variant===value?'on':'')+'"><i class="mobile-choice-icon">'+hedgeIcon(value)+'</i><span><strong>'+item.title+'</strong><small>'+item.sub+'</small></span>'+(s.variant===value?'<b class="mobile-choice-check" aria-hidden="true">✓</b>':'')+'</button>').join('');
    return '<div class="mobile-config-title"><span class="mobile-config-icon" aria-hidden="true">'+gearIcon()+'</span><div><h3>Konfigurace živého plotu</h3><p>Vyberte charakter výsadby pro vaši zahradu</p></div></div><div class="mobile-choices" role="group" aria-label="Varianta živého plotu">'+choices+'</div><div class="mobile-product"><div class="mobile-product-head"><strong>Vybraná varianta</strong><span>Individuální nabídka</span></div><div class="mobile-product-main"><img src="/assets/fence-types/category-hedge.webp" alt="Ilustrační vizualizace tvarovaného živého plotu" decoding="async" width="1536" height="1024"><div><h3>'+selected.title+' živý plot</h3><p>'+selected.description+'</p><p>Konkrétní druhy rostlin, jejich velikost při výsadbě a rozestupy upřesníme v nabídce.</p></div></div>'+tip('Délku výsadby a požadovanou cílovou výšku zadejte v rozměrech plotu. Cena závisí na vybraných rostlinách, jejich počtu, přípravě půdy a rozsahu výsadby. Obrázek je ilustrační AI vizualizace.')+'</div>';
  }

  function render(){
    const b=ensure();
    if(!b)return;
    const t=type();
    b.dataset.type=t;
    if(!['masonry','mobile','other','hedge'].includes(t)){
      b.style.display='none';
      b.innerHTML='';
      publish(t);
      return;
    }
    b.style.display='block';
    let html='';
    if(t==='masonry'){
      const s=state.masonry;
      ensureStyle();
      html=window.PLOTAO_MASONRY_UI.render(s,{gearIcon,btn,tip});
    }else if(t==='mobile'){
      ensureStyle();
      const s=state.mobile;
      html='<div class="mobile-config-title"><span class="mobile-config-icon" aria-hidden="true">'+gearIcon()+'</span><div><h3>Konfigurace mobilního oplocení</h3><p>Vyberte typ panelu a zobrazte dostupné varianty</p></div></div><div class="mobile-choices">'+mobileBtn('mesh','Síťový panel','3,5 × 1,9 m',s)+mobileBtn('solid','Plný panel','2,8 × 2,0 m',s)+mobileBtn('barrier','Mobilní zábrana','',s)+'</div>'+mobileProduct(s);
    }else if(t==='hedge'){
      ensureStyle();
      html=hedgeProduct(state.hedge);
    }else{
      html='<h3 style="margin:0 0 8px">Atypické oplocení</h3><p style="margin:0;color:#68786f;font-size:12px;line-height:1.45">Atypický plot nemá univerzální kusový ceník. Kalkulátor jej proto jasně označí jako individuální nabídku.</p>';
    }
    b.innerHTML=html;
    const s=state[t];
    b.querySelectorAll('[data-eg]').forEach(x=>x.onclick=()=>{const group=x.dataset.eg,value=x.dataset.ev;s[group]=value;render();focusChoice(group,value)});
    publish(t);
  }

  function schedule(){clearTimeout(schedule.t);schedule.t=setTimeout(render,20)}
  function init(){render();document.addEventListener('plotao:options-reset',render);document.addEventListener('click',e=>{if(e.target.closest('.type'))schedule()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();