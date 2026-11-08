'use strict';

// A frame under [inert], or behind an open modal dialog, is inert with its
// whole document: out of the accessibility tree and the focus order, as the
// top page's own content there is to its rules.

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
  "<!doctype html><html lang=en><head><title>c</title></head><body><main><img src='data:,'><button></button></main></body></html>";

test(
  'an inert frame is not judged as a page anyone reaches, in Chromium',
  { skip: !chromium },
  async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    async function frameOutcomes(body, setup) {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
        );
        if (setup) await page.evaluate(setup);
        await page.waitForFunction(() =>
          [...document.querySelectorAll('iframe')].every(
            (f) => f.contentDocument && f.contentDocument.readyState === 'complete'
          )
        );
        await page.addScriptTag({ content: CHUNK });
        for (const frame of page.frames().slice(1)) {
          await frame.addScriptTag({ content: CHUNK });
          await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
        }
        const r = await page.evaluate(() =>
          window.runa11yCoreAcrossFrames(null, null, {}, ['img-alt-present', 'button-name-present'])
        );
        // A frame left out, or scanned with neither rule applying, both pass.
        return r.frames
          .flatMap((f) => (f.topFrame ? f.topFrame.checksResults.map((c) => c.outcome) : []))
          .filter((o) => o === 'fail');
      } finally {
        await page.close();
      }
    }
    await t.test('under an [inert] ancestor', async () => {
      assert.deepEqual(
        await frameOutcomes(`<div inert><iframe title="x" srcdoc="${CHILD}"></iframe></div>`),
        []
      );
    });
    await t.test('behind a modal dialog', async () => {
      assert.deepEqual(
        await frameOutcomes(
          `<iframe title="x" srcdoc="${CHILD}"></iframe><dialog id="d"><button>Close</button></dialog>`,
          () => document.getElementById('d').showModal()
        ),
        []
      );
    });
    await t.test('in a modal dialog under another, topmost one', async () => {
      const page = (frameIn) =>
        `<dialog id="lower">${frameIn === 'lower' ? `<iframe title="x" srcdoc="${CHILD}"></iframe>` : '<p>Lower</p>'}</dialog>` +
        `<dialog id="upper">${frameIn === 'upper' ? `<iframe title="x" srcdoc="${CHILD}"></iframe>` : '<p>Upper</p>'}</dialog>`;
      const open = () => {
        document.getElementById('lower').showModal();
        document.getElementById('upper').showModal();
      };
      // Only the topmost modal is reachable: the lower one's frame is left out.
      assert.deepEqual(await frameOutcomes(page('lower'), open), []);
      // The topmost one's frame is scanned, as any.
      assert.ok((await frameOutcomes(page('upper'), open)).length > 0);
    });
    await t.test('in a modal dialog with another, topmost one inside it', async () => {
      const frame = `<iframe title="x" srcdoc="${CHILD}"></iframe>`;
      const page = (frameIn) =>
        `<dialog id="outer">${frameIn === 'outer' ? frame : '<p>Outer</p>'}` +
        `<dialog id="inner">${frameIn === 'inner' ? frame : '<p>Inner</p>'}</dialog></dialog>`;
      const open = () => {
        document.getElementById('outer').showModal();
        document.getElementById('inner').showModal();
      };
      // The outer dialog's content around the inner one is inert: left out.
      assert.deepEqual(await frameOutcomes(page('outer'), open), []);
      // The inner, topmost one's frame is scanned.
      assert.ok((await frameOutcomes(page('inner'), open)).length > 0);
    });
  }
);
