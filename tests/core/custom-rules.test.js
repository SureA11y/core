'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

// engineOptions.customRules: same module shape as an internal rule file
// ({ id, meta, runInPage, applicability?, data? }), registered per-call (not a
// mutable global registry -- matches surea11y's "fresh engineOptions per
// call" design). runInPage/applicability may
// be a real function (same-realm callers) or a function-source string
// (required for cross-realm callers, e.g. Playwright's page.evaluate, whose
// engineOptions argument crosses a JSON/structured-clone boundary that can't
// carry a live Function reference).

const HTML = `<!doctype html><html><body><div id="target"></div></body></html>`;

test('customRules: a real function reference runs and produces a normalized fail occurrence', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'my-custom-rule',
          meta: { title: 'My custom rule', tags: ['custom'], defaultSeverity: 'serious' },
          runInPage(ctx) {
            const el = ctx.document.getElementById('target');
            return el
              ? { outcome: 'fail', occurrences: [{ __node: el }] }
              : { outcome: 'notApplicable', occurrences: [] };
          }
        }
      ]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'my-custom-rule');
  assert.ok(r, 'custom rule appears in checksResults');
  assert.strictEqual(r.outcome, 'fail');
  assert.strictEqual(r.severity, 'serious');
  assert.strictEqual(r.occurrences[0].selector, '#target');
  assert.deepStrictEqual(r.occurrences[0].structuralPath, [1, 0]);
});

test('customRules: runInPage/applicability given as function-source strings (the cross-realm shape) work identically', () => {
  const runInPageSrc = function (ctx) {
    const el = ctx.document.getElementById('target');
    return el
      ? { outcome: 'fail', occurrences: [{ __node: el }] }
      : { outcome: 'notApplicable', occurrences: [] };
  }.toString();

  const applicabilitySrc = function (ctx) {
    return !!ctx.document.getElementById('target');
  }.toString();

  // Round-trip through JSON to prove these survive an actual serialization
  // boundary, not just "happen to still be a function in the same process".
  const engineOptions = JSON.parse(
    JSON.stringify({
      customRules: [
        {
          id: 'string-sourced-rule',
          meta: { title: 'String-sourced rule', tags: ['custom'] },
          runInPage: runInPageSrc,
          applicability: applicabilitySrc
        }
      ]
    })
  );

  const result = runa11yCoreOnHtml(HTML, { engineOptions });
  const r = result.checksResults.find((x) => x.ruleId === 'string-sourced-rule');
  assert.ok(r, 'custom rule appears in checksResults');
  assert.strictEqual(r.outcome, 'fail');
});

test('customRules: applicability(ctx) returning false yields notApplicable, matching built-in rule semantics', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'never-applicable-rule',
          meta: { title: 'Never applicable' },
          applicability() {
            return false;
          },
          runInPage() {
            return { outcome: 'fail', occurrences: [{}] };
          }
        }
      ]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'never-applicable-rule');
  assert.strictEqual(r.outcome, 'notApplicable');
});

test('customRules: a throwing runInPage is contained as cantTell, not a crash, same as a built-in rule', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'throwing-rule',
          meta: { title: 'Throws' },
          runInPage() {
            throw new Error('boom');
          }
        }
      ]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'throwing-rule');
  assert.strictEqual(r.outcome, 'cantTell');
  assert.match(r.error || '', /boom/);
});

test('customRules: an invalid entry (unresolvable runInPage) is skipped with a warning, and the rest of the scan still runs', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        { id: 'bad-rule', runInPage: 'not a function at all' },
        {
          runInPage() {
            return { outcome: 'pass', occurrences: [] };
          }
        } // missing id entirely
      ]
    }
  });

  assert.ok(!result.checksResults.some((x) => x.ruleId === 'bad-rule'));
  // built-in rules still ran normally
  assert.ok(result.checksResults.length > 100);
  const warnings = warn.mock.calls.map((c) => c.arguments.join(' '));
  assert.ok(warnings.some((w) => /skipped rule "bad-rule".*could not be turned back/.test(w)));
  assert.ok(warnings.some((w) => /skipped a rule \(no id\)/.test(w)));
});

test('customRules: a method written in shorthand survives toString(), as the docs example does', () => {
  const methods = {
    runInPage(ctx) {
      const el = ctx.document.getElementById('target');
      return { outcome: 'fail', occurrences: [{ __node: el }] };
    },
    async asyncRun() {
      return { outcome: 'pass', occurrences: [] };
    },
    applicability(ctx) {
      return !!ctx.document.getElementById('target');
    }
  };
  class Rule {
    runInPage() {
      return { outcome: 'pass', occurrences: [] };
    }
  }
  const sources = {
    shorthand: methods.runInPage.toString(),
    asyncShorthand: methods.asyncRun.toString(),
    classMethod: Rule.prototype.runInPage.toString()
  };
  assert.ok(sources.shorthand.startsWith('runInPage('), 'the shape this test is about');

  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'shorthand',
          meta: { title: 'Shorthand' },
          runInPage: sources.shorthand,
          applicability: methods.applicability.toString()
        },
        { id: 'class-method', meta: { title: 'Class' }, runInPage: sources.classMethod }
      ],
      runOnly: ['shorthand', 'class-method']
    }
  });
  const byId = (id) => result.checksResults.find((x) => x.ruleId === id);
  assert.strictEqual(byId('shorthand').outcome, 'fail');
  assert.strictEqual(byId('shorthand').occurrences.length, 1);
  assert.strictEqual(byId('class-method').outcome, 'pass');

  // An async method revives as a function; what it returns is another matter.
  const asyncResult = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{ id: 'async-shorthand', meta: {}, runInPage: sources.asyncShorthand }]
    }
  });
  assert.ok(asyncResult.checksResults.some((x) => x.ruleId === 'async-shorthand'));
});

test('customRules: a meta that fails validation skips that rule, not the scan', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const ok = () => ({ outcome: 'pass', occurrences: [] });
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        { id: 'bad-deprecated', meta: { deprecated: true }, runInPage: ok },
        { id: 'bad-i18n', meta: { i18n: {} }, runInPage: ok },
        { id: 'good', meta: { title: 'Good' }, runInPage: ok }
      ]
    }
  });

  const ids = result.checksResults.map((x) => x.ruleId);
  assert.ok(!ids.includes('bad-deprecated'));
  assert.ok(!ids.includes('bad-i18n'));
  assert.ok(ids.includes('good'));
  assert.ok(result.checksResults.length > 100, 'built-in rules still ran');
  const warnings = warn.mock.calls.map((c) => c.arguments.join(' '));
  assert.ok(warnings.some((w) => /skipped rule "bad-deprecated" \(invalid meta: /.test(w)));
  assert.ok(warnings.some((w) => /skipped rule "bad-i18n" \(invalid meta: /.test(w)));
});

test('customRules: a custom rule id colliding with a built-in one overrides it for that scan (reference-engine configure()-like semantics)', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'img-alt-present',
          meta: { title: 'Overridden' },
          runInPage() {
            return { outcome: 'pass', occurrences: [] };
          }
        }
      ]
    }
  });

  const matches = result.checksResults.filter((x) => x.ruleId === 'img-alt-present');
  assert.strictEqual(
    matches.length,
    1,
    'override replaces, does not duplicate, the built-in entry'
  );
  assert.strictEqual(matches[0].outcome, 'pass');
  assert.strictEqual(matches[0].title, 'Overridden');
});

test('customRules: an id collision with a built-in rule is surfaced via overriddenBuiltinIds and a console.warn, whether intentional or not', () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  let result;
  try {
    result = runa11yCoreOnHtml(HTML, {
      engineOptions: {
        customRules: [
          {
            id: 'img-alt-present',
            runInPage() {
              return { outcome: 'pass', occurrences: [] };
            }
          }
        ]
      }
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.deepStrictEqual(result.overriddenBuiltinIds, ['img-alt-present']);
  assert.ok(
    warnings.some((w) => w.includes('img-alt-present')),
    'console.warn should name the overridden rule id'
  );
});

test('customRules: a non-colliding custom rule id leaves overriddenBuiltinIds empty and warns nothing', () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  let result;
  try {
    result = runa11yCoreOnHtml(HTML, {
      engineOptions: {
        customRules: [
          {
            id: 'my-brand-new-custom-rule',
            runInPage() {
              return { outcome: 'pass', occurrences: [] };
            }
          }
        ]
      }
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.deepStrictEqual(result.overriddenBuiltinIds, []);
  assert.strictEqual(warnings.length, 0);
});

test('customRules: meta gets the same defaulting as a build-time rule module (severity/confidence/tags/type)', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        {
          id: 'minimal-meta-rule',
          runInPage() {
            return { outcome: 'pass', occurrences: [] };
          }
        }
      ]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'minimal-meta-rule');
  assert.strictEqual(r.severity, 'moderate');
  assert.strictEqual(r.confidence, 'medium');
  assert.strictEqual(r.type, 'automatic');
  assert.ok(r.title);
});
