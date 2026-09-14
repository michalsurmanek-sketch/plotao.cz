export const activeScripts=[
  '/assets/ui-bootstrap-v1.js','/assets/segment-limit-ui-v1.js','/assets/segment-connections-v1.js','/assets/calculator-v3.js','/assets/segment-plan-topview-v1.js','/assets/geometry-core-v1.js','/assets/geometry-v3.js','/assets/geometry-validity-v1.js','/assets/gabion-options.js','/assets/aluminium-config.js','/assets/privacy-config.js','/assets/metal-config.js','/assets/concrete-config.js','/assets/extra-fence-config.js','/assets/options-router-v1.js','/assets/panel-slab-safety-v1.js','/assets/structural-pricing-core-v1.js','/assets/structural-pricing-v5.js','/assets/panel-pricing-core-v1.js','/assets/panel-pricing-v5.js','/assets/mesh-pricing-core-v1.js','/assets/mesh-pricing-v2.js','/assets/aluminium-pricing-core-v1.js','/assets/aluminium-pricing.js','/assets/privacy-pricing-core-v1.js','/assets/privacy-pricing.js','/assets/metal-pricing.js','/assets/extra-fence-pricing-core-v1.js','/assets/extra-fence-pricing.js','/assets/slab-pricing-core-v1.js','/assets/slab-pricing-v2.js','/assets/concrete-material-core-v1.js','/assets/concrete-material-v1.js','/assets/gate-pricing-core-v1.js','/assets/gate-pricing-v1.js','/assets/gate-drive-pricing-core-v1.js','/assets/gate-drive-pricing-v1.js','/assets/input-validity-guard-v1.js','/assets/scope-integrity.js','/assets/price-total-core-v1.js','/assets/price-bridge.js','/assets/gate-total-pending-v1.js','/assets/mobile-price-bridge.js','/assets/accuracy-guard.js','/assets/lead-option-details-v1.js','/assets/lead-core-v1.js','/assets/lead-transport-core-v1.js','/assets/lead-transport-config-v1.js','/assets/lead-transport-v1.js','/assets/lead-safety-v1.js','/assets/lead-mode-ui-v1.js','/assets/modal-accessibility-v1.js','/assets/choice-accessibility-v1.js','/assets/step-scroll-v1.js','/assets/gate-ui-v1.js','/assets/ui-truth-v1.js','/assets/mobile-summary-state-v1.js','/assets/mobile-safe-area-v1.js','/assets/footer-logo-v1.js'
];

export const requiredArtifact=[
  'name="plotao-deploy"','/assets/ui-bootstrap-v1.js','data-v="material" class="on"','Ceník aktualizován 12. 9. 2026','<input id="gate" type="checkbox">','<input id="door" type="checkbox">','<title>Kalkulátor ceny plotu a materiálu | PLOTAO.cz</title>','<h1>Spočítejte materiál na celý plot. Hned.</h1>','Spočítejte ověřený materiálový rozpočet plotu podle typu','Ověřený materiál spočítáme hned.','terén, podloží a přístup slouží jako podklady pro individuální realizační nabídku.'
];

export const forbiddenArtifact=[
  '<script>const types=[','function calc(){',
  'price:1680','price:720','price:2650','price:3180','price:4650','price:3950','price:3850','price:4250','price:780','price:2900',
  'double:22500,sliding:31500,cantilever:38500',
  "delivery=state.scope==='material'?0:2900",
  "workRate=state.type==='concrete'?1450:980",
  "drive==='auto'?18500:0",
  "dp=door?9900+Math.max(0,dw-.9)*7000:0",
  'databázové odeslání bude další krok',
  '<input id="gate" type="checkbox" checked>',
  '<input id="door" type="checkbox" checked>',
  '/assets/calculator-v2.js','/assets/geometry-fix.js','/assets/concrete-price-guard.js','/assets/pricing-benchmark.js','/assets/pricing-benchmark-v2.js','/assets/pricing-benchmark-v3.js','/assets/pricing-benchmark-v4.js',
  '<title>Kalkulátor ceny plotu na klíč | Plotao.cz</title>',
  '<h1>Zjistěte cenu celého plotu. Hned.</h1>',
  'Jednotlivé úseky, brány, materiál, doprava i montáž v jednom výpočtu.'
];
