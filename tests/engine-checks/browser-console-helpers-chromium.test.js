'use strict';

/**
 * The browser bundle's console helpers in Chromium, loaded with a <script>
 * tag from an https origin as a person would load them from a CDN:
 * highlight() boxes the reported elements in a layer of its own, leaving the
 * page's markup as it was; a scan after highlight() gives the same results;
 * openReport() loads surea11y.report.js from beside the bundle and opens the
 * report in a new tab; inspect() draws the headings, landmarks, names and
 * focus order the engine works out, in the same layer.
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

// For inspect(): a heading level from aria-level, an unnamed button, a
// positive tabindex that Tab reaches first, a hidden link left out, a link
// hidden only with aria-hidden that Tab still reaches, and a <header> that
// is a banner only outside <main>.
const INSPECT_PAGE = `<!doctype html><html lang="en"><head><title>Inspect</title></head><body>
<header><a id="home" href="/">Home</a></header>
<nav aria-label="Main"><a id="about" href="/about">About</a></nav>
<main><h1>Shop</h1>
<div role="heading" aria-level="3" id="deals">Deals</div>
<h2 id="cart">Cart</h2>
<button id="unnamed" style="width:40px;height:20px"></button>
<input id="q" aria-label="Search" tabindex="2">
<a id="hidden" href="/x" hidden>Hidden</a>
<div aria-hidden="true"><a id="ah" href="/y">Skip</a></div>
<section><header>Not a banner</header></section>
</main>
<footer>Footer</footer>
<script src="/dist/surea11y.browser.js"></script>
</body></html>`;

test('console helpers in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  await context.route(`${ORIGIN}**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
    if (pathname === '/inspect') {
      return route.fulfill({ contentType: 'text/html', body: INSPECT_PAGE });
    }
    if (pathname === '/csp') {
      return route.fulfill({
        contentType: 'text/html',
        headers: { 'content-security-policy': "script-src 'self'; style-src 'self'" },
        body: PAGE
      });
    }
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

  await t.test(
    'inspect() lists and draws headings, landmarks, names and focus order, as the engine works them out',
    async () => {
      const other = await context.newPage();
      await other.goto(`${ORIGIN}inspect`);
      const before = await other.evaluate(() => document.body.outerHTML);
      const got = await other.evaluate(async () => {
        const api = window.a11ycore;
        const labels = () =>
          Array.from(
            document.querySelector('[data-surea11y-highlights]').shadowRoot.querySelectorAll('.box')
          ).map((b) => [b.textContent, b.classList.contains('ask')]);
        const headings = await api.inspect('headings');
        const headingMarks = labels();
        const landmarks = await api.inspect('landmarks');
        const names = await api.inspect('names');
        const nameMarks = labels();
        const order = await api.inspect('focus-order');
        const orderMarks = labels();
        const listed = await api.inspect('headings', { draw: false });
        const drawn = !!document.querySelector('[data-surea11y-highlights]');
        let error = '';
        try {
          await api.inspect('colours');
        } catch (e) {
          error = e.name + ': ' + e.message;
        }
        return {
          headings,
          headingMarks,
          landmarks,
          names,
          nameMarks,
          order,
          orderMarks,
          listed,
          drawn,
          error
        };
      });
      assert.deepEqual(
        got.headings.map((h) => [h.level, h.name]),
        [
          [1, 'Shop'],
          [3, 'Deals'],
          [2, 'Cart']
        ]
      );
      assert.deepEqual(got.headingMarks, [
        ['H1 Shop', false],
        ['H3 Deals', false],
        ['H2 Cart', false]
      ]);
      assert.deepEqual(
        got.landmarks.map((l) => [l.role, l.name]),
        [
          ['banner', ''],
          ['navigation', 'Main'],
          ['main', ''],
          ['contentinfo', '']
        ]
      );
      assert.deepEqual(
        got.names.map((n) => [n.role, n.name]),
        [
          ['link', 'Home'],
          ['link', 'About'],
          ['button', ''],
          ['textbox', 'Search']
        ]
      );
      assert.deepEqual(
        got.nameMarks.find(([label]) => label === 'button: (no name)'),
        ['button: (no name)', true],
        'a control with no name is marked amber'
      );
      assert.deepEqual(
        got.order.map((o) => [o.order, o.element, o.tabindex]),
        [
          [1, '#q', 2],
          [2, '#home', undefined],
          [3, '#about', undefined],
          [4, '#unnamed', undefined],
          [5, '#ah', undefined]
        ]
      );
      assert.equal(got.order[4].ariaHidden, true);
      assert.deepEqual(got.orderMarks, [
        ['1', false],
        ['2', false],
        ['3', false],
        ['4', false],
        ['5 (aria-hidden)', true]
      ]);
      assert.equal(got.listed.length, 3);
      assert.equal(got.drawn, false, 'draw: false lists without drawing');
      assert.match(
        got.error,
        /^TypeError: inspect: kind must be one of headings, landmarks, names, focus-order/
      );
      await other.evaluate(() => window.a11ycore.clearHighlights());
      assert.equal(await other.evaluate(() => document.body.outerHTML), before);
      await other.close();
    }
  );

  await t.test(
    'highlight() draws under a CSP without inline styles, and over a transformed <html>',
    async () => {
      const other = await context.newPage();
      await other.goto(`${ORIGIN}csp`);
      const got = await other.evaluate(async () => {
        const html = document.documentElement.style;
        html.transform = 'translate(30px, 10px) scale(0.8)';
        html.transformOrigin = '0 0';
        html.zoom = '1.25';
        html.margin = '15px';
        html.border = '5px solid';
        window.scrollTo(0, 100);
        const result = await window.a11ycore.run({ runOnly: ['img-alt-present'] });
        window.a11ycore.highlight(result);
        const box = document
          .querySelector('[data-surea11y-highlights]')
          .shadowRoot.querySelector('.box');
        const a = box.getBoundingClientRect();
        const e = document.getElementById('logo').getBoundingClientRect();
        return {
          border: getComputedStyle(box).borderTopStyle,
          off: [a.left - e.left, a.top - e.top, a.width - e.width, a.height - e.height].map(
            (v) => Math.round(v) || 0
          )
        };
      });
      assert.equal(got.border, 'solid', 'the layer is styled');
      assert.deepEqual(got.off, [0, 0, 0, 0]);
      await other.close();
    }
  );

  await t.test('highlight() finds an element inside an open shadow root', async () => {
    const other = await context.newPage();
    await other.goto(`${ORIGIN}inspect`);
    const got = await other.evaluate(async () => {
      const host = document.createElement('div');
      document.querySelector('main').append(host);
      host.attachShadow({ mode: 'open' }).innerHTML =
        '<button style="width:50px;height:20px" aria-label="  "></button>';
      const result = await window.a11ycore.run({ runOnly: ['button-name-present'] });
      const inner = result.checksResults[0].occurrences.find((o) => o.shadowHostSelectors);
      return {
        marked: window.a11ycore.highlight(result),
        hosts: inner && inner.shadowHostSelectors
      };
    });
    assert.ok(got.hosts && got.hosts.length === 1);
    assert.equal(got.marked, 2, 'the unnamed button in the page and the one in the shadow root');
    await other.close();
  });
});
