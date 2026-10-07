'use strict';

/**
 * Cross-frame scans reach the frames the page shows: an iframe inside an
 * open shadow root, and an iframe that is itself the scanned scope. And a
 * custom rule given as a function reaches the child frames as its source,
 * which postMessage can carry; it used to fail every child frame with a
 * DataCloneError.
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

test('cross-frame scans reach every shown frame, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, setup, contextSelector, engineOptions, runOnly) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>top</title></head><body><main>${body}</main></body></html>`
      );
      if (setup) await page.evaluate(setup);
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('iframe')).every(
          (f) => f.contentDocument && f.contentDocument.readyState === 'complete'
        )
      );
      await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
      for (const frame of page.frames().slice(1)) {
        await frame.addScriptTag({ content: CROSS_FRAME_CHUNK });
        await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
      }
      return await page.evaluate(
        async ([ctx, eoSrc, ro]) => {
          // A function-valued custom rule is built in the page, as a page script would.
          const eo = eoSrc ? new Function('return ' + eoSrc)() : {};
          const r = await window.runa11yCoreAcrossFrames(null, ctx, eo, ro);
          return r.frames.map((f) => (f.topFrame ? f.topFrame.title : 'error: ' + f.error));
        },
        [contextSelector || null, engineOptions || null, runOnly || ['img-alt-present']]
      );
    } finally {
      await page.close();
    }
  }

  await t.test('an iframe inside an open shadow root', async () => {
    const got = await scan('<div id="host"></div>', () => {
      const host = document.getElementById('host');
      host.attachShadow({ mode: 'open' }).innerHTML =
        '<iframe title="in shadow" srcdoc="' +
        "<!doctype html><html lang='en'><head><title>shadow</title></head><body><main><img src='data:,'></main></body></html>" +
        '"></iframe>';
    });
    assert.deepEqual(got, ['shadow']);
  });

  await t.test('an iframe that is the scanned scope', async () => {
    const got = await scan(
      `<iframe id="only" title="only" srcdoc="${child('scoped')}"></iframe><iframe title="other" srcdoc="${child('other')}"></iframe>`,
      null,
      '#only'
    );
    assert.deepEqual(got, ['scoped']);
  });

  await t.test('a custom rule given as a function reaches the child frame', async () => {
    const got = await scan(
      `<iframe title="f" srcdoc="${child('fn')}"></iframe>`,
      null,
      null,
      "{ customRules: [{ id: 'acme-x', meta: { title: 'X', tags: ['best-practice'] }, runInPage: function () { return { outcome: 'pass', occurrences: [] }; } }] }",
      ['acme-x']
    );
    assert.deepEqual(got, ['fn']);
  });
});
