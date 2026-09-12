import fs from 'node:fs';
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)};
ok(workflow.includes('node scripts/prepare-pages.mjs'),'Pages workflow must use prepare-pages.mjs');
ok(workflow.includes('node scripts/verify-pages-artifact.mjs'),'Pages workflow must use verify-pages-artifact.mjs');
ok(workflow.includes('for file in assets/*.js scripts/*.mjs; do node --check "$file"; done'),'Pages workflow must syntax-check assets and build scripts');
ok(!workflow.includes("python - <<'PY'")&&!workflow.includes('s=s.replace('),'inline Python/string patching must not return to Pages workflow');
ok(!workflow.includes('price:1680')&&!workflow.includes('double:22500'),'legacy pricing constants must not live in workflow');
if(fail.length){console.error('Build pipeline checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Build pipeline checks OK');
