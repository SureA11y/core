'use strict';

/**
 * A custom rule's fail with no occurrences, in a real browser (#133). It
 * is reported on the document element, so a reporter that builds
 * failures from occurrences shows it.
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

test(
  'a fail with no occurrences is reported on the document element, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });

    const check = await page.evaluate(() => {
      const rule = {
        id: 'page-fail',
        meta: {
          title: 'Page',
          description: 'Page',
          tags: ['best-practice'],
          wcagSc: [],
          type: 'automatic'
        },
        runInPage:
          "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }"
      };
      const c = window.a11ycore.runa11yCoreInPage(null, null, { customRules: [rule] }, [
        'page-fail'
      ]).checksResults[0];
      return {
        outcome: c.outcome,
        occurrences: c.occurrences.map((o) => ({
          selector: o.selector,
          html: o.html,
          reasonCode: o.data.details.reasonCode,
          matches: document.querySelector(o.selector) === document.documentElement
        }))
      };
    });

    assert.deepEqual(check, {
      outcome: 'fail',
      occurrences: [
        {
          selector: 'html',
          html: '<html lang="en">',
          reasonCode: 'FAIL_WITHOUT_OCCURRENCE',
          matches: true
        }
      ]
    });
  }
);
