(()=>{'use strict';
const endpoint='https://jmukoccjqykyoqsypuwb.supabase.co/functions/v1/partner-job-response';
const key='sb_publishable_FSrTbgu1LeF9DNeam3ztwA_3dNHGq-V';
const params=new URLSearchParams(location.search),id=params.get('id')||'',token=params.get('token')||'';
const job=document.querySelector('#job'),jobNumber=document.querySelector('#jobNumber'),partnerName=document.querySelector('#partnerName'),choice=document.querySelector('#choice'),box=document.querySelector('#confirmBox'),confirmText=document.querySelector('#confirmText'),note=document.querySelector('#note'),status=document.querySelector('#status'),confirm=document.querySelector('#confirm');
let selected='';
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error)}
async function call(method,url,body){const response=await fetch(url,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});let data={};try{data=await response.json()}catch{}if(!response.ok)throw new Error(data.error||'Odkaz už není platný.');return data}
function choose(value){selected=value;confirmText.textContent=value==='accepted'?'Potvrzujete, že zakázku přijímáte?':'Potvrzujete, že zakázku odmítáte?';box.hidden=false;choice.hidden=true;note.focus()}
document.addEventListener('click',e=>{const button=e.target.closest('[data-choose]');if(button)choose(button.dataset.choose)});
document.querySelector('#cancel').addEventListener('click',()=>{selected='';box.hidden=true;choice.hidden=false});
confirm.addEventListener('click',async()=>{if(!selected)return;confirm.disabled=true;message('Ukládáme vaši odpověď…');try{const result=await call('POST',endpoint,{id,token,status:selected,note:note.value.trim()});box.hidden=true;choice.hidden=true;message(result.status==='accepted'?'Zakázku jste přijali. Odpověď byla uložena.':'Zakázku jste odmítli. Odpověď byla uložena.')}catch(err){message(err.message==='response_link_unavailable'?'Odkaz už byl použit nebo jeho platnost skončila.':err.message,true)}finally{confirm.disabled=false}});
(async()=>{try{if(!id||!token)throw new Error('Odkaz není úplný nebo platný.');const data=await call('GET',endpoint+'?id='+encodeURIComponent(id)+'&token='+encodeURIComponent(token));jobNumber.textContent='Zakázka '+data.job_number;partnerName.textContent=data.partner_name;job.hidden=false;choice.hidden=false;message('Odkaz je platný. Vyberte svou odpověď.')}catch(err){message(err.message==='response_link_unavailable'?'Odkaz už byl použit nebo jeho platnost skončila.':err.message,true)}})();
})();
