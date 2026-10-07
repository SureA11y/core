'use strict';

/**
 * page-title-present on an SVG document opened on its own (#150). Its
 * document element is <svg>, its title is its own <title> child (Chromium's
 * document.title reads it), and it has no <head>: it is not the HTML page
 * WCAG 2.4.2 and ACT 2779a5 judge, so the rule doesn't apply. An HTML page
 * is judged as before.
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

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><title>Sales chart</title>' +
  '<rect width="200" height="100" fill="#fff"/><text x="10" y="50">Sales up 10%</text></svg>';

test('page-title-present does not judge an SVG document, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, contentType) {
    const page = await browser.newPage();
    try {
      await page.route('https://example.test/doc', (route) =>
        route.fulfill({ status: 200, contentType, body })
      );
      await page.goto('https://example.test/doc');
      const title = await page.evaluate(() => document.title);
      await page.evaluate(BUNDLE);
      const outcome = await page.evaluate(
        () =>
          window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['page-title-present'])
            .checksResults[0].outcome
      );
      return { title, outcome };
    } finally {
      await page.close();
    }
  }

  await t.test('an SVG document is notApplicable', async () => {
    assert.deepEqual(await scan(SVG, 'image/svg+xml'), {
      title: 'Sales chart',
      outcome: 'notApplicable'
    });
  });
  await t.test('an HTML page without a title still fails', async () => {
    const html = `<!doctype html><html lang="en"><body><main>${SVG}</main></body></html>`;
    assert.deepEqual(await scan(html, 'text/html'), { title: '', outcome: 'fail' });
  });
});
