/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check video-caption
 * @atomic true
 * @summary Prerecorded <video> should provide a captions track
 * @standard WCAG 2.2
 * @sc 1.2.2
 * @applicability
 *   Any <video> element in the composed DOM.
 * @expectation
 *   SC 1.2.2 requires captions for prerecorded synchronized media, but
 *   only when the video actually has an audio track that conveys
 *   information (a silent/decorative video needs none) — which cannot be
 *   verified from static markup alone (jsdom does not decode media).
 *   This rule is therefore `type: 'manual'` (cantTell-capped, never
 *   fail), matching the precedent set by
 *   `media-alternative-transcript-evidence` for the same class
 *   of "normatively mapped but not staticaly verifiable" gap. A <video>
 *   with a `<track kind="captions">` (or `kind="subtitles"`, commonly
 *   used interchangeably in the wild even though captions and subtitles
 *   serve technically distinct purposes) whose `src` is non-empty is not
 *   flagged; everything else is flagged for human review.
 * @implementation-notes
 * - Does not attempt to verify the referenced track file's content —
 *   only that a captions/subtitles track is declared with a non-empty
 *   `src`.
 */

const id = 'video-caption';

const meta = {
  title: 'Prerecorded video should provide a captions track',
  description:
    'Flags <video> elements with no <track kind="captions"|"subtitles"> child, for manual review of whether the video has an audio track that needs captions.',
  i18n: {
    titleKey: 'videoCaption_title',
    descriptionKey: 'videoCaption_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag122', 'media', 'timebasedmedia', 'atomic', 'manual'],
  wcagSc: ['1.2.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.2.2',
      title: 'Captions (Prerecorded)',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.2.2': ['video-captions-track-evidence'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('video') : helpers.queryAll('video');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.querySelectorAll) continue;

    applicableCount += 1;

    let hasCaptionsTrack = false;
    const tracks = el.querySelectorAll('track');
    for (const t of tracks) {
      const kind = (t.getAttribute('kind') || '').trim().toLowerCase();
      const src = (t.getAttribute('src') || '').trim();
      if ((kind === 'captions' || kind === 'subtitles') && src) {
        hasCaptionsTrack = true;
        break;
      }
    }

    if (hasCaptionsTrack) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: 'This video has no captions (or subtitles) track.',
      hint: 'If this video has an audio track that conveys information, add a <track kind="captions" src="..."> with the captioned content.',
      i18n: {
        summaryKey: 'videoCaption_summary_cantTell',
        hintKey: 'videoCaption_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'CAPTIONS_TRACK_NOT_DETECTED' }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail):
  // every <video> already has a captions/subtitles track.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
