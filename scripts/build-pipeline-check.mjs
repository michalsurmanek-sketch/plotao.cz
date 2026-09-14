import fs from 'node:fs';
import './public-link-integrity-check.mjs';
import {activeScripts} from './pages-manifest.mjs';

const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const smoke=fs.readFileSync('.github/workflows/live-smoke.yml','utf8');
const browser=fs.readFileSync('scripts/browser-e2e.mjs','utf8');
const privacyPath='scripts/enrich-privacy-ui.mjs';
const privacy=fs.readFileSync(privacyPath,'utf8');
const privacyPage=fs.readFileSync('ochrana-osobnich-udaju.html','utf8');
const socialPath='scripts/enrich-social-meta.mjs';
const social=fs.readFileSync(socialPath,'utf8');
const socialArtifactPath='scripts/social-artifact-check.mjs';
const socialArtifact=fs.readFileSync(socialArtifactPath,'utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const socialPages=[
  ['index.html','/','panelovy-3d.webp'],
  ['typy-plotu.html','/typy-plotu.html','panelovy-3d.webp'],
  ['panelovy-plot.html','/panelovy-plot.html','panelovy-3d.webp'],
  ['pletivovy-plot.html','/pletivovy-plot.html','pletivovy.webp'],
  ['betonovy-plot.html','/betonovy-plot.html','betonovy.webp'],
  ['hlinikovy-plot.html','/hlinikovy-plot.html','hlinikovy.webp'],
  ['plot-na-soukromi.html','/plot-na-soukromi.html','soukromi-lamely.webp'],
  ['gabionovy-plot.html','/gabionovy-plot.html','gabionovy.webp'],
  ['kovovy-plot.html','/kovovy-plot.html','category-metal.webp'],
  ['zdeny-plot.html','/zdeny-plot.html','category-masonry.webp'],
  ['mobilni-oploceni.html','/mobilni-oploceni.html','category-mobile.webp'],
  ['specialni-oploceni.html','/specialni-oploceni.html','category-other.webp']
];
const fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)};
ok(fs.existsSync('scripts/public-link-integrity-check.mjs'),'public link integrity checker must exist and run from the build gate');
ok(workflow.includes('uses: actions/checkout@v7'),'Pages workflow must use the Node 24 checkout major');
ok(workflow.includes('uses: actions/configure-pages@v6'),'Pages workflow must use the Node 24 configure-pages major');
ok(workflow.includes('node scripts/prepare-pages.mjs'),'Pages workflow must use prepare-pages.mjs');
ok(fs.existsSync(privacyPath),'privacy UI enrichment script must exist');
ok(fs.existsSync('ochrana-osobnich-udaju.html'),'public privacy information page must exist');
ok(workflow.includes('- name: Enrich production privacy UI')&&workflow.includes(`node ${privacyPath}`),'Pages workflow must enrich the prepared artifact with privacy UI');
ok(privacy.includes('/ochrana-osobnich-udaju.html')&&privacy.includes('data-plotao-privacy-notice="1"')&&privacy.includes('data-plotao-privacy-link="1"'),'privacy enrichment must publish both lead-form notice and footer link');
ok(privacy.includes('public page has no supported footer for privacy link')&&privacy.includes('public pages missing privacy footer link'),'privacy enrichment must hard-fail when any public HTML page cannot expose the footer privacy link');
ok(privacy.includes('linkedPages.length!==expectedLinked.length')&&privacy.includes('privacy footer link on ${linkedPages.length}/${expectedLinked.length} public pages'),'privacy enrichment must verify complete public-page footer coverage after injection');
ok(privacyPage.includes('AO Holding s.r.o.')&&privacyPage.includes('Ochrana osobních údajů')&&privacyPage.includes('Vyřízení poptávky a příprava nabídky')&&privacyPage.includes('Vaše práva'),'privacy page must identify the controller and explain purpose and data-subject rights');
ok(privacyPage.includes('href="mailto:info@slevao.cz"')&&privacyPage.includes('>info@slevao.cz</a>'),'privacy page must expose the verified AO Holding contact email as a clickable mailto link');
ok(privacyPage.includes('<!--email_off-->')&&privacyPage.includes('<!--/email_off-->'),'privacy controller mailto must be protected from Cloudflare email-obfuscation rewriting');
ok(privacyPage.includes('Poptávkový formulář PLOTAO.cz není určen pro žádosti týkající se ochrany osobních údajů.'),'privacy page must not route data-subject requests through the disabled lead transport');
ok(!privacyPage.includes('můžete použít poptávkový formulář na PLOTAO.cz')&&!privacyPage.includes('Po doplnění samostatného kontaktního e-mailu'),'privacy page must not advertise an inactive privacy-request channel or placeholder contact');
ok(!privacyPage.includes('souhlasím se zpracováním'),'necessary lead processing must not be misrepresented as a mandatory consent checkbox');
ok(workflow.includes('- name: Enrich production social metadata')&&workflow.includes(`node ${socialPath}`),'Pages workflow must enrich social metadata on the prepared artifact');
ok(fs.existsSync(socialArtifactPath),'discovery social artifact checker must exist');
ok(workflow.includes('- name: Verify discovery social artifact')&&workflow.includes(`node ${socialArtifactPath}`),'Pages workflow must verify every discovery social card after enrichment');
ok(workflow.includes('node scripts/verify-pages-artifact.mjs'),'Pages workflow must use verify-pages-artifact.mjs');
const preparePos=workflow.indexOf('node scripts/prepare-pages.mjs'),privacyPos=workflow.indexOf(`node ${privacyPath}`),socialPos=workflow.indexOf(`node ${socialPath}`),socialArtifactPos=workflow.indexOf(`node ${socialArtifactPath}`),verifyPos=workflow.indexOf('node scripts/verify-pages-artifact.mjs'),browserPos=workflow.indexOf('- name: Run browser E2E on production artifact');
ok(preparePos>=0&&preparePos<privacyPos&&privacyPos<socialPos&&socialPos<socialArtifactPos&&socialArtifactPos<verifyPos&&verifyPos<browserPos,'privacy/social enrichment and discovery social verification must run after dist preparation and before generic artifact/browser verification');
ok(fs.existsSync(socialPath),'social metadata enrichment script must exist');
ok(social.includes('summary_large_image')&&social.includes('og:image:width')&&social.includes('og:image:height')&&social.includes('og:image:secure_url'),'social metadata enrichment must publish complete large-card image metadata');
ok(social.includes('if(width<300||height<180)'),'social metadata enrichment must reject undersized discovery-page card images');
ok(socialArtifact.includes('exactly one')&&socialArtifact.includes('og:title')&&socialArtifact.includes('twitter:description'),'social artifact checker must reject duplicate image tags and incomplete title/description metadata');
for(const [page,path,image] of socialPages){
  ok(social.includes(`'${page}':{image:'${image}'`),`social metadata enrichment must map ${page} to ${image}`);
  ok(socialArtifact.includes(`'${page}':{image:'${image}'`),`social artifact checker must protect ${page} with ${image}`);
  ok(smoke.includes(`"${path}|${image}"`),`standalone live smoke must verify ${path} with ${image}`);
}
ok(smoke.includes('social_pages=(')&&smoke.includes('verify_social_pages()'),'standalone live smoke must iterate all discovery-page social previews');
ok(smoke.includes('Social preview metadata mismatch')&&smoke.includes('Social preview image is not publicly reachable'),'standalone live smoke must fail on wrong metadata or unreachable social images');
ok(smoke.includes('Public footer privacy link missing')&&smoke.includes('privacy footer'),'standalone live smoke must verify the privacy footer on every discovery page');
ok(smoke.includes('summary_large_image')&&smoke.includes('og:image:secure_url'),'standalone live smoke must require large Twitter cards and secure Open Graph image URLs');
ok(smoke.includes('contains() {')&&smoke.includes('[[ "$1" == *"$2"* ]]'),'standalone live smoke must use pipefail-safe in-memory HTML matching');
ok(!smoke.includes("printf '%s' \"$privacy\" | grep -Fq"),'standalone live smoke must not regress to grep -q pipelines for privacy HTML under pipefail');
ok(workflow.includes('for file in assets/*.js scripts/*.mjs; do node --check "$file"; done'),'Pages workflow must syntax-check assets and build scripts');
ok(workflow.includes('- name: Run browser E2E on production artifact'),'Pages workflow must browser-test the prepared production artifact before deployment');
ok(workflow.includes('npm install --no-audit --no-fund --package-lock=false'),'browser E2E must install only the pinned repository tooling without mutating the lock state');
ok(workflow.includes('npx playwright install --with-deps --only-shell chromium'),'browser E2E must install only the Chromium headless shell required by the headless smoke test');
ok(!workflow.includes('npx playwright install --with-deps chromium'),'browser E2E must not regress to downloading full Chromium when only headless shell is used');
ok(workflow.includes('python3 -m http.server 4173 --directory dist'),'browser E2E must run against the exact prepared dist directory');
ok(workflow.includes('PLOTAO_E2E_URL=http://127.0.0.1:4173 npm run browser:e2e'),'browser E2E must execute the repository smoke script against local dist');
ok(fs.existsSync('scripts/browser-e2e.mjs'),'browser E2E smoke script must exist');
ok(pkg?.private===true&&pkg?.scripts?.['browser:e2e']==='node scripts/browser-e2e.mjs','package.json must keep browser E2E tooling private and expose the expected smoke command');
ok(pkg?.devDependencies?.playwright==='1.63.0','Playwright must stay pinned to the reviewed 1.63.0 version instead of floating latest');
for(const type of ['panel','mesh','concrete','privacy','aluminium','gabion','metal','masonry','mobile','other'])ok(browser.includes(`selectType(page,'${type}'`),`browser E2E must exercise fence type ${type}`);
ok(browser.includes("runScenario('desktop',{width:1440,height:1000}")&&browser.includes("runScenario('mobile-390',{width:390,height:844}"),'browser E2E must protect both desktop and 390px mobile flows');
ok(browser.includes('data-plotao-privacy-notice=')&&browser.includes('/ochrana-osobnich-udaju.html')&&browser.includes('AO Holding s.r.o.')&&browser.includes('mailto:info@slevao.cz')&&browser.includes('Poptávkový formulář PLOTAO.cz není určen'),'browser E2E must verify the privacy notice, controller, verified email and disabled-form boundary');
ok(workflow.includes('uses: actions/upload-pages-artifact@v5')&&workflow.includes('path: dist'),'Pages workflow must upload only the strict public dist directory with the Node 24 Pages artifact action');
ok(workflow.includes('uses: actions/deploy-pages@v5'),'Pages workflow must deploy with the Node 24 deploy-pages major');
ok(workflow.includes('name: github-pages-${{ github.run_attempt }}'),'Pages artifact name must include run_attempt so a retry cannot create ambiguous duplicate github-pages artifacts');
ok(workflow.includes('artifact_name: github-pages-${{ github.run_attempt }}'),'deploy-pages must select the same retry-safe run_attempt artifact name');
ok(!/upload-pages-artifact@v\d+[\s\S]{0,200}path:\s*\./.test(workflow),'Pages workflow must never upload the repository root');
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
ok(smoke.includes('privacy_url="https://plotao.cz/ochrana-osobnich-udaju.html?sha=${EXPECTED_SHA}"'),'standalone live smoke must fetch the public privacy page with cache busting');
ok(smoke.includes('expected_privacy_href=')&&smoke.includes('expected_privacy_link=')&&smoke.includes('expected_privacy_notice='),'standalone live smoke must verify privacy href, footer marker and lead-form notice on the live homepage');
ok(smoke.includes('expected_controller_email=')&&smoke.includes('mailto:info@slevao.cz')&&smoke.includes('expected_form_boundary='),'standalone live smoke must require the verified controller email and disabled-form privacy boundary');
ok(smoke.includes('<h1>Ochrana osobních údajů</h1>')&&smoke.includes('AO Holding s.r.o.'),'standalone live smoke must verify privacy page identity and controller');
ok(smoke.includes('privacy_ok=0')&&smoke.includes('[ "$privacy_ok" = 1 ]'),'standalone live smoke must make privacy information a hard success condition');
const unique=new Set(activeScripts);
ok(unique.size===activeScripts.length,'Pages manifest must not contain duplicate script entries');
for(const src of activeScripts){
  ok(src.startsWith('/assets/'),`Pages manifest script must stay under /assets/: ${src}`);
  const file=src.replace(/^\//,'');
  ok(fs.existsSync(file),`Pages manifest references missing asset: ${file}`);
}
if(fail.length){console.error('Build pipeline checks failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log(`Build pipeline checks OK: ${activeScripts.length} unique active assets exist; Node 24 Pages actions, headless-only browser install, verified privacy controller contact, public links, browser/privacy information, all public-page privacy footers, strict dist, ${socialPages.length} enriched + artifact-verified + live-verified discovery social cards, all 10 browser-tested fence types, retry-safe Pages artifacts and both live verification paths protect deployment`);
