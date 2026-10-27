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
 *   which restores its role. An object whose type, or failing that its data
 *   URL's extension, names an HTML page, a PDF or plain text is left out,
 *   as object-text-alternative-present leaves it out: it renders no
 *   non-text content (ACT 8fc3b6). So is a Flash object
 *   (`type="application/x-shockwave-flash"`, or with no type a `data`
 *   URL ending in `.swf`): no current
 *   browser runs Flash (support ended in 2021), so the object draws nothing
 *   itself and the browser shows its fallback content, ordinary HTML the
 *   other rules judge. Nothing non-text is left for 1.1.1 (ACT 8fc3b6).
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 * @reports
 *   - `reasonCode`: `TEXT_ALTERNATIVE_REVIEW`.
 *   - `fallbackText`: the text content inside the <object>, trimmed, or
 *     `null` when there is none.
 *   - `ariaLabel`: the `aria-label` value, or `null` when there is none.
 *   - `ariaLabelledBy`: the `aria-labelledby` value, the ids it points to,
 *     or `null` when there is none.
 *   - `ariaLabelledByText`: the text of the elements `aria-labelledby`
 *     points to. Only looked up when there is no `aria-label`; `null`
 *     otherwise or when it resolves to nothing.
 *   - `title`: the `title` value, or `null` when there is none.
 * @reason-codes
 *   - `TEXT_ALTERNATIVE_REVIEW` (cantTell): an <object> has a text
 *     alternative, and a person checks that it describes the object's
 *     content.
 *     It leans fail when the text users get (the ARIA name, else the
 *     fallback text, else the title) is the data file's name, a placeholder
 *     word, or only a note that a plugin or player is missing (English
 *     wording).
 *     Basis: WCAG 1.1.1 (not settled); H53.
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
  },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Look at the object the report names and note what it shows or does (image, chart, animation, player).',
        'Read its text alternative from the report (fallback text, aria-label, aria-labelledby text or title), or in the Accessibility pane of the developer tools.',
        'If the text alternative only names the object, as is common for charts and diagrams, the details may be given elsewhere: in a caption, text or a table next to it, or a link beside it. That counts only if a screen reader user can find it from the object and it gives everything the object shows.',
        'Compare: does the text, with any such description, say what the object shows, or, for a control or player, what it is for?'
      ],
      passWhen:
        "The text alternative, alone or with a description a screen reader user can reach from it, describes the object's content or purpose accurately.",
      failWhen:
        'The text alternative is wrong or vague (such as "object" or a file name), or misses what the object conveys and no description reachable from it gives that, which fails WCAG 1.1.1.'
    }
  }
};

function runInPage(ctx) {
  // An object that embeds an HTML page, a PDF or plain text renders no
  // non-text content, so 1.1.1 asks nothing of it (ACT 8fc3b6): the same
  // test as object-text-alternative-present's, by the type attribute or,
  // failing that, the data URL's extension. An unknown type stays in scope.
  const NON_MEDIA_EXTENSIONS = new Set([
    'htm',
    'html',
    'xhtml',
    'xht',
    'shtml',
    'php',
    'asp',
    'aspx',
    'jsp',
    'txt',
    'xml',
    'json',
    'pdf',
    'csv',
    // Flash: no current browser runs it, so only the fallback shows.
    'swf'
  ]);

  function embedsNonMedia(type, data) {
    const t = String(type || '')
      .trim()
      .toLowerCase()
      .split(';')[0]
      .trim();
    if (t) return !/^(image|audio|video)\//.test(t);
    const m = /\.([a-z0-9]+)$/i.exec(String(data || '').split(/[?#]/)[0]);
    return !!(m && NON_MEDIA_EXTENSIONS.has(m[1].toLowerCase()));
  }

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

  // Text that stands in for the object without describing it: the words
  // for an object itself, and notes that a plugin or player is missing.
  // Every sentence must be such a note, so one beside a real description
  // gets no lean. English wording only.
  const OBJECT_PLACEHOLDER_WORDS = new Set([
    'object',
    'embed',
    'flash',
    'flash movie',
    'movie',
    'video',
    'audio',
    'media',
    'plugin',
    'plug-in'
  ]);
  const MISSING_PLUGIN_SENTENCE_RE = new RegExp(
    [
      "\\b(?:flash|plug-?ins?|player|browsers?)\\b.*\\b(?:not installed|is required|are required|required|needed|not supported|isn't supported|unsupported|(?:does not|doesn't|do not|don't|cannot|can't) (?:support|play|display|show))\\b",
      '\\b(?:install|download|get|update|upgrade|enable)\\b.*\\b(?:flash|plug-?ins?|player|browser)\\b',
      '^(?:sorry|oops)[.!,]?$'
    ].join('|'),
    'i'
  );
  function isMissingPluginNote(text) {
    const sentences = String(text || '')
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return sentences.length > 0 && sentences.every((x) => MISSING_PLUGIN_SENTENCE_RE.test(x));
  }
  function normalized(v) {
    return String(v || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function dataFileName(data) {
    const path = String(data || '').split(/[?#]/)[0];
    let name = path.slice(path.lastIndexOf('/') + 1);
    try {
      name = decodeURIComponent(name);
    } catch {
      // keep it as written
    }
    return normalized(name);
  }

  function leanFor(el, text, data) {
    const t = normalized(text);
    if (!t) return null;
    if (isMissingPluginNote(t)) {
      return {
        toward: 'fail',
        why: 'The text only says a plugin or player is missing, which tells nothing of the content.',
        signals: [{ signal: 'missing-plugin-text', value: true }],
        i18n: { whyKey: 'object_textAltQuality_lean_why_plugin' }
      };
    }
    let signal = null;
    const fileName = dataFileName(data);
    if (fileName && /\./.test(fileName) && t === fileName) signal = 'file-name';
    if (!signal) {
      try {
        const s =
          typeof helpers.getTextAlternativeSignal === 'function'
            ? helpers.getTextAlternativeSignal(el, text)
            : null;
        if (s && (s.altSignal === 'file-name' || s.altSignal === 'placeholder'))
          signal = s.altSignal;
      } catch {
        signal = null;
      }
    }
    if (!signal && OBJECT_PLACEHOLDER_WORDS.has(t.replace(/[.!?:]+$/, ''))) signal = 'placeholder';
    if (!signal) return null;
    return {
      toward: 'fail',
      why: 'A file name or a generic word does not say what the object shows.',
      signals: [{ signal: 'alt-signal', value: signal }],
      caution: 'The word may be all the object shows.',
      i18n: {
        whyKey: 'object_textAltQuality_lean_why',
        cautionKey: 'object_textAltQuality_lean_caution'
      }
    };
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
    if (embedsNonMedia(dom.getAttribute(el, 'type'), dom.getAttribute(el, 'data'))) continue;

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
      reasonCode: 'TEXT_ALTERNATIVE_REVIEW',
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

    const lean = leanFor(
      el,
      ariaLabel || labelledByText || fallbackText || title,
      dom.getAttribute(el, 'data')
    );
    const baseOccurrence = {
      ...(lean ? { lean } : {}),
      summary: 'Check that the text alternative of this <object> conveys what it embeds.',
      hint: 'The fallback content or ARIA name should give the same information as the embedded content.',
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
