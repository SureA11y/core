'use strict';

/**
 * Custom rules in the WCAG rollups (#179), from the browser bundle: a custom
 * rule mapped to a criterion counts toward that criterion's rollup, which
 * names it as custom, and naming the rollup selects it. They were in no
 * rollup.
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

const R111 = 'wcag-1.1.1-non-text-content';

test('custom rules in the WCAG rollups, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>Rollups</title></head><body><main><img src="data:," alt="A chart"></main></body></html>'
  );
  await page.evaluate(BUNDLE);

  async function scan(runOnly, outcome) {
    return page.evaluate(
      ({ runOnly, outcome, R111 }) => {
        const r = window.a11ycore.runa11yCoreInPage(
          location.href,
          null,
          {
            customRules: [
              {
                id: 'acme-alt',
                meta: { title: 'Alt text', description: 'Alt text', wcagSc: ['1.1.1'] },
                runInPage(ctx) {
                  return { ruleId: ctx.rule.ruleId, outcome, occurrences: [] };
                }
              }
            ]
          },
          runOnly
        );
        const rollup = r.rulesResults.find((x) => x.ruleId === R111);
        const check = r.checksResults.find((x) => x.ruleId === 'acme-alt');
        return {
          outcome: rollup && rollup.outcome,
          custom: rollup && rollup.data.details.customChecksIds,
          contributor:
            rollup && rollup.data.details.contributors.find((x) => x.testId === 'acme-alt'),
          rollupIds: check && check.rollupIds,
          ran: r.checksResults.map((x) => x.ruleId)
        };
      },
      { runOnly, outcome, R111 }
    );
  }

  await t.test('a failing custom rule fails the rollup of its criterion', async () => {
    const r = await scan(null, 'fail');
    assert.equal(r.outcome, 'fail');
    assert.deepEqual(r.custom, ['acme-alt']);
    assert.equal(r.contributor.custom, true);
    assert.deepEqual(r.rollupIds, [R111]);
  });

  await t.test('a passing one leaves the built-ins to decide', async () => {
    const r = await scan(null, 'pass');
    assert.notEqual(r.outcome, 'fail');
    assert.deepEqual(r.custom, ['acme-alt']);
  });

  await t.test('naming the rollup selects it', async () => {
    const r = await scan([R111], 'fail');
    assert.ok(r.ran.includes('acme-alt'));
    assert.equal(r.outcome, 'fail');
  });
});
