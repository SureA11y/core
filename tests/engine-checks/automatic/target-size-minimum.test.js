'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'a11ycore-target-size-minimum';

/**
 * Patch geometry + hit testing to be deterministic in JSDOM.
 * This rule relies on:
 * - getBoundingClientRect/getClientRects
 * - document.elementFromPoint (for sampling/spacing)
 *
 * We provide these via data-rect="x,y,w,h" attributes.
 */
function patchTargetSizeEnv(dom) {
  const { window } = dom;
  const { document } = window;

  // deterministic viewport
  try {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  } catch {}

  function parseRectAttr(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      const raw = el.getAttribute('data-rect');
      if (!raw) return null;
      const parts = String(raw).split(',').map((s) => Number(String(s).trim()));
      if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
      const [x, y, w, h] = parts;
      return { x, y, w, h };
    } catch {
      return null;
    }
  }

  // Patch rect APIs on Element prototype
  const proto = window.Element && window.Element.prototype;
  if (proto) {
    const origBcr = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function patchedGetBoundingClientRect() {
      const r = parseRectAttr(this);
      if (r) {
        return {
          x: r.x,
          y: r.y,
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          right: r.x + r.w,
          bottom: r.y + r.h
        };
      }
      try {
        if (typeof origBcr === 'function') return origBcr.call(this);
      } catch {}
      return { x: 0, y: 0, left: 0, top: 0, width: 10, height: 10, right: 10, bottom: 10 };
    };

    const origRects = proto.getClientRects;
    proto.getClientRects = function patchedGetClientRects() {
      try {
        if (this && this.getAttribute && this.getAttribute('data-no-rects') === '1') return [];
      } catch {}

      const r = parseRectAttr(this);
      if (r) {
        if (r.w <= 0 || r.h <= 0) return [];
        return [
          {
            x: r.x,
            y: r.y,
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            right: r.x + r.w,
            bottom: r.y + r.h
          }
        ];
      }
      try {
        if (typeof origRects === 'function') {
          const out = origRects.call(this);
          if (out && out.length) return out;
        }
      } catch {}
      return [{ x: 0, y: 0, left: 0, top: 0, width: 10, height: 10, right: 10, bottom: 10 }];
    };
  }

  // elementFromPoint: consider only candidate-ish elements (buttons/links/inputs/etc.)
  // and return the last element in DOM order that contains the point (topmost approximation).
  document.elementFromPoint = function patchedElementFromPoint(x, y) {
    const px = Number(x);
    const py = Number(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

    // Query broadly: the rule itself will normalize to nearest candidate.
    const all = Array.from(document.querySelectorAll('[data-rect]'));
    let hit = null;

    for (const el of all) {
      const r = parseRectAttr(el);
      if (!r) continue;

      // Respect basic style suppression for hit testing (display none / visibility hidden)
      const cs = window.getComputedStyle(el);
      const disp = cs && cs.display ? String(cs.display) : 'block';
      const vis = cs && cs.visibility ? String(cs.visibility) : 'visible';
      const cv = cs && cs.contentVisibility ? String(cs.contentVisibility) : 'visible';
      if (disp === 'none') continue;
      if (vis === 'hidden' || vis === 'collapse') continue;
      if (cv === 'hidden') continue;

      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        hit = el; // later wins
      }
    }
    return hit;
  };

  // Patch getComputedStyle defaults for properties used by the rule's reachability filter.
  const orig = window.getComputedStyle;
  if (typeof orig === 'function') {
    window.getComputedStyle = function patchedGetComputedStyle(el) {
      const cs = orig.call(window, el);
      return new Proxy(cs, {
        get(target, prop) {
          const v = target[prop];

          if (v == null || v === '') {
            if (prop === 'display') return 'block';
            if (prop === 'visibility') return 'visible';
            if (prop === 'contentVisibility') return 'visible';
            if (prop === 'pointerEvents') return 'auto';
            if (prop === 'opacity') return '1';
          }
          return v;
        }
      });
    };
  }
}

function run(html, engineOptions = {}) {
  const dom = createDom(html);
  patchTargetSizeEnv(dom);

  return runa11yCoreOnDom(dom, {
    engineOptions: {
      rules: [RULE_ID],
      ...engineOptions
    }
  });
}

test(`${RULE_ID}: no candidates => notApplicable`, () => {
  const html = `<!doctype html><html><body><div>no targets</div></body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: only suppressed candidates => notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <button style="display:none" data-rect="10,10,10,10">X</button>
    <button hidden data-rect="10,40,10,10">Y</button>
<details>
  <summary style="display:none" data-rect="10,70,20,20">S</summary>
  <button data-rect="40,70,10,10">inside</button>
</details>
    <div inert><button data-rect="10,110,10,10">inert</button></div>
    <button style="pointer-events:none" data-rect="10,140,10,10">pe-none</button>
    <button data-no-rects="1" data-rect="10,170,10,10">no rects</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: one >= 24x24 => pass`, () => {
  const html = `<!doctype html><html><body>
    <button id="b" data-rect="10,10,30,30">Big</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: undersized but spaced => pass (spacing exception)`, () => {
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="200,10,10,10">Small</button>
    <!-- another target far away -->
    <button id="far" data-rect="400,200,10,10">Far</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: two undersized targets too close => fail (2 occurrences)`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="10,80,10,10">A</button>
    <button id="b" data-rect="25,80,10,10">B</button>
  </body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  // Deterministic i18n keys
  for (const occ of rule.occurrences) {
    assert.strictEqual(occ.i18n.summaryKey, 'a11ycore_targetSizeMinimum_summary_fail');
    assert.strictEqual(occ.i18n.hintKey, 'a11ycore_targetSizeMinimum_hint_fail');
    assert.ok(occ.data && occ.data.details && occ.data.details.measured);
    assert.ok(occ.data.details.measured.width < 24 || occ.data.details.measured.height < 24);
    assert.strictEqual(occ.data.details.reasonCode, 'undersized-and-too-close');
  }
});

test(`${RULE_ID}: aria-hidden target still evaluated`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" aria-hidden="true" data-rect="10,120,10,10">AH</button>
    <button id="b" data-rect="25,120,10,10">N</button>
  </body></html>`;

  const result = run(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  // both should be reported (they are both pointer-reachable)
  assert.ok(rule.occurrences.some((o) => /#a\b/.test(o.selector)));
  assert.ok(rule.occurrences.some((o) => /#b\b/.test(o.selector)));
});

test(`${RULE_ID}: opacity:0 still evaluated`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" style="opacity:0" data-rect="10,160,10,10">O0</button>
    <button id="b" data-rect="25,160,10,10">N</button>
  </body></html>`;

  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: pointer-events none excluded`, () => {
  const html = `<!doctype html><html><body>
    <button id="pe" style="pointer-events:none" data-rect="10,200,10,10">PE</button>
    <button id="near" data-rect="25,200,10,10">N</button>
  </body></html>`;

  const result = run(html);
  // Only #near is applicable; it is undersized but now has no conflicting target => passes by spacing exception.
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: occluded small target fails (covered by another target)`, () => {
  const html = `<!doctype html><html><body>
    <button id="small" data-rect="10,520,10,10">S</button>
    <button id="cover" data-rect="5,515,40,40">Cover</button>
  </body></html>`;

  const result = run(html);
  // Both are candidates; small is undersized and too close (circle perimeter will hit cover).
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(rule.occurrences.some((o) => /#small\b/.test(o.selector)));
});

test(`${RULE_ID}: inline text link in <p> => pass (inline-text exception)`, () => {
  const html = `<!doctype html><html><body>
    <p>Read <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">more</a> here.</p>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline text link close to small button => pass (inline link doesn't invalidate spacing)`, () => {
  const html = `<!doctype html><html><body>
    <p>Go <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">here</a>.</p>
    <button id="btn" data-rect="25,10,10,10">B</button>
  </body></html>`;
  const result = run(html);
  // Only remaining undersized target is the button, and the inline link shouldn't count as conflict.
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline-block link in <p> => pass (inline-text exception)`, () => {
  const html = `<!doctype html><html><body>
    <p>
      <a id="chip" href="#" style="display:inline-block" data-rect="10,10,10,10">Chip</a>
    </p>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: inline link not in text container => evaluated normally`, () => {
  const html = `<!doctype html><html><body>
    <div>
      <a id="lnk" href="#" style="display:inline" data-rect="10,10,10,10">Link</a>
    </div>
    <button id="b" data-rect="25,10,10,10">B</button>
  </body></html>`;
  const result = run(html);
  // Both are small and close => fail 2 occurrences
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: undersized targets within 24px by geometry => fail (distance check)`, () => {
  const html = `<!doctype html><html><body>
    <button id="a" data-rect="100,100,10,10">A</button>
    <button id="b" data-rect="120,100,10,10">B</button>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: conflict inside svg => cantTell (essential/equivalent uncertainty)`, () => {
  const html = `<!doctype html><html><body>
    <svg>
      <button id="a" data-rect="10,10,10,10">A</button>
      <button id="b" data-rect="25,10,10,10">B</button>
    </svg>
  </body></html>`;
  const result = run(html);
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 0, maxOccurrences: 0 });
});
