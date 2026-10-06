'use strict';

/**
 * Collapsed content in a real browser. The content of a closed <details>,
 * and whatever sits under content-visibility: hidden or hidden="until-found",
 * keeps its layout box in Chromium, so it has a rect, but it is not
 * rendered: it is not painted, a pointer cannot hit it and it takes no
 * focus. No rule judges it, however deep it is nested: inside an open
 * <details> within a closed one, or in a shadow root inside one.
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

// Low-contrast text and two undersized targets side by side, each where
// the page does not show it.
const TINY = 'style="width:10px;height:10px;padding:0;border:0;margin:0"';
const LOW = `<p style="color:#bbb">Faint text</p><div><button ${TINY} aria-label="a"></button><button ${TINY} aria-label="b"></button></div>`;
const COLLAPSED = {
  'an open <details> nested in a closed one': `<details><summary>Outer</summary><details open><summary>Inner</summary>${LOW}</details></details>`,
  'a shadow root inside a closed <details>': `<details><summary>Outer</summary><x-panel></x-panel></details><script>customElements.define('x-panel', class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(LOW)}; } });</script>`,
  'a hidden="until-found" panel': `<div hidden="until-found">${LOW}</div>`
};

test('collapsed content is not judged, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, ruleIds) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff}</style></head>' +
          `<body><main>${body}</main></body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate((ids) => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ids);
        const out = {};
        for (const c of r.checksResults) out[c.ruleId] = c.outcome;
        return out;
      }, ruleIds);
    } finally {
      await p.close();
    }
  }

  for (const [name, body] of Object.entries(COLLAPSED)) {
    await t.test(`text in ${name} is not measured for contrast`, async () => {
      const r = await scan(body, ['contrast-minimum']);
      assert.notEqual(r['contrast-minimum'], 'fail', name);
    });
    await t.test(`the buttons in ${name} are not targets`, async () => {
      const r = await scan(body, ['target-size-minimum']);
      assert.notEqual(r['target-size-minimum'], 'fail', name);
    });
  }

  await t.test('the same content shown is still judged', async () => {
    const r = await scan(`<details open><summary>Open</summary>${LOW}</details>`, [
      'contrast-minimum',
      'target-size-minimum'
    ]);
    assert.equal(r['contrast-minimum'], 'fail');
    assert.equal(r['target-size-minimum'], 'fail');
  });

  for (const [name, wrap] of [
    ['closed <details>', (x) => `<details><summary>More</summary>${x}</details>`],
    ['content-visibility: hidden', (x) => `<div style="content-visibility:hidden">${x}</div>`]
  ]) {
    await t.test(`a link under ${name} in a framed document is not focusable content`, async () => {
      const doc = `<p>Text</p>${wrap('<a href="#">x</a>')}`;
      const r = await scan(`<iframe tabindex="-1" title="Embedded" srcdoc='${doc}'></iframe>`, [
        'iframe-focusable-content'
      ]);
      assert.notEqual(r['iframe-focusable-content'], 'fail', name);
    });
  }
});
