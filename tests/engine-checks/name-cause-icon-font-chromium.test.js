'use strict';

/**
 * A control whose only content is an icon-font character a CSS ::before
 * draws, on an element with no class to name it by: Chromium leaves the
 * private-use character out of the name, and the name rule's hint says
 * where the icon comes from (helpers.nameCause, cause iconGenerated).
 * jsdom computes no pseudo-element styles, so only a browser shows it.
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

// [markup, rule, the element the hint names]
const CASES = [
  [
    '<style>nav a i::before{content:"\\e900"}</style><nav><a href="/x"><i></i></a></nav>',
    'link-name-present',
    '::before on <i>'
  ],
  [
    '<style>.home::after{content:"\\f015"}</style><button class="home"></button>',
    'button-name-present',
    '::after on <button class="home">'
  ]
];

test('an icon font drawn by ::before is named in the hint, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();

  for (const [markup, ruleId, where] of CASES) {
    await t.test(`${ruleId}: ${markup}`, async () => {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body>${markup}</body></html>`
      );
      await addBundle(page);
      const result = await page.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, [id]);
        return r.checksResults.find((c) => c.ruleId === id);
      }, ruleId);
      assert.equal(result.outcome, 'fail');
      const occ = result.occurrences[0];
      assert.equal(occ.i18n.hintKey, 'nameCause_hint_iconGenerated');
      assert.match(occ.hint, /icon-font character drawn by CSS/);
      assert.ok(occ.hint.includes(where), occ.hint);
    });
  }
});
