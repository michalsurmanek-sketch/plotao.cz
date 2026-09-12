(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLOTAO_LEAD_CORE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SCHEMA_VERSION=2;
  const MODES=new Set(['lead','help','partner']);
  const PRICE_KINDS=new Set(['ověřená cena','částečný rozpočet','individuální nabídka','neplatné zadání']);
  const CONNECTIONS=new Set(['začátek','samostatný úsek','navazuje rohem']);
  const SCOPES=new Set(['material','delivery','turnkey']);

  function text(v,max=500){return String(v??'').replace(/\s+/g,' ').trim().slice(0,max)}
  function multiline(v,max=2000){return String(v??'').replace(/\r\n?/g,'\n').trim().slice(0,max)}
  function num(v,min=0,max=Number.MAX_SAFE_INTEGER,fallback=0){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
  function int(v,min=0,max=Number.MAX_SAFE_INTEGER,fallback=0){return Math.trunc(num(v,min,max,fallback))}
  function normalizePhone(v){const raw=text(v,80),plus=raw.startsWith('+'),digits=raw.replace(/\D/g,'').slice(0,32);return(plus?'+':'')+digits}
  function normalizeEmail(v){return text(v,320).toLowerCase()}
  function normalizeSegments(items){return(Array.isArray(items)?items:[]).map((x,i)=>({name:text(x?.name,120)||('Úsek '+(i+1)),length:num(x?.length,0,1000,0),connection:i===0?'začátek':CONNECTIONS.has(x?.connection)?x.connection:'navazuje rohem'}))}
  function normalizeOptions(items){const out=[];for(const item of Array.isArray(items)?items:[]){const v=text(item,160);if(v&&!out.includes(v))out.push(v);if(out.length>=40)break}return out}

  function normalizeLead(raw,now){
    const r=raw||{},segments=normalizeSegments(r.segments),priceKind=PRICE_KINDS.has(r.priceKind)?r.priceKind:'individuální nabídka',mode=MODES.has(r.mode)?r.mode:'lead',scopeValue=SCOPES.has(r.scopeValue)?r.scopeValue:'material';
    return{
      schemaVersion:SCHEMA_VERSION,mode,
      savedAt:text(r.savedAt,40)||text(now,40)||new Date().toISOString(),
      name:text(r.name,120),phone:normalizePhone(r.phone),email:normalizeEmail(r.email),place:text(r.place,160),note:multiline(r.note,2000),
      fenceType:text(r.fenceType,120),height:num(r.height,0,10000,0),segments,options:normalizeOptions(r.options),
      gate:!!r.gate,gateType:text(r.gateType,40),gateWidth:num(r.gateWidth,0,20,0),gateDrive:text(r.gateDrive,40),gateSection:int(r.gateSection,0,999,0),gatePos:num(r.gatePos,0,1000,0),
      wicket:!!r.wicket,wicketWidth:num(r.wicketWidth,0,10,0),wicketSection:int(r.wicketSection,0,999,0),wicketPos:num(r.wicketPos,0,1000,0),
      scopeValue,scope:text(r.scope,80),displayedPrice:text(r.displayedPrice,80),priceKind,priceReason:text(r.priceReason,1000),placeFromCalculator:text(r.placeFromCalculator,160)
    };
  }

  function validateContact(d,errors){
    const phoneDigits=d.phone.replace(/\D/g,'');
    if(d.name.length<2)errors.push({field:'name',code:'name',message:'Doplňte jméno (alespoň 2 znaky).'});
    if(phoneDigits.length<9||phoneDigits.length>15)errors.push({field:'phone',code:'phone',message:'Zadejte platné telefonní číslo (9–15 číslic).'});
    if(d.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))errors.push({field:'email',code:'email',message:'Zadejte platný e-mail.'});
  }
  function validateFence(d,errors){
    if(!d.fenceType)errors.push({field:'fenceType',code:'fence-type',message:'Vyberte typ plotu.'});
    if(d.height<40||d.height>400)errors.push({field:'height',code:'height',message:'Výška plotu musí být 40–400 cm.'});
    if(!d.segments.some(x=>x.length>0))errors.push({field:'segments',code:'segments',message:'Zadejte alespoň jeden úsek s délkou větší než 0 m.'});
    if(d.priceKind==='neplatné zadání')errors.push({field:'configuration',code:'invalid-price',message:'Nejdřív opravte neplatné zadání kalkulátoru.'});
    if((d.scopeValue==='delivery'||d.scopeValue==='turnkey')&&!d.place)errors.push({field:'place',code:'place-required',message:'Pro dopravu nebo realizaci na klíč doplňte obec nebo PSČ.'});
    function opening(kind,on,section,pos,width){
      if(!on)return;
      const s=d.segments[section];
      if(!s||s.length<=0){errors.push({field:kind,code:kind+'-section',message:(kind==='gate'?'Brána':'Branka')+' musí být umístěná v platném úseku.'});return}
      if(width<=0||pos<0||pos+width>s.length+.02)errors.push({field:kind,code:kind+'-placement',message:(kind==='gate'?'Brána':'Branka')+' se musí celá vejít do zvoleného úseku.'});
    }
    opening('gate',d.gate,d.gateSection,d.gatePos,d.gateWidth);
    opening('wicket',d.wicket,d.wicketSection,d.wicketPos,d.wicketWidth);
  }

  function validateLead(raw){
    const d=normalizeLead(raw),errors=[];validateContact(d,errors);
    if(d.mode==='lead')validateFence(d,errors);
    else if(d.mode==='help'&&d.note.length<5)errors.push({field:'note',code:'help-question',message:'Napište prosím stručně, s čím potřebujete poradit.'});
    else if(d.mode==='partner'&&!d.place)errors.push({field:'place',code:'partner-area',message:'Doplňte obec, okres nebo oblast působnosti.'});
    return{valid:errors.length===0,errors,data:d};
  }

  function fenceLines(d){
    const seg=d.segments.map((x,i)=>x.name+' '+x.length.toLocaleString('cs-CZ',{maximumFractionDigits:2})+' m'+(i?(' · '+x.connection):'')).join('; '),gate=d.gate?(d.gateType+' · '+d.gateWidth.toLocaleString('cs-CZ')+' m · '+d.gateDrive+' · úsek '+(d.gateSection+1)+' · pozice '+d.gatePos.toLocaleString('cs-CZ')+' m'):'ne',wicket=d.wicket?(d.wicketWidth.toLocaleString('cs-CZ')+' m · úsek '+(d.wicketSection+1)+' · pozice '+d.wicketPos.toLocaleString('cs-CZ')+' m'):'ne';
    return['Plot: '+(d.fenceType||'—'),'Výška: '+(d.height||'—')+' cm','Úseky: '+(seg||'—'),'Varianty: '+(d.options.join(', ')||'—'),'Brána: '+gate,'Branka: '+wicket,'Rozsah: '+(d.scope||d.scopeValue||'—'),'Zobrazená cena: '+(d.displayedPrice||'—'),'Stav ceny: '+(d.priceKind||'—'),...(d.priceReason?['Důvod / co dopočítat: '+d.priceReason]:[])];
  }
  function toText(raw){
    const d=normalizeLead(raw);
    if(d.mode==='partner')return['PLOTAO.CZ – zájem montážní firmy','','Kontakt:',d.name||'—',d.phone||'—',d.email||'—','Oblast působnosti: '+(d.place||'—'),'','Poznámka:',d.note||'—'].join('\n');
    if(d.mode==='help')return['PLOTAO.CZ – žádost o radu','','Kontakt:',d.name||'—',d.phone||'—',d.email||'—','Místo: '+(d.place||'—'),'','Dotaz:',d.note||'—'].join('\n');
    const place=d.place||d.placeFromCalculator||'—',lines=['PLOTAO.CZ – podklady poptávky','','Kontakt:',d.name||'—',d.phone||'—',d.email||'—','Místo: '+place,'',...fenceLines(d),'','Poznámka:',d.note||'—'];
    return lines.join('\n');
  }

  return{SCHEMA_VERSION,MODES,normalizePhone,normalizeEmail,normalizeSegments,normalizeLead,validateLead,toText};
});
