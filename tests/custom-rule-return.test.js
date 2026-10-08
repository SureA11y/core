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

// An applicability that was given but can't be used is no applicability:
// the rule is skipped with a reason, as for runInPage, instead of applying
// everywhere.
test('a custom rule with an unusable applicability is skipped', () => {
  const run = (applicability, runOnly = ['acme-x']) => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      return runa11yCoreOnHtml(PAGE, {
        runOnly,
        engineOptions: {
          customRules: [
            {
              id: 'acme-x',
              meta: { title: 'X', tags: ['best-practice'] },
              applicability,
              runInPage: () => ({ outcome: 'fail', occurrences: [] })
            }
          ]
        }
      });
    } finally {
      console.warn = warn;
    }
  };
  for (const [applicability, reason] of [
    ['function (ctx) { return ', 'applicability source could not be turned back into a function'],
    ['42', 'applicability source could not be turned back into a function'],
    [5, 'applicability is not a function'],
    [{}, 'applicability is not a function']
  ]) {
    // Selected by id, a skipped rule is a name runOnly can't use.
    assert.throws(() => run(applicability), { code: 'INVALID_RUN_ONLY' });
    const r = run(applicability, ['region']);
    assert.strictEqual(
      r.checksResults.find((c) => c.ruleId === 'acme-x'),
      undefined
    );
    assert.deepStrictEqual(r.skippedCustomRules, [{ id: 'acme-x', reason }]);
  }
  for (const applicability of [undefined, null, '', '  ']) {
    assert.strictEqual(run(applicability).checksResults[0].outcome, 'fail');
  }
  assert.strictEqual(run('(ctx) => false').checksResults[0].outcome, 'notApplicable');
});

// Custom rules that vanished without a trace: given as one object instead of
// a list, with the id "__proto__", tags given as a string, and a runOnly
// that names only a rule that was skipped.
test('custom rules no longer vanish without a trace', () => {
  const rule = (id, extra) =>
    Object.assign(
      {
        id,
        meta: { title: 'X', tags: ['best-practice'] },
        runInPage: () => ({ outcome: 'fail', occurrences: [] })
      },
      extra || {}
    );
  const warn = console.warn;
  console.warn = () => {};
  try {
    const single = runa11yCoreOnHtml(PAGE, {
      engineOptions: { customRules: rule('acme-one') },
      runOnly: ['region']
    });
    assert.deepStrictEqual(single.skippedCustomRules, [
      {
        id: 'acme-one',
        reason: 'customRules is not an array; give the rules as a list, such as [rule]'
      }
    ]);

    const proto = runa11yCoreOnHtml(PAGE, {
      engineOptions: { customRules: [rule('__proto__')] },
      runOnly: ['__proto__']
    });
    assert.deepStrictEqual(
      proto.checksResults.map((c) => [c.ruleId, c.outcome]),
      [['__proto__', 'fail']]
    );

    const tagged = runa11yCoreOnHtml(PAGE, {
      engineOptions: {
        customRules: [rule('acme-t', { meta: { title: 'X', tags: 'mytag, other' } })]
      },
      runOnly: { tags: ['mytag'] }
    });
    const t = tagged.checksResults.find((c) => c.ruleId === 'acme-t');
    assert.strictEqual(t.outcome, 'fail');
    assert.ok(t.meta.tags.includes('mytag') && t.meta.tags.includes('other'));

    assert.throws(
      () =>
        runa11yCoreOnHtml(PAGE, {
          engineOptions: { customRules: [rule('acme-bad', { runInPage: 5 })] },
          runOnly: ['acme-bad']
        }),
      {
        code: 'INVALID_RUN_ONLY',
        message:
          'runOnly: no rule or tag named "acme-bad" (a custom rule that was skipped: runInPage is not a function).'
      }
    );
  } finally {
    console.warn = warn;
  }
});

// Ids that differ only in case name one rule (#165): a custom rule spelt
// like a built-in in another case overrides it under the built-in's id, and
// a second custom rule in another case is skipped as a duplicate.
test('a custom rule id in another case overrides the built-in, and says so', () => {
  const { getCheckDefById } = require('../src/index.js');
  const rule = (id) => ({
    id,
    meta: { title: id, tags: ['best-practice'] },
    runInPage: (ctx) => ({ ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] })
  });
  const customRules = [rule('IMG-ALT-PRESENT'), rule('acme-x'), rule('Acme-X')];
  const warnings = [];
  const warn = console.warn;
  console.warn = (...a) => warnings.push(a.join(' '));
  let result;
  try {
    result = runa11yCoreOnHtml(PAGE, {
      runOnly: ['img-alt-present', 'acme-x'],
      engineOptions: { customRules }
    });
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(
    result.checksResults.map((c) => [c.ruleId, c.outcome, c.title]),
    [
      ['img-alt-present', 'fail', 'IMG-ALT-PRESENT'],
      ['acme-x', 'fail', 'acme-x']
    ]
  );
  assert.deepEqual(result.overriddenBuiltinIds, ['img-alt-present']);
  assert.deepEqual(result.skippedCustomRules, [
    { id: 'Acme-X', reason: 'another custom rule already has this id, as "acme-x"' }
  ]);
  assert.ok(
    warnings.includes(
      '[surea11y] customRules: "IMG-ALT-PRESENT" differs from the built-in rule "img-alt-present" only in case; it overrides it, as "img-alt-present".'
    ),
    warnings.join('\n')
  );
  // The catalog given the same options agrees.
  assert.equal(getCheckDefById('img-alt-present', { customRules }).title, 'IMG-ALT-PRESENT');
  // Selection stays exact.
  assert.throws(
    () => runa11yCoreOnHtml(PAGE, { runOnly: ['IMG-ALT-PRESENT'], engineOptions: { customRules } }),
    { code: 'INVALID_RUN_ONLY' }
  );
});
