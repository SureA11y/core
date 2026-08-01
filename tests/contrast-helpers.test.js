'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createContrastHelpers } = require('../src/core/contrast-helpers.js');

// parseCssColorToRgba/compositeRgba/relativeLuminance/contrastRatio are pure
// (no DOM access), so a minimal shared object is enough -- see
// tests/cache-tests/contrast-helpers-cache.test.js for the fuller
// window-backed harness used by the caching/element-facing helpers.
const helpers = createContrastHelpers({}, { trim: (v) => (v == null ? '' : String(v)).trim() });
const { parseCssColorToRgba, compositeRgba, contrastRatio } = helpers;

function approx(actual, expected, eps = 1e-6) {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= eps, `expected ${expected}, got ${actual}`);
}

test('parseCssColorToRgba: hex forms (#rgb, #rgba, #rrggbb, #rrggbbaa)', () => {
  assert.deepEqual(parseCssColorToRgba('#000'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseCssColorToRgba('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseCssColorToRgba('#0f08'), { r: 0, g: 255, b: 0, a: 0x88 / 255 });

  assert.deepEqual(parseCssColorToRgba('#112233'), { r: 0x11, g: 0x22, b: 0x33, a: 1 });
  assert.deepEqual(parseCssColorToRgba('#11223380'), { r: 0x11, g: 0x22, b: 0x33, a: 0x80 / 255 });
});

test('parseCssColorToRgba: rgb()/rgba(), including percentage channels and alpha', () => {
  assert.deepEqual(parseCssColorToRgba('rgb(0, 0, 0)'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseCssColorToRgba('rgba(255,255,255,0.5)'), { r: 255, g: 255, b: 255, a: 0.5 });
  assert.deepEqual(parseCssColorToRgba('rgba( 10 , 20 , 30 , 50% )'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.deepEqual(parseCssColorToRgba('rgb(100%, 0%, 0%)'), { r: 255, g: 0, b: 0, a: 1 });
});

test('parseCssColorToRgba: transparent keyword and invalid input', () => {
  assert.deepEqual(parseCssColorToRgba('transparent'), { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(parseCssColorToRgba('rebeccapurple'), null);
  assert.equal(parseCssColorToRgba('hsl(0, 0%, 0%)'), null);
  assert.equal(parseCssColorToRgba('#12'), null);
  assert.equal(parseCssColorToRgba(''), null);
});

test('parseCssColorToRgba: repeat calls for the same input return equal (cached) results', () => {
  const a = parseCssColorToRgba('#112233');
  const b = parseCssColorToRgba('#112233');
  assert.deepEqual(a, b);
});

test('compositeRgba: opaque source fully wins; fully transparent source falls through to dest', () => {
  assert.deepEqual(
    compositeRgba({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255, a: 1 }),
    { r: 255, g: 0, b: 0, a: 1 }
  );
  assert.deepEqual(
    compositeRgba({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 255, a: 1 }),
    { r: 0, g: 0, b: 255, a: 1 }
  );
});

test('compositeRgba: partial-alpha source-over blends channels and accumulates alpha', () => {
  const out = compositeRgba({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(out, { r: 128, g: 128, b: 128, a: 1 });

  const out2 = compositeRgba({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 0.5 });
  approx(out2.a, 0.75, 1e-12);
});

test('contrastRatio: black-on-white is 21:1, identical colors are 1:1', () => {
  approx(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21, 1e-9);
  approx(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }), 1, 1e-12);
  // symmetric regardless of fg/bg order
  approx(
    contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }),
    contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })
  );
});

test('contrastRatio: mid-gray against black falls strictly between 1 and 21', () => {
  const r = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 128, g: 128, b: 128 });
  assert.ok(r > 1 && r < 21, `expected 1<ratio<21, got ${r}`);
});
