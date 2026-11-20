'use strict';

/**
 * An <area> draws nothing of its own: the image that uses its map renders
 * it. HTML's default style sheet gives it display:none, which jsdom follows
 * and Chromium doesn't (it computes inline), so the area's own display, and
 * its map's, must not decide whether it is on the page, or a scan in jsdom
 * and one in Chromium disagree: valid-lang left a lang whose only text is
 * an area's alt notApplicable in jsdom and passed it in Chromium. Each case
 * runs in both, with the outcome they must agree on.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const { addBundle } = require('../helpers/browserBundle');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const map = (lang, css = '') =>
  `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style></head><body>` +
  `<div lang="${lang}"><img alt="" usemap="#m" src="x.png">` +
  '<map name="m"><area href="/x" alt="Bild von der Altstadt" shape="rect" coords="0,0,10,10"></map>' +
  '</div></body></html>';

// [name, page, valid-lang's outcome]
const CASES = [
  ["an area's alt is governed text", map('de'), 'pass'],
  ['under an invalid lang', map('zz-invalid'), 'fail'],
  ['the area set to display:none', map('zz-invalid', 'area{display:none}'), 'fail'],
  ['its map set to display:none', map('zz-invalid', 'map{display:none}'), 'fail'],
  ['the whole image map in a hidden block', map('zz-invalid', 'div{display:none}'), 'notApplicable']
];

test('an image map area is on the page in jsdom as in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [name, html, outcome] of CASES) {
    await t.test(name, async () => {
      const jsdom = runa11yCoreOnHtml(html, { runOnly: ['valid-lang'] }).checksResults[0].outcome;
      const page = await browser.newPage();
      try {
        await page.setContent(html);
        await addBundle(page);
        const inChromium = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['valid-lang']).checksResults[0]
              .outcome
        );
        assert.equal(inChromium, outcome, 'Chromium');
        assert.equal(jsdom, outcome, 'jsdom');
      } finally {
        await page.close();
      }
    });
  }
});
