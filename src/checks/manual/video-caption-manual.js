/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check video-caption
 * @atomic true
 * @summary Prerecorded <video> should provide a captions track
 * @standard WCAG 2.2
 * @sc 1.2.2
 * @applicability
 *   Any <video> element in the composed DOM, inert ones included: an
 *   inert video is still shown and can still play.
 * @expectation
 *   SC 1.2.2 requires captions for prerecorded synchronized media, but
 *   only when the video actually has an audio track that conveys
 *   information (a silent/decorative video needs none), which cannot be
 *   verified from static markup alone (jsdom does not decode media).
 *   This rule is therefore `type: 'manual'` (cantTell-capped, never
 *   fail), matching the precedent set by
 *   `media-alternative-transcript-evidence` for the same class
 *   of "normatively mapped but not statically verifiable" gap. Every
 *   <video> is asked about: one with a `<track kind="captions">` whose
 *   `src` is non-empty, whether its captions are complete and match the
 *   audio, which a declared track says nothing of (F8); any other, whether
 *   it needs captions. A video whose
 *   only text tracks are subtitles (`kind="subtitles"`, or no `kind`,
 *   which HTML treats as subtitles) gets its own question: subtitles may
 *   be a translation of the dialogue only, without the speaker and sound
 *   information captions carry.
 * @reason-codes
 *   - `CAPTIONS_REVIEW` (cantTell): a <video> has a captions track; a
 *     person checks that the captions carry all the dialogue and the sounds
 *     that matter.
 *     Basis: WCAG 1.2.2 (not settled); G87; F8; ACT f51b46.
 *   - `CAPTIONS_TRACK_NOT_DETECTED` (cantTell): a <video> has no
 *     <track kind="captions"> with a source; a person checks whether it has
 *     audio that needs captions.
 *     Basis: WCAG 1.2.2 (not settled); G87; H95; ACT f51b46.
 *   - `SUBTITLES_TRACK_ONLY` (cantTell): a <video> has only subtitles
 *     tracks, which may carry the dialogue without the speaker and sound
 *     information that captions add.
 *     Basis: WCAG 1.2.2 (not settled); H95; HTML track kind.
 * @implementation-notes
 * - Does not attempt to verify the referenced track file's content,
 *   only that a captions track is declared with a non-empty `src`.
 */

const id = 'video-caption';

const meta = {
  title: 'Prerecorded video should provide a captions track',
  description:
    'Asks about each <video>: with no <track kind="captions"> child, whether it has an audio track that needs captions (a subtitles track alone may be a translation only); with one, whether its captions are complete and match the audio.',
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // An inert video is still shown, and can still play (autoplay), so it is
  // judged like any other: 1.2.2 is about what is presented.
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('video', { inert: true })
    : helpers.queryAll('video');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'querySelectorAll')) continue;

    applicableCount += 1;

    let hasCaptionsTrack = false;
    let hasSubtitlesTrack = false;
    const tracks = dom.querySelectorAll(el, 'track');
    for (const t of tracks) {
      // A missing kind means subtitles (HTML's missing-value default).
      const kind = dom.hasAttribute(t, 'kind')
        ? (dom.getAttribute(t, 'kind') || '').trim().toLowerCase()
        : 'subtitles';
      const src = (dom.getAttribute(t, 'src') || '').trim();
      if (!src) continue;
      if (kind === 'captions') {
        hasCaptionsTrack = true;
        break;
      }
      if (kind === 'subtitles') hasSubtitlesTrack = true;
    }

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    // A captions track says captions exist, not that they are complete:
    // 1.2.2 asks for all the dialogue and the sounds that matter (F8), which
    // only a person watching can check.
    const baseOccurrence = hasCaptionsTrack
      ? {
          selector: stableSelector,
          html,
          summary:
            'This video has a captions track. Check that its captions are complete and match the audio.',
          hint: 'Watch the video with its captions on: they should carry all the dialogue, say who is speaking when that is not clear, and describe the sounds that matter. Captions that leave any of these out do not meet the criterion.',
          i18n: {
            summaryKey: 'videoCaption_summary_cantTell_review',
            hintKey: 'videoCaption_hint_cantTell_review',
            params: {}
          },
          data: {
            details: { reasonCode: 'CAPTIONS_REVIEW' }
          }
        }
      : hasSubtitlesTrack
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

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
