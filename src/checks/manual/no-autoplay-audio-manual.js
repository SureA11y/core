/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check no-autoplay-audio
 * @atomic true
 * @summary Sound that plays automatically should have a pause/stop or volume-control mechanism
 * @standard WCAG 2.2
 * @sc 1.4.2
 * @applicability
 *   Any <audio autoplay> or <video autoplay> element that is not `muted`.
 *   Also any <bgsound>, and any <embed> or <object> that loads sound or
 *   video, or a plugin (Flash) that may play it: its `type` is audio/*,
 *   video/* or a plugin type, or its `src`/`data` ends in a sound or video
 *   file extension. An <embed> or <object> with `autostart` or `autoplay`
 *   set to false (attribute or <param>) is left out.
 * @expectation
 *   SC 1.4.2 only applies when audio plays automatically for MORE than 3
 *   seconds; clip duration is not knowable from static markup (jsdom does
 *   not decode media), so this rule cannot determine whether the SC even
 *   applies to a given element. It is authored as `type:
 *   'manual'` (cantTell-capped, never fail) on purpose rather than guessing: an
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
 * - <embed>, <object> and <bgsound> have no `controls` or `muted` to
 *   read, so each one found is asked about. <bgsound> is obsolete
 *   and current browsers ignore it, but it still plays in older ones.
 * - Sound started by a script cannot be detected.
 * - Custom (JS-built) controls that don't use the native `controls`
 *   attribute cannot be detected statically. That's a documented limitation,
 *   same class as `iframe-focusable-content`'s `contentDocument` gap.
 * - Not gated on `isAccTreeEligible`: unlike most rules, a `display:none`
 *   or `aria-hidden` audio/video element still plays audible sound in a
 *   real browser, so visual/AT-tree eligibility is not a relevant filter
 *   here. For the same reason the rule does not use queryAllSmart, whose
 *   hidden-content filter would drop such elements: an <audio> without
 *   `controls` is always one, since browsers hide it with their own
 *   stylesheet (`display: none`). It queries the DOM directly (and open
 *   shadow roots, unless includeShadowDom is false), honouring only the
 *   scan scope and excludeSelectors.
 */

const id = 'no-autoplay-audio';

const meta = {
  title: 'Autoplaying audio should provide a pause/stop or volume-control mechanism',
  description:
    'Flags <audio>/<video> elements that autoplay unmuted with no native controls attribute, and <embed>, <object> or <bgsound> elements that may play sound, for manual review against the 3-second exemption in WCAG 1.4.2.',
  i18n: {
    titleKey: 'noAutoplayAudio_title',
    descriptionKey: 'noAutoplayAudio_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag142', 'media', 'atomic', 'manual'],
  wcagSc: ['1.4.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.2',
      title: 'Audio Control',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.4.2': ['no-autoplay-audio-evidence'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

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

  const nodes = queryAllUnfiltered('audio[autoplay], video[autoplay]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.hasAttribute) continue;
    if (el.hasAttribute('muted')) continue;

    applicableCount += 1;

    if (el.hasAttribute('controls')) continue;

    const mediaTag = (el.tagName || '').toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary:
        'This element autoplays audio without a native pause/stop or volume-control mechanism.',
      hint: 'If this clip plays for more than 3 seconds, add a `controls` attribute (or an equivalent custom mechanism) so users can pause/stop it or control its volume independently of the system volume.',
      i18n: {
        summaryKey: 'noAutoplayAudio_summary_cantTell',
        hintKey: 'noAutoplayAudio_hint_cantTell',
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

  // <embed>, <object> and <bgsound>: no controls or muted attribute to read.
  const MEDIA_EXT =
    /\.(mp3|wav|wave|ogg|oga|opus|m4a|aac|flac|wma|mid|midi|mp4|m4v|webm|ogv|mov|avi|wmv|mpg|mpeg|swf)(?:[?#]|$)/i;
  const PLUGIN_TYPES = /^(application\/x-shockwave-flash|application\/futuresplash)$/i;

  function attr(el, name) {
    return String(el.getAttribute(name) || '').trim();
  }

  function mayPlaySound(el, urlAttr) {
    const type = attr(el, 'type').toLowerCase().split(';')[0].trim();
    if (type) return /^(audio|video)\//.test(type) || PLUGIN_TYPES.test(type);
    return MEDIA_EXT.test(attr(el, urlAttr));
  }

  function startsDisabled(el) {
    const isOff = (v) => /^(false|0|no)$/i.test(String(v || '').trim());
    if (isOff(el.getAttribute('autostart')) || isOff(el.getAttribute('autoplay'))) return true;
    return Array.from(el.children || []).some((c) => {
      if ((c.tagName || '').toLowerCase() !== 'param') return false;
      const name = attr(c, 'name').toLowerCase();
      return (
        (name === 'autostart' || name === 'autoplay' || name === 'play') &&
        isOff(c.getAttribute('value'))
      );
    });
  }

  // The fallback inside an <object> already asked about is the same sound.
  const askedObjects = [];

  for (const el of queryAllUnfiltered('embed, object, bgsound')) {
    if (!el || !el.getAttribute) continue;
    if (askedObjects.some((o) => o !== el && o.contains(el))) continue;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'embed' && !mayPlaySound(el, 'src')) continue;
    if (tag === 'object' && !mayPlaySound(el, 'data')) continue;
    if (tag !== 'bgsound' && startsDisabled(el)) continue;

    applicableCount += 1;
    if (tag === 'object') askedObjects.push(el);

    const baseOccurrence = {
      selector: helpers.buildSelector ? helpers.buildSelector(el) : 'html',
      html: helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '',
      summary: 'This element may play sound as soon as the page loads.',
      hint: 'Check whether it plays sound on its own. If the sound lasts more than 3 seconds, users need a way to pause or stop it, or to change its volume without changing the system volume.',
      i18n: {
        summaryKey: 'noAutoplayAudio_summary_cantTell_embedded',
        hintKey: 'noAutoplayAudio_hint_cantTell_embedded',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'EMBEDDED_SOUND_SOURCE', mediaTag: tag }
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
  // every applicable autoplaying element already has a controls mechanism.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
