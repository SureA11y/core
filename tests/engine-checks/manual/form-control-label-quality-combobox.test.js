'use strict';

// form-control-label-quality: a combobox and its own popup that share a
// label are one field, not each other's duplicate. Other fields with the
// same label are still asked about (round 11, B11-12). Each case runs under
// jsdom and in Chromium.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('../../helpers/chromium');
const { addBundle } = require('../../helpers/browserBundle');

const RULE_ID = 'form-control-label-quality';

const LB = '<div role="option" aria-selected="true">Apple</div><div role="option">Pear</div>';

// [label, body, ids reported as DUPLICATE_LABEL_TEXT]
const CASES = [
  [
    'select-only combobox, expanded, controls its listbox',
    `<label id="cl">Favorite fruit</label><div id="cb" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-labelledby="cl" aria-controls="lb" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" tabindex="-1">${LB}</div>`,
    []
  ],
  [
    'combobox owns its listbox',
    `<label id="cl">Favorite fruit</label><div id="cb" role="combobox" aria-expanded="true" aria-labelledby="cl" aria-owns="lb" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" tabindex="-1">${LB}</div>`,
    []
  ],
  [
    'the listbox points back at its combobox',
    `<label id="cl">Favorite fruit</label><div id="cb" role="combobox" aria-expanded="true" aria-labelledby="cl" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" aria-controls="cb" tabindex="-1">${LB}</div>`,
    []
  ],
  [
    'a third field with the same label is still asked about',
    `<label id="cl">Favorite fruit</label><div id="cb" role="combobox" aria-expanded="true" aria-labelledby="cl" aria-controls="lb" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" tabindex="-1">${LB}</div><label for="other">Favorite fruit</label><input id="other" type="text">`,
    ['cb', 'lb', 'other']
  ],
  [
    'a listbox the combobox does not reference is still asked about',
    `<label id="cl">Favorite fruit</label><div id="cb" role="combobox" aria-expanded="true" aria-labelledby="cl" tabindex="0">Apple</div><div role="listbox" id="lb" aria-labelledby="cl" tabindex="-1">${LB}</div>`,
    ['cb', 'lb']
  ],
  [
    'two comboboxes with the same label are still asked about',
    `<label id="cl">Fruit</label><div id="cb" role="combobox" aria-labelledby="cl" aria-controls="cb2" tabindex="0">Apple</div><div id="cb2" role="combobox" aria-labelledby="cl" tabindex="0">Pear</div>`,
    ['cb', 'cb2']
  ]
];

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function summarize(r) {
  return r.occurrences
    .filter((o) => o.data.details.reasonCode === 'DUPLICATE_LABEL_TEXT')
    .map((o) => /id="([^"]+)"/.exec(o.html)[1]);
}

test(`${RULE_ID}: a combobox and its popup are one field (jsdom)`, () => {
  for (const [label, body, want] of CASES) {
    const r = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }).checksResults.find(
      (c) => c.ruleId === RULE_ID
    );
    assert.deepEqual(summarize(r), want, label);
  }
});

test(`${RULE_ID}: a combobox and its popup are one field (Chromium)`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const pg = await browser.newPage();
  for (const [label, body, want] of CASES) {
    await pg.setContent(page(body));
    await addBundle(pg);
    const occ = await pg.evaluate(
      (ruleId) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, [ruleId])
          .checksResults.find((c) => c.ruleId === ruleId)
          .occurrences.map((o) => ({ html: o.html, data: o.data })),
      RULE_ID
    );
    assert.deepEqual(summarize({ occurrences: occ }), want, label);
  }
});
