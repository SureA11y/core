'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createContrastHelpers } = require('../src/core/contrast-helpers.js');

// parseCssColorToRgba/compositeRgba/relativeLuminance/contrastRatio are pure
// (no DOM access), so a minimal shared object is enough -- see
// tests/cache-tests/contrast-helpers-cache.test.js for the fuller
// window-backed harness used by the caching/element-facing helpers, and
// tests/contrast-helpers-dom.test.js for the DOM-facing functions
// (computeEffectiveForeground/Background, getComputabilityBlocker,
// getTextScan) that need a real document.
const helpers = createContrastHelpers({}, { trim: (v) => (v == null ? '' : String(v)).trim() });
const {
  parseCssColorToRgba,
  compositeRgba,
  contrastRatio,
  pxToPt,
  fontWeightLabel,
  round2,
  rgbaToString,
  parsePx,
  normalizeFontWeight,
  isLargeText,
  requiredRatio,
  rgbToHex,
  toHex2,
  hasBackgroundImageOrGradient,
  hasBlendMode,
  hasFilter
} = helpers;

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
  assert.deepEqual(parseCssColorToRgba('rgba(255,255,255,0.5)'), {
    r: 255,
    g: 255,
    b: 255,
    a: 0.5
  });
  assert.deepEqual(parseCssColorToRgba('rgba( 10 , 20 , 30 , 50% )'), {
    r: 10,
    g: 20,
    b: 30,
    a: 0.5
  });
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
  assert.deepEqual(compositeRgba({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255, a: 1 }), {
    r: 255,
    g: 0,
    b: 0,
    a: 1
  });
  assert.deepEqual(compositeRgba({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 255, a: 1 }), {
    r: 0,
    g: 0,
    b: 255,
    a: 1
  });
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

test('parseCssColorToRgba: modern space-separated rgb()/rgba() (rgb(r g b), rgb(r g b / a)), including percentage channels and alpha', () => {
  assert.deepEqual(parseCssColorToRgba('rgb(0 0 0)'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseCssColorToRgba('rgb(10 20 30 / 0.5)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.deepEqual(parseCssColorToRgba('rgb(10 20 30 / 50%)'), { r: 10, g: 20, b: 30, a: 0.5 });
  assert.deepEqual(parseCssColorToRgba('rgb(100% 0% 0%)'), { r: 255, g: 0, b: 0, a: 1 });
  // Fewer than 3 space-separated channels is malformed -- not a color.
  assert.equal(parseCssColorToRgba('rgb(10 20)'), null);
});

test('pxToPt: converts px to pt at 0.75pt/px, invalid input yields ""', () => {
  assert.strictEqual(pxToPt(16), '12.0');
  assert.strictEqual(pxToPt('24px'), '18.0');
  assert.strictEqual(pxToPt('not-a-number'), '');
});

test('fontWeightLabel: >=700 is bold, anything else is normal', () => {
  assert.strictEqual(fontWeightLabel(700), 'bold');
  assert.strictEqual(fontWeightLabel(900), 'bold');
  assert.strictEqual(fontWeightLabel(400), 'normal');
  assert.strictEqual(fontWeightLabel(NaN), 'normal');
});

test('round2: rounds to 2 decimals as a fixed string, non-finite input yields "0.00"', () => {
  assert.strictEqual(round2(4.5), '4.50');
  assert.strictEqual(round2(4.505), '4.51');
  assert.strictEqual(round2(NaN), '0.00');
});

test('rgbaToString: formats as rgba(r, g, b, a.aa), clamping out-of-range channels', () => {
  assert.strictEqual(rgbaToString({ r: 0, g: 128, b: 255, a: 0.5 }), 'rgba(0, 128, 255, 0.50)');
  assert.strictEqual(rgbaToString({ r: -10, g: 300, b: 128, a: 2 }), 'rgba(0, 255, 128, 1.00)');
  assert.strictEqual(rgbaToString(null), '');
});

test('parsePx: recognizes px/pt/rem/em/% units and bare numbers, null/invalid yields null', () => {
  assert.strictEqual(parsePx('16px'), 16);
  assert.strictEqual(parsePx('12pt'), 16);
  assert.strictEqual(parsePx('1rem'), 16);
  assert.strictEqual(parsePx('1em'), 16);
  assert.strictEqual(parsePx('50%'), 8);
  assert.strictEqual(parsePx(20), 20);
  assert.strictEqual(parsePx('20'), 20);
  assert.strictEqual(parsePx(null), null);
  assert.strictEqual(parsePx('not-a-size'), null);
});

test('normalizeFontWeight: keyword and numeric weights, unknown input defaults to 400', () => {
  assert.strictEqual(normalizeFontWeight('normal'), 400);
  assert.strictEqual(normalizeFontWeight('bold'), 700);
  assert.strictEqual(normalizeFontWeight('bolder'), 700);
  assert.strictEqual(normalizeFontWeight('lighter'), 300);
  assert.strictEqual(normalizeFontWeight('600'), 600);
  assert.strictEqual(normalizeFontWeight(''), 400);
  assert.strictEqual(normalizeFontWeight('not-a-weight'), 400);
});

test('isLargeText: >=24px is always large; >=18.6667px is large only when bold (>=700)', () => {
  assert.strictEqual(isLargeText(24, 400), true);
  assert.strictEqual(isLargeText(19, 700), true);
  assert.strictEqual(isLargeText(19, 400), false);
  assert.strictEqual(isLargeText(16, 700), false);
  assert.strictEqual(isLargeText('not-a-size', 400), false);
});

test('requiredRatio: AA is 4.5/3.0 (normal/large), AAA is 7.0/4.5', () => {
  assert.strictEqual(requiredRatio('AA', false), 4.5);
  assert.strictEqual(requiredRatio('AA', true), 3.0);
  assert.strictEqual(requiredRatio('AAA', false), 7.0);
  assert.strictEqual(requiredRatio('AAA', true), 4.5);
  // Unrecognized level defaults to the AA thresholds.
  assert.strictEqual(requiredRatio('bogus', false), 4.5);
});

test('rgbToHex/toHex2: formats as lowercase #rrggbb, clamping out-of-range channels', () => {
  assert.strictEqual(rgbToHex({ r: 0, g: 128, b: 255 }), '#0080ff');
  assert.strictEqual(rgbToHex({ r: -10, g: 300, b: 16 }), '#00ff10');
  assert.strictEqual(rgbToHex(null), '');
  assert.strictEqual(toHex2(5), '05');
});

test('rgbToHex: a channel that throws when coerced to a number degrades to "" instead of throwing', () => {
  // rgb.r/g/b are normally plain numbers, but rgbToHex is documented as
  // "always no-throw" via its own try/catch -- exercise that fallback
  // directly with a poisoned channel whose numeric coercion throws.
  const poisoned = {
    r: {
      valueOf() {
        throw new Error('boom');
      }
    },
    g: 0,
    b: 0
  };
  assert.strictEqual(rgbToHex(poisoned), '');
});

test('hasBackgroundImageOrGradient: a style whose backgroundImage getter throws degrades to false', () => {
  const style = {
    get backgroundImage() {
      throw new Error('boom');
    }
  };
  assert.strictEqual(hasBackgroundImageOrGradient(style), false);
});

test('hasBlendMode: a style whose mixBlendMode getter throws degrades to false', () => {
  const style = {
    get mixBlendMode() {
      throw new Error('boom');
    }
  };
  assert.strictEqual(hasBlendMode(style), false);
});

test('hasFilter: a style whose filter getter throws degrades to false', () => {
  const style = {
    get filter() {
      throw new Error('boom');
    }
  };
  assert.strictEqual(hasFilter(style), false);
});
