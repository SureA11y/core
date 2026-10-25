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
 * @reason-codes
 *   - `AUTOPLAY_NO_CONTROLS_MECHANISM` (cantTell): an unmuted <audio> or
 *     <video> plays automatically with no native controls to pause, stop
 *     or turn down its sound.
 *     It leans pass when a script has muted it (the muted property) or its
 *     known duration is 3 seconds or less without loop, and fail when it
 *     has loop or its known duration is longer than 3 seconds.
 *     Basis: WCAG 1.4.2 (not settled); F23; ACT 80f0bf; ACT 4c31df.
 *   - `AUTOPLAY_CONTROLS_HIDDEN` (cantTell): an unmuted <audio> or <video>
 *     plays automatically and has native controls, but it is hidden, so the
 *     controls cannot be reached.
 *     It leans as AUTOPLAY_NO_CONTROLS_MECHANISM does.
 *     Basis: WCAG 1.4.2 (not settled); F23; ACT 4c31df.
 *   - `EMBEDDED_SOUND_SOURCE` (cantTell): an <embed>, <object> or <bgsound>
 *     may play sound when the page loads, with no controls the rule can
 *     read.
 *     It leans pass for a <bgsound>, and for a Flash plugin (its type, or
 *     a .swf file), which current browsers no longer play.
 *     Basis: WCAG 1.4.2 (not settled); F23.
 * @implementation-notes
 * - Elements with `controls` present are not flagged while they are
 *   rendered: native controls provide pause/stop and volume adjustment,
 *   satisfying the SC's mechanism requirement regardless of duration. An
 *   element hidden by `display: none`, `visibility: hidden` or `hidden`
 *   (on itself or an ancestor) still plays, but its controls cannot be
 *   reached, so it is asked about (`AUTOPLAY_CONTROLS_HIDDEN`).
 * - Reports `pass` when every element found autoplays with usable native
 *   controls, the one case that needs no judgment. Sound started by a
 *   script, or inside a frame, is outside what this rule sees, so a pass
 *   covers the elements it found.
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
  coverage: { facetsBySc: { '1.4.2': ['no-autoplay-audio-evidence'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    AUTOPLAY_CONTROLS_HIDDEN: {
      steps: [
        'Load the page with sound on and listen whether the hidden audio or video the report names starts by itself.',
        'If it plays sound for more than 3 seconds, look for some other visible control on the page that pauses, stops or mutes it.',
        'Try that control with the keyboard and check the sound stops.'
      ],
      passWhen:
        'No sound plays for more than 3 seconds, or a visible, keyboard-reachable control stops or mutes it.',
      failWhen:
        'Sound plays from a hidden player whose controls cannot be reached and nothing else stops it, which fails WCAG 1.4.2 (F23).'
    },
    AUTOPLAY_NO_CONTROLS_MECHANISM: {
      steps: [
        'Load the page with sound on and listen whether the audio or video the report names starts by itself.',
        'If it plays sound for more than 3 seconds, look near the top of the page for a control to pause, stop or mute it, or to set its volume.',
        'Try that control with the keyboard (Tab to it, press Enter or Space) and with a screen reader running, and check the sound stops or drops.'
      ],
      passWhen:
        'No sound plays for more than 3 seconds, or a reachable control near the start of the page pauses, stops or mutes it.',
      failWhen:
        'Sound plays by itself for more than 3 seconds with no way to pause, stop or turn it down independently of the system volume, which fails WCAG 1.4.2 (F23).'
    },
    EMBEDDED_SOUND_SOURCE: {
      steps: [
        'Load the page with sound on and listen whether the embed, object or bgsound the report names plays sound by itself.',
        'If it plays for more than 3 seconds, look for a control to pause, stop or mute it, in the embedded player or near the top of the page.',
        'Try that control with the keyboard and check the sound stops.'
      ],
      passWhen:
        'Nothing plays automatically for more than 3 seconds, or a reachable control pauses, stops or mutes it.',
      failWhen:
        'Sound plays by itself for more than 3 seconds with no reachable way to stop it or turn it down, which fails WCAG 1.4.2 (F23).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
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

  // What the element states about its sound: muted by a script (the
  // property, with no attribute), set to loop, or a duration the browser
  // has read (readyState 1 or more). The 3-second limit is 1.4.2's.
  function mediaLean(el) {
    let muted;
    let readyState;
    let duration;
    try {
      muted = dom.get(el, 'muted') === true;
      readyState = Number(dom.get(el, 'readyState')) || 0;
      duration = Number(dom.get(el, 'duration'));
    } catch {
      return null;
    }
    const known = readyState >= 1 && !Number.isNaN(duration);
    const seconds = known && Number.isFinite(duration) ? Math.round(duration * 100) / 100 : null;
    const failCaution = {
      caution:
        'The browser may block sound that plays by itself, the file may have no sound, and a control elsewhere may stop it.',
      cautionKey: 'noAutoplayAudio_lean_caution'
    };
    if (muted) {
      return {
        toward: 'pass',
        why: 'A script has muted it, so it plays no sound.',
        signals: [{ signal: 'muted-property', value: true }],
        i18n: { whyKey: 'noAutoplayAudio_lean_why_muted' }
      };
    }
    if (dom.hasAttribute(el, 'loop')) {
      return {
        toward: 'fail',
        why: 'It has the loop attribute, so it plays again and again, for more than 3 seconds.',
        signals: [{ signal: 'loop-attribute', value: true }],
        caution: failCaution.caution,
        i18n: { whyKey: 'noAutoplayAudio_lean_why_loop', cautionKey: failCaution.cautionKey }
      };
    }
    if (!known) return null;
    if (seconds != null && seconds <= 3) {
      return {
        toward: 'pass',
        why: 'It lasts 3 seconds or less, which WCAG 1.4.2 allows.',
        signals: [{ signal: 'media-duration-s', value: seconds }],
        i18n: { whyKey: 'noAutoplayAudio_lean_why_short' }
      };
    }
    return {
      toward: 'fail',
      why: 'It lasts more than 3 seconds.',
      signals: [{ signal: 'media-duration-s', value: seconds }],
      caution: failCaution.caution,
      i18n: { whyKey: 'noAutoplayAudio_lean_why_long', cautionKey: failCaution.cautionKey }
    };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'hasAttribute')) continue;
    if (dom.hasAttribute(el, 'muted')) continue;

    applicableCount += 1;

    const mediaTag = (dom.tagName(el) || '').toLowerCase();
    if (dom.hasAttribute(el, 'controls')) {
      const shown = helpers.isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        ignoreOpacity: true
      });
      if (shown.eligible) continue;
      const hiddenLean = mediaLean(el);
      occurrences.push(
        helpers.reportOccurrence(el, {
          ...(hiddenLean ? { lean: hiddenLean } : {}),
          summary:
            'This element autoplays audio with native controls, but it is hidden, so its controls cannot be reached.',
          hint: 'If this clip plays for more than 3 seconds, show the element so its controls can be used, or offer another way to pause/stop it or control its volume.',
          i18n: {
            summaryKey: 'noAutoplayAudio_summary_cantTell_controlsHidden',
            hintKey: 'noAutoplayAudio_hint_cantTell_controlsHidden',
            params: { element: mediaTag }
          },
          data: {
            details: { reasonCode: 'AUTOPLAY_CONTROLS_HIDDEN', mediaTag }
          }
        })
      );
      continue;
    }

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    const lean = mediaLean(el);
    const baseOccurrence = {
      ...(lean ? { lean } : {}),
      selector: stableSelector,
      html,
      summary:
        'This element plays audio automatically, with no built-in way to pause it, stop it or change its volume.',
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
    return String(dom.getAttribute(el, name) || '').trim();
  }

  function mayPlaySound(el, urlAttr) {
    const type = attr(el, 'type').toLowerCase().split(';')[0].trim();
    if (type) return /^(audio|video)\//.test(type) || PLUGIN_TYPES.test(type);
    return MEDIA_EXT.test(attr(el, urlAttr));
  }

  function startsDisabled(el) {
    const isOff = (v) => /^(false|0|no)$/i.test(String(v || '').trim());
    if (isOff(dom.getAttribute(el, 'autostart')) || isOff(dom.getAttribute(el, 'autoplay')))
      return true;
    const kids = [];
    for (let c = dom.firstElementChild(el); c; c = dom.nextElementSibling(c)) kids.push(c);
    return kids.some((c) => {
      if ((dom.tagName(c) || '').toLowerCase() !== 'param') return false;
      const name = attr(c, 'name').toLowerCase();
      return (
        (name === 'autostart' || name === 'autoplay' || name === 'play') &&
        isOff(dom.getAttribute(c, 'value'))
      );
    });
  }

  // The fallback inside an <object> already asked about is the same sound.
  const askedObjects = [];

  for (const el of queryAllUnfiltered('embed, object, bgsound')) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (askedObjects.some((o) => o !== el && dom.contains(o, el))) continue;
    const tag = (dom.tagName(el) || '').toLowerCase();
    if (tag === 'embed' && !mayPlaySound(el, 'src')) continue;
    if (tag === 'object' && !mayPlaySound(el, 'data')) continue;
    if (tag !== 'bgsound' && startsDisabled(el)) continue;

    applicableCount += 1;
    if (tag === 'object') askedObjects.push(el);

    // Current browsers play neither a <bgsound> nor a Flash plugin.
    const urlAttr = tag === 'object' ? 'data' : 'src';
    const flash =
      tag !== 'bgsound' &&
      (PLUGIN_TYPES.test(attr(el, 'type').toLowerCase().split(';')[0].trim()) ||
        /\.swf(?:[?#]|$)/i.test(attr(el, urlAttr)));
    const embeddedLean =
      tag === 'bgsound' || flash
        ? {
            toward: 'pass',
            why:
              tag === 'bgsound'
                ? 'Current browsers ignore <bgsound>, so it plays nothing.'
                : 'Current browsers no longer run Flash, so it plays nothing.',
            signals: [
              { signal: tag === 'bgsound' ? 'bgsound-element' : 'flash-plugin', value: true }
            ],
            caution: 'Older browsers still play it.',
            i18n: {
              whyKey:
                tag === 'bgsound'
                  ? 'noAutoplayAudio_lean_why_bgsound'
                  : 'noAutoplayAudio_lean_why_flash',
              cautionKey: 'noAutoplayAudio_lean_caution_obsolete'
            }
          }
        : null;

    const baseOccurrence = {
      ...(embeddedLean ? { lean: embeddedLean } : {}),
      selector: helpers.buildSelector ? helpers.buildSelector(el) : 'html',
      html: helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : dom.outerHTML(el) || '',
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

  // Every autoplaying element found has usable native controls.
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
