'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { proceduresFor } = require('@surea11y/core');
const pack = require('..');
const { REQUIREMENTS } = require('../requirements');

const read = (id, options) =>
  proceduresFor(id, { packs: [pack], standard: '__NAMESPACE__', ...options });

test('every requirement says how a person assesses it, in every version', () => {
  for (const [version, requirements] of Object.entries(REQUIREMENTS)) {
    for (const id of Object.keys(requirements)) {
      const r = read(id, { version });
      assert.ok(r, `${version} ${id} has procedures (procedures.js)`);
      assert.equal(r.complete, true, `${version} ${id} has a procedure for every facet`);
    }
  }
});

test('a requirement that restates WCAG takes the criterion’s procedures', () => {
  const r = read('1');
  assert.equal(r.wcag, '1.1.1');
  assert.deepEqual(r.facets, proceduresFor('1.1.1', { packs: [pack] }).facets);
});

test('a requirement that tests a facet its own way shows its steps there', () => {
  const r = read('6');
  const facet = r.facets.find((f) => f.id === 'page-title-descriptive');
  assert.equal(facet.procedureFrom, pack.name);
  assert.match(facet.procedure.failWhen, /requirement 6/);
  // Read as WCAG, the criterion keeps core's.
  const wcag = proceduresFor('2.4.2', { packs: [pack] }).facets.find((f) => f.id === facet.id);
  assert.equal(wcag.procedureFrom, undefined);
});

test('a requirement of its own gives its facets', () => {
  assert.deepEqual(
    read('3').facets.map((f) => f.id),
    ['new-window-warned']
  );
});
