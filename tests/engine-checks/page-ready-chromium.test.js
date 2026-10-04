'use strict';

/**
 * waitForPageReady in a real browser, with images that arrive late, never
 * arrive, or are loaded lazily.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('waitForPageReady in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // Adds an image after the page has loaded, its request answered after
  // `delayMs`, or never when `delayMs` is null, then waits.
  async function waitWithImage(delayMs, options, imgAttrs = '') {
    const p = await browser.newPage();
    try {
      await p.route('https://img.example.test/a.png', (route) => {
        if (delayMs === null) return;
        setTimeout(() => route.fulfill({ contentType: 'image/png', body: PNG }), delayMs);
      });
      await p.setContent('<!doctype html><html lang="en"><body><p>Hi</p></body></html>');
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate(
        ([opts, attrs]) => {
          document.body.insertAdjacentHTML(
            'beforeend',
            `<img src="https://img.example.test/a.png" alt="" ${attrs}>`
          );
          return window.a11ycore.waitForPageReady(opts);
        },
        [options, imgAttrs]
      );
    } finally {
      await p.close();
    }
  }

  await t.test(
    'a driver can send the function into the page, as INTEGRATION.md shows',
    async () => {
      const { waitForPageReady } = require('../../src/index.js');
      const p = await browser.newPage();
      try {
        await p.route('https://img.example.test/a.png', (route) =>
          setTimeout(() => route.fulfill({ contentType: 'image/png', body: PNG }), 150)
        );
        await p.setContent('<!doctype html><html lang="en"><body><p>Hi</p></body></html>');
        await p.evaluate(() =>
          document.body.insertAdjacentHTML(
            'beforeend',
            '<img src="https://img.example.test/a.png" alt="">'
          )
        );
        // No bundle loaded: the function's own source is all the page gets.
        const r = await p.evaluate(waitForPageReady, { timeoutMs: 3000 });
        assert.equal(r.ready, true);
        assert.ok(r.waitedMs >= 100, `waited ${r.waitedMs}ms`);
      } finally {
        await p.close();
      }
    }
  );

  await t.test('it waits for an image that arrives late', async () => {
    const r = await waitWithImage(300, { timeoutMs: 3000 });
    assert.equal(r.ready, true);
    assert.equal(r.pending.images, 0);
    assert.ok(r.waitedMs >= 250, `waited ${r.waitedMs}ms`);
  });

  await t.test('an image that never arrives runs out the time, and is named', async () => {
    const r = await waitWithImage(null, { timeoutMs: 400 });
    assert.equal(r.ready, false);
    assert.equal(r.pending.images, 1);
    assert.ok(r.waitedMs >= 390 && r.waitedMs < 2000, `waited ${r.waitedMs}ms`);
  });

  await t.test('an image that fails to load counts as done', async () => {
    const p = await browser.newPage();
    try {
      await p.route('https://img.example.test/missing.png', (route) =>
        route.fulfill({ status: 404, body: '' })
      );
      await p.setContent('<!doctype html><html lang="en"><body><p>Hi</p></body></html>');
      await p.addScriptTag({ content: BUNDLE });
      const r = await p.evaluate(() => {
        document.body.insertAdjacentHTML(
          'beforeend',
          '<img src="https://img.example.test/missing.png" alt="">'
        );
        return window.a11ycore.waitForPageReady({ timeoutMs: 3000 });
      });
      assert.equal(r.ready, true);
      assert.equal(r.pending.images, 0);
    } finally {
      await p.close();
    }
  });

  await t.test('a scan after waiting records the images as loaded', async () => {
    const p = await browser.newPage();
    try {
      await p.route('https://img.example.test/a.png', (route) =>
        setTimeout(() => route.fulfill({ contentType: 'image/png', body: PNG }), 200)
      );
      await p.setContent('<!doctype html><html lang="en"><body><p>Hi</p></body></html>');
      await p.addScriptTag({ content: BUNDLE });
      const [before, after] = await p.evaluate(async () => {
        document.body.insertAdjacentHTML(
          'beforeend',
          '<img src="https://img.example.test/a.png" alt="">'
        );
        const scan = () =>
          window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { rules: { include: 'html-has-lang' } },
            null
          ).engine.environment.images;
        const first = scan();
        await window.a11ycore.waitForPageReady({ timeoutMs: 3000 });
        return [first, scan()];
      });
      assert.deepEqual([before, after], ['loading', 'loaded']);
    } finally {
      await p.close();
    }
  });

  await t.test('a lazily loaded image is not waited for', async () => {
    const r = await waitWithImage(
      null,
      { timeoutMs: 2000 },
      'loading="lazy" style="margin-top:3000px"'
    );
    assert.equal(r.ready, true);
    assert.ok(r.waitedMs < 500, `waited ${r.waitedMs}ms`);
  });
});
