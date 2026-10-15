'use strict';

// Forced colors (#227): under Windows high contrast, or Chromium's emulated
// forced-colors: active, the browser paints its own colors over the page's,
// and the contrast rules measure what is left of the page's. The result
// said nothing of it. engine.environment records it, and every contrast
// occurrence says so, with the outcomes left as they are.

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
const FR = fs.readFileSync(path.join(__dirname, '../../surea11y.i18n.fr.js'), 'utf8');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<p id="grey" style="color:#999;background:#fff">Opening hours</p>' +
  '<p id="ok" style="color:#000;background:#fff">Closed today</p>' +
  '</main></body></html>';

const RULES = ['contrast-minimum', 'contrast-enhanced', 'contrast-computable'];

test(
  'forced colors are recorded, and noted on every contrast occurrence, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (forcedColors, locale) => {
      const page = await browser.newPage();
      t.after(() => page.close());
      await page.emulateMedia({ forcedColors });
      await page.setContent(HTML);
      await page.addScriptTag({ content: BUNDLE });
      if (locale === 'fr') await page.addScriptTag({ content: FR });
      return page.evaluate(
        ([rules, locale]) => {
          const r = window.a11ycore.runa11yCoreInPage(null, null, locale ? { locale } : {}, rules);
          return {
            environment: r.engine.environment,
            checks: r.checksResults.map((c) => ({
              ruleId: c.ruleId,
              outcome: c.outcome,
              occurrences: c.occurrences.map((o) => ({
                selector: o.selector,
                forcedColors: o.data.details.forcedColors,
                hint: o.hint,
                hintKey: o.i18n && o.i18n.hintKey
              }))
            }))
          };
        },
        [RULES, locale || null]
      );
    };

    const off = await scan('none');
    assert.equal(off.environment.forcedColors, 'none');
    const on = await scan('active');
    assert.equal(on.environment.forcedColors, 'active');

    // The outcomes are the same either way: the note informs, it doesn't judge.
    const outcomes = (r) => Object.fromEntries(r.checks.map((c) => [c.ruleId, c.outcome]));
    assert.deepEqual(outcomes(on), outcomes(off));
    assert.deepEqual(outcomes(on), {
      'contrast-minimum': 'fail',
      'contrast-enhanced': 'fail',
      'contrast-computable': 'pass'
    });
    const minimum = (r) => r.checks.find((c) => c.ruleId === 'contrast-minimum');

    for (const check of off.checks) {
      assert.ok(check.occurrences.length, check.ruleId);
      for (const o of check.occurrences) {
        assert.equal(o.forcedColors, undefined, check.ruleId);
        assert.notEqual(o.hintKey, 'contrast_hint_forcedColors', check.ruleId);
      }
    }
    for (const check of on.checks) {
      assert.ok(check.occurrences.length, check.ruleId);
      for (const o of check.occurrences) {
        assert.equal(o.forcedColors, true, check.ruleId);
        assert.equal(o.hintKey, 'contrast_hint_forcedColors', check.ruleId);
        assert.match(o.hint, /^Forced colors were on when this page was checked/, check.ruleId);
      }
    }
    assert.deepEqual(
      minimum(on).occurrences.map((o) => o.selector),
      ['#grey']
    );

    // The hint is translated like any other.
    const fr = await scan('active', 'fr');
    assert.match(minimum(fr).occurrences[0].hint, /^Les couleurs forcées étaient actives/);
  }
);
