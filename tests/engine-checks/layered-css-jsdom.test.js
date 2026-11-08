'use strict';

/**
 * jsdom's getComputedStyle reads no rule inside @layer, @supports or
 * @container, so a Tailwind v4 page, whose `hidden`, `invisible` and
 * `sr-only` utilities are in @layer utilities, hid nothing under jsdom.
 * Without a layout the engine applies the cascade jsdom leaves out to the
 * properties it reads to tell whether an element is shown, and each page
 * here gets the verdicts Chromium gives it.
 *
 * The Chromium test is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { addBundle } = require('../helpers/browserBundle');

// Tailwind v4's layers, its preflight's rule for [hidden], and its utilities.
const CSS = `@layer theme, base, components, utilities;
@layer base { *, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0 }
  [hidden]:where(:not([hidden="until-found"])) { display: none !important } }
@layer utilities {
  .hidden { display: none } .block { display: block }
  .invisible { visibility: hidden } .visible { visibility: visible }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border-width: 0 }
  .not-sr-only { position: static; width: auto; height: auto; overflow: visible; clip-path: none }
}
@supports (display: grid) { .supports-hide { display: none } }
@supports not (display: grid) { .supports-not-hide { display: none } }
@supports selector(:has(a)) { .selector-hide { display: none } }
@container (min-width: 1px) { .container-hide { display: none } }
.unlayered { display: block }
@layer utilities { .unlayered { display: none } }`;

const SEARCH = (cls) =>
  `<label class="${cls}" for="a">Search</label><input id="a"><label for="b">Search</label><input id="b">`;

// [body, expected outcome of each rule that applies], as Chromium gives them.
const CASES = {
  hidden: ['<button class="hidden"></button>', {}],
  invisible: ['<button class="invisible"></button>', {}],
  'invisible, inherited': ['<div class="invisible"><button></button></div>', {}],
  'visible under invisible': [
    '<div class="invisible"><button class="visible"></button></div>',
    { 'button-name-present': 'fail' }
  ],
  'the style attribute over a layer': [
    '<button class="hidden" style="display:inline-block"></button>',
    { 'button-name-present': 'fail' }
  ],
  'an unlayered rule over a layer': [
    '<button class="unlayered"></button>',
    { 'button-name-present': 'fail' }
  ],
  'sr-only label': [SEARCH('sr-only'), {}],
  'not-sr-only label': [
    SEARCH('sr-only not-sr-only'),
    { 'form-control-label-quality': 'cantTell' }
  ],
  '@supports that holds': ['<button class="supports-hide"></button>', {}],
  '@supports not': [
    '<button class="supports-not-hide"></button>',
    { 'button-name-present': 'fail' }
  ],
  '@supports selector()': ['<button class="selector-hide"></button>', {}],
  '@container without a container': [
    '<button class="container-hide"></button>',
    { 'button-name-present': 'fail' }
  ]
};
const RULES = ['button-name-present', 'form-control-label-quality'];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title><style>${CSS}</style></head>` +
  `<body><main>${body}</main></body></html>`;

const outcomes = (checks) =>
  Object.fromEntries(
    checks.filter((c) => c.outcome !== 'notApplicable').map((c) => [c.ruleId, c.outcome])
  );

for (const [name, [body, expected]] of Object.entries(CASES)) {
  test(`layered and conditional CSS under jsdom: ${name}`, () => {
    const result = runa11yCoreOnHtml(page(body), { runOnly: RULES });
    assert.deepEqual(outcomes(result.checksResults), expected);
  });
}

test('layered and conditional CSS: the same verdicts in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [name, [body, expected]] of Object.entries(CASES)) {
    const p = await browser.newPage();
    await p.setContent(page(body));
    await addBundle(p);
    const checks = await p.evaluate(
      (rules) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, rules)
          .checksResults.map((c) => ({ ruleId: c.ruleId, outcome: c.outcome })),
      RULES
    );
    await p.close();
    assert.deepEqual(outcomes(checks), expected, name);
  }
});
