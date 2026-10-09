'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const pack = require('..');

const PAGE = `<!doctype html><html lang="en"><head><title>Home</title></head><body>
  <main>
    <h1>Shop</h1>
    <h2>Offers</h2>
    <img src="logo.png">
    <p style="color:#767676;background:#fff">Grey text</p>
    <a href="/offers">Read more</a>
    <a href="/report" target="_blank">Annual report</a>
  </main>
</body></html>`;

const MAPPED = [
  '__NAMESPACE__-contrast-enhanced',
  '__NAMESPACE__-link-text-specific',
  '__NAMESPACE__-new-window-review',
  'heading-order',
  'img-alt-present',
  'link-name-present',
  'page-title-present'
];

const scan = (engineOptions) =>
  runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack], ...engineOptions } });
const ran = (result) => result.checksResults.map((c) => c.ruleId);
const check = (result, id) => result.checksResults.find((c) => c.ruleId === id);

test('the standard profile runs exactly the rules rule-map.js lists', () => {
  const result = scan({ profile: '__NAMESPACE__-1.0' });
  assert.equal(result.engine.profile, '__NAMESPACE__-1.0');
  assert.deepEqual(ran(result).sort(), MAPPED);
  assert.equal(check(result, 'img-alt-present').severity, 'critical');
});

test('each requirement is a result of its own', () => {
  // A requirement's rollup is <namespace>-<version>-<requirement>.
  const requirements = scan({ profile: '__NAMESPACE__-1.0' }).rulesResults.filter((r) =>
    r.ruleId.startsWith('__NAMESPACE__-1.0-')
  );
  assert.deepEqual(
    requirements.map((r) => [r.ruleId, r.outcome]),
    [
      ['__NAMESPACE__-1.0-1', 'fail'], // the image has no alt
      ['__NAMESPACE__-1.0-2', 'fail'], // "Read more"
      ['__NAMESPACE__-1.0-3', 'cantTell'], // a person checks the new-window link
      ['__NAMESPACE__-1.0-4', 'fail'], // grey text below 7:1
      ['__NAMESPACE__-1.0-5', 'pass'], // headings in order
      ['__NAMESPACE__-1.0-6', 'pass'] // the page has a title
    ]
  );
});

test('results name the requirements their rule checks', () => {
  const result = scan({ profile: '__NAMESPACE__-1.0' });
  const entries = check(result, 'img-alt-present').meta.normativeMappings.filter(
    (m) => m.standard === '__TITLE__'
  );
  assert.deepEqual(
    entries.map((m) => m.requirement),
    ['1']
  );
});

test('the WCAG profile adds core WCAG 2.2 A and AA rules and region, without contrast-minimum', () => {
  const ids = ran(scan({ profile: '__NAMESPACE__-1.0-wcag' }));
  for (const id of [...MAPPED, 'region', 'aria-hidden-body'])
    assert.ok(ids.includes(id), `${id} runs`);
  assert.ok(!ids.includes('contrast-minimum'));
});
