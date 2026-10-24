/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check moving-content-pausable
 * @atomic true
 * @summary Content that moves by itself for more than five seconds can be paused, stopped or hidden
 * @standard WCAG 2.2
 * @sc 2.2.2
 * @type manual
 * @applicability
 *   Elements with an animation running when the scan starts, a CSS
 *   animation, a CSS transition or one a script started, on a time-based
 *   timeline (not scroll-driven), that is rendered, and that lasts more than
 *   five seconds from its start (its delay and every iteration) or never
 *   ends. Such motion started without the user asking for it. Without a
 *   browser's getAnimations (jsdom) nothing is applicable.
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
 *     animation name or transitioned property, '' when it has none) and
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
 *   were before that, from helpers.animationsAtScanStart().
 * - An animation that already ended before the scan is not seen. Nor is
 *   motion a script makes by changing styles on a timer, which is not an
 *   animation to the browser, nor a video or a <canvas>.
 * - A pseudo-element's animation is reported on its element.
 */

const id = 'moving-content-pausable';

const meta = {
  title: 'Content that moves by itself can be paused, stopped or hidden',
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

  function rendered(el) {
    if (!helpers.isDomVisibleEligible) return true;
    try {
      const info = helpers.isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      return !(info && info.eligible === false);
    } catch {
      return true;
    }
  }

  const byElement = new Map();
  for (const a of started) {
    const el = a && a.target;
    if (!el || dom.nodeType(el) !== 1) continue;
    const loops = a.endTime === null;
    if (!loops && !(a.endTime > LIMIT_MS)) continue;
    if (helpers.isExcluded && helpers.isExcluded(el)) continue;
    if (!rendered(el)) continue;
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
        hint: 'Check that a control lets users pause, stop or hide this movement, unless it is essential (WCAG 2.2.2). Movement that stops by itself within five seconds needs none.',
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
