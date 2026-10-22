'use strict';

/**
 * The shared name computation (src/core/dom-helpers.js) against the names
 * Chromium's accessibility tree gives, case by case: several labels for one
 * control (joined in document order, HTML-AAM; a hidden one adds nothing),
 * a label's own naming (aria-labelledby, aria-label, title), an id listed
 * twice in aria-labelledby (read twice, accname 2B), and hidden="until-found"
 * on an inline element (hides nothing). The helpers run in the page, bundled from
 * source with esbuild, so no build is needed.
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

function helpersBundle() {
  const esbuild = require('esbuild');
  return esbuild.buildSync({
    stdin: {
      contents:
        "const { createDomHelpers } = require('./src/core/dom-helpers.js');\n" +
        'globalThis.__nameTest = { createDomHelpers };\n',
      resolveDir: path.join(__dirname, '../..'),
      sourcefile: 'name-computation-chromium-helpers.js'
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
    logLevel: 'error'
  }).outputFiles[0].text;
}

// [markup, the id of the element named, the name Chromium and the engine give]
const CASES = [
  [
    '<label for="t">Address</label> <label for="t">Mailing address</label> <input id="t">',
    'Address Mailing address'
  ],
  ['<label>Street <input id="t"></label> <label for="t">(required)</label>', 'Street (required)'],
  [
    '<label aria-label="Toggle navigation" for="t"><svg aria-hidden="true" width="8" height="8"></svg></label><input id="t" type="checkbox">',
    'Toggle navigation'
  ],
  ['<label for="t" title="Volume"></label><input id="t" type="range">', 'Volume'],
  [
    '<span id="pc">Postcode</span><label aria-labelledby="pc" for="t"></label><input id="t">',
    'Postcode'
  ],
  ['<label aria-label="Email address" for="t">Email</label><input id="t">', 'Email address'],
  ['<label for="t" style="display:none">Hidden</label><input id="t">', ''],
  [
    '<label for="t">Full name</label><label for="t" style="display:none">Decoy</label><input id="t">',
    'Full name'
  ],
  [
    '<label for="t" style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Clipped</label><input id="t">',
    'Clipped'
  ],
  ['<span id="x">Phone</span><input id="t" aria-labelledby="x x">', 'Phone Phone'],
  [
    '<span id="x">Phone</span><span id="y">Home</span><input id="t" aria-labelledby="x y x">',
    'Phone Home Phone'
  ],
  ['<button id="t">Show <span hidden="until-found"><b>terms</b></span></button>', 'Show terms']
];

test('shared name computation agrees with Chromium', { skip }, async (t) => {
  const bundle = helpersBundle();
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);

  for (const [markup, expected] of CASES) {
    await t.test(markup, async () => {
      await page.goto('about:blank');
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body>${markup}</body></html>`
      );
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '#t'
      });
      const { node } = await cdp.send('DOM.describeNode', { nodeId });
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
        backendNodeId: node.backendNodeId,
        fetchRelatives: false
      });
      const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
      assert.equal((ax && ax.name && ax.name.value) || '', expected, 'Chromium');

      await page.addScriptTag({ content: bundle });
      const engine = await page.evaluate(() => {
        const helpers = window.__nameTest.createDomHelpers({ window, document, root: document });
        const el = document.getElementById('t');
        const own = helpers.getAccessibleNameInfo(el).value;
        return own || helpers.getNameFromContentInfo(el).value;
      });
      assert.equal(engine, expected, 'engine');
    });
  }
});
