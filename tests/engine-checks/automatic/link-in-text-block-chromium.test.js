'use strict';

/**
 * link-in-text-block in a real browser, where a page that sets no
 * background leaves the colors uncomputable in strict mode: an underline,
 * a non-color cue, must still settle the link without them.
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

const RULE_ID = 'link-in-text-block';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(body, bodyStyle = '') {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body style="${bodyStyle}">${body}</body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      return await p.evaluate((id) => {
        const r = window.a11ycore.runa11yCoreInPage(
          location.href,
          null,
          { rules: { include: id } },
          null
        );
        const c = r.checksResults.find((x) => x.ruleId === id);
        return [
          c.outcome,
          c.occurrences.map((o) => o.data && o.data.details && o.data.details.reasonCode)
        ];
      }, RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('an underlined link passes on a page that sets no background', async () => {
    const [outcome] = await scan(
      '<p>Read <a href="/pricing" style="text-decoration:underline">our pricing</a> first.</p>'
    );
    assert.equal(outcome, 'pass');
  });

  await t.test(
    'a link set apart by color only stays undecided there, and fails on a set background',
    async () => {
      const body =
        '<p style="color:#222222">Read <a href="/pricing" style="text-decoration:none;color:#2a2a2a">our pricing</a> first.</p>';
      assert.deepEqual(await scan(body), ['cantTell', ['COLOR_NOT_COMPUTABLE']]);
      assert.deepEqual(await scan(body, 'background:#ffffff'), [
        'fail',
        ['COLOR_ONLY_DIFFERENTIATION']
      ]);
    }
  );
});
