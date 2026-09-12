const MODES=new Set(['lead','help','partner']);
const SCOPES=new Set(['material','delivery','turnkey']);
const PRICE_KINDS=new Set(['ověřená cena','individuální nabídka','částečný rozpočet']);
const CONNECTIONS=new Set(['začátek','samostatný úsek','navazuje rohem']);

const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max)=>typeof v==='string'?v.trim().replace(/\s+/g,' ').slice(0,max):'';
const rawText=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const bool=v=>v===true;
const num=(v,min,max,def=0)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):def;
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(v)&&v.length<=254;
function phone(v){const s=String(v??'').trim();const plus=s.startsWith('+')?'+':'';const digits=s.replace(/\D/g,'');return digits.length>=9&&digits.length<=15?plus+digits:''}
function cleanSegments(v){if(!Array.isArray(v)||v.length<1||v.length>100)return null;const out=[];for(let i=0;i<v.length;i++){const x=v[i];if(!isObj(x))return null;const length=num(x.length,.01,1000,-1);if(length<=0)return null;out.push({name:text(x.name||`Úsek ${i+1}`,100),length,connection:CONNECTIONS.has(x.connection)?x.connection:(i===0?'začátek':'navazuje rohem')})}return out}
function cleanOptions(v){if(!Array.isArray(v))return[];return v.slice(0,50).map(x=>text(x,200)).filter(Boolean)}
export function validateEnvelope(input){
  const errors=[];
  if(!isObj(input))return{ok:false,errors:['body']};
  if(input.transportVersion!==1)errors.push('transportVersion');
  if(input.source!=='plotao.cz')errors.push('source');
  const submittedAt=typeof input.submittedAt==='string'&&Number.isFinite(Date.parse(input.submittedAt))?new Date(input.submittedAt).toISOString():'';
  if(!submittedAt)errors.push('submittedAt');
  const l=isObj(input.lead)?input.lead:null;
  if(!l)return{ok:false,errors:[...errors,'lead']};
  if(l.schemaVersion!==2)errors.push('schemaVersion');
  if(!MODES.has(l.mode))errors.push('mode');
  const mode=MODES.has(l.mode)?l.mode:'lead';
  const name=text(l.name,120),phoneValue=phone(l.phone),email=rawText(l.email,254).toLowerCase(),place=text(l.place,200),note=rawText(l.note,4000);
  if(name.length<2)errors.push('name');
  if(!phoneValue)errors.push('phone');
  if(!emailOk(email))errors.push('email');
  if(mode==='help'&&note.length<5)errors.push('note');
  if(mode==='partner'&&place.length<2)errors.push('place');
  const lead={schemaVersion:2,mode,name,phone:phoneValue,email,place,note};
  if(mode==='lead'){
    const fenceType=text(l.fenceType,120),height=num(l.height,40,400,-1),segments=cleanSegments(l.segments),scopeValue=SCOPES.has(l.scopeValue)?l.scopeValue:'material',priceKind=PRICE_KINDS.has(l.priceKind)?l.priceKind:'';
    if(!fenceType)errors.push('fenceType');
    if(height<40)errors.push('height');
    if(!segments)errors.push('segments');
    if(!priceKind)errors.push('priceKind');
    if((scopeValue==='delivery'||scopeValue==='turnkey')&&place.length<2)errors.push('place');
    Object.assign(lead,{savedAt:typeof l.savedAt==='string'&&Number.isFinite(Date.parse(l.savedAt))?new Date(l.savedAt).toISOString():'',fenceType,height,segments:segments||[],options:cleanOptions(l.options),gate:bool(l.gate),gateType:text(l.gateType,80),gateWidth:num(l.gateWidth,0,20,0),gateDrive:text(l.gateDrive,80),gateSection:num(l.gateSection,0,100,0),gatePos:num(l.gatePos,0,1000,0),wicket:bool(l.wicket),wicketWidth:num(l.wicketWidth,0,10,0),wicketSection:num(l.wicketSection,0,100,0),wicketPos:num(l.wicketPos,0,1000,0),scopeValue,scope:text(l.scope,80),displayedPrice:text(l.displayedPrice,100),priceKind,priceReason:rawText(l.priceReason,500),placeFromCalculator:text(l.placeFromCalculator,200)});
  }
  return errors.length?{ok:false,errors:[...new Set(errors)]}:{ok:true,submittedAt,lead};
}
