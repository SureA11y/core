'use strict';

/**
 * The browser bundle's console helpers in Chromium, loaded with a <script>
 * tag from an https origin as a person would load them from a CDN:
 * highlight() boxes the reported elements in a layer of its own, leaving the
 * page's markup as it was; a scan after highlight() gives the same results;
 * openReport() loads surea11y.report.js from beside the bundle and opens the
 * report in a new tab.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');

const ROOT = path.join(__dirname, '../..');
const ORIGIN = 'https://console.test/';
const PAGE = `<!doctype html><html lang="en"><head><title>Console</title></head><body>
<main><h1>Shop</h1>
<p style="margin-top:400px"><img id="logo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="20"></p>
<button id="empty" style="width:60px;height:30px"></button>
<a id="go" href="#x">Go</a>
</main>
<script src="/dist/surea11y.browser.js"></script>
</body></html>`;

test('console helpers in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  await context.route(`${ORIGIN}**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
    const file = path.join(ROOT, path.basename(pathname));
    if (pathname.startsWith('/dist/') && fs.existsSync(file)) {
      return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(file) });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage();
  await page.goto(ORIGIN);
  await page.evaluate(() => window.scrollTo(0, 200));

  await t.test(
    'highlight() boxes each reported element, over it, without changing the page',
    async () => {
      const before = await page.evaluate(() => document.body.outerHTML);
      const got = await page.evaluate(async () => {
        const result = await window.a11ycore.run({
          runOnly: ['img-alt-present', 'button-name-present', 'link-name-quality']
        });
        const count = window.a11ycore.highlight(result);
        const host = document.querySelector('[data-surea11y-highlights]');
        const boxes = Array.from(host.shadowRoot.querySelectorAll('.box')).map((b) => {
          const r = b.getBoundingClientRect();
          return {
            tags: b.textContent,
            ask: b.classList.contains('ask'),
            rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]
          };
        });
        const rect = (id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
        };
        return {
          count,
          boxes,
          expected: { logo: rect('logo'), empty: rect('empty'), go: rect('go') },
          hidden: host.getAttribute('aria-hidden'),
          inert: host.inert,
          parent: host.parentElement === document.documentElement
        };
      });
      assert.equal(got.count, 3);
      const byTag = Object.fromEntries(got.boxes.map((b) => [b.tags, b]));
      assert.deepEqual(byTag['img-alt-present'].rect, got.expected.logo);
      assert.equal(byTag['img-alt-present'].ask, false);
      assert.deepEqual(byTag['button-name-present'].rect, got.expected.empty);
      assert.deepEqual(byTag['link-name-quality'].rect, got.expected.go);
      assert.equal(byTag['link-name-quality'].ask, true, 'a question is drawn as one');
      assert.equal(got.hidden, 'true');
      assert.equal(got.inert, true);
      assert.equal(got.parent, true);
      assert.equal(await page.evaluate(() => document.body.outerHTML), before);
    }
  );

  await t.test('a scan with the highlights on the page gives the same results', async () => {
    const outcomes = await page.evaluate(async () => {
      const pick = (r) => r.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length]);
      const plainScan = () => window.a11ycore.runa11yCoreInPage(null, null, {}, null);
      const withLayer = pick(plainScan());
      window.a11ycore.clearHighlights();
      const without = pick(plainScan());
      return { withLayer, without };
    });
    assert.deepEqual(outcomes.withLayer, outcomes.without);
  });

  await t.test('openReport() opens the report in a new tab', async () => {
    const [popup, url] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(async () => {
        const result = await window.a11ycore.run();
        return window.a11ycore.openReport(result, { report: { title: 'Shop' } });
      })
    ]);
    await popup.waitForLoadState();
    assert.match(url, /^blob:/);
    assert.match(await popup.title(), /^Shop — /);
    assert.ok(await popup.locator('text=img-alt-present').count());
    assert.equal(await page.evaluate(() => typeof window.a11ycoreReport), 'object');
  });
});
