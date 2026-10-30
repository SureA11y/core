/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check duplicate-id-aria
 * @atomic true
 * @summary Any id referenced by an ARIA ID-reference attribute must be unique in the document
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies when the document contains at least one non-empty
 *   aria-labelledby, aria-describedby, aria-owns, aria-controls,
 *   aria-activedescendant, aria-flowto, aria-errormessage, or aria-details
 *   attribute (i.e. at least one ARIA ID reference exists to resolve).
 * @expectation
 *   For every id value referenced by one of those attributes, exactly one
 *   element in the document carries that id. A duplicate does not break the
 *   reference: it resolves to the first element in tree order, so the name is
 *   still computed. Whether that element is the intended target depends on
 *   author intent, which markup does not carry, so the outcome is cantTell.
 * @reports
 *   - `id`: the duplicated id an ARIA attribute refers to.
 *   - `duplicateCount`: how many elements in the document carry that id.
 * @reason-codes
 *   - `DUPLICATE_ID_ARIA_REFERENCED` (cantTell): an id that an ARIA attribute
 *     refers to is on more than one element, so the reference goes to the
 *     first, which may not be the one meant.
 *     It leans pass when only aria-labelledby, aria-describedby or
 *     aria-errormessage refer to the id and every element carrying it has the
 *     same text; and fail when an element referring to it sits nearer a later
 *     copy than the first, as in repeated components.
 *     Basis: HTML id attribute (MUST); WAI-ARIA 1.2 ID reference; WCAG 4.1.2
 *     (not settled).
 * @implementation-notes
 * - Scoped to ids referenced by ARIA. The page-wide check
 *   lives in its own rule, `duplicate-id`, mapped to the WCAG 2.0/2.1 SC
 *   4.1.1 that WCAG 2.2 removed; the two overlap on referenced ids and
 *   answer different questions there (see that rule's header).
 * - Document-wide by design: id uniqueness and ARIA id references are a
 *   whole-document property, not scoped to a sub-root. Reported occurrences are
 *   limited to the scanned scope.
 */

const id = 'duplicate-id-aria';

const meta = {
  title: 'IDs referenced by ARIA must be unique',
  description:
    'Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.',
  i18n: {
    titleKey: 'duplicateIdAria_title',
    descriptionKey: 'duplicateIdAria_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
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
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['duplicate-id-aria'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const IDREF_ATTRS = [
    'aria-labelledby',
    'aria-describedby',
    'aria-owns',
    'aria-controls',
    'aria-activedescendant',
    'aria-flowto',
    'aria-errormessage',
    'aria-details'
  ];

  const idMap = new Map(); // id -> element[]
  const idNodes = dom.get(document, 'querySelectorAll')
    ? dom.querySelectorAll(document, '[id]')
    : [];
  for (const el of idNodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const value = String(dom.getAttribute(el, 'id') || '').trim();
    if (!value) continue;
    if (!idMap.has(value)) idMap.set(value, []);
    idMap.get(value).push(el);
  }

  const referencedIds = new Set();
  // id -> [{ el, attr }], the elements that refer to it and by what.
  const referrers = new Map();
  for (const attr of IDREF_ATTRS) {
    const selector = `[${attr}]`;
    const nodes = dom.get(document, 'querySelectorAll')
      ? dom.querySelectorAll(document, selector)
      : [];
    for (const el of nodes) {
      if (!el || !dom.get(el, 'getAttribute')) continue;
      const raw = String(dom.getAttribute(el, attr) || '').trim();
      if (!raw) continue;
      for (const token of raw.split(/\s+/)) {
        if (!token) continue;
        referencedIds.add(token);
        if (!referrers.has(token)) referrers.set(token, []);
        referrers.get(token).push({ el, attr });
      }
    }
  }

  // Detection is document-wide; occurrences are limited to the scanned scope.
  // An inert duplicate still takes the reference, so it stays in scope.
  let inScope = null;
  if (helpers && typeof helpers.queryAllSmart === 'function') {
    try {
      const scoped = helpers.queryAllSmart('[id]', { inert: true });
      inScope = new Set(Array.isArray(scoped) ? scoped : Array.from(scoped || []));
    } catch {
      inScope = null;
    }
  }

  const cantTellOccurrences = [];

  // The attributes whose target only gives text (a name, a description, an
  // error message): copies with the same text give the same result.
  const TEXT_ATTRS = new Set(['aria-labelledby', 'aria-describedby', 'aria-errormessage']);
  const normalized = (el) =>
    String(dom.textContent(el) || '')
      .replace(/\s+/g, ' ')
      .trim();

  // How deep the deepest ancestor two elements share is.
  function sharedDepth(a, b) {
    const chain = new Map();
    let depth = 0;
    for (let n = a; n; n = dom.parentNode(n)) chain.set(n, depth++);
    const total = depth;
    for (let n = b; n; n = dom.parentNode(n)) {
      if (chain.has(n)) return total - chain.get(n);
    }
    return 0;
  }

  // Which way a duplicated, referenced id points. Copies that all say the
  // same thing to attributes that only read text give the same result
  // whichever is reached. A referring element whose nearest copy (the one
  // it shares the deepest ancestor with, alone) is not the first in tree
  // order is a repeated component reaching another one's element.
  function leanFor(refId, els) {
    const refs = referrers.get(refId) || [];
    const first = normalized(els[0]);
    const sameText = els.every((e) => normalized(e) === first);
    if (sameText && refs.length && refs.every((r) => TEXT_ATTRS.has(r.attr))) {
      return {
        toward: 'pass',
        why: 'Every element with this id has the same text, so whichever one the reference reaches gives the same name or description.',
        signals: [{ signal: 'duplicates-same-text', value: true }],
        i18n: { whyKey: 'duplicateIdAria_lean_why_sameText' }
      };
    }
    for (const r of refs) {
      let best = -1;
      let nearest = null;
      let tie = false;
      for (const e of els) {
        const d = sharedDepth(r.el, e);
        if (d > best) {
          best = d;
          nearest = e;
          tie = false;
        } else if (d === best) tie = true;
      }
      if (nearest && !tie && nearest !== els[0]) {
        return {
          toward: 'fail',
          why: 'An element that refers to this id sits next to a later copy of it, but the reference goes to the first one, elsewhere in the page.',
          signals: [
            { signal: 'duplicates-same-text', value: sameText },
            { signal: 'nearest-duplicate-is-first', value: false }
          ],
          caution: 'Being nearer is a sign of what was meant, not proof.',
          i18n: {
            whyKey: 'duplicateIdAria_lean_why_nearerCopy',
            cautionKey: 'duplicateIdAria_lean_caution_nearerCopy'
          }
        };
      }
    }
    return null;
  }

  for (const refId of referencedIds) {
    const els = idMap.get(refId) || [];
    if (els.length <= 1) continue;
    const lean = leanFor(refId, els);

    for (const el of els) {
      if (inScope && !inScope.has(el)) continue;

      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'This id is referenced by an ARIA attribute but is used by more than one element; the reference resolves to the first.',
          hint: 'Confirm the first element carrying this id is the intended target, or make the id unique.',
          i18n: {
            summaryKey: 'duplicateIdAria_summary_cantTell',
            hintKey: 'duplicateIdAria_hint_cantTell',
            params: { id: refId, duplicateCount: String(els.length) }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the first element carrying this id is the intended target.',
            evidence: { id: refId, duplicateCount: els.length, resolvesTo: 'first' }
          },
          ...(lean ? { lean } : {}),
          data: {
            details: {
              reasonCode: 'DUPLICATE_ID_ARIA_REFERENCED',
              id: refId,
              duplicateCount: els.length
            }
          }
        })
      );
    }
  }

  if (referencedIds.size === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome(
    [],
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
