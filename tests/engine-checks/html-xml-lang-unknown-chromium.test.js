'use strict';

/**
 * html-xml-lang-mismatch applies only when lang has a known primary
 * language subtag, as ACT 5b7ae0 says (#158). <html lang="xx"
 * xml:lang="yy"> fails html-lang-attr-present, and is not a second failure
 * here; a known lang that xml:lang contradicts still fails.
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

// [<html> attributes, html-lang-attr-present, html-xml-lang-mismatch]
const CASES = [
  ['lang="xx" xml:lang="yy"', 'fail', 'notApplicable'],
  ['lang="en" xml:lang="fr"', 'pass', 'fail'],
  ['lang="en" xml:lang="en-GB"', 'pass', 'pass']
];

test('html-xml-lang-mismatch needs a known lang, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [attrs, langOutcome, mismatchOutcome] of CASES) {
    await t.test(attrs, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(
          `<!doctype html><html ${attrs}><head><title>t</title></head><body><main>x</main></body></html>`
        );
        await page.addScriptTag({ content: BUNDLE });
        const got = await page.evaluate(() =>
          Object.fromEntries(
            window.a11ycore
              .runa11yCoreInPage(null, null, {}, [
                'html-lang-attr-present',
                'html-xml-lang-mismatch'
              ])
              .checksResults.map((c) => [c.ruleId, c.outcome])
          )
        );
        assert.equal(got['html-lang-attr-present'], langOutcome);
        assert.equal(got['html-xml-lang-mismatch'], mismatchOutcome);
      } finally {
        await page.close();
      }
    });
  }
});
