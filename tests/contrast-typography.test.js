'use strict';

const assert = require('node:assert/strict');

// These should match helpers.contrast implementations exactly.

const trim = (v) => (v == null ? '' : String(v)).trim();

function normalizeFontWeight(v) {
  const s = trim(v).toLowerCase();
  if (!s) return 400;
  if (s === 'normal') return 400;
  if (s === 'bold' || s === 'bolder') return 700;
  if (s === 'lighter') return 300;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : 400;
}

// WCAG “large text” thresholds (in CSS px):
// - >= 24px regular
// - >= 18.6667px (≈ 14pt) if bold (>= 700)
function isLargeText(fontSizePx, fontWeightNum) {
  const size = parseFloat(fontSizePx);
  const w = Number(fontWeightNum);
  if (!Number.isFinite(size)) return false;
  if (size >= 24) return true;
  if (size >= 18.6667 && Number.isFinite(w) && w >= 700) return true;
  return false;
}

function requiredRatio(level, large) {
  const l = String(level || '').toUpperCase();
  if (l === 'AAA') return large ? 4.5 : 7.0;
  // default AA
  return large ? 3.0 : 4.5;
}

// ===== Tests =====

(function test_normalizeFontWeight() {
  assert.equal(normalizeFontWeight(undefined), 400);
  assert.equal(normalizeFontWeight(''), 400);
  assert.equal(normalizeFontWeight('normal'), 400);
  assert.equal(normalizeFontWeight('bold'), 700);
  assert.equal(normalizeFontWeight('bolder'), 700);
  assert.equal(normalizeFontWeight('lighter'), 300);

  assert.equal(normalizeFontWeight('100'), 100);
  assert.equal(normalizeFontWeight('400'), 400);
  assert.equal(normalizeFontWeight('700'), 700);
  assert.equal(normalizeFontWeight('900'), 900);

  assert.equal(normalizeFontWeight(' 700 '), 700);
  assert.equal(normalizeFontWeight('weird'), 400);
})();

(function test_isLargeText() {
  // Regular large text threshold
  assert.equal(isLargeText(24, 400), true);
  assert.equal(isLargeText(23.99, 400), false);

  // Bold large text threshold
  assert.equal(isLargeText(18.6667, 700), true);
  assert.equal(isLargeText(18.66, 700), false);
  assert.equal(isLargeText(18.6667, 600), false);

  // Non-numeric size
  assert.equal(isLargeText('nope', 700), false);
})();

(function test_requiredRatio() {
  // AA
  assert.equal(requiredRatio('AA', false), 4.5);
  assert.equal(requiredRatio('AA', true), 3.0);
  assert.equal(requiredRatio('', false), 4.5); // default AA

  // AAA
  assert.equal(requiredRatio('AAA', false), 7.0);
  assert.equal(requiredRatio('AAA', true), 4.5);
  assert.equal(requiredRatio('aaa', true), 4.5);
})();
