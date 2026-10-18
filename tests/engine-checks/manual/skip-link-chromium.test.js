'use strict';

/**
 * skip-link in a real browser, where it also measures the link's target: a
 * target that collapses to nothing below a breakpoint is reported at that
 * width only, and the finding says which viewport it was measured at. An
 * empty anchor, which has no area by nature, is a usable target.
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

const RULE_ID = 'skip-link';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  @media (max-width: 600px) { #main { height: 0; overflow: hidden } }
</style></head><body>
  <a id="skip" href="#main">Skip to main content</a>
  <nav><a href="/a">A</a> <a href="/b">B</a></nav>
  <main id="main"><h1>Title</h1><p>Content</p></main>
</body></html>`;

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(viewport) {
    const p = await browser.newPage({ viewport });
    try {
      await p.setContent(PAGE);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
        RULE_ID
      );
      return result.checksResults.find((r) => r.ruleId === RULE_ID);
    } finally {
      await p.close();
    }
  }

  await t.test('a target that collapses below a breakpoint, with its viewport', async () => {
    const wide = await scan({ width: 1024, height: 700 });
    assert.equal(wide.occurrences.length, 0);

    const narrow = await scan({ width: 500, height: 700 });
    assert.equal(narrow.outcome, 'cantTell');
    const { details } = narrow.occurrences[0].data;
    assert.equal(details.reasonCode, 'SKIP_LINK_TARGET_UNUSABLE');
    assert.equal(details.unusableReasonCode, 'ZERO_AREA_TARGET');
    assert.deepEqual(details.viewport, { width: 500, height: 700 });
  });

  await t.test(
    'an empty anchor target is usable, and a link to it reaches what follows',
    async () => {
      for (const target of [
        '<a id="main-content" tabindex="-1"></a>',
        '<a id="main-content"></a>',
        '<a name="main-content"></a>',
        '<div id="main-content" tabindex="-1"></div>',
        '<a id="main-content" tabindex="-1" style="display:contents"></a>',
        '<div id="main-content" style="display:contents"><p>Main text</p></div>'
      ]) {
        const p = await browser.newPage();
        try {
          await p.setContent(
            `<!doctype html><html lang="en"><head><title>t</title></head><body>
            <a id="skip" href="#main-content">Skip to main content</a>
            <nav><a href="/a">A</a> <a href="/b">B</a></nav>
            <main><nav aria-label="Breadcrumb"><a href="/c">C</a></nav>${target}
            <h1>Title</h1><a id="after" href="/d">D</a></main></body></html>`
          );
          await p.focus('#skip');
          await p.keyboard.press('Enter');
          await p.keyboard.press('Tab');
          assert.equal(
            await p.evaluate(() => document.activeElement.id),
            'after',
            `Chromium follows the link to ${target}`
          );
          await p.addScriptTag({ content: BUNDLE });
          const result = await p.evaluate(
            (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
            RULE_ID
          );
          const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
          assert.equal(rule.outcome, 'pass', target);
        } finally {
          await p.close();
        }
      }
    }
  );

  async function unusable(target) {
    const p = await browser.newPage();
    try {
      await p.setContent(
        `<!doctype html><html lang="en"><head><title>t</title></head><body>
        <a id="skip" href="#mc">Skip to main content</a>
        <nav><a href="/a">A</a> <a href="/b">B</a></nav>
        <div role="main"><nav aria-label="Breadcrumb"><a href="/c">C</a></nav>${target}
        <h1>Title</h1><a id="after" href="/d">D</a></div></body></html>`
      );
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
        RULE_ID
      );
      const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
      return rule.occurrences.map((o) => o.data.details.unusableReasonCode);
    } finally {
      await p.close();
    }
  }

  await t.test('an empty anchor in content collapsed out of sight is asked about', async () => {
    for (const target of [
      '<main style="height:0;overflow:hidden"><a id="mc" tabindex="-1"></a><p>Main text</p></main>',
      '<div style="height:0;overflow:hidden"><main><a id="mc" tabindex="-1"></a><p>Main text</p></main></div>',
      '<main style="width:0;overflow:hidden"><a name="mc"></a><img src="data:," alt="Logo"></main>'
    ]) {
      assert.deepEqual(await unusable(target), ['ZERO_AREA_TARGET'], target);
    }
  });

  await t.test('a display: contents target is measured by its children', async () => {
    assert.deepEqual(
      await unusable('<div id="mc" style="display:contents"><p>Main text</p></div>'),
      []
    );
    assert.deepEqual(
      await unusable(
        '<div id="mc" style="display:contents"><p style="height:0;overflow:hidden">Main text</p></div>'
      ),
      ['ZERO_AREA_TARGET']
    );
  });

  await t.test('a target an ancestor cuts to nothing is asked about', async () => {
    for (const [target, expected] of [
      [
        '<div style="height:0;overflow:hidden"><div id="mc"><p>Main text</p></div></div>',
        ['ZERO_AREA_TARGET']
      ],
      [
        '<div style="height:40px;overflow:clip"><div style="height:100px"></div><div id="mc"><p>Main text</p></div></div>',
        ['ZERO_AREA_TARGET']
      ],
      [
        '<div style="height:40px;overflow:hidden"><div style="height:100px"></div><div id="mc"><p>Main text</p></div></div>',
        []
      ]
    ]) {
      assert.deepEqual(await unusable(target), expected, target);
    }
  });

  await t.test('the fixture', async () => {
    const p = await browser.newPage();
    try {
      await p.setContent(FIXTURE);
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(
        (id) => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: id } }, null),
        RULE_ID
      );
      const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
      assert.deepEqual(
        rule.occurrences.map((o) => (String(o.html || '').match(/id="([^"]+)"/) || [])[1]).sort(),
        [
          'sl_case_02',
          'sl_case_04',
          'sl_case_06',
          'sl_case_07',
          'sl_case_09',
          'sl_case_10',
          'sl_case_11'
        ]
      );
    } finally {
      await p.close();
    }
  });
});
