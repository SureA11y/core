/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check moving-content-pausable
 * @atomic true
 * @summary Content that moves by itself for more than five seconds should be possible to pause, stop or hide
 * @standard WCAG 2.2
 * @sc 2.2.2
 * @type manual
 * @applicability
 *   Elements with an animation running when the scan starts, a CSS
 *   animation, a CSS transition or one a script started, on a time-based
 *   timeline (not scroll-driven), that is rendered, and that lasts more than
 *   five seconds from its start (its delay and every iteration) or never
 *   ends, in the document or in an open shadow root (unless
 *   includeShadowDom is off). Such motion started without the user asking
 *   for it. Without a browser's getAnimations (jsdom) nothing is
 *   applicable.
 *   Motion nothing shows is left out: an animation whose keyframes change
 *   no property, or only custom properties (which show nothing by
 *   themselves), and one on an element that is not drawn while it runs.
 *   That is an element hidden by visibility or opacity 0 (unless the
 *   animation changes that property), or, when the animation changes only
 *   colours or moves the element by a translation, one clipped to nothing
 *   (its own clip or clip-path, or an ancestor's overflow clip with no
 *   width or height, or one it lies wholly outside of, however far the
 *   translation takes it), with no size and its overflow clipped, or
 *   wholly before the page's start (left of it on a left-to-right page, or
 *   above it), or past its right edge where the root clips overflow,
 *   wherever the translation takes it. An animation that changes another
 *   property (a size, an inset, a rotation) may bring the element into
 *   view, and is asked about as before.
 * @expectation
 *   WCAG 2.2.2 asks that moving, blinking or scrolling content that starts
 *   automatically, lasts more than five seconds and is shown beside other
 *   content can be paused, stopped or hidden, unless the movement is
 *   essential. Whether a control does that, and whether the movement is
 *   essential, is for a person to check, so each element is asked about
 *   (cantTell), once, however many animations it runs.
 * @reports
 *   - `reasonCode`: `MOVING_CONTENT_LOOPS` for an animation that never ends,
 *     `MOVING_CONTENT_OVER_5S` for one that ends after more than five
 *     seconds.
 *   - `animations`: the element's animations, up to five, each with its
 *     `kind` (`css-animation`, `css-transition` or `script`), `name` (the
 *     animation name or transitioned property, `''` when it has none) and
 *     `endTime`, in milliseconds from its start, `null` when it never ends.
 * @reason-codes
 *   - `MOVING_CONTENT_LOOPS` (cantTell): the element runs an animation that
 *     started by itself and never ends; whether it can be paused, stopped or
 *     hidden, or is essential, is for a person to check.
 *     Basis: WCAG 2.2.2 (not settled).
 *   - `MOVING_CONTENT_OVER_5S` (cantTell): the element runs an animation
 *     that started by itself and lasts more than five seconds; whether it
 *     can be paused, stopped or hidden, or is essential, is for a person to
 *     check.
 *     Basis: WCAG 2.2.2 (not settled).
 * @implementation-notes
 * - The engine moves every animation to a fixed point while the rules run
 *   (settleAnimations, src/core/dom-runner.js), and a finite one then no
 *   longer shows in getAnimations(). The rule reads the animations as they
 *   were before that, from helpers.animationsAtScanStart(), which also
 *   holds those of open shadow roots: the document's getAnimations() leaves
 *   them out. A closed shadow root's are not seen.
 * - An animation that already ended before the scan is not seen. Nor is
 *   motion a script makes by changing styles on a timer, which is not an
 *   animation to the browser, nor a video, a <canvas>, an animated image,
 *   or SVG's own animation elements (SMIL: <animate>, <animateTransform>,
 *   <animateMotion>), which getAnimations() does not list.
 * - Whether an element is drawn is read once the engine has moved its
 *   animations to their fixed point (an endless one to its start): a
 *   translation's reach is the spread of the values its keyframes take
 *   (helpers.animationsAtScanStart's `changes`). Keyframes that can't be
 *   read leave the animation asked about.
 * - A pseudo-element's animation is reported on its element.
 */

const id = 'moving-content-pausable';

const meta = {
  title: 'Content that moves by itself should be possible to pause, stop or hide',
  description:
    'Asks about elements animated when the page loads, for more than five seconds or without end, whether the movement can be paused, stopped or hidden.',
  i18n: {
    titleKey: 'movingContentPausable_title',
    descriptionKey: 'movingContentPausable_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag222', 'structure', 'atomic', 'manual'],
  wcagSc: ['2.2.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.2.2',
      title: 'Pause, Stop, Hide',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {
    facetsBySc: {
      '2.2.2': ['auto-moving-content-pausable']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // WCAG 2.2.2: "lasts more than five seconds".
  const LIMIT_MS = 5000;
  const MAX_LISTED = 5;

  const started =
    helpers && typeof helpers.animationsAtScanStart === 'function'
      ? helpers.animationsAtScanStart()
      : [];

  // Whether the element is drawn, as the style hides it: visibility and
  // opacity 0 are left aside where the animation changes them.
  function shownByStyle(el, changes) {
    if (!helpers.isDomVisibleEligible) return true;
    const animated = changes || {};
    try {
      const info = helpers.isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true,
        ignoreOpacity: 'opacity' in animated
      });
      if (!info || info.eligible !== false) return true;
      return 'visibility' in animated && (info.reasons || []).includes('visibilityHidden');
    } catch {
      return true;
    }
  }

  // Properties whose change can't draw a box that isn't drawn: colours.
  // A translation moves what is drawn, and is weighed by how far it goes.
  const PAINT_ONLY =
    /^(color|backgroundColor|border(Top|Right|Bottom|Left|Block|Inline)?(Start|End)?Color|outlineColor|textDecorationColor|columnRuleColor|caretColor|accentColor|fill|stroke|stopColor|floodColor|lightingColor)$/;
  const view = dom.defaultView(document) || null;

  // How far the animation's translations take the element, left/right
  // and up/down: the spread of the values its keyframes give transform and
  // translate. null for one it can't tell (a rotation, a scale, a
  // percentage, a value it can't read).
  function translationReach(changes) {
    const reach = { x: 0, y: 0 };
    const Matrix = view && (view.DOMMatrixReadOnly || view.DOMMatrix);
    for (const prop of ['transform', 'translate']) {
      const values = changes[prop];
      if (!values) continue;
      if (!Matrix) return null;
      const xs = [];
      const ys = [];
      for (const raw of values) {
        const v = String(raw).trim();
        if (/%/.test(v)) return null;
        let m;
        try {
          if (prop === 'translate') {
            const parts = v === 'none' ? ['0px'] : v.split(/\s+/);
            m = new Matrix(`translate(${parts.slice(0, 2).join(', ')})`);
          } else {
            m = new Matrix(v === 'none' ? 'none' : v);
          }
        } catch {
          return null;
        }
        if (m.a !== 1 || m.b !== 0 || m.c !== 0 || m.d !== 1 || !m.is2D) return null;
        xs.push(m.e);
        ys.push(m.f);
      }
      reach.x += Math.max(...xs) - Math.min(...xs);
      reach.y += Math.max(...ys) - Math.min(...ys);
    }
    return reach;
  }

  const clipsOverflow = (v) => !!v && v !== 'visible';
  // Whether the element is not drawn while the animation runs, from its
  // box: clipped to nothing, no size with its overflow clipped, or off the
  // page, wherever its translation takes it. Only for an animation that
  // changes colours or translations: another change may bring it into view.
  function notDrawnByGeometry(el, changes) {
    if (!changes) return false;
    const props = Object.keys(changes);
    if (!props.every((p) => PAINT_ONLY.test(p) || p === 'transform' || p === 'translate'))
      return false;
    const reach = translationReach(changes);
    if (!reach) return false;
    try {
      const cs = helpers.computedStyle(el) || {};
      if (typeof helpers.isElementClipHidden === 'function' && helpers.isElementClipHidden(el, cs))
        return true;
      const r = dom.getBoundingClientRect(el);
      if (
        (r.width === 0 || r.height === 0) &&
        clipsOverflow(cs.overflowX) &&
        clipsOverflow(cs.overflowY)
      )
        return true;
      // The box's reach: where the translation can take it.
      const box = {
        l: r.left - reach.x,
        r: r.right + reach.x,
        t: r.top - reach.y,
        b: r.bottom + reach.y
      };
      // An ancestor's overflow clip, up to a box that leaves it (fixed or
      // absolute: what clips it then is not simply above it).
      let escapes = cs.position === 'fixed' || cs.position === 'absolute';
      for (let a = helpers.flatParentElement(el), i = 0; a && !escapes && i < 256; i++) {
        const acs = helpers.computedStyle(a) || {};
        const cx = clipsOverflow(acs.overflowX);
        const cy = clipsOverflow(acs.overflowY);
        if (cx || cy) {
          const ar = dom.getBoundingClientRect(a);
          if ((cx && ar.width === 0) || (cy && ar.height === 0)) return true;
          if (cx && (box.r <= ar.left || box.l >= ar.right)) return true;
          if (cy && (box.b <= ar.top || box.t >= ar.bottom)) return true;
        }
        if (acs.position === 'fixed' || acs.position === 'absolute') escapes = true;
        a = helpers.flatParentElement(a);
      }
      // Off the page: wholly before its start, which no scrolling reaches
      // (left of it on a left-to-right page, or above it), or past its
      // right edge where the root clips overflow. A fixed box is off the
      // viewport instead.
      if (!view) return false;
      const root = dom.documentElement(document);
      const rootCs = helpers.computedStyle(root) || {};
      if (cs.position === 'fixed') {
        return box.r <= 0 || box.b <= 0 || box.l >= view.innerWidth || box.t >= view.innerHeight;
      }
      const sx = Number(view.scrollX) || 0;
      const sy = Number(view.scrollY) || 0;
      if (box.b + sy <= 0) return true;
      if (rootCs.direction !== 'rtl') {
        if (box.r + sx <= 0) return true;
        const bodyCs = dom.body(document) ? helpers.computedStyle(dom.body(document)) || {} : {};
        if (
          (clipsOverflow(rootCs.overflowX) || clipsOverflow(bodyCs.overflowX)) &&
          box.l + sx >= Math.max(view.innerWidth, dom.clientWidth(root) || 0)
        )
          return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const byElement = new Map();
  for (const a of started) {
    const el = a && a.target;
    if (!el || dom.nodeType(el) !== 1) continue;
    const loops = a.endTime === null;
    if (!loops && !(a.endTime > LIMIT_MS)) continue;
    if (helpers.isExcluded && helpers.isExcluded(el)) continue;
    // Keyframes that change nothing visible: no motion to show.
    const changes = a.changes && typeof a.changes === 'object' ? a.changes : null;
    if (changes && !Object.keys(changes).length) continue;
    if (!shownByStyle(el, changes)) continue;
    if (notDrawnByGeometry(el, changes)) continue;
    let entry = byElement.get(el);
    if (!entry) {
      entry = { loops: false, animations: [] };
      byElement.set(el, entry);
    }
    if (loops) entry.loops = true;
    if (entry.animations.length < MAX_LISTED)
      entry.animations.push({ kind: a.kind, name: a.name || '', endTime: a.endTime });
  }

  if (!byElement.size) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const [el, entry] of byElement) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    const name = entry.animations.map((a) => a.name).filter(Boolean)[0] || '';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: entry.loops
          ? `This <${tag}> moves by itself without end${name ? ` (animation "${name}")` : ''}.`
          : `This <${tag}> moves by itself for more than five seconds${name ? ` (animation "${name}")` : ''}.`,
        hint: 'Check that a control lets users pause, stop or hide this movement, unless it is essential. Movement that stops by itself within five seconds needs none.',
        i18n: {
          summaryKey: entry.loops
            ? 'movingContentPausable_summary_cantTell_loops'
            : 'movingContentPausable_summary_cantTell_long',
          hintKey: 'movingContentPausable_hint_cantTell',
          params: { element: tag, name }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether a control pauses, stops or hides this movement, or the movement is essential.'
        },
        data: {
          details: {
            reasonCode: entry.loops ? 'MOVING_CONTENT_LOOPS' : 'MOVING_CONTENT_OVER_5S',
            animations: entry.animations
          }
        }
      })
    );
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
