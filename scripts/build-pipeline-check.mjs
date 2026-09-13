import fs from 'node:fs';
import {activeScripts} from './pages-manifest.mjs';

const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const smoke=fs.readFileSync('.github/workflows/live-smoke.yml','utf8');
const fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)};
ok(workflow.includes('node scripts/prepare-pages.mjs'),'Pages workflow must use prepare-pages.mjs');
ok(workflow.includes('node scripts/verify-pages-artifact.mjs'),'Pages workflow must use verify-pages-artifact.mjs');
ok(workflow.includes('for file in assets/*.js scripts/*.mjs; do node --check "$file"; done'),'Pages workflow must syntax-check assets and build scripts');
ok(workflow.includes('uses: actions/upload-pages-artifact@v3')&&workflow.includes('path: dist'),'Pages workflow must upload only the strict public dist directory');
ok(!/upload-pages-artifact@v3[\s\S]{0,200}path:\s*\./.test(workflow),'Pages workflow must never upload the repository root');
for(const path of ['/scripts/seo-regression-check.mjs','/supabase/functions/submit-lead/index.ts','/docs/lead-backend-contract.md']){
  ok(workflow.includes(path),`Pages workflow must probe private path ${path}`);
  ok(smoke.includes(path),`standalone live smoke must probe private path ${path}`);
}
ok(workflow.includes('Internal source path correctly returns 404'),'Pages workflow must require internal source paths to stay unpublished on the live domain');
ok(smoke.includes('Internal source path correctly returns 404'),'standalone live smoke must require internal source paths to stay unpublished on the live domain');
ok(!workflow.includes("python - <<'PY'")&&!workflow.includes('s=s.replace('),'inline Python/string patching must not return to Pages workflow');
ok(!workflow.includes('price:1680')&&!workflow.includes('double:22500'),'legacy pricing constants must not live in workflow');
ok(workflow.includes('- name: Verify live custom domain'),'main Pages workflow must verify the custom domain after Deploy');
ok(workflow.includes('deploy-marker.txt?sha=${EXPECTED_SHA}'),'main Pages workflow must verify deploy-marker.txt with expected SHA');
ok(workflow.includes('https://plotao.cz/?sha=${EXPECTED_SHA}'),'main Pages workflow must verify main HTML with cache busting');
ok(workflow.includes('name=\\"plotao-deploy\\" content=\\"${EXPECTED_SHA}\\"'),'main Pages workflow must require the exact deploy SHA meta tag');
ok(smoke.includes('deploy-marker.txt?sha=${EXPECTED_SHA}'),'standalone live smoke must verify deploy-marker.txt');
ok(smoke.includes('https://plotao.cz/?sha=${EXPECTED_SHA}'),'standalone live smoke must verify main HTML with cache busting');
ok(smoke.includes('name=\\"plotao-deploy\\" content=\\"${EXPECTED_SHA}\\"'),'standalone live smoke must require the exact deploy SHA meta tag in HTML');
const unique=new Set(activeScripts);
ok(unique.size===activeScripts.length,'Pages manifest must not contain duplicate script entries');
for(const src of activeScripts){
  ok(src.startsWith('/assets/'),`Pages manifest script must stay under /assets/: ${src}`);
  const file=src.replace(/^\//,'');
  ok(fs.existsSync(file),`Pages manifest references missing asset: ${file}`);
}
if(fail.length){console.error('Build pipeline checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log(`Build pipeline checks OK: ${activeScripts.length} unique active assets exist; strict dist and both live verification paths protect deploy identity and repository internals`);
