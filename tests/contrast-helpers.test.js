'use strict';

const assert = require('node:assert/strict');

// ===== Minimal deterministic primitives (same logic as helpers.contrast) =====

const clamp01 = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
};

const clamp255 = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    if (x < 0) return 0;
    if (x > 255) return 255;
    return x;
};

function parseCssColorToRgba(input) {
    const trim = (v) => (v == null ? '' : String(v)).trim();
    const s = trim(input).toLowerCase();
    if (!s) return null;
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

    if (s[0] === '#') {
        const hex = s.slice(1);
        if (!/^[0-9a-f]+$/i.test(hex)) return null;

        const hexToInt = (h) => Number.parseInt(h, 16);

        try {
            if (hex.length === 3) {
                return {
                    r: hexToInt(hex[0] + hex[0]),
                    g: hexToInt(hex[1] + hex[1]),
                    b: hexToInt(hex[2] + hex[2]),
                    a: 1
                };
            }
            if (hex.length === 4) {
                return {
                    r: hexToInt(hex[0] + hex[0]),
                    g: hexToInt(hex[1] + hex[1]),
                    b: hexToInt(hex[2] + hex[2]),
                    a: clamp01(hexToInt(hex[3] + hex[3]) / 255)
                };
            }
            if (hex.length === 6) {
                return {
                    r: hexToInt(hex.slice(0, 2)),
                    g: hexToInt(hex.slice(2, 4)),
                    b: hexToInt(hex.slice(4, 6)),
                    a: 1
                };
            }
            if (hex.length === 8) {
                return {
                    r: hexToInt(hex.slice(0, 2)),
                    g: hexToInt(hex.slice(2, 4)),
                    b: hexToInt(hex.slice(4, 6)),
                    a: clamp01(hexToInt(hex.slice(6, 8)) / 255)
                };
            }
        } catch {}
        return null;
    }

    const m = s.match(/^rgba?\((.*)\)$/);
    if (m && m[1]) {
        const parts = m[1].split(',').map((x) => String(x).trim());
        if (parts.length < 3) return null;

        const parseChannel = (t) => {
            if (!t) return null;
            if (t.endsWith('%')) {
                const p = Number.parseFloat(t);
                if (!Number.isFinite(p)) return null;
                return clamp255(Math.round((p / 100) * 255));
            }
            const n = Number.parseFloat(t);
            if (!Number.isFinite(n)) return null;
            return clamp255(Math.round(n));
        };

        const r = parseChannel(parts[0]);
        const g = parseChannel(parts[1]);
        const b = parseChannel(parts[2]);
        if (r == null || g == null || b == null) return null;

        let a = 1;
        if (parts.length >= 4) {
            const t = parts[3];
            if (t && t.endsWith('%')) {
                const p = Number.parseFloat(t);
                if (Number.isFinite(p)) a = clamp01(p / 100);
            } else {
                const n = Number.parseFloat(t);
                if (Number.isFinite(n)) a = clamp01(n);
            }
        }

        return { r, g, b, a };
    }

    return null;
}

// Source-over compositing: src over dst
function compositeRgba(src, dst) {
    const s = src && typeof src === 'object' ? src : { r: 0, g: 0, b: 0, a: 0 };
    const d = dst && typeof dst === 'object' ? dst : { r: 0, g: 0, b: 0, a: 0 };

    const as = clamp01(s.a);
    const ad = clamp01(d.a);

    const outA = as + ad * (1 - as);
    if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };

    const rs = clamp255(s.r);
    const gs = clamp255(s.g);
    const bs = clamp255(s.b);

    const rd = clamp255(d.r);
    const gd = clamp255(d.g);
    const bd = clamp255(d.b);

    const outR = (rs * as + rd * ad * (1 - as)) / outA;
    const outG = (gs * as + gd * ad * (1 - as)) / outA;
    const outB = (bs * as + bd * ad * (1 - as)) / outA;

    return {
        r: clamp255(Math.round(outR)),
        g: clamp255(Math.round(outG)),
        b: clamp255(Math.round(outB)),
        a: clamp01(outA)
    };
}

function srgbToLinear(c) {
    const cs = Number(c) / 255;
    if (cs <= 0.03928) return cs / 12.92;
    return Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
    const r = srgbToLinear(clamp255(rgb.r));
    const g = srgbToLinear(clamp255(rgb.g));
    const b = srgbToLinear(clamp255(rgb.b));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgRgb, bgRgb) {
    const L1 = relativeLuminance(fgRgb);
    const L2 = relativeLuminance(bgRgb);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
}

function approx(actual, expected, eps = 1e-6) {
    assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
    assert.ok(Math.abs(actual - expected) <= eps, `expected ${expected}, got ${actual}`);
}

// ===== Tests =====

(function test_parseCssColorToRgba() {
    assert.deepEqual(parseCssColorToRgba('#000'), { r: 0, g: 0, b: 0, a: 1 });
    assert.deepEqual(parseCssColorToRgba('#fff'), { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(parseCssColorToRgba('#0f08'), { r: 0, g: 255, b: 0, a: 0x88 / 255 });

    assert.deepEqual(parseCssColorToRgba('#112233'), { r: 0x11, g: 0x22, b: 0x33, a: 1 });
    assert.deepEqual(parseCssColorToRgba('#11223380'), { r: 0x11, g: 0x22, b: 0x33, a: 0x80 / 255 });

    assert.deepEqual(parseCssColorToRgba('rgb(0, 0, 0)'), { r: 0, g: 0, b: 0, a: 1 });
    assert.deepEqual(parseCssColorToRgba('rgba(255,255,255,0.5)'), { r: 255, g: 255, b: 255, a: 0.5 });
    assert.deepEqual(parseCssColorToRgba('rgba( 10 , 20 , 30 , 50% )'), { r: 10, g: 20, b: 30, a: 0.5 });

    assert.deepEqual(parseCssColorToRgba('rgb(100%, 0%, 0%)'), { r: 255, g: 0, b: 0, a: 1 });

    assert.deepEqual(parseCssColorToRgba('transparent'), { r: 0, g: 0, b: 0, a: 0 });

    assert.equal(parseCssColorToRgba('rebeccapurple'), null);
    assert.equal(parseCssColorToRgba('hsl(0, 0%, 0%)'), null);
    assert.equal(parseCssColorToRgba('#12'), null);
})();

(function test_compositeRgba() {
    assert.deepEqual(
        compositeRgba({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255, a: 1 }),
        { r: 255, g: 0, b: 0, a: 1 }
    );

    assert.deepEqual(
        compositeRgba({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 255, a: 1 }),
        { r: 0, g: 0, b: 255, a: 1 }
    );

    const out = compositeRgba({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(out, { r: 128, g: 128, b: 128, a: 1 });

    const out2 = compositeRgba({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 0.5 });
    approx(out2.a, 0.75, 1e-12);
})();

(function test_contrastRatio() {
    approx(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 21, 1e-9);
    approx(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }), 1, 1e-12);

    const r = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 128, g: 128, b: 128 });
    assert.ok(r > 1 && r < 21, `expected 1<ratio<21, got ${r}`);
})();
