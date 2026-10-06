/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check video-poster-text-alternative-present
 * @atomic true
 * @summary Accessible <video> elements with a poster must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <video> elements that:
 *   1) have a non-empty poster attribute, AND
 *   2) are exposed to assistive technologies (per engine eligibility checks).
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per eligibility checks).
 *   Videos with role="presentation" or role="none" are excluded only when they are not focusable.
 * @expectation
 *   Each applicable <video> element provides a text alternative for the poster image, via:
 *   - an accessible name (aria-label / aria-labelledby / title).
 *   Between-tag fallback content inside <video> is NOT accepted: it is only
 *   rendered by browsers that don't support <video>, so it is not reliably
 *   exposed to assistive technologies in practice. <video> is also not a
 *   labelable element, so native <label for="..."> associations are not
 *   accepted either.
 *   A <video> with no name that is the only content of a <figure> with a
 *   non-empty <figcaption> is asked about (cantTell) rather than failed: the
 *   caption names the figure, not the video (HTML-AAM; Chromium gives the
 *   video no name), but it may describe the poster, and only a person can
 *   tell.
 * @reports
 *   - `reasonCode`: `VIDEO_POSTER_FIGCAPTION_REVIEW` on the cantTell
 *     finding, with `figcaption`, the caption's text up to 100 characters.
 */

const id = 'video-poster-text-alternative-present';

const meta = {
  title: '<video> poster must have a text alternative',
  description:
    'Checks that <video> elements with a poster image provide a text alternative (accessible name).',
  i18n: {
    titleKey: 'videoPoster_textAltPresent_title',
    descriptionKey: 'videoPoster_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'media', 'video', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['video-poster-text-alt-present']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const reportOccurrence =
    helpers && typeof helpers.reportOccurrence === 'function' ? helpers.reportOccurrence : null;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function' ? helpers.queryAll : null;

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const isFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function computeNameInfo(el) {
    // <video> is not a labelable element (no browser computes an accessible
    // name from <label for="...">), so only ARIA naming and title count,
    // do not accept native <label> associations.
    const flags = [];
    let aria = null;

    if (getAriaNameInfo) {
      aria = (() => {
        try {
          return getAriaNameInfo(el, ctx);
        } catch {
          return null;
        }
      })();
    }

    if (aria && aria.present && trim(aria.value)) {
      return {
        present: true,
        value: trim(aria.value),
        mechanism: aria.mechanism || 'aria',
        flags: (aria.flags || []).slice(0)
      };
    }

    const title = trim(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'title'));
    if (title) {
      flags.push('title-used');
      return { present: true, value: title, mechanism: 'title', flags };
    }

    if (aria && aria.flags && aria.flags.length) {
      for (const f of aria.flags) flags.push(f);
    }

    return { present: false, value: '', mechanism: 'none', flags };
  }

  const videos = (() => {
    try {
      if (queryAllSmart) return Array.from(queryAllSmart('video') || []);
      if (queryAll) return Array.from(queryAll('video') || []);
      return safeRoot && dom.get(safeRoot, 'querySelectorAll')
        ? Array.from(dom.querySelectorAll(safeRoot, 'video'))
        : [];
    } catch {
      try {
        return safeRoot && dom.get(safeRoot, 'querySelectorAll')
          ? Array.from(dom.querySelectorAll(safeRoot, 'video'))
          : [];
      } catch {
        return [];
      }
    }
  })();

  if (!videos.length)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // The caption of the <figure> a video is the only content of: its
  // <figcaption>'s text, or '' when the video shares the figure with other
  // content, or the caption is empty.
  function soleFigureCaption(el) {
    const figure = dom.parentElement(el);
    if (!figure || String(dom.localName(figure)) !== 'figure') return '';
    let caption = null;
    for (let c = dom.firstElementChild(figure); c; c = dom.nextElementSibling(c)) {
      if (c === el) continue;
      if (String(dom.localName(c)) === 'figcaption' && !caption) caption = c;
      else return '';
    }
    for (let n = dom.firstChild(figure); n; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) === 3 && trim(dom.nodeValue(n))) return '';
    }
    return caption ? trim(dom.textContent(caption)).replace(/\s+/g, ' ') : '';
  }

  for (const el of videos) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const poster = trim(dom.getAttribute(el, 'poster'));
    if (!poster) continue; // not applicable: no poster image

    // Eligibility: only elements exposed to AT (with helper exceptions)
    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // Role presentation/none excluded ONLY if not focusable (mirrors img behavior)
    // The resolved role: the first token naming a known role, in any case.
    const role = helpers.aria.getExplicitRole(el);
    if (role === 'presentation' || role === 'none') {
      let focusable;
      if (isFocusableInfo) {
        const fi = (() => {
          try {
            return isFocusableInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = dom.getAttribute(el, 'tabindex');
        focusable =
          tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const nameInfo = computeNameInfo(el);
    if (nameInfo.present) continue;

    let eligInfo = null;
    if (getEligibilityInfo) {
      try {
        eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' });
      } catch {
        eligInfo = null;
      }
    }

    const caption = soleFigureCaption(el);
    if (caption) {
      const text = caption.length > 100 ? caption.slice(0, 99) + '…' : caption;
      const occ = {
        summary:
          'This <video> has no name, but its figure has a caption that may describe its poster.',
        hint: 'Check that the caption describes what the poster image shows. If it does not, give the video an accessible name (aria-label or aria-labelledby).',
        i18n: {
          summaryKey: 'videoPoster_textAltPresent_summary_cantTell_figcaption',
          hintKey: 'videoPoster_textAltPresent_hint_cantTell_figcaption',
          params: { figcaption: text }
        },
        uncertainty: {
          code: 'equivalence-unknown',
          needed: 'Whether the figure caption describes what the poster image shows.',
          evidence: { figcaption: text }
        },
        data: {
          poster,
          details: { reasonCode: 'VIDEO_POSTER_FIGCAPTION_REVIEW', figcaption: text }
        }
      };
      cantTellOccurrences.push(
        reportOccurrence ? reportOccurrence(el, occ) : { selector: '', html: '', ...occ }
      );
      continue;
    }

    const baseOccurrence = {
      summary: 'Missing text alternative for <video> poster.',
      hint: 'Provide an accessible name for the poster image (aria-label/aria-labelledby preferred, or a title attribute as a fallback).',
      i18n: {
        summaryKey: 'videoPoster_textAltPresent_summary_fail',
        hintKey: 'videoPoster_textAltPresent_hint_fail',
        params: { element: 'video' }
      },
      data: {
        poster,
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        nameInfo: nameInfo || null
      }
    };

    if (reportOccurrence) {
      occurrences.push(reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length && !cantTellOccurrences.length)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  if (helpers && typeof helpers.resolveTieredOutcome === 'function') {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(
        occurrences,
        cantTellOccurrences,
        rule.defaultSeverity || 'minor'
      )
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? 'fail' : 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences: occurrences.concat(cantTellOccurrences)
  };
}

module.exports = { id, meta, runInPage };
