'use strict';

/**
 * @check a11ycore-nested-interactive-controls-absent
 * @atomic true
 * @summary An interactive control must not contain another interactive control
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements matching the interactive-control set (native
 *   a[href], button, input (not hidden), select, textarea; or an explicit
 *   ARIA widget role: button, link, checkbox, radio, switch, tab, textbox,
 *   combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option,
 *   slider, spinbutton, searchbox, treeitem).
 * @expectation
 *   The element does not contain, as a descendant, another element from
 *   that same interactive-control set (e.g. a <button> wrapping a
 *   <select>, or a link containing a checkbox). Nested interactive
 *   controls are not reliably announced or operable via assistive
 *   technology — activating the outer control and the inner one become
 *   ambiguous, and some AT only exposes one of the two.
 * @implementation-notes
 * - Matches the reference engine's nested-interactive. Reports on the outer
 *   (containing) control, not the nested descendant — this engine
 *   considers the container the fixable unit ("move the nested control
 *   outside this element").
 * - A container can be reported once even with multiple nested
 *   descendants (listed together); a deeply nested chain (A > B > C, all
 *   interactive) reports both A and B as separate occurrences, since each
 *   genuinely contains a nested interactive control.
 */

const id = 'a11ycore-nested-interactive-controls-absent';

const meta = {
  title: 'Interactive controls must not be nested',
  description: 'Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.',
  i18n: {
    titleKey: 'a11ycore_nestedInteractiveControlsAbsent_title',
    descriptionKey: 'a11ycore_nestedInteractiveControlsAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['nested-interactive-controls-absent'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const INTERACTIVE_SELECTOR = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="listbox"]',
    '[role="menuitem"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    '[role="option"]',
    '[role="slider"]',
    '[role="spinbutton"]',
    '[role="searchbox"]',
    '[role="treeitem"]'
  ].join(', ');

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(INTERACTIVE_SELECTOR, safeRoot) : helpers.queryAll(INTERACTIVE_SELECTOR, safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.querySelectorAll) continue;

    applicableCount += 1;

    let nested = [];
    try {
      nested = Array.from(el.querySelectorAll(INTERACTIVE_SELECTOR));
    } catch {
      nested = [];
    }
    if (!nested.length) continue;

    const nestedTags = nested.map((n) => (n && n.tagName ? n.tagName.toLowerCase() : 'unknown'));

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This interactive control contains one or more other interactive controls.',
      hint: 'Move the nested interactive control(s) outside this element; nested interactive controls are not reliably operable via assistive technology.',
      i18n: {
        summaryKey: 'a11ycore_nestedInteractiveControlsAbsent_summary_fail',
        hintKey: 'a11ycore_nestedInteractiveControlsAbsent_hint_fail',
        params: { element: tag, nestedElements: nestedTags.join(', ') }
      },
      data: {
        details: { reasonCode: 'NESTED_INTERACTIVE_CONTROL', element: tag, nestedElements: nestedTags }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };