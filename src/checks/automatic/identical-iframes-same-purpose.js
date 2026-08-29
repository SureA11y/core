/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check identical-iframes-same-purpose
 * @atomic true
 * @summary Frames sharing an accessible name must embed the same resource
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to each set of two or more <iframe>/<frame> elements that are
 *   included in the accessibility tree and share the same non-empty
 *   accessible name, compared with whitespace collapsed. A frame named
 *   only by a mechanism that names nothing, or hidden from the
 *   accessibility tree, is not part of a set; a set needs two surviving
 *   members to exist at all.
 * @expectation
 *   Every frame in a set resolves to the same resource. A shared name
 *   describes one resource, so two frames answering to it must embed the
 *   same one.
 * @implementation-notes
 * - Distinct from iframe-title-unique, which asks the stricter question of
 *   whether the title ATTRIBUTE repeats at all, and answers it from static
 *   markup. This rule keys on the computed accessible name and judges the
 *   resource behind it.
 * - src values are compared as resolved absolute URLs with the fragment
 *   removed and a trailing slash normalised away, so a directory written
 *   both with and without one is a single resource.
 * - Frames that resolve to different URLs are reported cantTell, never
 *   fail. Different resources can still be equivalent — differently worded
 *   copies of one page, or two adverts serving the same purpose — and
 *   nothing in the markup settles it. Comparing the embedded documents
 *   would not settle it either, since content differing is exactly what
 *   those equivalent cases look like.
 */

const id = 'identical-iframes-same-purpose';

const meta = {
  title: 'Frames with the same name embed the same resource',
  description:
    'Checks that <iframe>/<frame> elements sharing an accessible name embed the same resource, since one name can only describe one resource.',
  i18n: {
    titleKey: 'identicalIframesSamePurpose_title',
    descriptionKey: 'identicalIframesSamePurpose_description'
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
  coverage: { facetsBySc: { '4.1.2': ['identical-iframes-same-purpose'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  function normalizedName(el) {
    if (!helpers.getAccessibleNameInfo) return '';
    let info;
    try {
      info = helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 });
    } catch {
      return '';
    }
    if (!info || !info.present || !info.value) return '';
    return String(info.value).replace(/\s+/g, ' ').trim();
  }

  // A light-DOM child of a shadow host with no slot to land in is absent from
  // the flat tree and so renders nowhere, which the shared eligibility helper
  // does not model.
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

  // A directory written with and without its trailing slash is one resource,
  // and a fragment selects within a resource rather than naming another.
  function resourceKey(el) {
    let raw;
    try {
      raw = el.getAttribute('src');
    } catch {
      return null;
    }
    if (raw == null || !String(raw).trim()) return null;

    const doc = (ctx && ctx.document) || (el.ownerDocument ? el.ownerDocument : null);
    const base = doc && doc.baseURI ? doc.baseURI : undefined;
    try {
      const u = new URL(String(raw).trim(), base);
      let pathname = u.pathname;
      if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {
        pathname = pathname.slice(0, -1);
      }
      return u.protocol + '//' + u.host + pathname + u.search;
    } catch {
      return null;
    }
  }

  const groups = new Map();

  for (const el of nodes) {
    if (!el || !el.tagName) continue;
    if (!inAccessibilityTree(el)) continue;

    const name = normalizedName(el);
    if (!name) continue;

    const list = groups.get(name);
    if (list) list.push(el);
    else groups.set(name, [el]);
  }

  const sets = [];
  for (const [name, els] of groups) {
    if (els.length >= 2) sets.push([name, els]);
  }

  if (!sets.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];

  for (const [name, els] of sets) {
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
            'This frame shares its accessible name with another frame that embeds a different resource.',
          hint: 'Give each frame a name describing the resource it embeds, or point them at the same resource.',
          i18n: {
            summaryKey: 'identicalIframesSamePurpose_summary_cantTell',
            hintKey: 'identicalIframesSamePurpose_hint_cantTell',
            params: { element: tag, name }
          },
          uncertainty:
            keys[i] == null
              ? {
                  code: 'not-computable',
                  needed: 'A resolvable src for this frame.',
                  evidence: { element: tag, name, setSize: els.length }
                }
              : {
                  code: 'equivalence-unknown',
                  needed: 'Whether the two resources serve the same purpose despite differing.',
                  evidence: {
                    element: tag,
                    name,
                    resource: keys[i],
                    otherResources: resolved.filter((k) => k !== keys[i]),
                    setSize: els.length
                  }
                },
          data: {
            details: {
              reasonCode:
                keys[i] == null ? 'IFRAME_RESOURCE_UNRESOLVED' : 'IFRAME_RESOURCE_DIFFERS',
              element: tag,
              name,
              resource: keys[i],
              setSize: els.length
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
