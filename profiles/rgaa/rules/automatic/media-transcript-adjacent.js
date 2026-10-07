/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check media-transcript-adjacent
 * @atomic true
 * @summary Each audio or video should have a transcript, or a link or button to one, right before or after it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <audio> and <video> in the scan scope that is not
 *   hidden by the author. An <audio> without controls is hidden by the
 *   browser's own stylesheet but still plays, so for it the check looks at
 *   its parent and at its own hidden and aria-hidden attributes, as
 *   media-alternative-transcript-evidence does. A page with none is
 *   notApplicable.
 * @expectation
 *   The element just before or just after the media in the code (RGAA
 *   glossary « Lien ou bouton adjacent »: « juste avant ou juste après
 *   l’élément ») is a link or button whose name mentions a transcript, or a
 *   block whose text does (a clearly identifiable adjacent transcript, or a
 *   block holding the link). Then the media passes the presence step of
 *   RGAA 4.1.1, 4.1.2 and 4.1.3. Otherwise it is flagged (cantTell): the
 *   transcript may be elsewhere, the media may not need one (decorative,
 *   itself an alternative, a CAPTCHA), or a video may meet 4.1.2 or 4.1.3
 *   through audio description instead. The rule never fails.
 * @implementation-notes
 * - WCAG 1.2.1 accepts a transcript anywhere it is associated, and
 *   media-alternative-transcript-evidence stays silent on a transcript
 *   referenced by aria-describedby. RGAA 4.1 accepts only an adjacent one,
 *   so this rule asks in that case (reason `describedTranscriptNotAdjacent`).
 * - "Mentions a transcript" means the text contains one of the words
 *   media-alternative-transcript-evidence looks for (transcript,
 *   transcription, texte intégral, verbatim, Transkript, transcripción,
 *   文字起こし, and the like), in any of the shipped languages.
 * - Whitespace, comments and <script>, <style> and <template> elements
 *   between the media and its neighbour are skipped; any other text or
 *   element in between breaks the adjacency. A neighbour hidden by the
 *   author is not visually adjacent and does not count.
 * - The rule cannot tell audio-only, video-only and synchronised media
 *   apart, so a finding carries 4.1.1 to 4.1.3; the auditor keeps the one
 *   that applies. Whether the transcript is relevant is 4.2's matter.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'media-transcript-adjacent';

const meta = {
  title: 'Audio and video have an adjacent transcript or a link to one',
  description:
    'Checks that the element right before or right after each <audio> and <video> is a transcript, or a link or button to one, as RGAA 4.1 requires, and asks about media that have none.',
  i18n: {
    titleKey: 'mediaTranscriptAdjacent_title',
    descriptionKey: 'mediaTranscriptAdjacent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'media', 'timebasedmedia', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // The same words as media-alternative-transcript-evidence.
  const TRANSCRIPT_TOKENS = [
    'transcript',
    'transcription',
    'texte intégral',
    'compte rendu',
    'verbatim',
    'transkript',
    'transkription',
    'abschrift',
    'textfassung',
    'transcripción',
    'transcripcion',
    'トランスクリプト',
    '文字起こし',
    '書き起こし'
  ];
  const SKIPPED_TAGS = ['script', 'style', 'template', 'noscript'];

  function normText(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function mentionsTranscript(s) {
    const t = normText(s);
    return !!t && TRANSCRIPT_TOKENS.some((tok) => t.includes(tok));
  }

  const eligCache = new WeakMap();
  function getEligibility(node) {
    if (!node || dom.nodeType(node) !== 1) {
      return { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };
    }
    if (eligCache.has(node)) return eligCache.get(node);
    let info;
    try {
      info =
        typeof helpers.getEligibilityInfo === 'function'
          ? helpers.getEligibilityInfo(node, ctx, { targetSet: 'acc' })
          : null;
    } catch {
      info = null;
    }
    const norm =
      info && typeof info === 'object'
        ? info
        : { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };
    eligCache.set(node, norm);
    return norm;
  }

  // Every match in scope, hidden or not; see media-alternative-transcript-evidence.
  function queryAllUnfiltered(sel) {
    const engineOptions = ctx.engineOptions || {};
    const deep =
      engineOptions.includeShadowDom !== false && typeof helpers.queryAllDeep === 'function';
    const list = Array.from((deep ? helpers.queryAllDeep(sel) : helpers.queryAll(sel)) || []);
    return typeof helpers.isExcluded === 'function'
      ? list.filter((el) => !helpers.isExcluded(el))
      : list;
  }

  function getMediaEligibility(el) {
    const isHiddenByBrowser =
      String(dom.localName(el) || '').toLowerCase() === 'audio' &&
      !dom.hasAttribute(el, 'controls');
    if (!isHiddenByBrowser) return getEligibility(el);
    if (dom.hasAttribute(el, 'hidden')) {
      return { eligible: false, reasons: ['hiddenAttr'], targetSet: 'acc', accEligible: false };
    }
    if (normText(dom.getAttribute(el, 'aria-hidden')) === 'true') {
      return { eligible: false, reasons: ['ariaHidden'], targetSet: 'acc', accEligible: false };
    }
    let parent = dom.parentElement(el);
    if (!parent) {
      const rootNode = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
      parent = rootNode && dom.host(rootNode) ? dom.host(rootNode) : null;
    }
    return parent ? getEligibility(parent) : getEligibility(el);
  }

  // The node right before or after the media, skipping whitespace, comments
  // and elements that render nothing.
  function neighbour(el, forward) {
    let n = forward ? dom.nextSibling(el) : dom.previousSibling(el);
    while (n) {
      if (dom.nodeType(n) === 8) {
        n = forward ? dom.nextSibling(n) : dom.previousSibling(n);
        continue;
      }
      if (dom.nodeType(n) === 3 && !normText(dom.nodeValue(n))) {
        n = forward ? dom.nextSibling(n) : dom.previousSibling(n);
        continue;
      }
      if (
        dom.nodeType(n) === 1 &&
        SKIPPED_TAGS.includes(String(dom.localName(n) || '').toLowerCase())
      ) {
        n = forward ? dom.nextSibling(n) : dom.previousSibling(n);
        continue;
      }
      return n;
    }
    return null;
  }

  function isLinkOrButton(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    const role = helpers.aria.getExplicitRole(el);
    if (role === 'link' || role === 'button') return true;
    if (tag === 'a' || tag === 'area') return dom.hasAttribute(el, 'href');
    if (tag === 'button') return true;
    if (tag === 'input') {
      return ['button', 'submit'].includes(normText(dom.getAttribute(el, 'type')));
    }
    return false;
  }

  function nameOf(el) {
    try {
      const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
      if (info && info.value) return info.value;
    } catch {}
    return dom.textContent(el) || dom.getAttribute(el, 'value') || '';
  }

  // 'adjacentLink', 'adjacentTranscript' or null.
  function adjacentEvidence(node) {
    if (!node || dom.nodeType(node) !== 1) return null;
    if (!getEligibility(node).eligible) return null;
    if (isLinkOrButton(node)) return mentionsTranscript(nameOf(node)) ? 'adjacentLink' : null;
    return mentionsTranscript(dom.textContent(node)) ? 'adjacentTranscript' : null;
  }

  function describedTranscript(el) {
    const ids = normText(dom.getAttribute(el, 'aria-describedby')).split(' ').filter(Boolean);
    if (!ids.length) return false;
    const doc = dom.ownerDocument(el);
    const rootNode = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : doc;
    return ids.some((idRef) => {
      let target;
      try {
        target =
          (rootNode && dom.get(rootNode, 'getElementById')
            ? dom.getElementById(rootNode, idRef)
            : null) || (doc ? dom.getElementById(doc, idRef) : null);
      } catch {
        target = null;
      }
      return !!target && mentionsTranscript(dom.textContent(target));
    });
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of queryAllUnfiltered('audio, video')) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const eligInfo = getMediaEligibility(el);
    if (!eligInfo || !eligInfo.eligible) continue;
    applicableCount += 1;

    const evidence =
      adjacentEvidence(neighbour(el, false)) || adjacentEvidence(neighbour(el, true));
    if (evidence) continue;

    const element = String(dom.localName(el) || '').toLowerCase();
    const described = describedTranscript(el);
    const reasonCode = described ? 'describedTranscriptNotAdjacent' : 'noAdjacentTranscript';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: described
          ? `This <${element}> refers to a transcript through aria-describedby, but no transcript, or link or button to one, is right before or after it.`
          : `No transcript, or link or button to one, is right before or after this <${element}>.`,
        hint: 'Check whether this media needs a transcript (RGAA 4.1). If it does, place the transcript, or a link or button to it, right before or right after the media, in the code and on screen. A video may instead have audio description.',
        i18n: {
          summaryKey: described
            ? 'mediaTranscriptAdjacent_summary_cantTell_described'
            : 'mediaTranscriptAdjacent_summary_cantTell',
          hintKey: 'mediaTranscriptAdjacent_hint_cantTell',
          params: { element }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether this media needs a transcript, and whether one, or a link or button to one, sits right before or after it.',
          evidence: { reasonCode }
        },
        data: {
          details: { reasonCode, element },
          visibilityFilter: eligInfo
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
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
