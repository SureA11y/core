'use strict';

/**
 * The integrator's API: what the eighth stress test found (round 8, PK-*,
 * RO-*, NW-*). Selection lists given as a Set, criteria WCAG 2.2 removed,
 * the caller's English messages, the catalog under strictOptions, reporter
 * switches, standard data, profile lists, timestamps and page values quoted
 * whole.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const core = require('../src/index.js');
const { runa11yCoreOnHtml } = require('../src/testing.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';

// Runs `fn` with window/document set to a page of `html`, console.warn
// collected rather than printed.
function withPage(html, fn) {
  const dom = new JSDOM(html);
  const saved = { window: global.window, document: global.document, warn: console.warn };
  const warnings = [];
  global.window = dom.window;
  global.document = dom.window.document;
  console.warn = (...a) => warnings.push(a.map(String).join(' '));
  try {
    return fn(warnings, dom.window);
  } finally {
    global.window = saved.window;
    global.document = saved.document;
    console.warn = saved.warn;
  }
}

test('runOnly { type, values } reads a Set of names as its list (PK-2)', () => {
  withPage(HTML, () => {
    const ids = (ro) =>
      core.runDomRulesInPage(null, null, {}, ro).checksResults.map((c) => c.ruleId);
    assert.deepEqual(ids({ type: 'rule', values: new Set(['img-alt-present']) }), [
      'img-alt-present'
    ]);
    assert.deepEqual(
      ids({ type: 'tag', values: new Set(['wcag2a']) }).sort(),
      ids({ type: 'tag', values: ['wcag2a'] }).sort()
    );
    assert.deepEqual(ids({ includeRuleIds: new Set(['img-alt-present']) }), ['img-alt-present']);
    assert.throws(
      () =>
        core.runDomRulesInPage(null, null, {}, { type: 'rule', values: new Set(['no-such-rule']) }),
      { code: 'INVALID_RUN_ONLY' }
    );
    assert.deepEqual(
      core
        .getChecksForRunOnly({ type: 'rule', values: new Set(['img-alt-present']) })
        .map((d) => d.ruleId),
      ['img-alt-present']
    );
  });
});

test('a custom or pack rule mapped only to 4.1.1 does not fail a WCAG 2.2 scan (PK-3)', () => {
  const { definePack } = require('../src/pack.js');
  const page = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';
  const meta = {
    title: 'Parsing check',
    description: 'd',
    tags: ['wcag2a', 'wcag411'],
    wcagSc: ['4.1.1']
  };
  const run = () => ({ outcome: 'fail', occurrences: [{ selector: 'p' }] });
  const pack = definePack({
    name: 'acme-pack',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [{ id: 'acme-parse', meta, runInPage: run }]
  });
  for (const [id, eo] of [
    ['org-parse', { customRules: [{ id: 'org-parse', meta, runInPage: run }] }],
    ['acme-parse', { packs: [pack] }]
  ]) {
    const r = runa11yCoreOnHtml(page, { engineOptions: { ...eo, profile: 'wcag22-aa' } });
    const c = r.checksResults.find((x) => x.ruleId === id);
    assert.equal(c.outcome, 'cantTell', id);
    assert.deepEqual(c.wcagVersionScope.removedSc, ['4.1.1'], id);
    const rollup = r.rulesResults.find((x) => x.ruleId === 'wcag-4.1.1-parsing');
    assert.equal(rollup.outcome, 'cantTell', id);
  }
  // Beside a criterion 2.2 keeps, the fail stands.
  const both = { ...meta, tags: ['wcag2a', 'wcag411', 'wcag111'], wcagSc: ['4.1.1', '1.1.1'] };
  const r = runa11yCoreOnHtml(page, {
    engineOptions: { customRules: [{ id: 'org-both', meta: both, runInPage: run }] },
    runOnly: ['org-both']
  });
  assert.equal(r.checksResults[0].outcome, 'fail');
});
