/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check iframe-title-unique
 * @atomic true
 * @summary <iframe>/<frame> elements sharing a title attribute must embed the same resource
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to each set of two or more <iframe>/<frame> elements that are
 *   included in the accessibility tree and carry the same non-empty
 *   (trimmed, case-sensitive) title attribute value. A frame hidden from
 *   the accessibility tree is not part of a set; a set needs two surviving
 *   members to exist at all.
 * @expectation
 *   Every frame in a set resolves to the same resource. One title can only
 *   describe one resource, so two frames answering to it must embed the
 *   same one. Frames whose resources differ are reported cantTell, never
 *   fail: WCAG 4.1.2 asks that a name be exposed, not that it be unique,
 *   and ACT rule 4b1c6c accepts identical names on frames embedding
 *   equivalent content, which nothing in the markup settles.
 * @implementation-notes
 * - Distinct, atomic decision from iframe-name-present (presence):
 *   a frame can have a non-empty title while still sharing it.
 * - Compares the title ATTRIBUTE specifically, not the full computed
 *   accessible name. identical-iframes-same-purpose asks the same question
 *   of the computed name; this rule keeps the title-attribute view, since a
 *   title that aria-label overrides still reaches some assistive technology
 *   as a description.
 * - What "the same resource" means is shared with
 *   identical-iframes-same-purpose through helpers.getFrameResourceKey:
 *   src resolved against the document, fragment dropped, trailing slash
 *   normalised away.
 * - Gated on the accessibility tree the way the sibling is, since a title
 *   assistive technology never announces cannot collide with anything.
 *   Engine-level hidden-subtree filtering still applies unless
 *   engineOptions.includeHiddenElements is true.
 */

const id = 'iframe-title-unique';

const meta = {
  title: 'Frames sharing a title embed the same resource',
  description:
    'Checks that <iframe>/<frame> elements sharing a title attribute embed the same resource, since one title can only describe one resource.',
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
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['iframe-title-unique'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  // A light-DOM child of a shadow host with no slot to land in is absent from
  // the flat tree and so renders nowhere, which the shared eligibility helper
  // does not model. Same check as identical-iframes-same-purpose.
  function isUnslotted(el) {
    try {
      let cur = el;
      let guard = 0;
      while (cur && cur.nodeType === 1 && guard++ < 100) {
        const parent = cur.parentNode;
        if (!parent || parent.nodeType !== 1) return false;
        if (parent.shadowRoot && cur.assignedSlot == null) return true;
        cur = parent;
      }
      return false;
    } catch {
      return false;
    }
  }

  function inAccessibilityTree(el) {
    if (isUnslotted(el)) return false;
    if (!helpers.isIncludedInAccessibilityTree) return true;
    try {
      return !!helpers.isIncludedInAccessibilityTree(el);
    } catch {
      return false;
    }
  }

  function resourceKey(el) {
    if (!helpers.getFrameResourceKey) return null;
    try {
      return helpers.getFrameResourceKey(el);
    } catch {
      return null;
    }
  }

  const groups = new Map(); // trimmed title -> elements[]
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (!inAccessibilityTree(el)) continue;

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

  const occurrences = [];

  for (const [title, els] of groups) {
    if (els.length < 2) continue;

    const keys = els.map(resourceKey);
    const resolved = keys.filter((k) => k != null);
    const allResolved = resolved.length === keys.length;
    const allSame = allResolved && resolved.every((k) => k === resolved[0]);
    if (allSame) continue;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const tag = el.tagName.toLowerCase();
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'This frame shares its title with another frame that embeds a different resource.',
          hint: 'Give each frame a title describing the resource it embeds, or point them at the same resource.',
          i18n: {
            summaryKey: 'iframeTitleUnique_summary_cantTell',
            hintKey: 'iframeTitleUnique_hint_cantTell',
            params: { element: tag, title }
          },
          uncertainty:
            keys[i] == null
              ? {
                  code: 'not-computable',
                  needed: 'A resolvable src for this frame.',
                  evidence: { element: tag, title, setSize: els.length }
                }
              : {
                  code: 'equivalence-unknown',
                  needed: 'Whether the two resources serve the same purpose despite differing.',
                  evidence: {
                    element: tag,
                    title,
                    resource: keys[i],
                    otherResources: resolved.filter((k) => k !== keys[i]),
                    setSize: els.length
                  }
                },
          data: {
            details: {
              reasonCode: 'IFRAME_TITLE_DUPLICATE',
              element: tag,
              title,
              resource: keys[i],
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
