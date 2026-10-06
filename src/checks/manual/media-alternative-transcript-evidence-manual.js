/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check media-alternative-transcript-evidence
 * @atomic
 * @summary Detects time-based media elements (<audio>/<video>) where a transcript / text alternative
 *          is not strongly evidenced in-page. Designed for WCAG 2.2 SC 1.2.1 (A).
 * @standard WCAG
 * @sc 1.2.1
 * @applicability Any eligible <audio> or <video> element in the composed DOM.
 * @expectation If a strong transcript/text-alternative signal is present (e.g., aria-describedby binding to
 *              a visible transcript block, or a nearby clearly labeled Transcript section/link), no occurrence is reported.
 *              Otherwise, the rule reports cantTell (insufficient evidence) for that media element.
 * @reports
 *   - `evidence.strength`: how strong the transcript signal found near the
 *     media is: `none` (`transcriptNotDetected`) or `weak`
 *     (`transcriptEvidenceUnverified`).
 *   - `evidence.method`: what was found: `none`, `anchor-unverified` (a
 *     transcript link to a part of the same page that does not look like a
 *     transcript) or `external-link` (a transcript link to another page,
 *     which is not followed).
 *   - `evidence.transcriptLinkHref` (a weak signal): the transcript link's
 *     `href`.
 *   - `evidence.transcriptNodeSelector` (a weak signal): a selector for the
 *     transcript link.
 *   - `evidence.notes`: short English notes on what was found. Empty when
 *     nothing was.
 * @implementation-notes
 * - An <audio> without `controls` is hidden by the browser's own stylesheet
 *   (`display: none`), not by the author, and it still plays. So the rule
 *   does not use queryAllSmart, whose hidden-content filter would drop it in
 *   a real browser. It queries <audio>/<video> directly (scope,
 *   excludeSelectors and open shadow roots honoured) and applies the
 *   eligibility check to the element itself, except for an <audio> without
 *   `controls`: there it applies the check to the parent (or shadow host)
 *   and to the element's own `hidden` and `aria-hidden="true"`, since its
 *   computed style cannot tell the browser's hiding from the author's.
 */

const id = 'media-alternative-transcript-evidence';

const meta = {
  title: 'Time-based media: transcript or text alternative evidence',
  description:
    'Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.',
  i18n: {
    titleKey: 'mediaTranscriptPresent_title',
    descriptionKey: 'mediaTranscriptPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag121', 'timebasedmedia', 'media', 'atomic', 'manual'],
  wcagSc: ['1.2.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.2.1',
      title: 'Audio-only and Video-only (Prerecorded)',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.2.1': ['transcript-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Conservative keyword set (deterministic), matched in every language at
  // once: a Japanese page may well link an English transcript. Keep this
  // list strict to avoid false positives.
  const TRANSCRIPT_TOKENS = [
    'transcript',
    'transcription',
    'texte intégral',
    'compte rendu',
    'verbatim',
    'transkript',
    'transkription',
    'abschrift',
    'textfassung',
    'transcripción',
    'transcripcion',
    'トランスクリプト',
    '文字起こし',
    '書き起こし'
  ];

  // Minimum transcript body length to be considered "substantial" when used as evidence.
  // (Avoids treating short summaries as transcripts.)
  const MIN_TRANSCRIPT_CHARS = 200;

  // If aria-describedby contains no transcript token, require a larger body to consider it evidence.
  const MIN_DESCRIBEDBY_CHARS_WITHOUT_TOKEN = 400;

  function normText(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function containsTranscriptToken(s) {
    const t = normText(s);
    if (!t) return false;
    for (const tok of TRANSCRIPT_TOKENS) {
      if (t.includes(tok)) return true;
    }
    return false;
  }

  function textLen(s) {
    const t = normText(s);
    return t ? t.length : 0;
  }

  function getNodeText(el) {
    try {
      if (!el) return '';
      return dom.textContent(el) || '';
    } catch {
      return '';
    }
  }

  function isElement(el) {
    return !!(el && dom.nodeType(el) === 1);
  }

  const __eligCache = new WeakMap();

  function getEligibility(node) {
    if (!node || dom.nodeType(node) !== 1)
      return { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };
    const cached = __eligCache.get(node);
    if (cached) return cached;

    let info;
    try {
      info =
        helpers && typeof helpers.getEligibilityInfo === 'function'
          ? helpers.getEligibilityInfo(node, ctx, { targetSet: 'acc' })
          : null;
    } catch {
      info = null;
    }

    const norm =
      info && typeof info === 'object'
        ? info
        : { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };

    __eligCache.set(node, norm);
    return norm;
  }

  function isEligible(node) {
    const info = getEligibility(node);
    return !!(info && info.eligible);
  }

  // Evidence object includes strength, so the rule can treat "unverified external link" as insufficient proof.
  function evidenceNone() {
    return {
      strength: 'none', // none | weak | strong
      method: 'none',
      transcriptNodeSelector: null,
      transcriptLinkHref: null,
      notes: []
    };
  }

  function nodeRef(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      const elementId = dom.get(el, 'getAttribute') && dom.getAttribute(el, 'id');
      if (elementId) return { type: 'id', value: String(elementId) };
      const tag = (dom.tagName(el) || '').toLowerCase();
      return { type: 'tag', value: tag };
    } catch {
      return null;
    }
  }

  const __evidenceCache = new WeakMap();

  // Walk a small neighborhood around the media element to find transcript cues.
  // Bounded for determinism and performance.
  function findTranscriptEvidence(mediaEl) {
    const evidence = evidenceNone();

    // 1) aria-describedby strong binding
    const descInfo = helpers.getAccessibleDescriptionInfo
      ? helpers.getAccessibleDescriptionInfo(mediaEl, ctx)
      : null;

    if (descInfo && descInfo.mechanism === 'aria-describedby') {
      const descText = descInfo.value || '';
      const hasToken = containsTranscriptToken(descText);
      const len = textLen(descText);

      // Strong signal if the described text clearly indicates transcript, or is very substantial.
      if (hasToken || len >= MIN_DESCRIBEDBY_CHARS_WITHOUT_TOKEN) {
        evidence.strength = 'strong';
        evidence.method = 'aria-describedby';
        evidence.notes.push(
          'media has aria-describedby with explicit or substantial transcript text'
        );
        return evidence;
      }
    }

    // 2) In-container transcript heading + substantial visible text
    const parent = dom.parentElement(mediaEl);
    if (isElement(parent) && isEligible(parent)) {
      const headings = dom.querySelectorAll(parent, 'h1,h2,h3,h4,h5,h6');
      for (const h of headings) {
        if (!isEligible(h)) continue;
        const hText = getNodeText(h);
        if (!containsTranscriptToken(hText)) continue;

        // Look at a small set of following siblings for substantial text (and ensure visibility).
        let sib = dom.nextElementSibling(h);
        let steps = 0;
        while (isElement(sib) && steps < 4) {
          if (isEligible(sib)) {
            const sibText = getNodeText(sib);
            if (textLen(sibText) >= MIN_TRANSCRIPT_CHARS) {
              evidence.strength = 'strong';
              evidence.method = 'adjacent-heading';
              evidence.transcriptNodeSelector = nodeRef(h);
              evidence.notes.push(
                'found transcript heading with substantial visible adjacent text'
              );
              return evidence;
            }
          }
          sib = dom.nextElementSibling(sib);
          steps += 1;
        }
      }
    }

    // 3) Nearby explicit transcript link
    // - Same-document anchors can be verified (strong).
    // - Cross-document links are unverified (weak).
    if (isElement(parent) && isEligible(parent)) {
      const links = dom.querySelectorAll(parent, 'a[href]');
      for (const a of links) {
        if (!isEligible(a)) continue;

        const nameInfo = helpers.getAccessibleNameInfo
          ? helpers.getAccessibleNameInfo(a, ctx)
          : null;
        const linkName = nameInfo && nameInfo.value ? nameInfo.value : getNodeText(a);
        if (!containsTranscriptToken(linkName)) continue;

        const href = dom.getAttribute(a, 'href') || '';
        evidence.transcriptLinkHref = href;
        evidence.transcriptNodeSelector = nodeRef(a);

        // 3a) Same-document anchor: resolve and verify target content has transcript heading + substance.
        if (href.startsWith('#')) {
          const targetId = href.slice(1);
          const target = targetId
            ? dom.get(safeRoot, 'getElementById')
              ? dom.getElementById(safeRoot, targetId)
              : dom.getElementById(document, targetId)
            : null;

          if (isElement(target) && isEligible(target)) {
            // Find a transcript heading in the target, and ensure there is substantial text in the target subtree.
            const targetHeadings = dom.querySelectorAll(target, 'h1,h2,h3,h4,h5,h6');
            let hasTranscriptHeading = false;
            for (const th of targetHeadings) {
              if (!isEligible(th)) continue;
              if (containsTranscriptToken(getNodeText(th))) {
                hasTranscriptHeading = true;
                break;
              }
            }
            const targetText = getNodeText(target);

            if (hasTranscriptHeading && textLen(targetText) >= MIN_TRANSCRIPT_CHARS) {
              evidence.strength = 'strong';
              evidence.method = 'anchor-target';
              evidence.notes.push(
                'resolved transcript link to an on-page section with transcript heading and substantial text'
              );
              return evidence;
            }
          }

          // If anchor cannot be verified, treat as weak (still better than nothing, but not proof).
          evidence.strength = 'weak';
          evidence.method = 'anchor-unverified';
          evidence.notes.push(
            'transcript link found but anchor target could not be verified as a transcript section'
          );
          return evidence;
        }

        // 3b) External or cross-document link: do not treat as proof without crawling.
        evidence.strength = 'weak';
        evidence.method = 'external-link';
        evidence.notes.push('transcript link found but cannot verify content without crawling');
        return evidence;
      }
    }

    return evidence;
  }

  const occurrences = [];
  let applicableCount = 0;

  // Every match in scope, hidden or not (see @implementation-notes).
  function queryAllUnfiltered(sel) {
    const engineOptions = ctx.engineOptions || {};
    const deep =
      engineOptions.includeShadowDom !== false && typeof helpers.queryAllDeep === 'function';
    const list = Array.from((deep ? helpers.queryAllDeep(sel) : helpers.queryAll(sel)) || []);
    return typeof helpers.isExcluded === 'function'
      ? list.filter((el) => !helpers.isExcluded(el))
      : list;
  }

  function hiddenByBrowserStylesheet(el) {
    return (
      String(dom.tagName(el) || '').toLowerCase() === 'audio' &&
      !(dom.get(el, 'hasAttribute') && dom.hasAttribute(el, 'controls'))
    );
  }

  // The eligibility that decides whether the media element is in scope.
  function getMediaEligibility(el) {
    if (!hiddenByBrowserStylesheet(el)) return getEligibility(el);
    if (dom.hasAttribute(el, 'hidden')) {
      return { eligible: false, reasons: ['hiddenAttr'], targetSet: 'acc', accEligible: false };
    }
    if (
      String(dom.getAttribute(el, 'aria-hidden') || '')
        .trim()
        .toLowerCase() === 'true'
    ) {
      return { eligible: false, reasons: ['ariaHidden'], targetSet: 'acc', accEligible: false };
    }
    let parent = dom.parentElement(el);
    if (!parent) {
      const rootNode = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
      parent = rootNode && dom.host(rootNode) ? dom.host(rootNode) : null;
    }
    return parent ? getEligibility(parent) : getEligibility(el);
  }

  const nodes = queryAllUnfiltered('audio,video');

  for (const el of nodes) {
    const eligInfo = getMediaEligibility(el);
    if (!eligInfo || !eligInfo.eligible) continue;

    applicableCount += 1;

    // Evidence must be computed and cached per media element: two sibling
    // <audio>/<video> elements under the same container do not necessarily
    // share the same transcript evidence (e.g. one has a strong
    // aria-describedby binding, the other has none). Keying this cache by
    // the shared container instead of the element itself previously caused
    // an undocumented sibling to silently inherit another element's
    // evidence classification.
    let evidence = __evidenceCache.get(el);
    if (!evidence) {
      evidence = findTranscriptEvidence(el);
      __evidenceCache.set(el, evidence);
    }

    const mediaTag = (dom.tagName(el) || '').toLowerCase();

    if (evidence.strength === 'none') {
      const baseOccurrence = {
        summary:
          'A transcript or other text alternative for this time-based media is not strongly evidenced on the page.',
        hint: 'Provide a clearly identified transcript or other text alternative for prerecorded audio-only or video-only media, for example a visible “Transcript” section or link. No transcript is needed when the media is itself an alternative for text on the page and is clearly labelled as one.',
        i18n: {
          summaryKey: 'mediaTranscriptPresent_summary_cantTell_missing',
          hintKey: 'mediaTranscriptPresent_hint_cantTell_missing',
          params: { element: mediaTag }
        },
        data: {
          details: {
            reasonCode: 'transcriptNotDetected',
            mediaTag,
            evidence
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
      } else {
        occurrences.push({ selector: '', html: '', ...baseOccurrence });
      }
      continue;
    }

    if (evidence.strength === 'weak') {
      const baseOccurrence = {
        summary:
          'A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.',
        hint: 'Ensure a clearly identified transcript or other text alternative is available and visibly or programmatically associated with the media on the page. No transcript is needed when the media is itself an alternative for text on the page and is clearly labelled as one.',
        i18n: {
          summaryKey: 'mediaTranscriptPresent_summary_cantTell_unverified',
          hintKey: 'mediaTranscriptPresent_hint_cantTell_unverified',
          params: { element: mediaTag }
        },
        data: {
          details: {
            reasonCode: 'transcriptEvidenceUnverified',
            mediaTag,
            evidence
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
      } else {
        occurrences.push({ selector: '', html: '', ...baseOccurrence });
      }
    }
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

  // Strong evidence of a transcript was found for every applicable media
  // element, so there is nothing to flag. Not a pass: the evidence is a
  // heuristic, and says nothing about whether the transcript is complete.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
