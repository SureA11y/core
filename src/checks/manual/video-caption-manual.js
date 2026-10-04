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
 *   information (a silent/decorative video needs none), which cannot be
 *   verified from static markup alone (jsdom does not decode media).
 *   This rule is therefore `type: 'manual'` (cantTell-capped, never
 *   fail), matching the precedent set by
 *   `media-alternative-transcript-evidence` for the same class
 *   of "normatively mapped but not statically verifiable" gap. A <video>
 *   with a `<track kind="captions">` whose `src` is non-empty is not
 *   flagged; everything else is flagged for human review. A video whose
 *   only text tracks are subtitles (`kind="subtitles"`, or no `kind`,
 *   which HTML treats as subtitles) gets its own question: subtitles may
 *   be a translation of the dialogue only, without the speaker and sound
 *   information captions carry.
 * @implementation-notes
 * - Does not attempt to verify the referenced track file's content,
 *   only that a captions track is declared with a non-empty `src`.
 */

const id = 'video-caption';

const meta = {
  title: 'Prerecorded video should provide a captions track',
  description:
    'Flags <video> elements with no <track kind="captions"> child, for manual review of whether the video has an audio track that needs captions; a subtitles track alone may be a translation only.',
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
    let hasSubtitlesTrack = false;
    const tracks = el.querySelectorAll('track');
    for (const t of tracks) {
      // A missing kind means subtitles (HTML's missing-value default).
      const kind = t.hasAttribute('kind')
        ? (t.getAttribute('kind') || '').trim().toLowerCase()
        : 'subtitles';
      const src = (t.getAttribute('src') || '').trim();
      if (!src) continue;
      if (kind === 'captions') {
        hasCaptionsTrack = true;
        break;
      }
      if (kind === 'subtitles') hasSubtitlesTrack = true;
    }

    if (hasCaptionsTrack) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = hasSubtitlesTrack
      ? {
          selector: stableSelector,
          html,
          summary:
            'This video has only subtitles tracks, which may translate the dialogue without the speaker and sound information captions carry.',
          hint: 'If this video has an audio track that conveys information, check that a subtitles track is in fact captions, and mark it <track kind="captions">; otherwise add a captions track. Captions are not needed when the video is a media alternative for text on the page and is clearly labelled as one.',
          i18n: {
            summaryKey: 'videoCaption_summary_cantTell_subtitlesOnly',
            hintKey: 'videoCaption_hint_cantTell_subtitlesOnly',
            params: {}
          },
          data: {
            details: { reasonCode: 'SUBTITLES_TRACK_ONLY' }
          }
        }
      : {
          selector: stableSelector,
          html,
          summary: 'This video has no captions track.',
          hint: 'If this video has an audio track that conveys information, add a <track kind="captions" src="..."> with the captioned content. Captions are not needed when the video is a media alternative for text on the page and is clearly labelled as one.',
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

  // Every <video> has a captions track. Not a pass: a track existing says
  // nothing about whether its captions are accurate or complete.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
