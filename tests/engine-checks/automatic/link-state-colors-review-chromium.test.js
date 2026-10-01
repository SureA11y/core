'use strict';

/**
 * link-state-colors-review in a real browser. Where the page has a layout,
 * the rule puts each link in its visited, hover, active and focus states and
 * reads the colors, so it passes or fails what jsdom can only ask about. The
 * tests check those verdicts, that the page's selectors, attributes and focus
 * are put back, and the WCAG and RGAA rollups side by side under the RGAA
 * profile.
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

const RULE_ID = 'link-state-colors-review';
const BUNDLE = fs.readFileSync(path.join(__dirname, '../../../surea11y.browser.js'), 'utf8');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

// Surrounding text is black on white; #f60 contrasts 8.4:1 with it.
function page(css, body) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>body{color:#000;background:#fff} p a{color:#f60;text-decoration:none} ${css}</style></head><body><main>${body}</main><input id="field" aria-label="Champ"></body></html>`;
}
const LINK = '<p>Lire <a id="l" href="/x">la suite</a> ici.</p>';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, engineOptions = { rules: { include: RULE_ID } }) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      const selectors = () =>
        [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n');
      const before = await p.evaluate(selectors);
      await p.evaluate(() => {
        const f = document.getElementById('field');
        if (f) f.focus();
      });
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        engineOptions
      );
      const after = await p.evaluate(selectors);
      const state = await p.evaluate(() => ({
        marked: document.querySelectorAll('[data-surea11y-link-state]').length,
        active: document.activeElement && document.activeElement.id
      }));
      assert.equal(after, before, 'the style rules are put back as they were');
      assert.equal(state.marked, 0, 'no state attribute is left behind');
      return { result, state };
    } finally {
      await p.close();
    }
  }

  const rule = (result) => result.checksResults.find((r) => r.ruleId === RULE_ID);
  const verdict = (result) => {
    const r = rule(result);
    return {
      outcome: r.outcome,
      findings: (r.occurrences || []).map((o) => [
        (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
        o.occurrenceOutcome,
        o.data.details.reasonCode,
        o.data.details.states
      ])
    };
  };

  await t.test('the fixture', async () => {
    const { result } = await scan(FIXTURE);
    assert.deepEqual(verdict(result), {
      outcome: 'fail',
      findings: [
        ['lscr_case_01', 'fail', 'STATE_CONTRAST_LOW', ['visited']],
        // The focus rule changes the color too, but the browser's focus ring
        // still marks that state by more than color.
        ['lscr_case_02', 'fail', 'STATE_CONTRAST_LOW', ['hover']],
        ['lscr_case_03', 'cantTell', 'BROWSER_STATE_COLORS', []]
      ]
    });
  });

  await t.test('each state below 3:1 fails, and is named', async () => {
    for (const [css, states] of [
      ['a:visited{color:#333}', ['visited']],
      ['a:hover{color:#222}', ['hover']],
      ['a:active{color:#222}', ['active']],
      ['a:focus{color:#222;outline:none}', ['focus']],
      ['a:focus-visible{color:#222;outline:none}', ['focus']],
      // :hover on an ancestor matches while the link is hovered.
      ['p:hover a{color:#222}', ['hover']],
      // In the visited state :link no longer matches, wherever it sits.
      ['a:visited{color:#333} p a:link{color:#f60}', ['visited']],
      ['@media (min-width: 1px){a:hover{color:#222}}', ['hover']]
    ]) {
      const { result } = await scan(page(css, LINK));
      assert.deepEqual(
        verdict(result),
        {
          outcome: 'fail',
          findings: [['l', 'fail', 'STATE_CONTRAST_LOW', states]]
        },
        css
      );
    }
  });

  // #595959 on black is 2.998:1: below 3, so it fails, and it must not read 3.00.
  await t.test('a ratio just below 3 fails and reads 2.99', async () => {
    const { result } = await scan(page('a:hover{color:#595959}', LINK));
    const occ = rule(result).occurrences[0];
    assert.equal(occ.occurrenceOutcome, 'fail');
    assert.equal(occ.i18n.params.ratio, '2.99');
  });

  await t.test('states that keep 3:1, add a mark or keep the color pass', async () => {
    for (const css of [
      'a:hover,a:focus{color:#09f}',
      'a:hover{color:#222;text-decoration:underline}',
      'a:focus{color:#222}',
      'a:visited{color:#f60}',
      ''
    ]) {
      const { result, state } = await scan(page(css, LINK));
      assert.equal(rule(result).outcome, 'pass', css);
      assert.equal(state.active, 'field', 'focus goes back where it was');
    }
  });

  await t.test('jsdom asks about what the browser fails', async () => {
    const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
    const r = runa11yCoreOnHtml(page('a:hover{color:#222}', LINK), {
      runOnly: { includeRuleIds: [RULE_ID] }
    }).checksResults.find((x) => x.ruleId === RULE_ID);
    assert.equal(r.outcome, 'cantTell');
  });

  await t.test('under the RGAA profile: WCAG 1.4.1 does not fail, RGAA 10.6 does', async () => {
    const { result } = await scan(page('a:hover{color:#222}', LINK), { profile: 'rgaa-4.1.2' });
    const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id).outcome;
    assert.equal(rule(result).outcome, 'fail');
    assert.notEqual(rollup('wcag-1.4.1-use-of-color'), 'fail');
    assert.equal(rollup('rgaa-4.1.2-10.6'), 'fail');
  });
});
