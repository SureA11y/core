'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { coarseStructuralSignature } = require('../../src/explain/coarse-signature');

test('coarseStructuralSignature: keeps only the last two segments', () => {
  assert.strictEqual(
    coarseStructuralSignature('body > nav > ul > li > a > span[role="button"]'),
    'a>span[role="button"]'
  );
});

test('coarseStructuralSignature: strips nth-child/nth-of-type positional noise', () => {
  assert.strictEqual(
    coarseStructuralSignature('div:nth-child(3) > a:nth-of-type(2) > span[role="button"]'),
    'a>span[role="button"]'
  );
});

test('coarseStructuralSignature: strips id selectors (per-page unique, not structural)', () => {
  assert.strictEqual(coarseStructuralSignature('#header > nav > a#login-link'), 'nav>a');
});

test('coarseStructuralSignature: two structurally-identical repeated widgets produce the same signature', () => {
  const a = coarseStructuralSignature(
    'main > ul > li:nth-child(1) > a#card-1 > span[role="button"]'
  );
  const b = coarseStructuralSignature(
    'main > ul > li:nth-child(7) > a#card-7 > span[role="button"]'
  );
  assert.strictEqual(a, b);
});

test('coarseStructuralSignature: handles a single-segment selector', () => {
  assert.strictEqual(coarseStructuralSignature('img'), 'img');
});

test('coarseStructuralSignature: non-string/empty input returns empty string, never throws', () => {
  assert.strictEqual(coarseStructuralSignature(''), '');
  assert.strictEqual(coarseStructuralSignature(null), '');
  assert.strictEqual(coarseStructuralSignature(undefined), '');
});
