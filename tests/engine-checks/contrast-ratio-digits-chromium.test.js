'use strict';

// The same page gives the same contrast ratios in jsdom and Chromium (#171):
// ratios are rounded past the digits that depend on compositing order.

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

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');
// Translucent text on translucent boxes, where the two environments
// composited in a different order: 1.0778038367054583 in jsdom against
// 1.077803836705458 in Chromium.
const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff"><main>' +
  '<div style="background:rgba(255,255,255,.5)"><p style="color:rgba(0,0,0,.6)">Opening hours today</p></div>' +
  '<div style="background:rgba(40,80,160,.35)"><p style="color:rgba(255,200,0,.7)">Closed on Sundays</p></div>' +
  '</main></body></html>';
const OPTIONS = { visibilityMode: 'styleOnly' };
const RULES = ['contrast-minimum', 'contrast-enhanced'];

function ratios(result) {
  return result.checksResults.map((c) => [
    c.ruleId,
    c.outcome,
    c.margin ? c.margin.value : null,
    (c.occurrences || []).map((o) => o.data.details.metrics.ratio)
  ]);
}

test('contrast ratios agree between jsdom and Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(PAGE);
  await page.addScriptTag({ content: BUNDLE });
  const inBrowser = await page.evaluate(
    ([options, rules]) => window.a11ycore.runa11yCoreInPage(null, null, options, rules),
    [OPTIONS, RULES]
  );
  const inJsdom = runa11yCoreOnHtml(PAGE, { runOnly: RULES, engineOptions: OPTIONS });
  assert.deepEqual(ratios(inBrowser), ratios(inJsdom));
  assert.ok(ratios(inBrowser).some(([, , , list]) => list.includes(1.077803836705)));
});
