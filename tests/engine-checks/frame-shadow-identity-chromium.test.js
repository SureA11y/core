'use strict';

// A frame in a shadow root is named so it can be found again and told apart
// from another component's frame: its entry says the shadow hosts that lead
// to it, as an occurrence does (shadowHostSelectors).

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
const { buildBaselineEntries } = require('../../src/baseline.js');

test(
  "two components' frames have entries of their own, in Chromium",
  { skip: !chromium },
  async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><iframe title="light" srcdoc="<title>l</title>"></iframe><div id="pay"></div><div id="video"></div></main></body></html>'
    );
    await page.evaluate(() => {
      for (const id of ['pay', 'video'])
        document.getElementById(id).attachShadow({ mode: 'open' }).innerHTML =
          `<iframe title="${id}" srcdoc="<!doctype html><html lang=en><title>${id}</title><body><img src=data:,></body></html>"></iframe>`;
    });
    await page.waitForTimeout(300);
    await page.addScriptTag({ content: CHUNK });
    for (const frame of page.frames().slice(1)) {
      await frame.addScriptTag({ content: CHUNK });
      await frame.evaluate(() => window.a11yCoreEnableFrameResponder());
    }
    const r = await page.evaluate(() =>
      window.runa11yCoreAcrossFrames(null, null, {}, ['img-alt-present'])
    );
    // Each entry finds its own <iframe> again.
    const found = await page.evaluate(
      (entries) =>
        entries.map((f) => {
          let root = document;
          for (const h of f.shadowHostSelectors || []) root = root.querySelector(h).shadowRoot;
          const el = root.querySelector(f.selector);
          return el && el.getAttribute('title');
        }),
      r.frames.map((f) => ({ selector: f.selector, shadowHostSelectors: f.shadowHostSelectors }))
    );
    assert.deepEqual(
      found,
      r.frames.map((f) => f.title)
    );
    // And the two components' findings are two baseline entries, not one twice.
    const entries = buildBaselineEntries(r).filter((e) => e.ruleId === 'img-alt-present');
    assert.equal(new Set(entries.map((e) => JSON.stringify(e))).size, 2);
  }
);
