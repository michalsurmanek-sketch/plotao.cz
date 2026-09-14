import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const enrich=fs.readFileSync('scripts/enrich-accessibility-shell.mjs','utf8');
const browser=fs.readFileSync('scripts/browser-e2e.mjs','utf8');
const fail=[];
const ok=(value,message)=>{if(!value)fail.push(message)};

ok(workflow.includes('- name: Enrich production accessibility shell')&&workflow.includes('node scripts/enrich-accessibility-shell.mjs'),'Pages workflow must run accessibility-shell enrichment');
const prepare=workflow.indexOf('node scripts/prepare-pages.mjs');
const access=workflow.indexOf('node scripts/enrich-accessibility-shell.mjs');
const structured=workflow.indexOf('node scripts/enrich-structured-data.mjs');
ok(prepare>=0&&prepare<access&&access<structured,'accessibility-shell enrichment must run after dist preparation and before later artifact enrichments');
ok(enrich.includes('data-plotao-skip-link="1"')&&enrich.includes('href="#kalkulator"'),'accessibility enrichment must publish the reviewed skip link target');
ok(enrich.includes('tabindex="-1"')&&enrich.includes('id=["\']kalkulator'),'calculator main must stay programmatically focusable as the skip destination');
ok(enrich.includes('data-plotao-skip-style="1"')&&enrich.includes('.plotao-skip-link:focus-visible'),'skip link must have focus-only visible styling');
ok(enrich.includes('prefers-reduced-motion:reduce'),'skip-link transition must respect reduced-motion preferences');
ok(browser.includes('[data-plotao-skip-link="1"]'),'Chromium E2E must locate the production skip link');
ok(browser.includes("location.hash==='#kalkulator'")&&browser.includes("document.activeElement?.id==='kalkulator'"),'Chromium E2E must verify skip activation moves focus to #kalkulator');
ok(browser.includes('focused skip link must become visible near the top of the viewport'),'Chromium E2E must verify the focused skip link is visually exposed');

if(fail.length){
  console.error('Accessibility shell checks failed:\n- '+fail.join('\n- '));
  process.exit(1);
}
console.log('Accessibility shell checks OK: build ordering, focus-visible skip link, focusable main target and browser focus transfer are protected');
