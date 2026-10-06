/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check input-image-alt-present
 * @atomic true
 * @summary Accessible <input type="image"> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <input type="image"> elements included in the accessibility tree.
 * @expectation
 *   Each applicable <input type="image"> element has a non-empty accessible
 *   name from aria-labelledby, aria-label, alt or title. An empty name
 *   fails, whether alt is missing or empty (alt="").
 *   An author-supplied name that equals a browser default for an image
 *   button ("Submit", "Submit Query") is not an empty name: it may describe
 *   the button, so it is reported as cantTell for a person to judge.
 */

const id = 'input-image-alt-present';

const meta = {
  title: '<input type="image"> must have an alt attribute',
  description:
    'Checks that <input type="image"> elements provide an alt attribute to support a text alternative mechanism.',
  i18n: {
    titleKey: 'inputImage_altPresent_title',
    descriptionKey: 'inputImage_altPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'atomic', 'automatic'],
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
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['input-image-alt-attr-present']
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

  // ACT 59796f applies to image buttons included in the accessibility tree,
  // which excludes focusable content inside aria-hidden.
  const isEligibleHelper =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  const inputs = (() => {
    try {
      return Array.from(
        (queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) ||
          []
      );
    } catch {
      return queryAll('input[type="image"]');
    }
  })();

  if (!inputs.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of inputs) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    if (isEligibleHelper) {
      const elig = (() => {
        try {
          return isEligibleHelper(el, ctx);
        } catch {
          return true;
        }
      })();
      const eligible = typeof elig === 'boolean' ? elig : !(elig && elig.eligible === false);
      if (!eligible) continue;
    }

    applicableCount += 1;

    // An author-supplied name equal to the browser's own fallback name for an
    // image button ("Submit Query" from HTML-AAM, "Submit" from Chrome) may
    // be the browser default copied by hand, or may describe a submit button
    // accurately. It is a name, so ACT 59796f passes it; whether it conveys
    // the button's purpose is asked, not failed. Only the English defaults
    // are recognised. With no author name at all the control fails below.
    const effectiveName = (() => {
      let v = '';
      if (getAriaNameInfo) {
        try {
          const aria = getAriaNameInfo(el, ctx);
          if (aria && aria.present && aria.value) v = String(aria.value);
        } catch {
          v = '';
        }
      }
      if (!v) {
        const alt = dom.getAttribute(el, 'alt');
        if (alt != null && String(alt).trim()) v = String(alt);
      }
      if (!v) {
        const t = dom.getAttribute(el, 'title');
        if (t != null && String(t).trim()) v = String(t);
      }
      return v.trim().toLowerCase();
    })();

    if (effectiveName === 'submit query' || effectiveName === 'submit') {
      const eligInfoDefault = getEligibilityInfo
        ? getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        : null;
      const defaultNameOccurrence = {
        summary:
          'The accessible name matches the browser default for an image button; check that it describes what the button does.',
        hint: 'If the name does not say what the button does, replace it with text that does, for example "Search".',
        occurrenceOutcome: 'cantTell',
        i18n: {
          summaryKey: 'inputImage_altPresent_summary_cantTell_defaultName',
          hintKey: 'inputImage_altPresent_hint_cantTell_defaultName',
          params: { element: 'input[type=image]' }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether this default-looking name describes what the button does.',
          evidence: { name: effectiveName }
        },
        data: {
          visibilityFilter: eligInfoDefault || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: { reasonCode: 'default_name' }
        }
      };
      cantTellOccurrences.push(
        helpers && typeof helpers.reportOccurrence === 'function'
          ? helpers.reportOccurrence(el, defaultNameOccurrence)
          : { selector: '', html: '', ...defaultNameOccurrence }
      );
      continue;
    }

    // effectiveName already covers the naming sources HTML-AAM allows here,
    // in order: aria-label/aria-labelledby, then alt, then title.
    if (effectiveName) continue;

    // An image button is a control, so an empty name fails whether alt is
    // absent or present-but-empty. alt="" marks a decorative image, and an
    // image button is never decorative.
    const emptyAlt = dom.getAttribute(el, 'alt') !== null;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = emptyAlt
      ? {
          summary: 'Empty alt="" on <input type="image"> leaves the control unnamed.',
          hint: 'Describe the action in alt, or name the control with aria-label or aria-labelledby.',
          i18n: {
            summaryKey: 'inputImage_altPresent_summary_emptyAlt',
            hintKey: 'inputImage_altPresent_hint_emptyAlt',
            params: { element: 'input[type=image]' }
          },
          data: {
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
            details: { reasonCode: 'empty_alt' }
          }
        }
      : {
          summary: 'Missing alt attribute on <input type="image">.',
          hint: 'Add an alt attribute (use alt="" only when a separate accessible name is provided).',
          i18n: {
            summaryKey: 'inputImage_altPresent_summary_fail',
            hintKey: 'inputImage_altPresent_hint_fail',
            params: { element: 'input[type=image]' }
          },
          data: {
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
            details: { reasonCode: 'missing_alt' }
          }
        };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length && !cantTellOccurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'minor'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
