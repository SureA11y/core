'use strict';

// What the engine takes from a rule's return, and what stays its own.

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';

function runCustom(type, returned) {
  const rule = {
    id: 'acme-x',
    meta: { title: 'X', type, tags: ['best-practice'] },
    runInPage: () => returned
  };
  return runa11yCoreOnHtml(PAGE, {
    runOnly: ['acme-x'],
    engineOptions: { customRules: [rule] }
  }).checksResults.find((r) => r.ruleId === 'acme-x');
}

// A rule's type is its meta's (#159): a different one in its return
// changes neither the coercion nor the result, and is noted in error.
test('a returned type does not change the rule type', () => {
  const automatic = runCustom('automatic', { outcome: 'fail', type: 'manual', occurrences: [] });
  assert.strictEqual(automatic.type, 'automatic');
  assert.strictEqual(automatic.outcome, 'fail');
  assert.match(automatic.error, /returned type "manual"; a rule's type comes from its meta/);

  const manual = runCustom('manual', { outcome: 'fail', type: 'automatic', occurrences: [] });
  assert.strictEqual(manual.type, 'manual');
  assert.strictEqual(manual.outcome, 'cantTell');
  assert.match(manual.error, /returned type "automatic"/);

  const same = runCustom('automatic', { outcome: 'pass', type: 'automatic', occurrences: [] });
  assert.strictEqual(same.error, undefined);
});

// The scan's options, the WCAG scope and the engine's notes are the
// engine's (#160): an engineOptions or wcagVersionScope in a rule's return
// is not taken, and a returned error keeps the engine's notes after it.
test('engine-owned fields are not taken from a rule’s return', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="a">x</p></main></body></html>';
  const run = (type, ret) =>
    runa11yCoreOnHtml(html, {
      runOnly: ['acme-x'],
      engineOptions: {
        customRules: [
          { id: 'acme-x', meta: { title: 'X', type, tags: ['best-practice'] }, runInPage: ret }
        ]
      }
    }).checksResults.find((r) => r.ruleId === 'acme-x');

  const own = run('automatic', (ctx) => ({
    outcome: 'fail',
    engineOptions: { output: { includeSelector: false, includeHtml: false } },
    wcagVersionScope: { removedSc: ['1.1.1'], target: '2.2' },
    occurrences: [{ __node: ctx.document.getElementById('a'), summary: 'x' }]
  }));
  assert.strictEqual(own.occurrences[0].selector, '#a');
  assert.match(own.occurrences[0].html, /<p id="a">/);
  assert.strictEqual('wcagVersionScope' in own, false);
  assert.strictEqual(own.engineOptions.output, undefined);

  const noted = run('manual', () => ({ outcome: 'fail', error: 'mine', occurrences: [] }));
  assert.strictEqual(noted.outcome, 'cantTell');
  assert.match(noted.error, /^mine \| Manual rules cannot return outcome=fail/);

  const coerced = run('manual', () => ({ outcome: 'fail', type: 'automatic', occurrences: [] }));
  assert.match(
    coerced.error,
    /returned type "automatic".*\| Manual rules cannot return outcome=fail/
  );
});

// An uncertainty code outside the closed set is left out, and error says
// which code it was.
test('an invalid uncertainty code is left out with a note', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="a">x</p></main></body></html>';
  const run = (code) =>
    runa11yCoreOnHtml(html, {
      runOnly: ['acme-x'],
      engineOptions: {
        customRules: [
          {
            id: 'acme-x',
            meta: { title: 'X', tags: ['best-practice'] },
            runInPage: (ctx) => ({
              outcome: 'cantTell',
              occurrences: [
                { __node: ctx.document.getElementById('a'), summary: 'x', uncertainty: { code } }
              ]
            })
          }
        ]
      }
    }).checksResults.find((r) => r.ruleId === 'acme-x');
  for (const code of ['NOT_A_CODE', 42, 'NOT_COMPUTABLE']) {
    const c = run(code);
    assert.strictEqual(c.occurrences[0].uncertainty, undefined);
    assert.ok(c.error.includes('uncertainty code ' + JSON.stringify(code)), c.error);
  }
  const ok = run('not-computable');
  assert.deepStrictEqual(ok.occurrences[0].uncertainty, { code: 'not-computable' });
  assert.strictEqual(ok.error, undefined);
});
