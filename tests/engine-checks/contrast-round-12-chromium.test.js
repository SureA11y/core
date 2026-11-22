'use strict';

/**
 * Text contrast: what the twelfth stress test found (C12-n), in Chromium.
 * The jsdom side is contrast-round-12.test.js.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chromium, executablePath, skip } = require('../helpers/chromium.js');
const { addBundle } = require('../helpers/browserBundle');

const page = (body, head = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${head}</head><body><main>${body}</main></body></html>`;

let browser;
test.before(async () => {
  if (!skip) browser = await chromium.launch({ executablePath });
});
test.after(async () => {
  if (browser) await browser.close();
});

// The rule's outcome and each occurrence as [outcome, reason code, ratio].
async function run(html, ruleId, viewport = { width: 1280, height: 800 }) {
  const p = await browser.newPage({ viewport });
  try {
    await p.setContent(html, { waitUntil: 'load' });
    await addBundle(p);
    return await p.evaluate(async (id) => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, [id]);
      const c = r.checksResults.find((x) => x.ruleId === id);
      return {
        outcome: c.outcome,
        occ: c.occurrences.map((o) => {
          const d = (o.data && o.data.details) || {};
          const m = d.metrics && d.metrics.ratio;
          return [
            o.outcome || null,
            d.reasonCode || null,
            m ? Math.round(m * 100) / 100 : d.ratio || null
          ];
        })
      };
    }, ruleId);
  } finally {
    await p.close();
  }
}

const component = (shadow) =>
  `<x-s>Buy now</x-s><script>customElements.define('x-s', class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: 'open' }).innerHTML = '${shadow}'; } });</script>`;

test(
  'text placed straight into a shadow host takes its slot’s color and background (C12-2)',
  { skip },
  async () => {
    const grey = await run(
      page(component('<div style="color:#aaa"><slot></slot></div>')),
      'contrast-minimum'
    );
    assert.equal(grey.outcome, 'fail');
    assert.equal(grey.occ[0][2], 2.32);
    assert.equal(
      (await run(page(component('<slot style="color:#aaa"></slot>')), 'contrast-minimum')).outcome,
      'fail'
    );
    const dark = await run(
      page(component('<div style="background:#000;color:#fff"><slot></slot></div>')),
      'contrast-minimum'
    );
    assert.equal(dark.outcome, 'pass');
  }
);
