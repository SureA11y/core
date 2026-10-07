'use strict';

/**
 * A custom rule's helpUrl and tags, from a scan in a real browser to the
 * reporters (#142): the result carries both, SARIF gives the rule its
 * helpUri and tags, and the HTML report links the help from its card.
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
const { renderSarifReport } = require('../../src/sarif.js');
const { renderHtmlReport } = require('../../src/report.js');

test('a custom rule help link and tags reach the reporters, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });
  const result = await page.evaluate(() => {
    const rule = {
      id: 'acme-rule',
      meta: {
        title: 'Acme',
        description: 'Acme',
        helpUrl: 'https://example.test/rules/acme',
        tags: ['best-practice', 'acme-design-system'],
        wcagSc: [],
        type: 'automatic'
      },
      runInPage:
        "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }"
    };
    return window.a11ycore.runa11yCoreInPage(
      'https://example.test/',
      null,
      { customRules: [rule] },
      ['acme-rule']
    );
  });

  assert.equal(result.checksResults[0].meta.helpUrl, 'https://example.test/rules/acme');
  const sarifRule = JSON.parse(renderSarifReport(result)).runs[0].tool.driver.rules[0];
  assert.equal(sarifRule.helpUri, 'https://example.test/rules/acme');
  assert.ok(sarifRule.properties.tags.includes('acme-design-system'));
  assert.match(
    renderHtmlReport(result),
    /<a href="https:\/\/example\.test\/rules\/acme">How to fix acme-rule<\/a>/
  );
});
