/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check object-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <object> elements that already carry a text alternative:
 *   fallback text content, a non-empty aria-label, an aria-labelledby that
 *   resolves to non-empty text, or a non-empty title. An <object> with none
 *   of those is object-text-alternative-present's failure, not a quality
 *   question. The element must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 * @reports
 *   - `fallbackText`: the text content inside the <object>, trimmed, or
 *     `null` when there is none.
 *   - `ariaLabel`: the `aria-label` value, or `null` when there is none.
 *   - `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to,
 *     or `null` when there is none.
 *   - `ariaLabelledByText`: the text of the elements `aria-labelledby`
 *     points to. Only looked up when there is no `aria-label`; `null`
 *     otherwise or when it resolves to nothing.
 *   - `title`: the `title` value, or `null` when there is none.
 */

const id = 'object-text-alternative-quality';

const meta = {
  title: '<object> text alternative must be appropriate (manual review)',
  description:
    'Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.',
  i18n: {
    titleKey: 'object_textAltQuality_title',
    descriptionKey: 'object_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'object', 'manual', 'atomic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['text-alternative-quality']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && dom.get(safeRoot, 'querySelectorAll')
              ? Array.from(dom.querySelectorAll(safeRoot, sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function isRolePresentationExcluded(el) {
    // The role attribute is a fallback list: the first token naming a real
    // role wins, in any case (role="foo none" and role="NONE" both apply).
    const role = (() => {
      try {
        return helpers.aria.getExplicitRole(el);
      } catch {
        return '';
      }
    })();
    if (role !== 'presentation' && role !== 'none') return false;

    // Exclude only when NOT focusable (mirrors img-alt-present policy)
    let focusable;
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(el, ctx);
        } catch {
          return null;
        }
      })();
      focusable = !!(fi && fi.focusable);
    } else {
      const tabindex = dom.getAttribute(el, 'tabindex');
      focusable =
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()));
    }
    return !focusable;
  }

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('object') : queryAll('object')) || []);
    } catch {
      return queryAll('object');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of els) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    const trim = (v) => (v == null ? '' : String(v)).trim();

    let fallbackText = '';
    let ariaLabel = '';
    let ariaLabelledBy = '';
    let title = '';
    let labelledByText = '';

    try {
      fallbackText = trim(dom.textContent(el) || '');
      ariaLabel = trim(dom.getAttribute(el, 'aria-label'));
      ariaLabelledBy = trim(dom.getAttribute(el, 'aria-labelledby'));
      title = trim(dom.getAttribute(el, 'title'));
    } catch {}

    // Only resolve idrefs if needed/present
    if (
      !ariaLabel &&
      ariaLabelledBy &&
      helpers &&
      typeof helpers.getTextFromIdRefs === 'function'
    ) {
      try {
        const t = helpers.getTextFromIdRefs(ariaLabelledBy, ctx, undefined, el);
        labelledByText = trim(t && t.text);
      } catch {}
    }

    const details = {
      fallbackText: fallbackText || null,
      ariaLabel: ariaLabel || null,
      ariaLabelledBy: ariaLabelledBy || null,
      ariaLabelledByText: labelledByText || null,
      title: title || null
    };

    const hasMechanism = !!(
      details.fallbackText ||
      details.ariaLabel ||
      details.ariaLabelledByText ||
      details.title
    );
    if (!hasMechanism) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review text alternative for <object> for equivalence and appropriateness.',
      hint: 'Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.',
      i18n: {
        summaryKey: 'object_textAltQuality_summary_cantTell',
        hintKey: 'object_textAltQuality_hint_cantTell',
        params: { element: 'object' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
