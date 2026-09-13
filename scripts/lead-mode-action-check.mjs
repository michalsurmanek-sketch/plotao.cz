import fs from 'node:fs';
const src=fs.readFileSync('assets/lead-mode-ui-v1.js','utf8'),lead=fs.readFileSync('assets/lead-safety-v1.js','utf8'),fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
ok(src.includes("function transportReady(){try{return window.PLOTAO_LEAD_TRANSPORT?.available?.()===true}"),'mode UI must derive action wording from the real transport availability');
ok(src.includes("return live?'Odeslat kontakt':'Zkontrolovat kontakt a zkopírovat'"),'partner action must distinguish live submission from clipboard fallback');
ok(src.includes("return live?'Odeslat žádost':'Zkontrolovat žádost a zkopírovat'"),'help action must distinguish live submission from clipboard fallback');
ok(src.includes("return live?'Odeslat poptávku':'Zkontrolovat poptávku a zkopírovat'"),'customer lead action must distinguish live submission from clipboard fallback');
ok(src.includes("send.title=transportReady()?'Bezpečně odeslat formulář PLOTAO':'Zkontrolovat a zkopírovat podklady bez serverového odeslání'"),'button tooltip must match transport state');
ok(!src.includes("if(send)send.textContent='Zkontrolovat kontakt a zkopírovat'")&&!src.includes("if(send)send.textContent='Zkontrolovat žádost a zkopírovat'")&&!src.includes("if(send)send.textContent='Zkontrolovat poptávku a zkopírovat'"),'mode UI must not hard-code offline wording after transport activation');
ok(lead.includes("send.textContent=live?'Odeslat':'Zkontrolovat a zkopírovat podklady'"),'lead safety bootstrap must still initialize a transport-aware generic action before mode-specific wording');
if(fail.length){console.error('Lead mode action checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Lead mode action checks OK: mode-specific submit labels stay truthful in online and offline transport states');
