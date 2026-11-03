'use strict';

// A frame in a shadow root is read through its host: aria-hidden, an
// exclude selector or includeShadowDom:false on the host reach the frame, as
// they reach every other element of the shadow root.

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
const CORE = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
const START = CORE.indexOf('// SELF-CONTAINED in-page runner');
const CHUNK = CORE.slice(START, CORE.indexOf('module.exports = {', START));
const CHILD =
  "<!doctype html><html lang=en><head><title>c</title></head><body><main><img src='data:,'></main></body></html>";

test(
  'a frame in a shadow root is read through its host, in Chromium',
  { skip: !chromium },
  async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    async function frames(hostAttrs, engineOptions) {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="host" ${hostAttrs}></div></main></body></html>`
        );
        await page.evaluate((child) => {
          document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
            `<iframe title="x" srcdoc="${child}"></iframe>`;
        }, CHILD);
        await page.waitForFunction(() => {
          const f = document.getElementById('host').shadowRoot.querySelector('iframe');
          return f.contentDocument && f.contentDocument.readyState === 'complete';
        });
        await page.addScriptTag({ content: CHUNK });
        for (const frame of page.frames().slice(1)) {
          await frame.addScriptTag({ content: CHUNK });
          await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
        }
        const r = await page.evaluate(
          (eo) => window.runa11yCoreAcrossFrames(null, null, eo, ['img-alt-present']),
          engineOptions
        );
        return r.frames.map((f) => f.topFrame.checksResults[0].outcome);
      } finally {
        await page.close();
      }
    }
    await t.test('an aria-hidden host hides the frame', async () => {
      assert.deepEqual(await frames('aria-hidden="true"', {}), ['notApplicable']);
    });
    await t.test('an excluded host leaves the frame out', async () => {
      assert.deepEqual(await frames('', { excludeSelectors: ['#host'] }), []);
    });
    await t.test('includeShadowDom:false leaves the frame out', async () => {
      assert.deepEqual(await frames('', { includeShadowDom: false }), []);
    });
  }
);
