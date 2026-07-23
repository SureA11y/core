'use strict';

/**
 * @check a11ycore-no-autoplay-audio
 * @atomic true
 * @summary Autoplaying, unmuted <audio>/<video> should provide a pause/stop or volume-control mechanism
 * @standard WCAG 2.2
 * @sc 1.4.2
 * @applicability
 *   Any <audio autoplay> or <video autoplay> element that is not `muted`.
 * @expectation
 *   SC 1.4.2 only applies when audio plays automatically for MORE than 3
 *   seconds; clip duration is not knowable from static markup (jsdom does
 *   not decode media), so this rule cannot determine whether the SC even
 *   applies to a given element. It is deliberately authored as `type:
 *   'manual'` (cantTell-capped, never fail) rather than guessing: an
 *   autoplaying unmuted element with no `controls` attribute (the native,
 *   statically-verifiable mechanism to pause/stop or adjust volume) is
 *   flagged for human review rather than treated as a deterministic
 *   violation.
 * @implementation-notes
 * - Elements with `controls` present are not flagged: native controls
 *   provide pause/stop and volume adjustment, satisfying the SC's
 *   mechanism requirement regardless of duration.
 * - Elements with `muted` present are not flagged: muted playback is not
 *   audible, so the SC's condition ("plays automatically... audio")
 *   does not apply.
 * - Custom (JS-built) controls that don't use the native `controls`
 *   attribute cannot be detected statically — a documented limitation,
 *   same class as `iframe-focusable-content`'s `contentDocument` gap.
 * - Not gated on `isAccTreeEligible`: unlike most rules, a `display:none`
 *   or `aria-hidden` audio/video element still plays audible sound in a
 *   real browser, so visual/AT-tree eligibility is not a relevant filter
 *   here.
 */

const id = 'a11ycore-no-autoplay-audio';

const meta = {
  title: 'Autoplaying audio should provide a pause/stop or volume-control mechanism',
  description:
    'Flags <audio>/<video> elements that autoplay unmuted with no native controls attribute, for manual review against the 3-second exemption in WCAG 1.4.2.',
  i18n: {
    titleKey: 'a11ycore_noAutoplayAudio_title',
    descriptionKey: 'a11ycore_noAutoplayAudio_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag142', 'media', 'atomic', 'manual'],
  wcagSc: ['1.4.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.4.2', title: 'Audio Control', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.4.2': ['no-autoplay-audio-evidence'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('audio[autoplay], video[autoplay]', safeRoot) : helpers.queryAll('audio[autoplay], video[autoplay]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.hasAttribute) continue;
    if (el.hasAttribute('muted')) continue;

    applicableCount += 1;

    if (el.hasAttribute('controls')) continue;

    const mediaTag = (el.tagName || '').toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: 'This element autoplays audio without a native pause/stop or volume-control mechanism.',
      hint: 'If this clip plays for more than 3 seconds, add a `controls` attribute (or an equivalent custom mechanism) so users can pause/stop it or control its volume independently of the system volume.',
      i18n: {
        summaryKey: 'a11ycore_noAutoplayAudio_summary_cantTell',
        hintKey: 'a11ycore_noAutoplayAudio_hint_cantTell',
        params: { element: mediaTag }
      },
      data: {
        details: { reasonCode: 'AUTOPLAY_NO_CONTROLS_MECHANISM', mediaTag }
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
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'moderate', occurrences };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail):
  // every applicable autoplaying element already has a controls mechanism.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
