import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = (process.env.PLOTAO_E2E_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(base + '/admin.html', { waitUntil: 'networkidle', timeout: 45000 });
  await page.locator('#products').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#admEmail').count(), 1, 'Admin login shell did not load');
  await page.locator('#admEmail').evaluate(el => { el.closest('body > div').style.display = 'none'; });
  assert.equal(await page.locator('[data-view="products"]').count(), 1, 'Products menu entry is missing');
  assert.equal(await page.locator('[data-view="suppliers"]').count(), 1, 'Suppliers menu entry is missing');

  await page.locator('[data-view="suppliers"]').click();
  assert.equal(await page.locator('#suppliers').evaluate(el => el.classList.contains('on')), true);
  await page.locator('[data-new-supplier]').click();
  assert.equal(await page.locator('#supplierFormPanel').isVisible(), true);

  await page.locator('[data-view="products"]').click();
  assert.equal(await page.locator('#products').evaluate(el => el.classList.contains('on')), true);
  await page.locator('[data-new-product]').click();
  assert.equal(await page.locator('#productFormPanel').isVisible(), true);
  const desktop = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    productFields: document.querySelectorAll('#productForm .catalog-fields label').length
  }));
  assert.ok(desktop.document <= desktop.viewport + 1, 'Desktop admin overflows horizontally');

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    formFieldBounds: [...document.querySelectorAll('#productForm .catalog-fields input, #productForm .catalog-fields select, #productForm .catalog-fields textarea')]
      .map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; })
  }));
  assert.ok(mobile.document <= mobile.viewport + 1, 'Mobile admin overflows horizontally');
  assert.ok(mobile.formFieldBounds.every(([left, right]) => left >= -1 && right <= mobile.viewport + 1), 'A product form control exceeds the mobile viewport');
  assert.deepEqual(errors, [], 'Admin JavaScript raised an uncaught error');
  console.log(JSON.stringify({ result: 'passed', desktop, mobile, uncaughtErrors: errors.length }));
} finally {
  await browser.close();
}