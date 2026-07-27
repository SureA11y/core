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
 */

const id = 'media-alternative-transcript-evidence';

const meta = {
  title: 'Time-based media: transcript / media alternative evidence',
  description:
    'Finds <audio>/<video> elements where a transcript or other text alternative is not strongly evidenced in-page. ' +
    'This rule is conservative and returns cantTell when evidence is missing or unverified.',
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
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Conservative keyword set (deterministic). Includes common EN/FR terms.
  // Keep this list strict to avoid false positives.
  const TRANSCRIPT_TOKENS = [
    'transcript',
    'transcription',
    'texte intégral',
    'compte rendu',
    'verbatim'
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
      return el.textContent || '';
    } catch (e) {
      return '';
    }
  }

  function isElement(el) {
    return !!(el && el.nodeType === 1);
  }

  const __eligCache = new WeakMap();

  function getEligibility(node) {
    if (!node || node.nodeType !== 1) return { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };
    const cached = __eligCache.get(node);
    if (cached) return cached;

    let info = null;
    try {
      info = (helpers && typeof helpers.getEligibilityInfo === 'function')
          ? helpers.getEligibilityInfo(node, ctx, { targetSet: 'acc' })
          : null;
    } catch {
      info = null;
    }

    const norm = (info && typeof info === 'object')
        ? info
        : { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };

    __eligCache.set(node, norm);
    return norm;
  }

  function isEligible(node) {
    const info = getEligibility(node);
    return !!(info && info.eligible);
  }

  function safeSelector(node) {
    return helpers.buildSelector ? helpers.buildSelector(node) : 'html';
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
      if (!el || el.nodeType !== 1) return null;
      const elementId = el.getAttribute && el.getAttribute('id');
      if (elementId) return { type: 'id', value: String(elementId) };
      const tag = (el.tagName || '').toLowerCase();
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
        evidence.notes.push('media has aria-describedby with explicit or substantial transcript text');
        return evidence;
      }
    }

    // 2) In-container transcript heading + substantial visible text
    const parent = mediaEl.parentElement;
    if (isElement(parent) && isEligible(parent)) {
      const headings = parent.querySelectorAll('h1,h2,h3,h4,h5,h6');
      for (const h of headings) {
        if (!isEligible(h)) continue;
        const hText = getNodeText(h);
        if (!containsTranscriptToken(hText)) continue;

        // Look at a small set of following siblings for substantial text (and ensure visibility).
        let sib = h.nextElementSibling;
        let steps = 0;
        while (isElement(sib) && steps < 4) {
          if (isEligible(sib)) {
            const sibText = getNodeText(sib);
            if (textLen(sibText) >= MIN_TRANSCRIPT_CHARS) {
              evidence.strength = 'strong';
              evidence.method = 'adjacent-heading';
              evidence.transcriptNodeSelector = nodeRef(h);
              evidence.notes.push('found transcript heading with substantial visible adjacent text');
              return evidence;
            }
          }
          sib = sib.nextElementSibling;
          steps += 1;
        }
      }
    }

    // 3) Nearby explicit transcript link
    // - Same-document anchors can be verified (strong).
    // - Cross-document links are unverified (weak).
    if (isElement(parent) && isEligible(parent)) {
      const links = parent.querySelectorAll('a[href]');
      for (const a of links) {
        if (!isEligible(a)) continue;

        const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(a, ctx) : null;
        const linkName = nameInfo && nameInfo.value ? nameInfo.value : getNodeText(a);
        if (!containsTranscriptToken(linkName)) continue;

        const href = a.getAttribute('href') || '';
        evidence.transcriptLinkHref = href;
        evidence.transcriptNodeSelector = nodeRef(a);

        // 3a) Same-document anchor: resolve and verify target content has transcript heading + substance.
        if (href.startsWith('#')) {
          const targetId = href.slice(1);
          const target = targetId
            ? (safeRoot.getElementById ? safeRoot.getElementById(targetId) : document.getElementById(targetId))
            : null;

          if (isElement(target) && isEligible(target)) {
            // Find a transcript heading in the target, and ensure there is substantial text in the target subtree.
            const targetHeadings = target.querySelectorAll('h1,h2,h3,h4,h5,h6');
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
              evidence.notes.push('resolved transcript link to an on-page section with transcript heading and substantial text');
              return evidence;
            }
          }

          // If anchor cannot be verified, treat as weak (still better than nothing, but not proof).
          evidence.strength = 'weak';
          evidence.method = 'anchor-unverified';
          evidence.notes.push('transcript link found but anchor target could not be verified as a transcript section');
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

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('audio,video')
    : helpers.queryAll('audio,video');

  for (const el of nodes) {
    const eligInfo = getEligibility(el);
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

    const mediaTag = (el.tagName || '').toLowerCase();

    if (evidence.strength === 'none') {
      const baseOccurrence = {
        summary:
            'A transcript or other text alternative for this time-based media is not strongly evidenced on the page.',
        hint:
            'Provide a clearly identified transcript or other text alternative for audio-only/video-only prerecorded media (for example, a “Transcript” section or link).',
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
        hint:
            'Ensure a clearly identified transcript or other text alternative is available and programmatically or visibly associated with the media on the page.',
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
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail).
  // Strong evidence was found for all applicable media elements, so there
  // is nothing to flag for review.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
