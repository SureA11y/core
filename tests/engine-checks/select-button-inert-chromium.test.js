'use strict';

/**
 * The button a customizable <select> draws itself with. HTML makes it
 * inert: "If a button element is the first child which is an element of a
 * select element, then it is inert." The select is the control, exposed as
 * a combobox with its name and options; the button is neither focusable nor
 * exposed. It was judged as a focusable button, so the spec's own markup
 * failed nested-interactive-controls-absent, and with `multiple` it failed
 * button-name-present too. Only the button is inert: a focusable element an
 * author puts inside it or inside an option is still a nested control, and
 * so is a button that isn't the select's first element.
 *
 * A legacy HTML parser, jsdom's among them, drops a <button> inside
 * <select>, so the jsdom cases build it with the DOM. The Chromium cases
 * parse it, and are skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

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

const { addBundle } = require('../helpers/browserBundle');
const RULES = [
  'nested-interactive-controls-absent',
  'button-name-present',
  'presentational-children-focusable-absent'
];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

const outcomes = (result) =>
  Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c.outcome]));

const BASE_SELECT = '<style>select, ::picker(select) { appearance: base-select; }</style>';

// [name, html, expected outcomes]
const CASES = [
  [
    'the spec markup',
    '<label>Fruit <select><button><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>',
    { 'nested-interactive-controls-absent': 'pass', 'button-name-present': 'notApplicable' }
  ],
  [
    'with appearance: base-select',
    BASE_SELECT +
      '<label>Fruit <select><button><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>',
    { 'nested-interactive-controls-absent': 'pass', 'button-name-present': 'notApplicable' }
  ],
  [
    'with tabindex on the button',
    '<label>Fruit <select><button tabindex="0"><selectedcontent></selectedcontent></button><option>Apple</option></select></label>',
    { 'nested-interactive-controls-absent': 'pass', 'button-name-present': 'notApplicable' }
  ],
  [
    'a list box with an empty button',
    '<label>Fruit <select multiple><button></button><option>Apple</option></select></label>',
    { 'nested-interactive-controls-absent': 'pass', 'button-name-present': 'notApplicable' }
  ],
  [
    'a link an author puts inside the button',
    '<label>Fruit <select><button><a href="/x">x</a><selectedcontent></selectedcontent></button><option>Apple</option></select></label>',
    { 'nested-interactive-controls-absent': 'fail' }
  ],
  // Anything focusable in the button is a nested control too, whatever its
  // role: HTML allows no tabindex and no interactive content in a button.
  ...[
    ['a tabindex span', '<span tabindex="0">i</span>'],
    ['an editable span', '<span contenteditable="true">e</span>'],
    ['a details', '<details><summary>More</summary>x</details>'],
    ['an audio player with controls', '<audio controls></audio>']
  ].map(([what, inner]) => [
    `${what} an author puts inside the button`,
    BASE_SELECT +
      `<label>Fruit <select><button>${inner}<selectedcontent></selectedcontent></button><option>Apple</option></select></label>`,
    { 'nested-interactive-controls-absent': 'fail' }
  ]),
  [
    'a link inside an option',
    BASE_SELECT +
      '<label>Fruit <select><option><a href="/x">Apple</a></option><option>Pear</option></select></label>',
    {
      'nested-interactive-controls-absent': 'fail',
      'presentational-children-focusable-absent': 'fail'
    }
  ],
  [
    'a button after the options',
    '<label>Fruit <select><option>Apple</option><button>Pick</button></select></label>',
    { 'nested-interactive-controls-absent': 'fail', 'button-name-present': 'pass' }
  ]
];

test('customizable select, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const [name, html, expected] of CASES) {
    await t.test(name, async () => {
      const p = await browser.newPage();
      try {
        await p.setContent(page(html));
        await addBundle(p);
        const got = await p.evaluate(
          (rules) =>
            window.a11ycore
              .runa11yCoreInPage(location.href, null, {}, { includeRuleIds: rules })
              .checksResults.map((c) => [c.ruleId, c.outcome]),
          RULES
        );
        const map = Object.fromEntries(got);
        for (const [ruleId, outcome] of Object.entries(expected)) {
          assert.equal(map[ruleId], outcome, `${ruleId}: ${JSON.stringify(map)}`);
        }
      } finally {
        await p.close();
      }
    });
  }
});

function selectWithButton(build) {
  const dom = new JSDOM(
    page('<label>Fruit <select id="s"><option>Apple</option></select></label>')
  );
  const doc = dom.window.document;
  const select = doc.getElementById('s');
  build(doc, select);
  return dom;
}

test('in jsdom, the select button built with the DOM is inert, and what is put in it is not', () => {
  const plain = selectWithButton((doc, select) => {
    const button = doc.createElement('button');
    button.appendChild(doc.createElement('selectedcontent'));
    select.insertBefore(button, select.firstChild);
  });
  assert.deepEqual(outcomes(runa11yCoreOnDom(plain, { runOnly: RULES })), {
    'nested-interactive-controls-absent': 'pass',
    'button-name-present': 'notApplicable',
    'presentational-children-focusable-absent': 'pass'
  });

  const withLink = selectWithButton((doc, select) => {
    const button = doc.createElement('button');
    const a = doc.createElement('a');
    a.href = '/x';
    a.textContent = 'x';
    button.appendChild(a);
    select.insertBefore(button, select.firstChild);
  });
  assert.equal(
    outcomes(runa11yCoreOnDom(withLink, { runOnly: RULES }))['nested-interactive-controls-absent'],
    'fail'
  );

  const second = selectWithButton((doc, select) => {
    const button = doc.createElement('button');
    button.textContent = 'Pick';
    select.appendChild(button);
  });
  assert.equal(
    outcomes(runa11yCoreOnDom(second, { runOnly: RULES }))['nested-interactive-controls-absent'],
    'fail'
  );
});
