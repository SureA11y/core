'use strict';

/**
 * A rule that throws in a real browser, through the reporters (#134). The
 * scan comes back from Chromium with the rule as cantTell, no
 * occurrences and its error; JUnit makes it an <error>, SARIF an error
 * notification, and the HTML report a card saying it did not complete.
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
const { renderJunitReport } = require('../../src/junit.js');
const { renderSarifReport } = require('../../src/sarif.js');
const { renderHtmlReport } = require('../../src/report.js');

test('a rule that throws in Chromium is reported as not complete', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  const result = await page.evaluate(() => {
    const rule = {
      id: 'boom',
      meta: {
        title: 'Boom',
        description: 'Boom',
        tags: ['best-practice'],
        wcagSc: [],
        type: 'automatic'
      },
      runInPage: "function () { throw new Error('boom'); }"
    };
    return window.a11ycore.runa11yCoreInPage(null, null, { customRules: [rule] }, [
      'boom',
      'img-alt-present'
    ]);
  });
  const boom = result.checksResults.find((c) => c.ruleId === 'boom');
  assert.deepEqual([boom.outcome, boom.occurrences, boom.error], ['cantTell', [], 'boom']);

  const junit = renderJunitReport(result);
  assert.match(junit, /<testsuites [^>]*failures="1" errors="1"/);
  assert.match(
    junit,
    /<error type="ruleError" message="The rule did not complete: boom">boom<\/error>/
  );

  const run = JSON.parse(renderSarifReport(result)).runs[0];
  assert.deepEqual(
    run.results.map((r) => r.ruleId),
    ['img-alt-present']
  );
  assert.deepEqual(
    run.invocations[0].toolExecutionNotifications.map((n) => [n.level, n.associatedRule.id]),
    [['error', 'boom']]
  );

  assert.match(renderHtmlReport(result), /The rule did not complete: boom/);
});
