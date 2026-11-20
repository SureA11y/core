'use strict';

/**
 * @surea11y/core/testing scans a page with the in-page runner and again in
 * Node, to check the two agree. What the engine says about the options is
 * said once, as one scan says it: before, an unknown profile was warned
 * about by both runs.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';

function warningsOf(fn) {
  const real = console.warn;
  const out = [];
  console.warn = (...args) => out.push(args.map(String).join(' '));
  try {
    fn();
  } finally {
    console.warn = real;
  }
  return out;
}

test('an unknown profile is warned about once per scan', () => {
  const said = warningsOf(() =>
    runa11yCoreOnHtml(HTML, { engineOptions: { profile: 'wcag23-aa' }, runOnly: ['region'] })
  );
  assert.equal(said.filter((w) => w.includes('"wcag23-aa"')).length, 1, said.join('\n'));
});

test('a warning about the options is said once, and the rest pass through', () => {
  const said = warningsOf(() =>
    runa11yCoreOnHtml(HTML, { engineOptions: { perfStats: 'maybe' }, runOnly: ['region'] })
  );
  assert.equal(said.filter((w) => w.includes('perfStats')).length, 1, said.join('\n'));
  // console.warn is the caller's again afterwards.
  const real = console.warn;
  const mine = () => {};
  console.warn = mine;
  try {
    runa11yCoreOnHtml(HTML, { runOnly: ['region'] });
    assert.equal(console.warn, mine);
  } finally {
    console.warn = real;
  }
});
