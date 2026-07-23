'use strict';

/**
 * @check a11ycore-mouse-only-event-handlers
 * @atomic true
 * @summary Pointer-only inline event handlers should have a keyboard-reachable equivalent
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Elements carrying at least one inline pointer-only event-handler
 *   attribute (`onmouseover`, `onmouseout`, `onmousedown`, `onmouseup`,
 *   `ondblclick`, `onmousemove`, `onmouseenter`, `onmouseleave`) with a
 *   non-empty value, that are also eligible/reachable (not
 *   hidden/`aria-hidden`/`display:none`).
 * @expectation
 *   The element also carries at least one keyboard-reachable inline
 *   handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard-
 *   event equivalents), or `onfocus`/`onblur` (the standard substitute
 *   for hover-triggered behavior — focus/blur are the keyboard-
 *   navigable analog to mouseover/mouseout, per WCAG technique G90).
 *   Otherwise the element's mouse-driven behavior (a hover tooltip, a
 *   custom dropdown, a drag interaction) has no way to be triggered by a
 *   keyboard-only user.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail), not
 *   `automatic`: this can only see inline `on*="..."` HTML attributes —
 *   a keyboard handler attached elsewhere via `addEventListener` (the
 *   norm in most modern frameworks) is invisible to a static markup
 *   scan and would make a `fail` a false positive. Surfaced by a diff
 *   against HTML_CodeSniffer's WCAG2AA ruleset (see ROADMAP.md's Tier 4
 *   research notes) — this is a real, well-known WCAG 2.1.1 anti-pattern
 *   (technique G90/F54) that nothing else in this rule set checks.
 * - Deliberately does NOT treat `onclick` as a keyboard-equivalent
 *   excuse: whether `onclick` is keyboard-reachable depends on the
 *   element's separate focusability (native interactive tag or
 *   `tabindex`), which this rule does not attempt to cross-check — and
 *   for the specific hover-triggered handlers this rule targets
 *   (`onmouseover`/`onmouseout`/etc.), `onclick` isn't actually an
 *   equivalent interaction model regardless of focusability (hover and
 *   click are different gestures with different semantics).
 * - Only inline HTML attribute handlers are detectable; JS-attached
 *   listeners (`addEventListener('mouseover', ...)`) are invisible to a
 *   static DOM scan — a documented limitation, not an oversight.
 */

const id = 'a11ycore-mouse-only-event-handlers';

const meta = {
  title: 'Pointer-only inline event handlers should have a keyboard-reachable equivalent',
  description:
    'Flags elements with an inline pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.',
  i18n: {
    titleKey: 'a11ycore_mouseOnlyEventHandlers_title',
    descriptionKey: 'a11ycore_mouseOnlyEventHandlers_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'manual'],
  wcagSc: ['2.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.1.1', title: 'Keyboard', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '2.1.1': ['mouse-only-event-handlers-evidence'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const MOUSE_ONLY_ATTRS = [
    'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup',
    'ondblclick', 'onmousemove', 'onmouseenter', 'onmouseleave'
  ];
  const KEYBOARD_EQUIV_ATTRS = ['onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur'];

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  const selector = MOUSE_ONLY_ATTRS.map((a) => `[${a}]`).join(', ');
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const presentMouseAttrs = MOUSE_ONLY_ATTRS.filter((a) => trim(el.getAttribute(a)));
    if (!presentMouseAttrs.length) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible = typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const hasKeyboardEquiv = KEYBOARD_EQUIV_ATTRS.some((a) => trim(el.getAttribute(a)));
    if (hasKeyboardEquiv) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
    const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This element has ${presentMouseAttrs.join(', ')} but no keyboard-reachable equivalent handler.`,
      hint: 'Add onkeydown/onkeyup/onkeypress (or onfocus/onblur for hover-triggered behavior) so this functionality is also reachable by keyboard.',
      i18n: {
        summaryKey: 'a11ycore_mouseOnlyEventHandlers_summary_cantTell',
        hintKey: 'a11ycore_mouseOnlyEventHandlers_hint_cantTell',
        params: { attrs: presentMouseAttrs.join(', ') }
      },
      data: {
        details: { reasonCode: 'MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT', mouseAttrs: presentMouseAttrs },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'moderate', occurrences };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
