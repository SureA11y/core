'use strict';

/**
 * evidenceState (src/core/evidence-state.js) in a real browser: it applies
 * the very style sheet text-spacing-content-loss measures with, the browser
 * paints it (the rule's own never is), and releasing it leaves the page as
 * it was, its scroll position too. A finding that shows only with the
 * spacing names the state; the rule's other findings don't. Also what a
 * binding does: sending the Node export into the page with a driver's
 * evaluate.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { evidenceState } = require('../../src/index.js');

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

// A box that cuts off its text once the spacing is applied, a style sheet
// rule that forces the spacing on other text, and room to scroll.
const CSS =
  '.clip { overflow: hidden; height: 20px; width: 160px; white-space: nowrap; font-size: 16px }' +
  '.forced { line-height: 1 !important }' +
  '.tall { height: 2000px }';
const BODY =
  '<main><h1>H</h1>' +
  '<div class="clip">Text that fits as it is</div>' +
  '<p class="forced">Text whose line height a rule forces.</p>' +
  '<div class="tall"></div></main>';
const PAGE = `<!doctype html><html lang="en"><head><title>t</title><link rel="stylesheet" href="/s.css"></head><body>${BODY}</body></html>`;

async function open(browser, { csp } = {}) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.route('https://example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: csp ? { 'Content-Security-Policy': csp } : {},
      body: PAGE
    })
  );
  await page.route('https://example.test/s.css', (route) =>
    route.fulfill({ contentType: 'text/css', body: CSS })
  );
  await page.goto('https://example.test/');
  await page.evaluate(BUNDLE);
  return page;
}

// Two animation frames: what was changed has been painted.
const painted = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );

test(
  'the state is the style sheet the rule measures with, and its findings name it',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const page = await open(browser);
      const r = await page.evaluate(() => {
        // What the rule adds, seen as it is added: it takes it out again in
        // the same task.
        const seen = [];
        const observer = new MutationObserver((records) => {
          for (const rec of records) {
            for (const n of rec.addedNodes) {
              if (n.nodeType === 1 && n.hasAttribute('data-surea11y')) seen.push(n.textContent);
            }
          }
        });
        observer.observe(document.head, { childList: true });
        const result = window.a11ycore.runa11yCoreInPage(null, null, {}, [
          'text-spacing-content-loss'
        ]);
        return new Promise((resolve) =>
          setTimeout(() => {
            observer.disconnect();
            const check = result.checksResults.find(
              (c) => c.ruleId === 'text-spacing-content-loss'
            );
            const applied = window.a11ycore.evidenceState({
              op: 'apply',
              state: 'text-spacing',
              token: 't'
            });
            const ours = document.querySelector('style[data-surea11y]').textContent;
            window.a11ycore.evidenceState({ op: 'release', token: 't' });
            resolve({
              seen,
              ours,
              applied,
              findings: check.occurrences.map((o) => [
                o.data.details.reasonCode,
                o.data.details.evidenceState || null
              ])
            });
          }, 0)
        );
      });
      assert.equal(r.applied.applied, true);
      assert.deepEqual(r.seen, [r.ours]);
      const codes = r.findings.map(([code]) => code);
      assert.ok(codes.includes('TEXT_CLIPPED'), codes.join());
      assert.ok(codes.includes('STYLESHEET_IMPORTANT'), codes.join());
      for (const [code, state] of r.findings) {
        assert.equal(state, code === 'STYLESHEET_IMPORTANT' ? null : 'text-spacing', code);
      }
    } finally {
      await browser.close();
    }
  }
);

test(
  'the browser paints the state, and releasing it leaves the page as it was',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const page = await open(browser);
      const box = page.locator('.clip');
      // An element screenshot scrolls the element into view: taken first.
      const before = await box.screenshot();
      await page.evaluate(() => window.scrollTo(0, 120));

      // The Node export, sent into the page as a binding sends it.
      const applied = await page.evaluate(evidenceState, {
        op: 'apply',
        state: 'text-spacing',
        token: 'shot'
      });
      assert.deepEqual(applied, { applied: true, via: 'style' });
      await painted(page);
      const style = await page.evaluate(() => {
        const s = getComputedStyle(document.querySelector('.clip'));
        return { letterSpacing: s.letterSpacing, lineHeight: s.lineHeight };
      });
      assert.equal(style.letterSpacing, '1.92px');
      assert.equal(style.lineHeight, '24px');
      // The picture scrolls the page; releasing puts back where it was.
      const during = await box.screenshot();
      assert.notDeepEqual(during, before, 'the picture shows the spacing');
      assert.notEqual(await page.evaluate(() => window.scrollY), 120);
      assert.deepEqual(await page.evaluate(evidenceState, { op: 'release', token: 'shot' }), {
        released: true
      });
      await painted(page);
      const after = await page.evaluate(() => ({
        left: document.querySelectorAll('style[data-surea11y]').length,
        letterSpacing: getComputedStyle(document.querySelector('.clip')).letterSpacing,
        scrollY: window.scrollY
      }));
      assert.deepEqual(after, { left: 0, letterSpacing: 'normal', scrollY: 120 });
      assert.deepEqual(await box.screenshot(), before);
    } finally {
      await browser.close();
    }
  }
);

test(
  'under a CSP that blocks inline styles, the state is adopted, and taken off again',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const page = await open(browser, { csp: "style-src 'self'" });
      const applied = await page.evaluate(evidenceState, {
        op: 'apply',
        state: 'text-spacing',
        token: 't'
      });
      assert.deepEqual(applied, { applied: true, via: 'adopted' });
      const during = await page.evaluate(() => ({
        left: document.querySelectorAll('style[data-surea11y]').length,
        adopted: document.adoptedStyleSheets.length,
        letterSpacing: getComputedStyle(document.querySelector('.clip')).letterSpacing
      }));
      assert.deepEqual(during, { left: 0, adopted: 1, letterSpacing: '1.92px' });
      await page.evaluate(evidenceState, { op: 'release', token: 't' });
      const after = await page.evaluate(() => ({
        adopted: document.adoptedStyleSheets.length,
        letterSpacing: getComputedStyle(document.querySelector('.clip')).letterSpacing
      }));
      assert.deepEqual(after, { adopted: 0, letterSpacing: 'normal' });

      // Neither way: blocked, and nothing is left behind.
      await page.evaluate(() => {
        delete window.CSSStyleSheet;
      });
      const blocked = await page.evaluate(evidenceState, {
        op: 'apply',
        state: 'text-spacing',
        token: 't'
      });
      assert.deepEqual(blocked, { applied: false, reason: 'blocked' });
      assert.equal(
        await page.evaluate(() => document.querySelectorAll('style[data-surea11y]').length),
        0
      );
    } finally {
      await browser.close();
    }
  }
);
