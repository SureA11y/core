/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check heading-quality
 * @atomic true
 * @summary Heading text should describe the content that follows, not be a placeholder
 * @standard WCAG 2.2
 * @sc 2.4.6
 * @applicability
 *   Elements with a heading role (native <h1>-<h6>, or any element with
 *   an explicit role="heading") that are included in the accessibility
 *   tree and have a non-empty accessible name. A heading with no name at
 *   all is `empty-heading`'s concern, not this rule's.
 * @expectation
 *   The heading's accessible name, normalized (whitespace-collapsed,
 *   case-folded, trailing punctuation stripped), is not a placeholder
 *   left in the markup: a known generic word ("heading", "title",
 *   "untitled", "lorem ipsum", ...), a numbered template slot ("Heading
 *   2", "Section 3"), a filename, or a URL. None of these describe the
 *   topic or purpose of the content they introduce.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail), for the
 *   same reason `link-name-quality` is: whether a heading describes the
 *   content that follows it is a reading-comprehension judgment. What is
 *   deterministic is that a placeholder string cannot describe anything,
 *   which is the signal this rule raises for review.
 * - Only the placeholder half of ACT b49b2e is reachable this way. Its
 *   real expectation (the heading describes the first perceivable
 *   content after it) needs a human to read both, and ACT's own failed
 *   examples are all well-formed headings on the wrong topic
 *   ("Weather" over opening hours), which no markup-level check can
 *   catch. Mapped as a partial match; see docs/ACT_RULE_MAPPING.md.
 * - Matching is EXACT against the curated list, never a substring check,
 *   the same precision-over-recall trade-off `link-name-quality`'s own
 *   header comment reasons through: "Heading into the storm" is a real
 *   heading and must not match "heading".
 * - Short headings are intentionally NOT flagged. ACT b49b2e is explicit
 *   that a heading may be a single word or even a single character and
 *   still be descriptive; its own passed example is `<h1>A</h1>` above a
 *   glossary section, so length carries no signal here, unlike in
 *   `page-title-patterns` where a <8-character page title is a real one.
 * - Heading resolution (native tag, explicit role, and the
 *   role="none"-plus-global-ARIA-attribute conflict-resolution case)
 *   mirrors `empty-heading`, which owns the same applicability question;
 *   the two rules split the decision, one on presence, one on quality.
 */

const id = 'heading-quality';

const meta = {
  title: 'Heading text should be descriptive, not a placeholder',
  description:
    'Flags headings whose accessible name is a placeholder rather than a description of the content that follows: a generic word ("Heading", "Untitled"), a numbered template slot ("Section 2"), a filename, or a URL.',
  i18n: {
    titleKey: 'headingQuality_title',
    descriptionKey: 'headingQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag246', 'headings', 'structure', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.6'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.6',
      title: 'Headings and Labels',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.6': ['heading-text-descriptive-evidence'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage; see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const PLACEHOLDER_HEADING_TEXT = new Set([
    'heading',
    'header',
    'headline',
    'subheading',
    'sub heading',
    'sub-heading',
    'title',
    'subtitle',
    'sub title',
    'untitled',
    'section',
    'new section',
    'chapter',
    'content',
    'main content',
    'text',
    'sample text',
    'placeholder',
    'placeholder text',
    'lorem ipsum',
    'insert title here',
    'your title here',
    'add a title',
    'tbd',
    'to be defined',
    'todo',
    'to do',
    'n/a',
    'test',
    'example',
    'default'
  ]);

  // A numbered template slot left as authored: "Heading 2", "Section 3",
  // "Chapter #1". The word alone is already in the set above; this catches
  // the same words carrying an index.
  const NUMBERED_PLACEHOLDER =
    /^(heading|header|headline|subheading|title|subtitle|section|chapter|part|step)\s*[-#:.]?\s*\d+$/;

  const FILENAME_LIKE =
    /^[\w\s\-.,()[\]]+\.(png|jpe?g|gif|svg|webp|avif|bmp|ico|tiff?|pdf|docx?|xlsx?|pptx?|html?|txt|csv|zip)$/;

  const URL_LIKE = /^(https?:\/\/|www\.)\S+$/;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(s) {
    return normalizeWs(s)
      .toLowerCase()
      .replace(/[.,;:!?]+$/g, '')
      .trim();
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  // The WAI-ARIA Global States and Properties set, same list and same
  // purpose as empty-heading's copy: a native h1-h6 marked
  // role="none"/"presentation" reverts to its heading role when it carries
  // any of these, the attribute's presence being what triggers conflict
  // resolution, not its value.
  const GLOBAL_ARIA_ATTRS = [
    'aria-atomic',
    'aria-braillelabel',
    'aria-brailleroledescription',
    'aria-busy',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-live',
    'aria-owns',
    'aria-relevant',
    'aria-roledescription'
  ];

  function hasGlobalAriaAttr(el) {
    for (const attr of GLOBAL_ARIA_ATTRS) {
      if (el.getAttribute && el.getAttribute(attr) != null) return true;
    }
    return false;
  }

  function isHeading(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    const isNativeHeadingTag = /^h[1-6]$/.test(tag);

    const explicit = getExplicitRoleToken(el);
    if (!explicit) return isNativeHeadingTag;
    if (explicit === 'heading') return true;
    if ((explicit === 'none' || explicit === 'presentation') && isNativeHeadingTag) {
      return hasGlobalAriaAttr(el);
    }
    return false;
  }

  // Same name resolution empty-heading uses, so the two rules agree on
  // what a heading is called: aria-label, then aria-labelledby, then the
  // shared accname-aligned "name from content" helper, then title.
  function getAccessibleNameText(el) {
    const al = normalizeWs(el.getAttribute && el.getAttribute('aria-label'));
    if (al) return al;

    const alb = normalizeWs(el.getAttribute && el.getAttribute('aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = document.getElementById(refId);
          if (ref) {
            const t = normalizeWs(ref.textContent);
            if (t) parts.push(t);
          }
        } catch {
          // ignore an unusable reference
        }
      }
      const joined = normalizeWs(parts.join(' '));
      if (joined) return joined;
    }

    if (helpers && typeof helpers.getContentNameInfo === 'function') {
      try {
        const info = helpers.getContentNameInfo(el, ctx);
        if (info && info.present && info.value) return normalizeWs(info.value);
      } catch {
        // fall through to title
      }
    }

    return normalizeWs(el.getAttribute && el.getAttribute('title'));
  }

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isEligible(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  function classify(normalized) {
    if (PLACEHOLDER_HEADING_TEXT.has(normalized) || NUMBERED_PLACEHOLDER.test(normalized)) {
      return 'PLACEHOLDER_HEADING_TEXT';
    }
    if (URL_LIKE.test(normalized)) return 'URL_LIKE_HEADING';
    if (FILENAME_LIKE.test(normalized)) return 'FILENAME_LIKE_HEADING';
    return '';
  }

  const SUMMARY_KEY_BY_REASON = {
    PLACEHOLDER_HEADING_TEXT: 'headingQuality_summary_cantTell_placeholder',
    FILENAME_LIKE_HEADING: 'headingQuality_summary_cantTell_filename',
    URL_LIKE_HEADING: 'headingQuality_summary_cantTell_url'
  };

  const selector = 'h1, h2, h3, h4, h5, h6, [role]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (!isHeading(el)) continue;
    if (!isEligible(el)) continue;

    const rawName = getAccessibleNameText(el);
    const normalized = normalize(rawName);
    if (!normalized) continue; // no name at all: empty-heading's concern.

    applicableCount += 1;

    const reasonCode = classify(normalized);
    if (!reasonCode) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? (() => {
          try {
            return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    const name = normalizeWs(rawName);
    const summaryByReason = {
      PLACEHOLDER_HEADING_TEXT: `This heading's accessible name ("${name}") is a placeholder rather than a description of the content it introduces.`,
      FILENAME_LIKE_HEADING: `This heading's accessible name ("${name}") is a filename rather than a description of the content it introduces.`,
      URL_LIKE_HEADING: `This heading's accessible name ("${name}") is a URL rather than a description of the content it introduces.`
    };

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: summaryByReason[reasonCode],
        hint: 'Rewrite the heading so it names the topic or purpose of the content that follows it.',
        i18n: {
          summaryKey: SUMMARY_KEY_BY_REASON[reasonCode],
          hintKey: 'headingQuality_hint_cantTell',
          params: { name }
        },
        data: {
          details: { reasonCode, name, normalizedName: normalized },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
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
