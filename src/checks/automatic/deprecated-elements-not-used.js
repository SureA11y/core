/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check deprecated-elements-not-used
 * @atomic true
 * @summary Scrolling <marquee> content needs a way to pause, stop, or hide it
 * @standard WCAG 2.2
 * @sc 2.2.2
 * @applicability
 *   Applies to any scan scope; whether it contains a <marquee> element is
 *   always an answerable question. <marquee> is an obsolete, non-standard
 *   HTML element that browsers still render as auto-scrolling text, with no
 *   built-in user mechanism to pause, stop, or hide it.
 * @expectation
 *   Each <marquee> is reported as cantTell: the scrolling itself is certain,
 *   but a page can offer its own pause or stop control (a button calling the
 *   element's stop() method, for example), and then failure F16 does not
 *   apply. Whether such a control exists is for a person to check. A scope
 *   with no <marquee> passes; there is no separate not-applicable case.
 * @reason-codes
 *   - `MARQUEE_PAUSE_MECHANISM_UNKNOWN` (cantTell): a <marquee> scrolls its
 *     content, and whether the page offers a control to pause, stop or hide
 *     it is for a person to check.
 *     It leans pass when scrollamount is 0 or a control is named for
 *     pausing, stopping or hiding, and fail when there is no such control
 *     and no inline script that could stop it, unless it scrolls only once.
 *     Basis: WCAG 2.2.2 (not settled); F16.
 * @implementation-notes
 * - <blink> is not reported. No current browser makes it blink: it renders
 *   as an unknown inline element, so it holds no blinking content for 2.2.2
 *   to govern.
 * - Not rule-gated on isAccTreeEligible: presence in markup is what the rule
 *   asks about, independent of visibility. Engine-level hidden-subtree
 *   filtering still applies unless engineOptions.includeHiddenElements is
 *   true.
 */

const id = 'deprecated-elements-not-used';

const meta = {
  title: 'Scrolling <marquee> content must be possible to pause, stop, or hide',
  description:
    'Asks, for each obsolete <marquee> element, whether the page offers a way to pause, stop, or hide its auto-scrolling content, since the element itself has none.',
  i18n: {
    titleKey: 'deprecatedElements_title',
    descriptionKey: 'deprecatedElements_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag222', 'structure', 'atomic', 'automatic'],
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
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.2.2': ['deprecated-non-stoppable-elements-absent'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    MARQUEE_PAUSE_MECHANISM_UNKNOWN: {
      steps: [
        'Find the scrolling text the report names and note whether it moves for more than 5 seconds.',
        'Look near it, and elsewhere on the page, for a control to pause, stop or hide it.',
        'Press Tab to reach that control and activate it with Enter or Space.',
        'Check that the text stops moving or disappears.'
      ],
      passWhen:
        'A keyboard-operable control pauses, stops or hides the scrolling text (or it stops on its own within 5 seconds).',
      failWhen:
        'The text keeps scrolling with no way to pause, stop or hide it, which fails WCAG 2.2.2 (F16).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // An inert marquee still moves, so it is judged (isHiddenContent).
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('marquee', { inert: true })
    : helpers.queryAll('marquee');

  const occurrences = [];

  // ---- Lean ----

  // A control whose name says it pauses, stops or hides, in the languages
  // the engine ships.
  const PAUSE_NAME =
    /\b(?:pause|stop|hide|freeze|arr[eê]ter|arr[eê]t|masquer|cacher|pausieren|anhalten|stopp|ausblenden|verbergen|pausa|pausar|detener|parar|ocultar)\b|一時停止|停止|止める|非表示/i;
  const CONTROL_SELECTOR =
    'button, input[type="button" i], input[type="submit" i], input[type="image" i], a[href], [role~="button" i], [role~="switch" i], [role~="link" i]';
  const SCRIPT_STOP = /\.\s*stop\s*\(|\.\s*start\s*\(|marquee/i;
  const HANDLER_ATTRS = ['onclick', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange', 'onfocus'];

  const withLean = (lean) => (lean ? { lean } : {});

  let pageEvidence = null;
  function readPageEvidence() {
    if (pageEvidence) return pageEvidence;
    let pauseControl = null;
    for (const c of helpers.queryAll(CONTROL_SELECTOR) || []) {
      const tag = String(dom.localName(c) || '').toLowerCase();
      const role = helpers.aria.getAuthorRole(c);
      const isControl = role
        ? role === 'button' || role === 'switch' || role === 'link'
        : tag === 'button' || tag === 'input' || tag === 'a';
      if (!isControl) continue;
      const info = helpers.getNameFromContentInfo(c, ctx);
      const name = String((info && info.value) || '')
        .replace(/\s+/g, ' ')
        .trim();
      // A short name, as a control's is: "Bus stop map" is not a pause button.
      if (name && name.split(' ').length <= 3 && PAUSE_NAME.test(name)) {
        pauseControl = name;
        break;
      }
    }
    let stopCall = false;
    const handlerSelector = HANDLER_ATTRS.map((a) => '[' + a + ']').join(', ');
    for (const h of helpers.queryAll(handlerSelector) || []) {
      if (HANDLER_ATTRS.some((a) => SCRIPT_STOP.test(String(dom.getAttribute(h, a) || '')))) {
        stopCall = true;
        break;
      }
    }
    if (!stopCall) {
      const doc = dom.ownerDocument(nodes[0]) || ctx.document;
      for (const sc of dom.querySelectorAll(doc, 'script:not([src])') || []) {
        if (SCRIPT_STOP.test(String(dom.textContent(sc) || ''))) {
          stopCall = true;
          break;
        }
      }
    }
    pageEvidence = { pauseControl, stopCall };
    return pageEvidence;
  }

  // A marquee with scrollamount="0" does not move, and a control named for
  // pausing, stopping or hiding is the usual mechanism: both lean pass. One
  // with no such control and no script that could stop it leans fail (F16),
  // unless it scrolls only once (loop, behavior="slide") and may stop within
  // 5 seconds.
  function marqueeLean(el) {
    const amount = String(dom.getAttribute(el, 'scrollamount') || '').trim();
    const stillByAmount = amount !== '' && parseFloat(amount) === 0;
    if (stillByAmount) {
      return {
        toward: 'pass',
        why: 'The marquee has scrollamount="0", so its content does not move.',
        signals: [{ signal: 'scrollamount-zero', value: true }],
        i18n: { whyKey: 'deprecatedElements_lean_why_still' }
      };
    }
    const { pauseControl, stopCall } = readPageEvidence();
    if (pauseControl) {
      return {
        toward: 'pass',
        why: 'The page has a control named for pausing, stopping or hiding.',
        signals: [
          { signal: 'pause-control', value: pauseControl },
          { signal: 'stop-call', value: stopCall }
        ],
        caution:
          'Check that the control acts on this marquee and can be reached with the keyboard.',
        i18n: {
          whyKey: 'deprecatedElements_lean_why_pauseControl',
          cautionKey: 'deprecatedElements_lean_caution_pauseControl'
        }
      };
    }
    const loop = String(dom.getAttribute(el, 'loop') || '').trim();
    const behavior = String(dom.getAttribute(el, 'behavior') || '')
      .trim()
      .toLowerCase();
    const scrollsOnce = (loop !== '' && parseInt(loop, 10) > 0) || behavior === 'slide';
    if (stopCall || scrollsOnce) return null;
    return {
      toward: 'fail',
      why: 'No control on the page is named for pausing, stopping or hiding, and no script in the page stops the marquee.',
      signals: [
        { signal: 'pause-control', value: null },
        { signal: 'stop-call', value: false },
        { signal: 'scrollamount-zero', value: false }
      ],
      caution: 'A script loaded from a file may wire a control by its id, such as an icon button.',
      i18n: {
        whyKey: 'deprecatedElements_lean_why_noMechanism',
        cautionKey: 'deprecatedElements_lean_caution_noMechanism'
      }
    };
  }

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;

    const tag = dom.tagName(el).toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This <marquee> scrolls its content, and the element itself gives the user no way to pause, stop, or hide it.',
        hint: 'Check that the page offers a control that pauses, stops, or hides this content. Better: replace it with static content, or with an animation that has a pause/stop control.',
        occurrenceOutcome: 'cantTell',
        ...withLean(marqueeLean(el)),
        i18n: {
          summaryKey: 'deprecatedElements_summary_cantTell',
          hintKey: 'deprecatedElements_hint_cantTell',
          params: { element: tag }
        },
        uncertainty: {
          code: 'runtime-dependent',
          needed:
            'Whether the page provides a control that pauses, stops, or hides the scrolling content.',
          evidence: { element: tag }
        },
        data: {
          details: { reasonCode: 'MARQUEE_PAUSE_MECHANISM_UNKNOWN', element: tag }
        }
      })
    );
  }

  // No <marquee> in scope is itself the passing case (see @expectation above).
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
