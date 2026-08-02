'use strict';

/**
 * Patch geometry + hit testing to be deterministic in JSDOM for
 * target-size-minimum.js, which relies on:
 * - getBoundingClientRect/getClientRects
 * - document.elementFromPoint (for sampling/spacing)
 *
 * We provide these via data-rect="x,y,w,h" attributes. Shared by
 * tests/engine-checks/automatic/target-size-minimum.test.js (via
 * runa11yCoreOnDom, the bundled in-page entry point) and
 * tests/target-size-minimum-node-runtime-parity.test.js (via
 * runDomRulesInPage, the real require()-based entry point Node's coverage
 * tool can actually attribute back to src/checks/automatic/target-size-minimum.js) --
 * both need the exact same deterministic geometry to exercise the same
 * fixture scenarios.
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
      const parts = String(raw)
        .split(',')
        .map((s) => Number(String(s).trim()));
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

module.exports = { patchTargetSizeEnv };
