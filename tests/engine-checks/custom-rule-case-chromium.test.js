'use strict';

// A custom rule spelt like a built-in in another case overrides it, under
// the built-in's id, in the browser bundle as in Node (#165).

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
  'a custom rule id in another case overrides the built-in, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });
    const got = await page.evaluate(() => {
      const rule = (id) => ({
        id,
        meta: { title: id, tags: ['best-practice'] },
        runInPage:
          'function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: "pass", occurrences: [] }; }'
      });
      const r = window.a11ycore.runa11yCoreInPage(
        null,
        null,
        { customRules: [rule('Img-Alt-Present'), rule('acme-x'), rule('ACME-X')] },
        ['img-alt-present', 'acme-x']
      );
      return {
        ran: r.checksResults.map((c) => [c.ruleId, c.outcome, c.title]),
        overridden: r.overriddenBuiltinIds,
        skipped: r.skippedCustomRules.map((s) => s.id)
      };
    });
    // The page's <img> has no alt, so the built-in would fail it: the pass is
    // the custom rule's.
    assert.deepEqual(got, {
      ran: [
        ['img-alt-present', 'pass', 'Img-Alt-Present'],
        ['acme-x', 'pass', 'acme-x']
      ],
      overridden: ['img-alt-present'],
      skipped: ['ACME-X']
    });
  }
);
