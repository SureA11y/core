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
 *   - `MARQUEE_STOPS_ONLY_ON_HOVER` (cantTell): a <marquee> scrolls its
 *     content and stops only while the pointer is over it (its own
 *     onmouseover or onmouseenter calls this.stop(), or a handler or inline
 *     script listening only for hover stops it), which keyboard and touch
 *     users cannot do; whether the page offers another way to pause, stop or
 *     hide it is for a person to check. Given in place of
 *     `MARQUEE_PAUSE_MECHANISM_UNKNOWN` when that code would lean fail. It
 *     leans fail.
 *     Basis: WCAG 2.2.2 (not settled); F16.
 * @implementation-notes
 * - <blink> is not reported. No current browser makes it blink: it renders
 *   as an unknown inline element, so it holds no blinking content for 2.2.2
 *   to govern.
 * - Stopping on hover is not a pause mechanism for 2.2.2: a keyboard or
 *   touch user cannot hold a pointer over the text. A marquee that only
 *   stops so keeps leaning fail, with a message that says why. Listeners
 *   the listener hook records are not read: the hook says that an element
 *   has a mouseover listener, not what it does.
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
  coverage: { facetsBySc: { '2.2.2': ['deprecated-non-stoppable-elements-absent'] } }
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
  // A call to stop() or start(), and the ways a script reaches a marquee
  // (header): by tag here, by id in reachesMarquee.
  const STOP_CALL = /\.\s*(?:stop|start)\s*\(/;
  const MARQUEE_BY_TAG =
    /getElementsByTagName\s*\(\s*['"`]marquee['"`]|querySelector(?:All)?\s*\(\s*['"`][^'"`]*\bmarquee\b/i;
  // The engine's own script, injected inline by the page (a script tag holding
  // the bundle): what it says about marquees is the engine's, not the page's.
  const isEngineScript = (text) => text.includes('runa11yCoreInPage') && text.includes('a11ycore');
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
    // The ids of the marquees in scope, as a script may name them.
    const ids = [];
    for (const m of nodes) {
      const mid = String(dom.getAttribute(m, 'id') || '').trim();
      if (mid) ids.push(mid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }
    const byId = ids.length
      ? new RegExp(
          '[\'"`#](?:' +
            ids.join('|') +
            ')[\'"`]|(?:^|[^\\w$.-])(?:' +
            ids.join('|') +
            ')\\s*\\.\\s*(?:stop|start)\\s*\\('
        )
      : null;
    const reachesMarquee = (text) => MARQUEE_BY_TAG.test(text) || !!(byId && byId.test(text));
    let stopCall = false;
    const handlerSelector = HANDLER_ATTRS.map((a) => '[' + a + ']').join(', ');
    for (const h of helpers.queryAll(handlerSelector) || []) {
      const onMarquee = String(dom.localName(h) || '').toLowerCase() === 'marquee';
      const calls = HANDLER_ATTRS.some((a) => {
        const text = String(dom.getAttribute(h, a) || '');
        if (!STOP_CALL.test(text)) return false;
        return (
          reachesMarquee(text) || (onMarquee && /\bthis\s*\.\s*(?:stop|start)\s*\(/.test(text))
        );
      });
      if (calls) {
        stopCall = true;
        break;
      }
    }
    // Inline scripts that stop a marquee. One whose only events are the
    // pointer's hover (mouseover, mouseenter and their ends) stops it only
    // while the pointer is over it: kept apart in hoverScripts.
    const hoverScripts = [];
    const doc = dom.ownerDocument(nodes[0]) || ctx.document;
    for (const sc of dom.querySelectorAll(doc, 'script:not([src])') || []) {
      const text = String(dom.textContent(sc) || '');
      if (isEngineScript(text)) continue;
      if (!STOP_CALL.test(text) || !reachesMarquee(text)) continue;
      if (isHoverOnlyScript(text)) {
        hoverScripts.push(text);
      } else {
        stopCall = true;
      }
    }
    pageEvidence = { pauseControl, stopCall, hoverScripts };
    return pageEvidence;
  }

  // The event types a script names: addEventListener('type', ...) and
  // el.ontype = ....
  const HOVER_TYPES = new Set(['mouseover', 'mouseenter', 'mouseout', 'mouseleave']);
  function isHoverOnlyScript(text) {
    const types = new Set();
    for (const m of text.matchAll(/addEventListener\s*\(\s*['"`]([A-Za-z]+)['"`]/g))
      types.add(m[1].toLowerCase());
    for (const m of text.matchAll(/\.\s*on([A-Za-z]+)\s*=(?!=)/g)) types.add(m[1].toLowerCase());
    return types.size > 0 && [...types].every((t) => HOVER_TYPES.has(t));
  }

  // Whether `text` reaches this marquee: by tag, or by its id.
  function reachesThis(el, text) {
    if (MARQUEE_BY_TAG.test(text)) return true;
    const mid = String(dom.getAttribute(el, 'id') || '').trim();
    if (!mid) return false;
    const q = mid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('[\'"`#]' + q + '[\'"`]|(?:^|[^\\w$.-])' + q + '\\s*\\.\\s*stop\\s*\\(').test(
      text
    );
  }

  // Whether the marquee stops when the pointer is over it: its own
  // onmouseover or onmouseenter calls this.stop(), another element's such
  // handler stops it, or an inline script listening only for hover does.
  const HOVER_ATTRS = ['onmouseover', 'onmouseenter'];
  const STOP_ONLY = /\.\s*stop\s*\(/;
  let hoverHandlers = null;
  function stopsOnHover(el) {
    for (const a of HOVER_ATTRS) {
      const text = String(dom.getAttribute(el, a) || '');
      if (/\bthis\s*\.\s*stop\s*\(/.test(text)) return true;
    }
    if (!hoverHandlers) hoverHandlers = helpers.queryAll('[onmouseover], [onmouseenter]') || [];
    for (const h of hoverHandlers) {
      for (const a of HOVER_ATTRS) {
        const text = String(dom.getAttribute(h, a) || '');
        if (STOP_ONLY.test(text) && reachesThis(el, text)) return true;
      }
    }
    return readPageEvidence().hoverScripts.some(
      (text) => STOP_ONLY.test(text) && reachesThis(el, text)
    );
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
        why: `The page has a control named for pausing, stopping or hiding: "${pauseControl}".`,
        signals: [
          { signal: 'pause-control', value: pauseControl },
          { signal: 'stop-call', value: stopCall }
        ],
        caution:
          'Check that the control acts on this marquee and can be reached with the keyboard.',
        i18n: {
          whyKey: 'deprecatedElements_lean_why_pauseControl',
          cautionKey: 'deprecatedElements_lean_caution_pauseControl',
          params: { pauseControl }
        }
      };
    }
    const loop = String(dom.getAttribute(el, 'loop') || '').trim();
    const behavior = String(dom.getAttribute(el, 'behavior') || '')
      .trim()
      .toLowerCase();
    const scrollsOnce = (loop !== '' && parseInt(loop, 10) > 0) || behavior === 'slide';
    if (stopCall || scrollsOnce) return null;
    if (stopsOnHover(el)) {
      return {
        toward: 'fail',
        why: 'The marquee stops only while the pointer is over it, which keyboard and touch users cannot do, and no control on the page is named for pausing, stopping or hiding.',
        signals: [
          { signal: 'pause-control', value: null },
          { signal: 'stop-call', value: false },
          { signal: 'stops-on-hover', value: true },
          { signal: 'scrollamount-zero', value: false }
        ],
        caution:
          'A script loaded from a file may wire a control by its id, such as an icon button.',
        i18n: {
          whyKey: 'deprecatedElements_lean_why_hoverOnly',
          cautionKey: 'deprecatedElements_lean_caution_noMechanism'
        }
      };
    }
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
    const lean = marqueeLean(el);
    // It stops only while the pointer is over it: the question is whether
    // there is another way to pause it.
    const hoverOnly = !!(
      lean && lean.signals.some((x) => x.signal === 'stops-on-hover' && x.value)
    );
    const reasonCode = hoverOnly
      ? 'MARQUEE_STOPS_ONLY_ON_HOVER'
      : 'MARQUEE_PAUSE_MECHANISM_UNKNOWN';

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: hoverOnly
          ? 'This <marquee> scrolls its content and stops only while the pointer is over it, which keyboard and touch users cannot do.'
          : 'This <marquee> scrolls its content, and the element itself gives the user no way to pause, stop, or hide it.',
        hint: hoverOnly
          ? 'Check that the page offers another way to pause, stop, or hide this content, one that works with the keyboard. Better: replace it with static content, or with an animation that has a pause/stop control.'
          : 'Check that the page offers a control that pauses, stops, or hides this content. Better: replace it with static content, or with an animation that has a pause/stop control.',
        occurrenceOutcome: 'cantTell',
        ...withLean(lean),
        i18n: {
          summaryKey: hoverOnly
            ? 'deprecatedElements_summary_cantTell_hoverOnly'
            : 'deprecatedElements_summary_cantTell',
          hintKey: hoverOnly
            ? 'deprecatedElements_hint_cantTell_hoverOnly'
            : 'deprecatedElements_hint_cantTell',
          params: { element: tag }
        },
        uncertainty: {
          code: 'runtime-dependent',
          needed: hoverOnly
            ? 'Whether the page offers another way, one that works with the keyboard, to pause, stop, or hide the scrolling content.'
            : 'Whether the page provides a control that pauses, stops, or hides the scrolling content.',
          evidence: { element: tag }
        },
        data: {
          details: { reasonCode, element: tag }
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
