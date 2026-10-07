'use strict';

/**
 * The alt-quality rules in Chromium (#157): alt made only of symbols
 * ("★★★★☆") gets a message saying so, not "a placeholder or a generic word";
 * and area-alt-quality and input-image-alt-quality report at most 50
 * ordinary elements and, on top, at most 50 with a signal, as
 * img-alt-quality does.
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
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test('alt-quality symbols message and caps, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function run(body, ruleId) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
      );
      await page.addScriptTag({ content: BUNDLE });
      return await page.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, {}, [id]).checksResults[0],
        ruleId
      );
    } finally {
      await page.close();
    }
  }

  await t.test('alt made only of symbols', async () => {
    const r = await run(`<img src="${IMG}" width="80" height="16" alt="★★★★☆">`, 'img-alt-quality');
    assert.equal(r.occurrences[0].data.details.altSignal, 'symbols');
    assert.match(r.occurrences[0].summary, /made only of symbols/);
  });

  await t.test('area-alt-quality is capped', async () => {
    const areas = Array.from(
      { length: 60 },
      (_, i) => `<area shape="rect" coords="0,0,${i + 1},${i + 1}" href="/${i}" alt="Page ${i}">`
    ).join('');
    const r = await run(
      `<img src="${IMG}" width="100" height="100" alt="Plan" usemap="#m"><map name="m">${areas}</map>`,
      'area-alt-quality'
    );
    assert.equal(r.occurrences.length, 50);
    assert.equal(r.data.details.truncated, true);
  });

  await t.test('input-image-alt-quality is capped', async () => {
    const inputs = Array.from(
      { length: 60 },
      (_, i) => `<input type="image" src="${IMG}" alt="${i < 55 ? `Page ${i}` : 'image'}">`
    ).join('');
    const r = await run(`<form>${inputs}</form>`, 'input-image-alt-quality');
    assert.equal(r.occurrences.length, 55);
    assert.equal(r.data.details.suspiciousCount, 5);
  });
});
