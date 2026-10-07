'use strict';

/**
 * Cross-frame scans and excludeSelectors, in a real browser (#131). A
 * frame matched by an exclude selector, or inside an element that is, is
 * left out of `frames` with its whole document, as excluded content is by
 * every rule. Other frames are scanned as before.
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

// The cross-frame pair is not in the browser bundle; the in-page chunk of
// core.js carries it (see tests/core/frame-scan.test.js).
const CORE = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
const START = CORE.indexOf('// SELF-CONTAINED in-page runner');
const CROSS_FRAME_CHUNK = CORE.slice(START, CORE.indexOf('module.exports = {', START));

const child = (title) =>
  `<!doctype html><html lang='en'><head><title>${title}</title></head><body><main><img src='data:,'></main></body></html>`;

test('excluded frames are left out of a cross-frame scan, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scannedFrames(excludeSelectors) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<!doctype html><html lang="en"><head><title>top</title></head><body><main>' +
          `<div id="ads"><iframe title="ad" srcdoc="${child('ad')}"></iframe></div>` +
          `<iframe title="video" class="video" srcdoc="${child('video')}"></iframe>` +
          '</main></body></html>'
      );
      await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
      for (const frame of page.frames().slice(1)) {
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
      }
      const result = await page.evaluate(
        (ex) =>
          window.runa11yCoreAcrossFrames(null, null, { excludeSelectors: ex }, ['img-alt-present']),
        excludeSelectors
      );
      return result.frames.map((f) => f.topFrame && f.topFrame.title).sort();
    } finally {
      await page.close();
    }
  }

  await t.test('every frame is scanned without an exclude', async () => {
    assert.deepEqual(await scannedFrames([]), ['ad', 'video']);
  });
  await t.test('a frame inside an excluded element is left out', async () => {
    assert.deepEqual(await scannedFrames(['#ads']), ['video']);
    assert.deepEqual(await scannedFrames('#ads, .other'), ['video']);
  });
  await t.test('a frame matching an exclude is left out', async () => {
    assert.deepEqual(await scannedFrames(['iframe[title=ad]']), ['video']);
    assert.deepEqual(await scannedFrames(['iframe']), []);
  });
  await t.test('a selector the page cannot parse excludes nothing', async () => {
    assert.deepEqual(await scannedFrames(['#ads[', '.video']), ['ad']);
  });
});
