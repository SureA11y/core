'use strict';

/**
 * scrollable-region-focusable in a real browser: where the page is laid out,
 * whether a scroll box's content overflows points one way. A box whose
 * content overflows leans fail; one whose content fits leans pass. jsdom lays
 * nothing out, so there it has no lean.
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

const { addBundle } = require('../../helpers/browserBundle');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'scrollable-region-focusable';
const page = (box) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${box}</main></body></html>`;
const OVERFLOWS = `<div style="overflow:auto;height:60px">${'<p>Line of text.</p>'.repeat(20)}</div>`;
const FITS = '<div style="overflow:auto;height:200px"><p>One line.</p></div>';

test(`${RULE_ID} in Chromium: measured overflow leans`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function occurrence(html) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await addBundle(p);
      return await p.evaluate(async (rule) => {
        const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, [rule]);
        const c = r.checksResults.find((x) => x.ruleId === rule);
        return c.occurrences[0] || null;
      }, RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('content that overflows leans fail', async () => {
    const occ = await occurrence(page(OVERFLOWS));
    assert.equal(occ.lean.toward, 'fail');
    assert.equal(occ.lean.i18n.whyKey, 'scrollableRegionFocusable_lean_why_overflows');
    assert.ok(occ.lean.signals[0].value > 2);
  });

  await t.test('content that fits leans pass', async () => {
    const occ = await occurrence(page(FITS));
    assert.equal(occ.lean.toward, 'pass');
    assert.equal(occ.lean.i18n.whyKey, 'scrollableRegionFocusable_lean_why_fits');
  });
});

test(`${RULE_ID} in jsdom: no layout, no lean`, () => {
  // jsdom doesn't expand the overflow shorthand: the axis is set itself.
  const box = OVERFLOWS.replace('overflow:auto', 'overflow-y:auto');
  const r = runa11yCoreOnHtml(page(box), { runOnly: [RULE_ID] }).checksResults[0];
  assert.equal(r.outcome, 'cantTell');
  assert.equal(r.occurrences[0].lean, undefined);
});
