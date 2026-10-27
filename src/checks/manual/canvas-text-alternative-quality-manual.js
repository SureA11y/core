/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check canvas-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <canvas> elements that already carry a text alternative:
 *   fallback content inside the element, an ARIA name, or a title. A
 *   <canvas> with none of those has no alternative whose quality could be
 *   judged; that's canvas-text-alternative-present's failure. The element
 *   must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 * @reports
 *   - `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`.
 *   - `value`: the text alternative to review. When the fallback content
 *     has no text of its own but holds an image with alt text or an element
 *     with an aria-label, this is the placeholder `fallback-content`.
 *   - `mechanism`: where the text alternative comes from:
 *     `canvas-fallback` (content inside the <canvas>), `aria-labelledby`,
 *     `aria-label` or `title`.
 *   - `flags`: notes on how the text alternative was found, such as
 *     `title-used` when only the title attribute provides it.
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_REVIEW` (cantTell): a <canvas> has a text
 *     alternative, and a person checks that it conveys what the canvas
 *     shows.
 *     It leans fail when the text that names it is only a note that the
 *     browser does not support canvas (English wording), or is a file name
 *     or a placeholder word.
 *     Basis: WCAG 1.1.1 (not settled); ACT qt1vmo.
 */

const id = 'canvas-text-alternative-quality';

const meta = {
  title: '<canvas> text alternative must be appropriate (manual review)',
  description:
    'Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.',
  i18n: {
    titleKey: 'canvas_textAltQuality_title',
    descriptionKey: 'canvas_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'canvas', 'manual', 'atomic'],
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
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Look at what the canvas the report names shows on screen, including any changes as you use it.',
        'Read its text alternative (the value the report gives, or its fallback content and name in the Accessibility pane).',
        'If the text alternative only names the canvas, as is common for charts and diagrams, the details may be given elsewhere: in a caption, text or a table next to it, or a link beside it. That counts only if a screen reader user can find it from the canvas and it gives everything the canvas shows.',
        'Check that the text, with any such description, conveys the same information or purpose as the drawing, and keeps up if the drawing changes.'
      ],
      passWhen:
        'The text alternative, alone or with a description a screen reader user can reach from it, gives the same information or purpose as what the canvas shows.',
      failWhen:
        'Neither the text alternative nor a description reachable from it gives the information the canvas shows, or the text is vague or wrong, which fails WCAG 1.1.1.'
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

  const __accEligCache = new WeakMap();
  function accEligibleCached(node) {
    if (!isAccTreeEligible) return { eligible: true, reasons: [] };
    if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
    const c = __accEligCache.get(node);
    if (c) return c;
    let r;
    try {
      r = isAccTreeEligible(node, ctx);
    } catch {
      r = { eligible: true, reasons: [] };
    }
    r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
    __accEligCache.set(node, r);
    return r;
  }

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
      let tabindex;
      try {
        tabindex = dom.getAttribute(el, 'tabindex');
      } catch {
        tabindex = null;
      }
      const t = tabindex == null ? '' : String(tabindex).trim();
      focusable = t !== '' && !Number.isNaN(Number(t));
    }
    return !focusable;
  }

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []);
    } catch {
      return queryAll('canvas');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // A note that the browser can't draw the canvas speaks of the browser, not
  // of the drawing. Every sentence of the text must be one, so a note beside
  // a real description gets no lean. English wording only.
  const UNSUPPORTED_SENTENCE_RE = new RegExp(
    [
      "\\bbrowsers?\\b.*\\b(?:does not|doesn't|do not|don't|cannot|can't|can not) (?:yet )?support\\b",
      "\\b(?:canvas|html5|browsers?)\\b.*\\b(?:not supported|isn't supported|unsupported)\\b",
      '\\b(?:update|upgrade|switch|use) (?:to )?(?:your|a (?:modern|newer|different|supported|compatible)) browser\\b',
      '^(?:sorry|oops)[.!,]?$'
    ].join('|'),
    'i'
  );
  function isUnsupportedBrowserNote(text) {
    const sentences = String(text || '')
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return sentences.length > 0 && sentences.every((x) => UNSUPPORTED_SENTENCE_RE.test(x));
  }

  // The text a user gets: the ARIA name when there is one, which wins over
  // the fallback content, else the alternative the shared helper found.
  function textToJudge(el, textAltInfo) {
    if (typeof helpers.getAriaNameInfo === 'function') {
      try {
        const aria = helpers.getAriaNameInfo(el, ctx);
        const v = aria && aria.present ? String(aria.value || '').trim() : '';
        if (v) return { text: v, fallback: false };
      } catch {
        // use the helper's value
      }
    }
    if (!textAltInfo || textAltInfo.value === 'fallback-content') return null;
    return {
      text: String(textAltInfo.value || '').trim(),
      fallback: textAltInfo.mechanism === 'canvas-fallback'
    };
  }

  function leanFor(el, textAltInfo) {
    const judged = textToJudge(el, textAltInfo);
    if (!judged || !judged.text) return null;
    if (judged.fallback && isUnsupportedBrowserNote(judged.text)) {
      return {
        toward: 'fail',
        why: 'The fallback only says the browser does not support canvas, which tells nothing of the drawing.',
        signals: [{ signal: 'unsupported-browser-text', value: true }],
        i18n: { whyKey: 'canvas_textAltQuality_lean_why_unsupported' }
      };
    }
    const signal = (() => {
      try {
        return typeof helpers.getTextAlternativeSignal === 'function'
          ? helpers.getTextAlternativeSignal(el, judged.text)
          : null;
      } catch {
        return null;
      }
    })();
    if (signal && (signal.altSignal === 'file-name' || signal.altSignal === 'placeholder')) {
      return {
        toward: 'fail',
        why: 'A file name or a generic word does not say what the canvas shows.',
        signals: [{ signal: 'alt-signal', value: signal.altSignal }],
        caution: 'The word may be all the canvas shows.',
        i18n: {
          whyKey: 'canvas_textAltQuality_lean_why',
          cautionKey: 'canvas_textAltQuality_lean_caution'
        }
      };
    }
    return null;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of els) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    if (isAccTreeEligible) {
      const elig = accEligibleCached(el);
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    const getTextAlternativeInfo =
      helpers && typeof helpers.getTextAlternativeInfo === 'function'
        ? helpers.getTextAlternativeInfo
        : null;

    // Rule-specific applicability (only elements that already have a text alternative mechanism)
    let textAltInfo = null;
    if (getTextAlternativeInfo) {
      try {
        textAltInfo = getTextAlternativeInfo(el, ctx);
      } catch {
        textAltInfo = null;
      }
    }

    const hasTextAlt = !!(textAltInfo && textAltInfo.present);
    if (!hasTextAlt) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const lean = leanFor(el, textAltInfo);
    const baseOccurrence = {
      ...(lean ? { lean } : {}),
      summary: 'Check that the text alternative of this <canvas> conveys what it shows.',
      hint: 'The fallback text or accessible name should give the same information, or do the same job, as what is drawn.',
      i18n: {
        summaryKey: 'canvas_textAltQuality_summary_cantTell',
        hintKey: 'canvas_textAltQuality_hint_cantTell',
        params: { element: (dom.tagName(el) || '').toLowerCase() }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: { reasonCode: 'TEXT_ALTERNATIVE_REVIEW', ...(textAltInfo || {}) }
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
