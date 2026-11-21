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
      inScope = new Set(Array.isArray(scoped) ? scoped : [...(scoped || [])]);
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

  // Each referring element's nearest copy of the id (the one it shares the
  // deepest ancestor with, alone), worked out once per id: { r, nearest }
  // for each referrer with a nearest copy. Asked once per copy, it cost
  // copies × referrers × copies on a page of repeated cards.
  const nearestMemo = new Map();
  function nearestCopies(refId, els) {
    if (nearestMemo.has(refId)) return nearestMemo.get(refId);
    const out = [];
    // Each ancestor of a copy, with how many copies lie under it and which
    // (the last met). A referrer's nearest copy is under its deepest
    // ancestor that has any: the only one there, or a tie between several.
    // Walked once per copy and once per referrer, where comparing each
    // referrer with each copy grew with their product (round 8, NW-5).
    const under = new Map();
    for (const e of els) {
      for (let n = e, i = 0; n && i < 100000; n = dom.parentNode(n), i++) {
        const rec = under.get(n);
        if (rec) {
          rec.count += 1;
          rec.copy = e;
        } else under.set(n, { count: 1, copy: e });
      }
    }
    for (const r of referrers.get(refId) || []) {
      let found = null;
      for (let n = r.el, i = 0; n && i < 100000; n = dom.parentNode(n), i++) {
        found = under.get(n);
        if (found) break;
      }
      // With no shared ancestor, a lone copy is still the nearest.
      if (found ? found.count === 1 : els.length === 1) {
        out.push({ r, nearest: found ? found.copy : els[0] });
      }
    }
    nearestMemo.set(refId, out);
    return out;
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
    for (const { nearest } of nearestCopies(refId, els)) {
      if (nearest !== els[0]) {
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

  // Up to 40 characters of an element's text, for a message.
  const shortText = (el) => {
    const t = normalized(el);
    return t.length > 40 ? t.slice(0, 39) + '…' : t;
  };
  // An element as a message names it: <input>, <input id="email">.
  function describeEl(n) {
    const tag = String(dom.localName(n) || dom.tagName(n) || '').toLowerCase();
    const cut = (v) => (v.length > 60 ? v.slice(0, 57) + '...' : v);
    const elId = String(dom.getAttribute(n, 'id') || '').trim();
    if (elId) return `<${tag} id="${cut(elId)}">`;
    const cls = String(dom.getAttribute(n, 'class') || '')
      .replace(/\s+/g, ' ')
      .trim();
    return cls ? `<${tag} class="${cut(cls)}">` : `<${tag}>`;
  }
  // The referring element whose nearest copy, alone, is `copy`: a repeated
  // component whose reference was meant for its own copy. { el, attr } or
  // null.
  function nearReferrerOf(refId, els, copy) {
    const found = nearestCopies(refId, els).find((x) => x.nearest === copy);
    return found ? found.r : null;
  }

  for (const refId of referencedIds) {
    const els = idMap.get(refId) || [];
    if (els.length <= 1) continue;
    const lean = leanFor(refId, els);
    // The attributes that refer to the id, each once.
    const attrs = [];
    for (const r of referrers.get(refId) || [])
      if (attrs.indexOf(r.attr) === -1) attrs.push(r.attr);
    const attributes = attrs.join(', ');
    const firstText = shortText(els[0]);

    for (const el of els) {
      if (inScope && !inScope.has(el)) continue;

      // Whether this copy is the one the reference reaches, and, for a later
      // one, the referring element next to it, whose reference was likely
      // meant for it.
      const isFirst = el === els[0];
      const near = isFirst ? null : nearReferrerOf(refId, els, el);
      const ownText = isFirst ? firstText : shortText(el);
      const nearReferrer = near ? describeEl(near.el) : '';
      const quoted = (t) => (t ? ` ("${t}")` : '');
      // The id as quoted, cut to 120 characters: a page's 200 KB id was
      // copied whole into the summary, its parameters and the details.
      const shownId = helpers.quoteText(refId);
      const summary = isFirst
        ? `The id "${shownId}" is used by ${els.length} elements; this one is the first, the one ${attributes} reaches.`
        : near
          ? `The ${near.attr} on the ${nearReferrer} next to this element refers to "${shownId}", but it reaches the first element with that id${quoted(firstText)}, not this one${quoted(ownText)}.`
          : `The id "${shownId}" is used by ${els.length} elements; ${attributes} reaches the first one${quoted(firstText)}, not this one${quoted(ownText)}.`;

      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary,
          hint: 'Confirm the first element carrying this id is the intended target, or make the id unique.',
          i18n: {
            summaryKey: isFirst
              ? 'duplicateIdAria_summary_cantTell_first'
              : near
                ? 'duplicateIdAria_summary_cantTell_nearerCopy'
                : 'duplicateIdAria_summary_cantTell',
            hintKey: 'duplicateIdAria_hint_cantTell',
            params: {
              id: shownId,
              duplicateCount: String(els.length),
              attributes,
              firstText,
              ownText,
              nearAttribute: near ? near.attr : '',
              nearReferrer
            }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the first element carrying this id is the intended target.',
            evidence: { id: shownId, duplicateCount: els.length, resolvesTo: 'first' }
          },
          ...(lean ? { lean } : {}),
          data: {
            details: {
              reasonCode: 'DUPLICATE_ID_ARIA_REFERENCED',
              id: shownId,
              duplicateCount: els.length,
              referringAttributes: attrs,
              reached: isFirst,
              ...(near ? { nearReferrer: { element: nearReferrer, attribute: near.attr } } : {})
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
