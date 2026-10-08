'use strict';

// auditorAssist on a page that asks for a dark color scheme (#170): text
// with no background of its own is measured against the dark canvas the
// browser paints (#121212 in Chromium), not the white fallback.

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

test('auditorAssist measures against the dark canvas, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const scan = async (head) => {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><p id="light" style="color:#bbb">Opening hours</p><p id="dark" style="color:#333">Closed today</p></main></body></html>`
    );
    await page.addScriptTag({ content: BUNDLE });
    return page.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(
        null,
        null,
        { contrast: { mode: 'auditorAssist' } },
        ['contrast-minimum']
      ).checksResults[0];
      return {
        failed: r.occurrences.map((o) => [
          o.selector,
          Math.round(o.data.details.metrics.ratio * 100) / 100,
          o.data.details.colors.backgroundHex
        ]),
        canvas: document.querySelectorAll('div').length
      };
    });
  };
  for (const head of [
    '<style>html{color-scheme:dark}</style>',
    '<meta name="color-scheme" content="dark">'
  ]) {
    assert.deepEqual(await scan(head), { failed: [['#dark', 1.48, '#121212']], canvas: 0 }, head);
  }
  // A page that doesn't ask for dark keeps the white fallback.
  assert.deepEqual(await scan(''), { failed: [['#light', 1.92, '#ffffff']], canvas: 0 });
});
