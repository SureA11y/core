'use strict';

/**
 * The sample profile as a pack (tests/fixtures/packs/sample.js), passed to a
 * scan in engineOptions.packs, gives the results and catalog of the engine
 * copy built with the sample profile (tests/helpers/sampleEngine.js): a
 * standard from outside core does what a built-in one does. The one
 * difference is meant: a pack's rule links the help it declares, where the
 * built copy links core's RULE_CATALOG.md, which doesn't describe it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const main = require('../../src/index.js');
const { requireSample } = require('../helpers/sampleEngine');
const pack = require('../fixtures/packs/sample.js');

const sample = requireSample('src/index.js');
const FIXTURES = path.join(__dirname, '..', 'fixtures');
const TIMESTAMP = '2026-10-08T00:00:00.000Z';

const PAGE =
  '<html lang="en"><head><title>Report</title></head><body><main>' +
  '<img src="a.png"><h1>Quarterly results</h1><h3>Sales by region</h3>' +
  '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';

function scan(api, html, engineOptions) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return api.runDomRulesInPage('https://example.test/', null, {
      ...engineOptions,
      timestamp: TIMESTAMP
    });
  } finally {
    dom.window.close();
  }
}

// A pack's rules link the help they declare (none here); the rest must match.
function withoutPackHelp(value) {
  const copy = JSON.parse(JSON.stringify(value));
  const visit = (o) => {
    if (!o || typeof o !== 'object') return;
    if (typeof o.ruleId === 'string' && o.ruleId.startsWith('sample-')) {
      if (o.meta) delete o.meta.helpUrl;
      delete o.helpUrl;
    }
    Object.values(o).forEach(visit);
  };
  visit(copy);
  return copy;
}

test('a scan with the sample pack gives the sample engine its results', () => {
  for (const options of [
    { profile: 'sample-1.0' },
    { profile: 'sample-2.0', locale: 'fr' },
    { mappings: ['sample'] },
    { optInRules: 'all' },
    {}
  ]) {
    const withPack = scan(main, PAGE, { ...options, packs: [pack] });
    assert.deepEqual(withPack.engine.packs, ['sample-pack@1.0.0']);
    delete withPack.engine.packs;
    assert.deepEqual(
      withoutPackHelp(withPack),
      withoutPackHelp(scan(sample, PAGE, options)),
      JSON.stringify(options)
    );
  }
});

test('every scenario page scans the same with the pack as with the sample engine', () => {
  const pages = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.html'));
  assert.ok(pages.length > 100);
  for (const page of pages) {
    const html = fs.readFileSync(path.join(FIXTURES, page), 'utf8');
    const withPack = scan(main, html, { profile: 'sample-1.0', packs: [pack] });
    delete withPack.engine.packs;
    assert.deepEqual(
      withoutPackHelp(withPack),
      withoutPackHelp(scan(sample, html, { profile: 'sample-1.0' })),
      page
    );
  }
});

test('the catalog functions answer with the pack as the sample engine does', () => {
  for (const options of [{ profile: 'sample-1.0' }, { mappings: ['sample'] }, {}]) {
    const packed = { ...options, packs: [pack] };
    const same = (a, b, what) =>
      assert.deepEqual(
        withoutPackHelp(a),
        withoutPackHelp(b),
        `${what} ${JSON.stringify(options)}`
      );
    same(main.getChecksCatalog(packed), sample.getChecksCatalog(options), 'getChecksCatalog');
    same(main.getRulesCatalog(packed), sample.getRulesCatalog(options), 'getRulesCatalog');
    same(
      main.getCheckDefById('sample-contrast-enhanced', packed),
      sample.getCheckDefById('sample-contrast-enhanced', options),
      'getCheckDefById'
    );
    same(
      main.getChecksForRunOnly({ tags: ['sample'] }, packed),
      sample.getChecksForRunOnly({ tags: ['sample'] }, options),
      'getChecksForRunOnly'
    );
  }
});
