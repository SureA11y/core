'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

// engineOptions.customRules: same module shape as an internal rule file
// ({ id, meta, runInPage, applicability?, data? }), registered per-call (not a
// mutable global registry like the reference engine's configure() -- matches a11y-core's
// existing "fresh engineOptions per call" design). runInPage/applicability may
// be a real function (same-realm callers) or a function-source string
// (required for cross-realm callers, e.g. Playwright's page.evaluate, whose
// engineOptions argument crosses a JSON/structured-clone boundary that can't
// carry a live Function reference).

const HTML = `<!doctype html><html><body><div id="target"></div></body></html>`;

test('customRules: a real function reference runs and produces a normalized fail occurrence', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{
        id: 'my-custom-rule',
        meta: { title: 'My custom rule', tags: ['custom'], defaultSeverity: 'serious' },
        runInPage(ctx) {
          const el = ctx.document.getElementById('target');
          return el ? { outcome: 'fail', occurrences: [{ __node: el }] } : { outcome: 'notApplicable', occurrences: [] };
        }
      }]
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
  const runInPageSrc = (function (ctx) {
    const el = ctx.document.getElementById('target');
    return el ? { outcome: 'fail', occurrences: [{ __node: el }] } : { outcome: 'notApplicable', occurrences: [] };
  }).toString();

  const applicabilitySrc = (function (ctx) {
    return !!ctx.document.getElementById('target');
  }).toString();

  // Round-trip through JSON to prove these survive an actual serialization
  // boundary, not just "happen to still be a function in the same process".
  const engineOptions = JSON.parse(JSON.stringify({
    customRules: [{
      id: 'string-sourced-rule',
      meta: { title: 'String-sourced rule', tags: ['custom'] },
      runInPage: runInPageSrc,
      applicability: applicabilitySrc
    }]
  }));

  const result = runa11yCoreOnHtml(HTML, { engineOptions });
  const r = result.checksResults.find((x) => x.ruleId === 'string-sourced-rule');
  assert.ok(r, 'custom rule appears in checksResults');
  assert.strictEqual(r.outcome, 'fail');
});

test('customRules: applicability(ctx) returning false yields notApplicable, matching built-in rule semantics', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{
        id: 'never-applicable-rule',
        meta: { title: 'Never applicable' },
        applicability() { return false; },
        runInPage() { return { outcome: 'fail', occurrences: [{}] }; }
      }]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'never-applicable-rule');
  assert.strictEqual(r.outcome, 'notApplicable');
});

test('customRules: a throwing runInPage is contained as cantTell, not a crash, same as a built-in rule', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{
        id: 'throwing-rule',
        meta: { title: 'Throws' },
        runInPage() { throw new Error('boom'); }
      }]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'throwing-rule');
  assert.strictEqual(r.outcome, 'cantTell');
  assert.match(r.error || '', /boom/);
});

test('customRules: an invalid entry (unresolvable runInPage) is silently skipped, and the rest of the scan still runs', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [
        { id: 'bad-rule', runInPage: 'not a function at all' },
        { runInPage() { return { outcome: 'pass', occurrences: [] }; } } // missing id entirely
      ]
    }
  });

  assert.ok(!result.checksResults.some((x) => x.ruleId === 'bad-rule'));
  // built-in rules still ran normally
  assert.ok(result.checksResults.length > 100);
});

test('customRules: a custom rule id colliding with a built-in one overrides it for that scan (the reference engine configure()-like semantics)', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{
        id: 'a11ycore-img-alt-present',
        meta: { title: 'Overridden' },
        runInPage() { return { outcome: 'pass', occurrences: [] }; }
      }]
    }
  });

  const matches = result.checksResults.filter((x) => x.ruleId === 'a11ycore-img-alt-present');
  assert.strictEqual(matches.length, 1, 'override replaces, does not duplicate, the built-in entry');
  assert.strictEqual(matches[0].outcome, 'pass');
  assert.strictEqual(matches[0].title, 'Overridden');
});

test('customRules: meta gets the same defaulting as a build-time rule module (severity/confidence/tags/type)', () => {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: {
      customRules: [{
        id: 'minimal-meta-rule',
        runInPage() { return { outcome: 'pass', occurrences: [] }; }
      }]
    }
  });

  const r = result.checksResults.find((x) => x.ruleId === 'minimal-meta-rule');
  assert.strictEqual(r.severity, 'moderate');
  assert.strictEqual(r.confidence, 'medium');
  assert.strictEqual(r.type, 'automatic');
  assert.ok(r.title);
});
