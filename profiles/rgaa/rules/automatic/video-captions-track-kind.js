/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check video-captions-track-kind
 * @atomic true
 * @summary A video's caption track must use kind="captions"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <video> elements with at least one <track> child with a
 *   non-empty src carrying text for the video: kind="subtitles",
 *   kind="captions", or no kind at all, which HTML reads as subtitles. A
 *   track with no src delivers nothing and is ignored. A page with none is
 *   notApplicable.
 * @expectation
 *   At least one of those tracks has kind="captions" (RGAA 4.3.2). When
 *   the only tracks are subtitles:
 *   - fail when one of them has a srclang in the language of the video
 *     (the nearest lang attribute, compared on the primary subtag): a
 *     same-language subtitles track is most likely captions that do not say
 *     so;
 *   - cantTell otherwise (srclang in another language, or missing, or no
 *     language to compare with): the track may be a translation, which is
 *     not a caption track, and then 4.3.2 does not apply and the question
 *     is 4.3.1's.
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
    'Checks that a <video> with text tracks has at least one <track kind="captions">, not only subtitles, and asks when its subtitles may be translations.',
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
  const cantTellOccurrences = [];
  let applicableCount = 0;

  function primarySubtag(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .split(/[-_]/)[0];
  }

  // The language of the video's content: its nearest lang attribute.
  function videoLanguage(video) {
    try {
      const host = video.closest ? video.closest('[lang]') : null;
      return host ? primarySubtag(host.getAttribute('lang')) : '';
    } catch {
      return '';
    }
  }

  for (const video of videos) {
    if (!video || !video.children) continue;
    const tracks = Array.from(video.children)
      .filter((c) => String(c.tagName).toLowerCase() === 'track')
      .filter((t) => String(t.getAttribute('src') || '').trim())
      .map((t) => ({
        kind:
          String(t.getAttribute('kind') || 'subtitles')
            .trim()
            .toLowerCase() || 'subtitles',
        srclang: primarySubtag(t.getAttribute('srclang'))
      }))
      .filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
    if (!tracks.length) continue;
    applicableCount += 1;
    const kinds = tracks.map((t) => t.kind);
    if (kinds.includes('captions')) continue;

    const lang = videoLanguage(video);
    const sameLanguage = !!lang && tracks.some((t) => t.srclang === lang);
    if (!sameLanguage) {
      const srclangs = tracks.map((t) => t.srclang);
      cantTellOccurrences.push(
        helpers.reportOccurrence(video, {
          summary:
            'This video has only subtitles tracks, none in the language of the video; they may be translations rather than captions.',
          hint: 'If a track carries captions for the video’s own language, mark it kind="captions" with the matching srclang. If the tracks are translations, check that captions are provided some other way (RGAA 4.3.1).',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'videoCaptionsTrackKind_summary_cantTell_translation',
            hintKey: 'videoCaptionsTrackKind_hint_cantTell_translation',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether a subtitles track carries captions or a translation.',
            evidence: { videoLang: lang || null, srclangs }
          },
          data: {
            details: { reasonCode: 'subtitlesMayBeTranslation', kinds, srclangs },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

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
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
