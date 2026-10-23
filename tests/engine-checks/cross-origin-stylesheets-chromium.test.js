'use strict';

/**
 * Style sheets from another origin, which a page's script can't read: the
 * rules read their text when engineOptions.styleSheetTexts gives it, and
 * runa11yCoreInPageAsync fetches it first where the server shares it (CORS),
 * with the sheets it imports. One that stays unreadable keeps
 * css-orientation-lock cantTell.
 *
 * Two origins are faked with Playwright routes. Skipped when Playwright or
 * its Chromium build is not installed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');
const LOCK = '@media (orientation: portrait) { body { transform: rotate(90deg); } }';
const PAGE = `<!doctype html><html lang="en"><head><title>t</title>
  <link rel="stylesheet" href="https://cdn.other.test/site.css"></head>
  <body><main><p>Content</p></main></body></html>`;

test('style sheets from another origin, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // site.css is the lock, or with `imports`, an @import of lock.css, which
  // holds it.
  async function open(cors, imports = false) {
    const context = await browser.newContext({ viewport: { width: 800, height: 1200 } });
    await context.route('https://site.test/**', (r) =>
      r.fulfill({ contentType: 'text/html', body: PAGE })
    );
    await context.route('https://cdn.other.test/**', (r) =>
      r.fulfill({
        contentType: 'text/css',
        // Playwright adds an allow-all CORS header to a fulfilled response
        // that has none, so a server that doesn't share is one that allows
        // another origin.
        headers: { 'access-control-allow-origin': cors ? '*' : 'https://elsewhere.test' },
        body:
          imports && !r.request().url().endsWith('/lock.css') ? '@import url("lock.css");' : LOCK
      })
    );
    const page = await context.newPage();
    await page.goto('https://site.test/');
    await addBundle(page);
    return { page, close: () => context.close() };
  }
  const outcomeOf = (r) => r.checksResults.find((c) => c.ruleId === 'css-orientation-lock');

  await t.test('unreadable and not given: cantTell', async () => {
    const { page, close } = await open(false);
    try {
      const r = await page.evaluate(() =>
        window.a11ycore.runa11yCoreInPage(null, null, {}, ['css-orientation-lock'])
      );
      assert.equal(outcomeOf(r).outcome, 'cantTell');
      assert.equal(outcomeOf(r).occurrences[0].data.details.reasonCode, 'STYLESHEETS_NOT_READABLE');
      // Without CORS the page can't fetch it either.
      assert.deepEqual(await page.evaluate(() => window.a11ycore.preloadStyleSheets()), []);
    } finally {
      await close();
    }
  });

  await t.test('given as a binding fetched it: the lock fails', async () => {
    const { page, close } = await open(false);
    try {
      const r = await page.evaluate(
        (text) =>
          window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { styleSheetTexts: [{ href: 'https://cdn.other.test/site.css', text }] },
            ['css-orientation-lock']
          ),
        LOCK
      );
      assert.equal(outcomeOf(r).outcome, 'fail');
    } finally {
      await close();
    }
  });

  await t.test(
    'shared with CORS: runa11yCoreInPageAsync fetches it, and the lock fails',
    async () => {
      const { page, close } = await open(true);
      try {
        const sheets = await page.evaluate(() => window.a11ycore.preloadStyleSheets());
        assert.deepEqual(sheets, [{ href: 'https://cdn.other.test/site.css', text: LOCK }]);
        const r = await page.evaluate(() =>
          window.a11ycore.runa11yCoreInPageAsync(null, null, {}, ['css-orientation-lock'])
        );
        assert.equal(outcomeOf(r).outcome, 'fail');
      } finally {
        await close();
      }
    }
  );

  // The page can't read site.css, so it can't see what site.css imports:
  // the import is found in the fetched text. Before, only site.css came
  // back, and the lock passed.
  await t.test('a sheet a fetched sheet imports is fetched too, and the lock fails', async () => {
    const { page, close } = await open(true, true);
    try {
      const sheets = await page.evaluate(() => window.a11ycore.preloadStyleSheets());
      assert.deepEqual(
        sheets.map((s) => s.href),
        ['https://cdn.other.test/site.css', 'https://cdn.other.test/lock.css']
      );
      const r = await page.evaluate(() =>
        window.a11ycore.runa11yCoreInPageAsync(null, null, {}, ['css-orientation-lock'])
      );
      assert.equal(outcomeOf(r).outcome, 'fail');
    } finally {
      await close();
    }
  });
});
