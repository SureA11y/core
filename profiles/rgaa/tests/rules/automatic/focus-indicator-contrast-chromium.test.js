'use strict';

/**
 * focus-indicator-contrast in a real browser. Where the page has a layout
 * the rule focuses each element and measures what Chromium draws, against
 * what is painted next to it, so it settles cases jsdom can only ask about
 * (variables, @media, a positioned layer behind the element). The tests
 * check those verdicts, that focus and the style attribute are put back,
 * and the WCAG and RGAA rollups side by side under the RGAA profile.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

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

const RULE_ID = 'focus-indicator-contrast';
const BUNDLE = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

function summarize(result) {
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  return {
    outcome: rule.outcome,
    findings: (rule.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      o.occurrenceOutcome,
      o.data.details.reasonCode
    ])
  };
}

// Each case sits in its own white block with room around it, so every side
// of the indicator is measured against the block it belongs to.
const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  :root { --low: #dddddd; --high: #000000; }
  body { margin: 0; background: #ffffff; }
  .case { padding: 30px; }
  #var_low:focus { outline: 2px solid var(--low); }
  #var_high:focus { outline: 2px solid var(--high); }
  @media (min-width: 1px) { #media_low:focus { outline: 2px solid #eeeeee; } }
  .layer { position: relative; }
  .layer .back { position: absolute; inset: 0; background: #111111; }
  #layer_dark { position: relative; color: #ffffff; }
  #layer_dark:focus { outline: 2px solid #222222; }
  .grad { background: linear-gradient(#ffffff, #000000); }
  #grad:focus { outline: 2px solid #cccccc; }
  #slow { transition: box-shadow 2s; }
  #slow:focus { outline: none; box-shadow: 0 0 0 3px #f0f0f0; }
  #styled:focus { outline: 2px solid #000000; }
</style></head><body>
  <div class="case"><a id="var_low" href="/1">One</a></div>
  <div class="case"><a id="var_high" href="/2">Two</a></div>
  <div class="case"><a id="media_low" href="/3">Three</a></div>
  <div class="case layer"><div class="back"></div><a id="layer_dark" href="/4">Four</a></div>
  <div class="case grad"><a id="grad" href="/5">Five</a></div>
  <div class="case"><button id="slow" type="button">Six</button></div>
  <div class="case"><a id="styled" href="/7" style="color: #333333">Seven</a></div>
  <div class="case"><input id="field" aria-label="Field"></div>
</body></html>`;

const outcomes = (result) =>
  Object.fromEntries(
    (result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      [o.occurrenceOutcome, o.data.details.reasonCode]
    ])
  );

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, engineOptions, before) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      if (before) await p.evaluate(before);
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        engineOptions
      );
      const after = await p.evaluate(() => ({
        active: document.activeElement && document.activeElement.id,
        style: document.getElementById('styled')
          ? document.getElementById('styled').getAttribute('style')
          : null,
        bare:
          !!document.getElementById('var_low') &&
          document.getElementById('var_low').hasAttribute('style')
      }));
      return { result, after };
    } finally {
      await p.close();
    }
  }

  await t.test('the fixture: what jsdom fails still fails', async () => {
    const { result } = await scan(FIXTURE, { rules: { include: RULE_ID } });
    assert.deepEqual(summarize(result), {
      outcome: 'fail',
      findings: [
        ['fic_case_01', 'fail', 'lowContrast'],
        ['fic_case_02', 'fail', 'lowContrast'],
        ['fic_case_03', 'fail', 'lowContrast'],
        ['fic_case_06', 'cantTell', 'notComputable'],
        // Case 07's variable is never defined, so Chromium drops the whole
        // outline declaration: the focus rule removes the outline with
        // nothing in its place, which is css-focus-indicator-suppressed's case.
        ['fic_case_08', 'cantTell', 'oneSide'],
        ['fic_case_09', 'cantTell', 'notMeasured']
      ]
    });
  });

  await t.test('rendered values settle what the stylesheets alone cannot', async () => {
    const { result, after } = await scan(PAGE, { rules: { include: RULE_ID } }, () =>
      document.getElementById('field').focus()
    );
    assert.deepEqual(outcomes(result), {
      var_low: ['fail', 'lowContrast'],
      media_low: ['fail', 'lowContrast'],
      // White page around it, but a dark layer is painted right behind it.
      layer_dark: ['fail', 'lowContrast'],
      grad: ['cantTell', 'notComputable'],
      // Measured at its end value, not halfway through the transition.
      slow: ['fail', 'lowContrast']
    });
    // var_high and styled pass: black on white.
    assert.equal(after.active, 'field', 'focus goes back where it was');
    assert.equal(after.style, 'color: #333333', 'the style attribute is put back');
    assert.equal(after.bare, false, 'no style attribute is left on an element that had none');
  });

  await t.test('the same elements in jsdom are asked about, not failed', () => {
    const rule = runa11yCoreOnHtml(PAGE, {
      runOnly: { includeRuleIds: [RULE_ID] }
    }).checksResults.find((r) => r.ruleId === RULE_ID);
    const tiers = Object.fromEntries(
      rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome])
    );
    assert.equal(tiers.var_low, 'cantTell');
    assert.equal(tiers.media_low, 'cantTell');
  });

  await t.test('under the RGAA profile: WCAG 2.4.7 does not fail, RGAA 10.7 does', async () => {
    const html = PAGE.replace(
      /<body>[\s\S]*<\/body>/,
      '<body><div class="case"><a id="var_low" href="/1">One</a></div></body>'
    );
    const { result } = await scan(html, { profile: 'rgaa-4.1.2' });
    const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
    assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'fail');
    assert.notEqual(rollup('wcag-2.4.7-focus-visible').outcome, 'fail');
    assert.equal(rollup('rgaa-4.1.2-10.7').outcome, 'fail');
  });
});
