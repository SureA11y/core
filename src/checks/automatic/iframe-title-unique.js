/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check iframe-title-unique
 * @atomic true
 * @summary Frames that share a title attribute must load the same resource
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to <iframe>/<frame> elements that carry a non-empty title
 *   attribute.
 * @expectation
 *   Frames in scope that share the same (trimmed, case-sensitive) title
 *   attribute value load the same resource (the same resolved src, or the
 *   same srcdoc). Such a group passes: the same content under the same
 *   title is what ACT 4b1c6c accepts. A group whose frames load different
 *   resources is cantTell: a shared title may stop assistive technology
 *   users from telling the frames apart, but the frames may also serve the
 *   same purpose (two instances of one widget), which only a person can
 *   judge. Every frame of such a group is reported.
 * @implementation-notes
 * - Never fails: no WCAG criterion requires unique frame names, and the
 *   relevance of a title (RGAA 2.2.1) is a judgment.
 * - Distinct, atomic decision from iframe-name-present (presence):
 *   a frame can have a non-empty title while still failing uniqueness.
 * - Compares the title ATTRIBUTE specifically, not the full computed
 *   accessible name (aria-label could legitimately differ in wording even
 *   when title happens to collide).
 * - Not rule-gated on isAccTreeEligible: duplicate titles are a static
 *   markup property. Engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'iframe-title-unique';

const meta = {
  title: 'Frame titles must be unique',
  description:
    'Checks that frames sharing a title attribute value load the same resource; frames with different sources and the same title are asked about.',
  i18n: {
    titleKey: 'iframeTitleUnique_title',
    descriptionKey: 'iframeTitleUnique_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'iframe'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['iframe-title-unique'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  const groups = new Map(); // trimmed title -> elements[]
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const title = String(el.getAttribute('title') || '').trim();
    if (!title) continue;

    applicableCount += 1;

    const list = groups.get(title);
    if (list) list.push(el);
    else groups.set(title, [el]);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // The resource a frame loads: srcdoc wins over src, and src is resolved
  // against the document base so "w.html" and "/w.html" can match.
  function resourceKey(el) {
    if (el.hasAttribute && el.hasAttribute('srcdoc')) {
      return 'srcdoc:' + String(el.getAttribute('srcdoc'));
    }
    const raw = String(el.getAttribute('src') || '').trim();
    if (!raw) return 'src:about:blank';
    try {
      const base = (el.ownerDocument && el.ownerDocument.baseURI) || undefined;
      return 'src:' + new URL(raw, base).href;
    } catch {
      return 'src:' + raw;
    }
  }

  const occurrences = [];

  for (const [title, els] of groups) {
    if (els.length < 2) continue;
    const keys = els.map(resourceKey);
    if (new Set(keys).size === 1) continue;

    for (const el of els) {
      const tag = el.tagName.toLowerCase();
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}>'s title "${title}" is shared with a frame that loads a different resource.`,
          hint: 'Check whether these frames have the same content or purpose. If they do not, give each frame a distinct title describing its specific content or purpose.',
          i18n: {
            summaryKey: 'iframeTitleUnique_summary_cantTell',
            hintKey: 'iframeTitleUnique_hint_cantTell',
            params: { element: tag, title }
          },
          uncertainty: {
            code: 'equivalence-unknown',
            needed:
              'Whether frames loading different resources under one title serve the same purpose.',
            evidence: {
              element: tag,
              title,
              resource: resourceKey(el),
              otherResources: keys.filter((k) => k !== resourceKey(el)),
              setSize: els.length
            }
          },
          data: {
            details: {
              reasonCode: 'IFRAME_TITLE_DUPLICATE',
              element: tag,
              title,
              duplicateCount: els.length
            }
          }
        })
      );
    }
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
