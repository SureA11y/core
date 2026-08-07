/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-present
 * @atomic true
 * @summary Accessible <img> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <img> elements that are exposed to assistive technologies.
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are focusable or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <img> element has an alt attribute.
 *   The alt attribute may be empty (alt="").
 */

const id = 'img-alt-present';

const meta = {
  title: '<img> must have an alt attribute',
  description:
    'Checks that <img> elements provide an alt attribute to support a text alternative mechanism.',
  i18n: {
    titleKey: 'img_altPresent_title',
    descriptionKey: 'img_altPresent_description'
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
      '1.1.1': ['img-alt-attr-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  // Prefer tagName collection when available (cheap), otherwise fall back.
  function getImgsCollection() {
    try {
      if (queryAllSmart) {
        const r = queryAllSmart('img');
        return Array.isArray(r) ? r : Array.from(r || []);
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof safeRoot.getElementsByTagName === 'function') {
        return safeRoot.getElementsByTagName('img'); // HTMLCollection (live)
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof safeRoot.querySelectorAll === 'function')
        return safeRoot.querySelectorAll('img');
    } catch {
      // fall through
    }

    return [];
  }

  const imgs = getImgsCollection();
  const imgLen = imgs && typeof imgs.length === 'number' ? imgs.length : 0;

  if (!imgLen) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  // Helper-safe trim
  const trim = (v) => (v == null ? '' : String(v)).trim();

  for (let i = 0; i < imgLen; i++) {
    const el = imgs[i];
    if (!el || !el.getAttribute) continue;

    // Eligibility: only imgs exposed to assistive tech (with focusable/IDREF exceptions handled by helper)
    if (isAccTreeEligible) {
      let elig;
      try {
        elig = isAccTreeEligible(el, ctx);
      } catch {
        elig = null;
      }
      if (elig && elig.eligible === false) continue;
      // If helper returns boolean, treat false as ineligible.
      if (typeof elig === 'boolean' && elig === false) continue;
    }

    // Role (presentation/none) exclusion only when NOT focusable.
    let role;
    try {
      role = trim(el.getAttribute('role')).toLowerCase();
    } catch {
      role = '';
    }

    if (role === 'presentation' || role === 'none') {
      let focusable;
      try {
        const fi = getFocusableInfo(el, ctx);
        // Preserve existing behavior: prefer fi.focusable; fall back to fi.tabbable if present.
        focusable = !!(fi && (fi.focusable || fi.tabbable));
      } catch {
        focusable = false;
      }

      if (!focusable) continue;
    }

    // From here: applicable
    applicableCount += 1;

    // alt attribute presence check (empty allowed)
    let hasAlt;
    try {
      hasAlt = el.getAttribute('alt') !== null;
    } catch {
      hasAlt = false;
    }
    if (hasAlt) continue;

    // aria-label / aria-labelledby is also a valid, standards-recognized
    // text-alternative mechanism for <img> (HTML-AAM accessible name
    // computation includes ARIA naming before falling back to alt); an
    // image with a non-empty ARIA name is not missing a text alternative
    // just because it lacks an alt attribute.
    if (getAriaNameInfo) {
      let ariaName;
      try {
        ariaName = getAriaNameInfo(el, ctx);
      } catch {
        ariaName = null;
      }
      if (ariaName && ariaName.present) continue;
    }

    // A non-empty title attribute is HTML-AAM's next fallback naming source
    // for <img> once alt is entirely absent (not merely alt="", which
    // explicitly marks decorative and stays excluded from this branch since
    // hasAlt already short-circuited above). An `<img src="..." title="...">`
    // with no alt attribute at all is not missing a text alternative.
    const title = trim(el.getAttribute('title'));
    if (title) continue;

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    const baseOccurrence = {
      summary: 'Missing alt attribute on <img>.',
      hint: 'Add an alt attribute (use alt="" only for decorative images).',
      i18n: {
        summaryKey: 'img_altPresent_summary_fail',
        hintKey: 'img_altPresent_hint_fail',
        params: {}
      },
      data: { visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] } }
    };

    occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
