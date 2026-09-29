/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check video-captions-track-kind
 * @atomic true
 * @summary A video's caption track must use kind="captions"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <video> elements with at least one <track> child carrying
 *   text for the video: kind="subtitles", kind="captions", or no kind at all,
 *   which HTML reads as subtitles. A page with none is notApplicable.
 * @expectation
 *   At least one of those tracks has kind="captions" (RGAA 4.3.2). A video
 *   whose only text tracks are subtitles fails, because RGAA wants captions
 *   delivered through <track> to say so.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not ask for a particular kind value, so
 *   the rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its
 *   own id.
 * - Tracks of kind chapters, descriptions or metadata are ignored. Whether
 *   the video needs captions at all, and whether they are relevant, stays
 *   with RGAA 4.3.1 and 4.4.1.
 */

const id = 'video-captions-track-kind';

const meta = {
  title: 'Video caption tracks use kind="captions"',
  description:
    'Checks that a <video> with text tracks has at least one <track kind="captions">, not only subtitles.',
  i18n: {
    titleKey: 'videoCaptionsTrackKind_title',
    descriptionKey: 'videoCaptionsTrackKind_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'media', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const videos = helpers.queryAllSmart ? helpers.queryAllSmart('video') : helpers.queryAll('video');

  const occurrences = [];
  let applicableCount = 0;

  for (const video of videos) {
    if (!video || !video.children) continue;
    const kinds = Array.from(video.children)
      .filter((c) => String(c.tagName).toLowerCase() === 'track')
      .map(
        (t) =>
          String(t.getAttribute('kind') || 'subtitles')
            .trim()
            .toLowerCase() || 'subtitles'
      )
      .filter((k) => k === 'subtitles' || k === 'captions');
    if (!kinds.length) continue;
    applicableCount += 1;
    if (kinds.includes('captions')) continue;

    occurrences.push(
      helpers.reportOccurrence(video, {
        summary: 'This video has text tracks, but none with kind="captions".',
        hint: 'Mark the track that carries the captions with kind="captions".',
        i18n: {
          summaryKey: 'videoCaptionsTrackKind_summary_fail',
          hintKey: 'videoCaptionsTrackKind_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'noCaptionsKind', kinds },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
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
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
