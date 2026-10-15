'use strict';

/**
 * Content inside a closed popover. HTML's UA style sheet hides it
 * ([popover]:not(:popover-open) { display: none }), so it is not in the
 * accessibility tree and ACT's link and image rules don't apply to it; once
 * opened it is checked like any content. In a browser the engine reads
 * computed display and was already right. jsdom ships the UA rule but no
 * popover support, and reads :popover-open inconsistently: a closed
 * popover's display depended on which element was styled first, so a link
 * inside it failed link-name-present, and img-alt-present failed its image
 * in a full scan but not alone. Where the DOM has no showPopover, no popover
 * can be open, so the engine treats it as hidden.
 *
 * The Chromium cases are skipped when Playwright or its Chromium build is
 * not installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

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
const RULES = ['link-name-present', 'img-alt-present'];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

const CLOSED = 'L<a href="#" id="p" popover><img src="a.png"></a>';

const outcomes = (result) =>
  Object.fromEntries(
    result.checksResults.filter((c) => RULES.includes(c.ruleId)).map((c) => [c.ruleId, c.outcome])
  );

test('in jsdom, a closed popover is hidden, alone and in a full scan', () => {
  const expected = { 'link-name-present': 'notApplicable', 'img-alt-present': 'notApplicable' };
  for (const runOnly of [['link-name-present'], ['img-alt-present'], undefined]) {
    const got = outcomes(runa11yCoreOnHtml(page(CLOSED), { runOnly, entryPointParity: false }));
    for (const [ruleId, outcome] of Object.entries(got))
      assert.equal(outcome, expected[ruleId], ruleId);
  }
  // A dialog that is open and a popover is shown, and checked.
  const dialog = page('<dialog open popover><a href="#"><img src="a.png"></a></dialog>');
  assert.deepEqual(
    outcomes(runa11yCoreOnHtml(dialog, { runOnly: RULES, entryPointParity: false })),
    {
      'link-name-present': 'fail',
      'img-alt-present': 'fail'
    }
  );
});

// [name, html, script, expected outcome of both rules]
const CASES = [
  ['closed', CLOSED, '', 'notApplicable'],
  ['opened by showPopover()', CLOSED, 'p.showPopover()', 'fail'],
  ['shown, then hidden', CLOSED, 'p.showPopover(); p.hidePopover()', 'notApplicable'],
  [
    "closed, but shown by the author's CSS",
    '<style>[popover] { display: block; }</style>' + CLOSED,
    '',
    'fail'
  ]
];

for (const [name, html, script, expected] of CASES) {
  test(`a popover in Chromium: ${name}`, { skip }, async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const p = await browser.newPage();
      await p.setContent(page(html));
      if (script) await p.evaluate(script);
      await p.addScriptTag({ content: BUNDLE });
      const got = await p.evaluate(
        (rules) =>
          window.a11ycore
            .runa11yCoreInPage(location.href, null, {}, { includeRuleIds: rules })
            .checksResults.map((c) => [c.ruleId, c.outcome]),
        RULES
      );
      assert.deepEqual(Object.fromEntries(got), {
        'link-name-present': expected,
        'img-alt-present': expected
      });
    } finally {
      await browser.close();
    }
  });
}
