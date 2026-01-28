'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');

const RULES = [
    'a11ycore-contrast-computable',
    'a11ycore-contrast-minimum',
    'a11ycore-contrast-enhanced'
];

// Reuse the same deterministic patches you already use in the other contrast tests.
// (Copied from your existing files; keep in sync if you change them later.)
function patchGeometry(dom) {
    const { window } = dom;
    const proto = window.Element && window.Element.prototype;
    if (!proto) return;
    if (proto.__a11ycorePatchedGeometry) return;
    proto.__a11ycorePatchedGeometry = true;

    if (typeof proto.getClientRects !== 'function') {
        proto.getClientRects = function getClientRects() {
            return [{ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 }];
        };
    } else {
        const orig = proto.getClientRects;
        proto.getClientRects = function patchedGetClientRects() {
            try {
                const r = orig.call(this);
                if (r && r.length) return r;
            } catch {}
            return [{ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 }];
        };
    }

    if (typeof proto.getBoundingClientRect !== 'function') {
        proto.getBoundingClientRect = function getBoundingClientRect() {
            return { x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 };
        };
    } else {
        const orig = proto.getBoundingClientRect;
        proto.getBoundingClientRect = function patchedGetBoundingClientRect() {
            try {
                const r = orig.call(this);
                if (r && r.width > 0 && r.height > 0) return r;
            } catch {}
            return { x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10 };
        };
    }
}

function patchComputedStyleDefaults(dom) {
    const { window } = dom;
    const orig = window.getComputedStyle;

    if (typeof orig !== 'function') return;
    if (window.__a11ycorePatchedComputedStyle) return;
    window.__a11ycorePatchedComputedStyle = true;

    window.getComputedStyle = function patchedGetComputedStyle(el) {
        const cs = orig.call(window, el);

        return new Proxy(cs, {
            get(target, prop) {
                const v = target[prop];

                if (v == null || v === '') {
                    if (prop === 'opacity') return '1';
                    if (prop === 'display') return 'block';
                    if (prop === 'visibility') return 'visible';
                    if (prop === 'contentVisibility') return 'visible';

                    if (prop === 'backgroundImage') return 'none';
                    if (prop === 'mixBlendMode') return 'normal';
                    if (prop === 'filter') return 'none';
                    if (prop === 'backdropFilter') return 'none';

                    // Typography defaults for AA/AAA rules (harmless for computable rule)
                    if (prop === 'fontSize') return '16px';
                    if (prop === 'fontWeight') return '400';
                    if (prop === 'color') return 'rgb(0, 0, 0)';
                    if (prop === 'backgroundColor') return 'rgba(0, 0, 0, 0)';
                }

                return v;
            }
        });
    };
}

function patchTreeWalkerCounter(dom) {
    const doc = dom.window.document;
    const orig = doc.createTreeWalker;
    assert.equal(typeof orig, 'function', 'Expected document.createTreeWalker to exist');

    let calls = 0;
    const stacks = [];

    doc.createTreeWalker = function patchedCreateTreeWalker(...args) {
        const stack = new Error('TreeWalker').stack || '';

        const fromGetTextScan = /getTextScan/.test(stack);

        // Windows-safe + tolerant matching
        const fromContrastImpl =
            /[\\/](src)[\\/](core)\.js/.test(stack) ||
            /contrast-helpers(\.js)?/i.test(stack) ||
            /contrast[-_]?helpers(\.js)?/i.test(stack);

        const isFromGetTextScan = fromGetTextScan && fromContrastImpl;

        if (isFromGetTextScan) {
            calls++;
            stacks.push(new Error('TreeWalker call #' + calls).stack);
        }

        return orig.apply(this, args);
    };

    return {
        getCalls: () => calls,
        getStacks: () => stacks.slice(0),
        restore: () => { doc.createTreeWalker = orig; }
    };
}

function runAllThreeContrastRules(dom, engineOptions = {}) {
    return runa11yCoreOnDom(dom, {
        engineOptions: {
            rules: RULES,
            ...engineOptions
        }
    });
}

test('contrast.getTextScan cache: multiple contrast rules in one run should only create ONE TreeWalker', () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255,255,255); opacity: 1">
<head></head>
<body style="background-color: rgb(255,255,255); opacity: 1">
  <p style="color: rgb(17,17,17); background-color: rgb(255,255,255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    const dom = createDom(html);
    patchGeometry(dom);
    patchComputedStyleDefaults(dom);

    const tw = patchTreeWalkerCounter(dom);

    // Run all three rules in the SAME engine invocation.
    runAllThreeContrastRules(dom);
    assert.strictEqual(
        tw.getCalls(),
        1,
        `Expected document.createTreeWalker to be called exactly once, got ${tw.getCalls()}`
    );

    tw.restore();
});

test('contrast.getTextScan cache key includes visibilityMode: styleOnly then styleAndGeometry should create TWO TreeWalkers', () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255,255,255); opacity: 1">
<head></head>
<body style="background-color: rgb(255,255,255); opacity: 1">
  <p style="color: rgb(17,17,17); background-color: rgb(255,255,255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    const dom = createDom(html);
    patchGeometry(dom);
    patchComputedStyleDefaults(dom);

    const tw = patchTreeWalkerCounter(dom);

    // First run uses default visibilityMode = styleOnly
    runAllThreeContrastRules(dom, { visibilityMode: 'styleOnly' });

    // Second run uses styleAndGeometry; same DOM, but different visibilityMode => different cache bucket
    runAllThreeContrastRules(dom, { visibilityMode: 'styleAndGeometry' });

    assert.strictEqual(
        tw.getCalls(),
        2,
        `Expected document.createTreeWalker to be called twice (one per visibilityMode), got ${tw.getCalls()}`
    );

    tw.restore();
});

test('contrast.getTextScan cache does NOT persist across separate engine runs (new dom = new TreeWalker)', () => {
    const html = `
<!doctype html>
<html style="background-color: rgb(255,255,255); opacity: 1">
<head></head>
<body style="background-color: rgb(255,255,255); opacity: 1">
  <p style="color: rgb(17,17,17); background-color: rgb(255,255,255); font-size: 16px; font-weight: 400; opacity: 1">
    Hello
  </p>
</body></html>`;

    // dom #1
    const dom1 = createDom(html);
    patchGeometry(dom1);
    patchComputedStyleDefaults(dom1);
    const tw1 = patchTreeWalkerCounter(dom1);
    runAllThreeContrastRules(dom1);
    assert.strictEqual(tw1.getCalls(), 1);
    tw1.restore();

    // dom #2 (fresh JSDOM)
    const dom2 = createDom(html);
    patchGeometry(dom2);
    patchComputedStyleDefaults(dom2);
    const tw2 = patchTreeWalkerCounter(dom2);
    runAllThreeContrastRules(dom2);
    assert.strictEqual(tw2.getCalls(), 1);
    tw2.restore();
});
