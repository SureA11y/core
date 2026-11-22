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

test(
  'text its padding pushes past a box that hides its overflow is not measured (C12-3)',
  { skip },
  async () => {
    // The box overlaps the clip; its text lies below it.
    const pushed = await run(
      page(
        '<div style="height:20px;overflow:hidden"><div style="padding-top:40px;color:#aaa">Clipped text</div></div>'
      ),
      'contrast-minimum'
    );
    assert.equal(pushed.outcome, 'notApplicable');
    // WooCommerce's star rating: its text, for screen readers, sits below
    // the 1em box that shows only the stars.
    const stars = await run(
      page(
        '<div class="star-rating" role="img" aria-label="Rated 4.00 out of 5"><span style="width:80%">Rated <strong class="rating">4.00</strong> out of 5</span></div>',
        '<style>.star-rating{overflow:hidden;position:relative;height:1em;line-height:1;width:5.4em}.star-rating span{overflow:hidden;float:left;top:0;left:0;position:absolute;padding-top:1.5em;color:#aaa}</style>'
      ),
      'contrast-minimum'
    );
    assert.equal(stars.outcome, 'notApplicable');
    // Text that shows in part is still measured.
    const half = await run(
      page(
        '<div style="height:20px;overflow:hidden"><div style="padding-top:10px;color:#aaa">Clipped text</div></div>'
      ),
      'contrast-minimum'
    );
    assert.equal(half.outcome, 'fail');
  }
);

test(
  'SVG text over a circle or ellipse that covers it is measured, as without a layout (C12-7)',
  { skip },
  async () => {
    const badge = (shape) =>
      page(
        `<svg width="200" height="100">${shape}<text x="100" y="57" text-anchor="middle" fill="#fff" font-size="20">12</text></svg>`
      );
    for (const shape of [
      '<circle cx="100" cy="50" r="40" fill="#1a7f37"/>',
      '<ellipse cx="100" cy="50" rx="90" ry="40" fill="#1a7f37"/>'
    ]) {
      const r = await run(badge(shape), 'contrast-computable');
      assert.equal(r.outcome, 'pass', shape);
    }
    // A circle smaller than the text: asked about.
    const small = await run(
      badge('<circle cx="100" cy="50" r="8" fill="#1a7f37"/>'),
      'contrast-computable'
    );
    assert.equal(small.outcome, 'cantTell');
    assert.equal(small.occ[0][1], 'BACKGROUND_OVERLAP');
  }
);
