/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-present
 * @atomic true
 * @summary Accessible <img> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <img> elements included in the accessibility tree.
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable
 *   and have no global ARIA attribute, since presentational roles conflict resolution gives either
 *   one back its img role.
 *   Hidden images are excluded whether or not they are focusable.
 * @expectation
 *   Each applicable <img> element has an alt attribute.
 *   The alt attribute may be empty (alt="").
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_MISSING` (fail): an <img> has no alt attribute (or
 *     one with only spaces) and no name from aria-label, aria-labelledby or
 *     title.
 *     Basis: WCAG 1.1.1; H37; F65; ACT 23a2a8; HTML img alt (MUST).
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
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  // ACT 23a2a8 exempts programmatically hidden images, and that glossary term
  // has no focusability carve-out, so an aria-hidden image stays out of scope
  // even when tabbable; aria-hidden-focus reports that markup instead.
  const isEligibleHelper =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;
  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  // Prefer tagName collection when available (cheap), otherwise fall back.
  function getImgsCollection() {
    try {
      if (queryAllSmart) {
        const r = queryAllSmart('img');
        return Array.isArray(r) ? r : [...(r || [])];
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof dom.get(safeRoot, 'getElementsByTagName') === 'function') {
        return dom.getElementsByTagName(safeRoot, 'img'); // HTMLCollection (live)
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof dom.get(safeRoot, 'querySelectorAll') === 'function')
        return dom.querySelectorAll(safeRoot, 'img');
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
    if (!el || !dom.get(el, 'getAttribute')) continue;

    // Eligibility: only imgs exposed to assistive tech.
    if (isEligibleHelper) {
      let elig;
      try {
        elig = isEligibleHelper(el, ctx);
      } catch {
        elig = null;
      }
      if (elig && elig.eligible === false) continue;
      // If helper returns boolean, treat false as ineligible.
      if (typeof elig === 'boolean' && elig === false) continue;
    }

    // Role (presentation/none) exclusion only when NOT focusable.
    // The resolved role: the first token naming a known role, in any case.
    let role;
    // Why a presentational role is ignored, for the message: 'focus' or
    // 'global' (a global ARIA attribute).
    let keptBy = '';
    try {
      role = helpers.aria.getExplicitRole(el);
    } catch {
      role = '';
    }

    if (role === 'presentation' || role === 'none') {
      // Presentational roles conflict resolution: a global ARIA attribute
      // (aria-describedby, say) keeps the img role, as being focusable does.
      let kept;
      try {
        const fi = getFocusableInfo(el, ctx);
        // Preserve existing behavior: prefer fi.focusable; fall back to fi.tabbable if present.
        kept = !!(fi && (fi.focusable || fi.tabbable));
      } catch {
        kept = false;
      }
      if (kept) keptBy = 'focus';
      if (!kept && typeof helpers.isPresentationalRoleIgnored === 'function') {
        try {
          kept = helpers.isPresentationalRoleIgnored(el);
        } catch {
          kept = false;
        }
        if (kept) keptBy = 'global';
      }

      if (!kept) continue;
    }

    // From here: applicable
    applicableCount += 1;

    // alt attribute presence check. A literally empty alt ("") is the
    // HTML decorative marker and always satisfies this check. A present
    // alt that is non-empty but trims to nothing (a lone space, a tab)
    // does not get that treatment: per HTML-AAM the img-role conflict-
    // resolution flip to presentation only triggers on the literal empty
    // string, so the element keeps its img role while its computed
    // accessible name is empty -- a real failure, not a decorative image.
    let rawAlt;
    try {
      rawAlt = dom.getAttribute(el, 'alt');
    } catch {
      rawAlt = null;
    }
    const isWhitespaceOnlyAlt = rawAlt !== null && rawAlt !== '' && trim(rawAlt) === '';
    const hasAlt = rawAlt !== null && !isWhitespaceOnlyAlt;
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
    const title = trim(dom.getAttribute(el, 'title'));
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

    // The message names what the author did: an alt of only white space,
    // which is not alt="", or a presentational role browsers ignore.
    const msg = (() => {
      if (isWhitespaceOnlyAlt) {
        return {
          summary:
            'This <img> has an alt attribute of only white space, which is not alt="": the image is not treated as decorative, and it has no name.',
          hint: 'Use alt="" (nothing between the quotes) if the image is decorative, or alt text that says what it shows.',
          summaryKey: 'img_altPresent_summary_fail_blankAlt',
          hintKey: 'img_altPresent_hint_fail_blankAlt',
          params: {},
          detail: { cause: 'blankAlt' }
        };
      }
      if (keptBy === 'focus') {
        return {
          summary: 'This <img> has no alt attribute.',
          hint: `It has role="${role}", but browsers ignore that role because the image can take focus, so it is still an image and needs alt. Remove what makes it focusable (such as tabindex), or give it alt text.`,
          summaryKey: 'img_altPresent_summary_fail',
          hintKey: 'img_altPresent_hint_fail_roleIgnoredFocus',
          params: { role },
          detail: { cause: 'presentationIgnored', by: 'focus' }
        };
      }
      if (keptBy === 'global') {
        const names = dom.getAttributeNames(el) || [];
        const GLOBAL =
          /^aria-(atomic|braillelabel|brailleroledescription|busy|controls|current|describedby|description|details|dropeffect|flowto|grabbed|keyshortcuts|live|owns|relevant|roledescription)$/;
        const attr =
          names.find((n) => GLOBAL.test(n)) ||
          names.find((n) => /^aria-/.test(n) && n !== 'aria-hidden') ||
          'aria-*';
        return {
          summary: 'This <img> has no alt attribute.',
          hint: `It has role="${role}", but browsers ignore that role because the image has ${attr}, a global ARIA attribute, so it is still an image and needs alt. Remove ${attr}, or give it alt text.`,
          summaryKey: 'img_altPresent_summary_fail',
          hintKey: 'img_altPresent_hint_fail_roleIgnoredGlobal',
          params: { role, attr },
          detail: { cause: 'presentationIgnored', by: 'global', attr }
        };
      }
      return null;
    })();
    const baseOccurrence = {
      summary: msg ? msg.summary : 'This <img> has no alt attribute.',
      hint: msg
        ? msg.hint
        : 'Add an alt attribute that says what the image shows, or alt="" if the image is purely decorative.',
      i18n: {
        summaryKey: msg ? msg.summaryKey : 'img_altPresent_summary_fail',
        hintKey: msg ? msg.hintKey : 'img_altPresent_hint_fail',
        params: msg ? msg.params : {}
      },
      data: {
        details: {
          reasonCode: 'TEXT_ALTERNATIVE_MISSING',
          ...(msg ? { altCause: msg.detail } : {})
        },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
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
