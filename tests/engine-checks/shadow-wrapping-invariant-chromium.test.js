'use strict';

/**
 * Wrapping what an element draws in a web component changes nothing a
 * reader sees, so it must change no verdict of the elements around it: the
 * same page scanned with its icons and its header's content drawn in open
 * shadow roots gives each target and each focused link the outcome it has
 * with them in the light DOM. Round 8 found two regressions of this kind
 * (NW-1, NW-2), after the hit tests began to look into shadow roots.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, executablePath, skip } = require('./../helpers/chromium');
const { addBundle } = require('./../helpers/browserBundle');

const RULES = [
  'target-size-minimum',
  'target-size-enhanced',
  'focus-not-obscured-minimum',
  'focus-not-obscured-enhanced'
];
const ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" style="display:block"><rect width="16" height="16"/></svg>';
const DEFINE = `<script>
  customElements.define('x-icon', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '${ICON}'; } });
  customElements.define('x-bar', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '<div style="height:60px;background:#fff">Site</div>'; } });
</script>`;

// The page, its icons and its header's content in the light DOM or drawn by
// components.
function page(wrapped) {
  const face = wrapped ? '<x-icon></x-icon>' : ICON;
  const bar = wrapped ? '<x-bar></x-bar>' : '<div style="height:60px;background:#fff">Site</div>';
  const button = (label) =>
    `<button aria-label="${label}" style="all:unset;display:inline-block;width:16px;height:16px">${face}</button>`;
  const toolbar = ['a', 'b', 'c', 'd'].map(button).join('');
  const links = Array.from(
    { length: 40 },
    (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`
  ).join('');
  return `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0}</style></head><body>${DEFINE}
    <header style="position:sticky;top:0;height:60px;background:#fff">${bar}</header>
    <main><h1>Page</h1><div style="display:flex;gap:2px;margin:20px">${toolbar}</div>
    ${links}</main></body></html>`;
}

test(
  'wrapping icons and a header in components changes no verdict around them',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const verdicts = async (wrapped) => {
      const p = await browser.newPage({ viewport: { width: 800, height: 600 } });
      try {
        await p.setContent(page(wrapped));
        await addBundle(p);
        return await p.evaluate((ids) => {
          const r = window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { rules: { include: ids } },
            null
          );
          const out = {};
          for (const c of r.checksResults) {
            out[c.ruleId] = {
              outcome: c.outcome,
              findings: c.occurrences
                .map((o) => `${o.data.details.reasonCode} ${(o.html.match(/^<[^>]*>/) || [''])[0]}`)
                .sort()
            };
          }
          return out;
        }, RULES);
      } finally {
        await p.close();
      }
    };
    const plain = await verdicts(false);
    const wrapped = await verdicts(true);
    for (const id of RULES) {
      assert.deepEqual(wrapped[id], plain[id], id);
    }
    // The page has something to judge: tight targets and a covering header.
    assert.equal(plain['target-size-minimum'].outcome, 'fail');
    assert.equal(plain['focus-not-obscured-minimum'].outcome, 'cantTell');
  }
);
