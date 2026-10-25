/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <img> elements whose alt attribute is present and non-empty.
 *   The element must be included in the accessibility tree, and
 *   a role attribute resolving to presentation/none (its first token naming
 *   a known role, matched case-insensitively) takes it out of scope unless
 *   it is focusable, which restores its role. An <img> with no alt at all is
 *   img-alt-present's failure, and one with alt="" is img-alt-decorative's
 *   review.
 * @expectation
 *   Human review is required to confirm that the provided text alternative
 *   is accurate and appropriate. Alt text that looks like something other
 *   than a description gets its own summary and hint: a file name (or alt
 *   equal to the image's own file name), a web address, only symbols (such
 *   as "★★★★☆"), a placeholder or generic word such as "image" or "TBD",
 *   an opening that says it is an
 *   image ("image of", "photo of"), or alt longer than 150 characters. Every
 *   finding is still `cantTell`: each of these can be right in context.
 * @reports
 *   - `altSignal`: what made the alt text look suspicious, on those findings
 *     only: `file-name`, `url`, `symbols`, `placeholder`, `redundant-prefix` or
 *     `too-long`. Absent on a finding with ordinary alt text. When several
 *     apply, the first in that order is reported.
 *   - `length`: the alt text's length in characters, on `too-long` only.
 *   - `limit`: the length above which alt counts as too long (150), on
 *     `too-long` only.
 *   - `reasonCode`: `IMAGE_ONLY_CONTROL_CONTENT` when the image is the
 *     only content of a link or button (no text and no other image in it),
 *     so its alt is the control's name (H30), with `controlContent` naming
 *     the control's role (`link` or `button`); `TEXT_ALTERNATIVE_REVIEW`
 *     otherwise.
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_REVIEW` (cantTell): an <img> has non-empty alt
 *     text, and a person checks that it conveys what the image shows.
 *     Basis: WCAG 1.1.1 (not settled); H37; ACT qt1vmo.
 *   - `IMAGE_ONLY_CONTROL_CONTENT` (cantTell): the image is the only
 *     content of a link or button, so its alt text is the control's name
 *     and should say what the control does.
 *     Basis: WCAG 1.1.1 (not settled); H30; ACT qt1vmo.
 * @implementation-notes
 * - A page reports at most 50 images with ordinary alt text and, on top,
 *   at most 50 whose alt has a signal, each in document order, so ordinary
 *   images early on a page can't hide a suspicious one later. The rule's
 *   own `data.details` counts both (`applicableCount`, `suspiciousCount`)
 *   and says whether any were left out (`truncated`).
 * - The signals are not reason codes: they change the message and
 *   `data.details` only, and a finding keeps its identity
 *   (`ruleId + reasonCode + html`) when its alt changes from ordinary to
 *   suspicious. The reason codes are IMAGE_ONLY_CONTROL_CONTENT and
 *   TEXT_ALTERNATIVE_REVIEW.
 * - The detection is helpers.getTextAlternativeSignal (dom-helpers.js),
 *   shared with area-alt-quality and input-image-alt-quality, and the
 *   message helpers.describeTextAlternativeSignal; both are in
 *   RULE_HELPERS.md.
 * - Word lists exist for en, de, es, fr and ja. English is always checked;
 *   the list for the image's own language (nearest lang attribute, across
 *   shadow roots) is added on top, as link-name-quality does.
 * - Exact matches for placeholders ("Logo" is flagged, "Company logo" is
 *   not), prefixes followed by more text for the "image of" case. Alt equal to the image's file name without its
 *   extension only counts when it looks like a file name (no spaces, and an
 *   underscore, two digits in a row or two hyphens), so `alt="Search"` on
 *   `search.svg` is ordinary alt text.
 * - 150 characters is a common guideline, not a WCAG limit: alt is read in
 *   one go and can't be navigated, so a longer one usually belongs in a
 *   long description.
 */

const id = 'img-alt-quality';

const meta = {
  title: '<img> alt text must be appropriate (manual review)',
  description:
    'Flags <img> elements with non-empty alt text for human review of appropriateness, and says when the alt looks like a file name, a web address, a placeholder, an "image of" opening or is very long.',
  i18n: {
    titleKey: 'img_altQuality_title',
    descriptionKey: 'img_altQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'manual', 'atomic'],
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
  },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    IMAGE_ONLY_CONTROL_CONTENT: {
      steps: [
        "Find the link or button the report names; the image is its only content, so its alt is the control's name.",
        'Read the alt text, then activate the control or check its destination to learn what it does.',
        'Decide whether the alt says what the control does ("Search", "Home"), not what the image looks like.'
      ],
      passWhen: "The alt text states the control's purpose or destination.",
      failWhen:
        'The alt text does not say what the control does, for example a file name, address, generic word or symbols, which fails WCAG 1.1.1 (H30, F30).'
    },
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Find the image the report names and read its alt text (the report gives the reason it looked suspect, if any).',
        'Look at the image and its context, and ask what it shows that matters to the page.',
        'Decide whether the alt says that; a file name, web address or generic word such as "image" does not.'
      ],
      passWhen:
        'The alt text conveys what the image shows that a user needs, in words that fit the context.',
      failWhen:
        "The alt text does not convey the image's content, for example a file name, address or generic word, which fails WCAG 1.1.1 (F30)."
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Cap occurrences to keep manual “quality” checks fast on large pages.
  // Deterministic: we keep DOM order, just stop collecting after N. Alt text
  // that looks like something other than a description has an allowance of
  // its own, so a page's first 50 ordinary images can't hide an IMG_1234.jpg
  // further down.
  const MAX_OCCURRENCES = 50;
  const MAX_SUSPICIOUS = 50;

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
    const role = (() => {
      try {
        // Fallback list: first token naming a known role, any case.
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

  // What makes an alt look like something other than a description, shared
  // with area-alt-quality and input-image-alt-quality.
  const getTextAlternativeSignal =
    helpers && typeof helpers.getTextAlternativeSignal === 'function'
      ? helpers.getTextAlternativeSignal
      : () => null;
  const describeTextAlternativeSignal =
    helpers && typeof helpers.describeTextAlternativeSignal === 'function'
      ? helpers.describeTextAlternativeSignal
      : () => null;

  const selector = 'img[alt]:not([alt=""])';
  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart(selector) : queryAll(selector)) || []);
    } catch {
      return queryAll(selector);
    }
  })();

  if (!els.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          suspiciousCount: 0,
          maxSuspicious: MAX_SUSPICIOUS,
          truncated: false
        }
      }
    };
  }

  // 'link' or 'button' when this image is the only content of one (no text
  // and no other image in it), '' otherwise. A report may want the image
  // judged with the control it names: its text alternative is then the
  // control's name (H30).
  const CONTROL_ROLES = new Set(['link', 'button']);
  const OTHER_CONTENT_TAGS = new Set([
    'img',
    'svg',
    'canvas',
    'input',
    'video',
    'object',
    'embed',
    'iframe'
  ]);
  function onlyContentOf(el) {
    let control = null;
    let role = '';
    let cur = helpers.flatParentElement ? helpers.flatParentElement(el) : dom.parentElement(el);
    for (let steps = 0; cur && steps < 50; steps++) {
      try {
        role = (helpers.getRoleInfo && (helpers.getRoleInfo(cur, ctx) || {}).role) || '';
      } catch {
        role = '';
      }
      if (CONTROL_ROLES.has(role)) {
        control = cur;
        break;
      }
      cur = helpers.flatParentElement ? helpers.flatParentElement(cur) : dom.parentElement(cur);
    }
    if (!control) return '';
    let other = false;
    let visits = 0;
    (function walk(n) {
      if (other || visits++ > 2000) return;
      const kids = helpers.flatChildNodes
        ? helpers.flatChildNodes(n)
        : Array.from(dom.childNodes(n) || []);
      for (const k of kids) {
        if (other) return;
        const type = dom.nodeType(k);
        if (type === 3) {
          if (String(dom.nodeValue(k) || '').trim()) other = true;
        } else if (type === 1 && k !== el) {
          if (
            dom.getAttribute(k, 'aria-hidden') === 'true' ||
            dom.getAttribute(k, 'hidden') != null
          )
            continue;
          if (OTHER_CONTENT_TAGS.has(String(dom.tagName(k)).toLowerCase())) other = true;
          else walk(k);
        }
      }
    })(control);
    return other ? '' : role;
  }

  const occurrences = [];
  let applicableCount = 0; // total applicable elements
  let collectedCount = 0; // how many occurrences we actually reported
  let suspiciousCount = 0; // applicable elements whose alt has a signal
  let ordinaryReported = 0;
  let suspiciousReported = 0;

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

    // Rule-specific applicability: non-empty alt
    const alt = (() => {
      try {
        return String(dom.getAttribute(el, 'alt') || '').trim();
      } catch {
        return '';
      }
    })();
    if (!alt) continue;

    applicableCount += 1;

    // Reading the alt is cheap; it decides which allowance the image counts
    // against before any expensive occurrence building.
    const signal = (() => {
      try {
        return getTextAlternativeSignal(el, dom.getAttribute(el, 'alt'));
      } catch {
        return null;
      }
    })();
    if (signal) suspiciousCount += 1;
    if (signal ? suspiciousReported >= MAX_SUSPICIOUS : ordinaryReported >= MAX_OCCURRENCES) {
      continue;
    }

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const controlContent = onlyContentOf(el);
    // Alt that looks like something other than a description gets the
    // shared message for its signal; ordinary alt keeps this rule's own.
    const message = signal ? describeTextAlternativeSignal(signal, 'img') : null;
    const baseOccurrence = {
      summary: message
        ? message.summary
        : "Check that this image's alt text is accurate and fits its context.",
      hint: message
        ? message.hint
        : 'The alt text should give the information or purpose the image has on this page, without repeating nearby text or reading like a file name.',
      i18n: message
        ? message.i18n
        : {
            summaryKey: 'img_altQuality_summary_cantTell',
            hintKey: 'img_altQuality_hint_cantTell',
            params: { element: 'img' }
          },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: controlContent
          ? { ...(signal || {}), reasonCode: 'IMAGE_ONLY_CONTROL_CONTENT', controlContent }
          : { ...(signal || {}), reasonCode: 'TEXT_ALTERNATIVE_REVIEW' }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }

    collectedCount += 1;
    if (signal) suspiciousReported += 1;
    else ordinaryReported += 1;
  }

  if (applicableCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          suspiciousCount: 0,
          maxSuspicious: MAX_SUSPICIOUS,
          truncated: false
        }
      }
    };
  }

  const truncated = applicableCount > collectedCount;

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: 'minor',
    occurrences,
    data: {
      details: {
        applicableCount,
        reportedCount: collectedCount,
        maxOccurrences: MAX_OCCURRENCES,
        suspiciousCount,
        maxSuspicious: MAX_SUSPICIOUS,
        truncated
      }
    }
  };
}

module.exports = { id, meta, runInPage };
