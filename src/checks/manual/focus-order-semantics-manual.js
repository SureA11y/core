/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-order-semantics
 * @atomic true
 * @summary Elements added to the tab order should have interactive semantics
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Elements with an explicit `tabindex` of `0` or greater (in the tab
 *   order) AND an explicit `role` attribute that resolves to one of a
 *   curated set of clearly non-interactive, structural/document roles. The
 *   attribute is a fallback list: its first known, non-abstract token, in
 *   any case, is the role (role="foo HEADING" is a heading, role="foo" is
 *   no role).
 * @expectation
 *   An element placed in the tab order on purpose should communicate
 *   why it's focusable: a role like `heading`, `list`, `note`, or
 *   `presentation` gives assistive technology no interactive semantic to
 *   announce, which is confusing for keyboard users who land on it and
 *   get no indication of what activating it (if anything) would do.
 * @reports
 *   - `tabindex`: the element's `tabindex`, as a number (0 or greater).
 *   - `role`: the non-interactive role the element carries.
 * @reason-codes
 *   - `TABBABLE_WITH_NON_INTERACTIVE_ROLE` (cantTell): the element is in the
 *     tab order but carries a non-interactive role, so a keyboard user who
 *     reaches it is not told what it does.
 *     It leans pass when the element scrolls (overflow auto or scroll and
 *     content measured larger than its box) or is a document inside an
 *     application, with no click or key handler; it leans fail when a click
 *     or key handler is on it and neither holds.
 *     Basis: WCAG 2.4.3 (best practice); WCAG 4.1.2 (best practice).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule.
 * - The non-interactive role list is curated and conservative
 *   (structural/document roles only). Legitimate custom widget patterns
 *   using `tabindex` with an actually interactive role (`option`, `tab`,
 *   `menuitem`, etc.) are never flagged. Elements with `tabindex` and NO
 *   role at all are also not flagged: native semantics or an
 *   intentionally generic custom-interactive pattern cannot be
 *   distinguished from markup alone with the same confidence.
 * - `region` is intentionally excluded from the non-interactive role
 *   list: a tabbable `role="region"` is a real, WCAG 2.1.1/2.1.3-grounded
 *   pattern this engine's own `scrollable-region-focusable` check exists
 *   to RECOMMEND (a scrollable landmark with no other focusable content
 *   needs `tabindex="0"` to be keyboard-reachable at all), so flagging it
 *   here would be internally inconsistent with that sibling check. A
 *   `role="region"` is also commonly made tabbable on its own merits
 *   (e.g. a cookie-consent banner or notification/toast region a keyboard
 *   user should be able to reach directly, as in
 *   `<div role="region" tabindex="0">`).
 * - `tabpanel` is not in the list for the same reason: the WAI-ARIA
 *   Authoring Practices make a tab panel focusable (`tabindex="0"`) when it
 *   holds no focusable content of its own. `navigation` and `status` stay
 *   flagged until there is evidence of a legitimate tabbable pattern.
 */

const id = 'focus-order-semantics';

const meta = {
  title: 'Elements added to the tab order should have interactive semantics',
  description:
    'Flags elements with tabindex >= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, note, presentation), for manual review.',
  i18n: {
    titleKey: 'focusOrderSemantics_title',
    descriptionKey: 'focusOrderSemantics_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const NON_INTERACTIVE_ROLES = new Set([
    'generic',
    'group',
    'text',
    'presentation',
    'none',
    'img',
    'heading',
    'article',
    'banner',
    'contentinfo',
    'main',
    'navigation',
    'complementary',
    'document',
    'note',
    'list',
    'listitem',
    'table',
    'row',
    'cell',
    'columnheader',
    'rowheader',
    'figure',
    'term',
    'definition',
    'paragraph',
    'caption',
    'status',
    'alert',
    'log',
    'tooltip'
  ]);

  // For the lean: what the element does with its tab stop.
  const HANDLER_ATTRS = ['onclick', 'onkeydown', 'onkeyup', 'onkeypress'];
  function hasActivationHandler(el) {
    if (HANDLER_ATTRS.some((a) => String(dom.getAttribute(el, a) || '').trim())) return true;
    try {
      return (
        typeof helpers.getEventListenerInfo === 'function' &&
        !!helpers.getEventListenerInfo(el, ['click', 'keydown', 'keyup', 'keypress']).listens
      );
    } catch {
      return false;
    }
  }
  // A box that scrolls: overflow auto or scroll, and content the browser
  // measures larger than the box. Without layout (jsdom) the sizes are 0.
  function scrollsOverflow(el) {
    try {
      const cs = helpers.computedStyle(el);
      const ov = [cs && cs.overflowX, cs && cs.overflowY].map((v) => String(v || '').toLowerCase());
      const x =
        (ov[0] === 'auto' || ov[0] === 'scroll') &&
        dom.get(el, 'scrollWidth') - dom.get(el, 'clientWidth') > 2;
      const y =
        (ov[1] === 'auto' || ov[1] === 'scroll') &&
        dom.get(el, 'scrollHeight') - dom.get(el, 'clientHeight') > 2;
      return !!(x || y);
    } catch {
      return false;
    }
  }
  function inApplication(el) {
    for (let a = dom.parentElement(el), i = 0; a && i < 500; a = dom.parentElement(a), i++) {
      try {
        if (helpers.aria.getExplicitRole(a) === 'application') return true;
      } catch {}
    }
    return false;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[tabindex][role]')
    : helpers.queryAll('[tabindex][role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const tabindexAttr = dom.getAttribute(el, 'tabindex');
    const tabindex = Number.parseInt(tabindexAttr, 10);
    if (!Number.isFinite(tabindex) || tabindex < 0) continue;

    // The role the attribute resolves to: its first known, non-abstract
    // token, in any case. role="foo heading" is a heading; role="foo" gives
    // no role at all, so the element is not in scope.
    let role;
    try {
      role = helpers.aria.getExplicitRole(el);
    } catch {
      role = '';
    }
    if (!role) continue;

    applicableCount += 1;

    if (!NON_INTERACTIVE_ROLES.has(role)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    const handler = hasActivationHandler(el);
    const scrolls = scrollsOverflow(el);
    const docInApp = role === 'document' && inApplication(el);
    let lean;
    if (!handler && (scrolls || docInApp)) {
      lean = {
        toward: 'pass',
        why: scrolls
          ? 'The element’s content overflows its box and it scrolls, so its tab stop lets keyboard users scroll it.'
          : 'A document inside an application is made focusable so screen reader users can read it.',
        signals: [
          { signal: 'scrollable-overflow', value: scrolls },
          { signal: 'document-in-application', value: docInApp },
          { signal: 'inline-activation-handler', value: false }
        ],
        i18n: {
          whyKey: scrolls
            ? 'focusOrderSemantics_lean_why_scrolls'
            : 'focusOrderSemantics_lean_why_documentInApplication'
        }
      };
    } else if (handler && !scrolls && !docInApp) {
      lean = {
        toward: 'fail',
        why: 'A click or key handler is on the element, so it acts as a control while its role says it is not one.',
        signals: [
          { signal: 'inline-activation-handler', value: true },
          { signal: 'scrollable-overflow', value: false }
        ],
        caution: 'The handler may only track clicks, or serve something other than the element.',
        i18n: {
          whyKey: 'focusOrderSemantics_lean_why_handler',
          cautionKey: 'focusOrderSemantics_lean_caution_handler'
        }
      };
    }

    const baseOccurrence = {
      ...(lean ? { lean } : {}),
      selector: stableSelector,
      html,
      summary: `This element is in the tab order (tabindex="${tabindex}") but has a non-interactive role ("${role}").`,
      hint: "Remove the tabindex if the element isn't meant to be used, or give it an interactive role that matches what it does.",
      i18n: {
        summaryKey: 'focusOrderSemantics_summary_cantTell',
        hintKey: 'focusOrderSemantics_hint_cantTell',
        params: { tabindex: String(tabindex), role }
      },
      data: {
        details: { reasonCode: 'TABBABLE_WITH_NON_INTERACTIVE_ROLE', tabindex, role }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
