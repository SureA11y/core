'use strict';

/**
 * ctx.standard under a standard's profile: the key, name and version the run
 * targets, which a rule whose behaviour differs between versions reads.
 * Checked through a custom rule in both entry points, and through the sample
 * profile's sample-statement-link, which version 2.0 asks to find in the
 * footer. Run against the engine copy with the sample profile
 * (tests/helpers/sampleEngine.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { requireSample } = require('../helpers/sampleEngine');

const { runDomRulesInPage, runa11yCoreInPage } = requireSample('src/index.js');
const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');

function probe(tags, expected) {
  return {
    id: 'probe-standard',
    meta: { title: 'probe', tags, wcagSc: ['1.1.1'], type: 'automatic' },
    runInPage: `function runInPage(ctx) {
      const seen = ctx.standard ? JSON.stringify(ctx.standard) : 'null';
      return { outcome: seen === ${JSON.stringify(expected)} ? 'pass' : 'fail', occurrences: [] };
    }`
  };
}

function outcomes(engineOptions, rule) {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><p>x</p></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const options = { ...engineOptions, customRules: [rule] };
    return [runDomRulesInPage, runa11yCoreInPage].map((run) => {
      const r = run('https://example.test/', null, options).checksResults.find(
        (c) => c.ruleId === 'probe-standard'
      );
      return r ? r.outcome : 'not run';
    });
  } finally {
    dom.window.close();
  }
}

test("a standard's profile gives every rule its standard and version", () => {
  for (const version of ['1.0', '2.0']) {
    const standard = { key: 'sample', name: 'Sample Standard', version };
    for (const tags of [['sample'], ['wcag2a', 'wcag111']]) {
      assert.deepEqual(
        outcomes({ profile: `sample-${version}` }, probe(tags, JSON.stringify(standard))),
        ['pass', 'pass'],
        `${version} ${tags}`
      );
    }
  }
});

test('its rules chosen by tag, without its profile, see null', () => {
  assert.deepEqual(outcomes({ optInRules: 'sample' }, probe(['sample'], 'null')), ['pass', 'pass']);
});

test('ctx.standard cannot be changed by a rule', () => {
  const rule = {
    id: 'probe-standard',
    meta: { title: 'probe', tags: ['sample'], type: 'automatic' },
    runInPage: `function runInPage(ctx) {
      try { ctx.standard.version = 'x'; } catch (e) {}
      return { outcome: ctx.standard.version === '1.0' ? 'pass' : 'fail', occurrences: [] };
    }`
  };
  assert.deepEqual(outcomes({ profile: 'sample-1.0' }, rule), ['pass', 'pass']);
});

test("a profile's rule decides by the version its run targets", () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const outcome = (body, engineOptions) =>
    runa11yCoreOnHtml(page(body), { engineOptions }).checksResults.find(
      (r) => r.ruleId === 'sample-statement-link'
    ).outcome;
  const inMain = '<main><a href="/a11y">Accessibility statement</a></main>';
  const inFooter = '<main>x</main><footer><a href="/a11y">Accessibility statement</a></footer>';
  assert.equal(outcome(inMain, { profile: 'sample-1.0' }), 'pass');
  assert.equal(outcome(inMain, { profile: 'sample-2.0' }), 'fail');
  assert.equal(outcome(inFooter, { profile: 'sample-2.0' }), 'pass');
  // Chosen by tag, with no version named, it takes the lenient reading.
  assert.equal(outcome(inMain, { optInRules: 'sample' }), 'pass');
});
