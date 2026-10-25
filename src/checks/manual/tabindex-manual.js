/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check tabindex
 * @atomic true
 * @summary tabindex should not be greater than 0
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to elements with a tabindex attribute whose value parses as
 *   a valid integer.
 * @expectation
 *   The tabindex value is 0 or negative. A positive tabindex reorders
 *   keyboard tab order explicitly, which is fragile to maintain as a
 *   page changes and usually indicates the natural DOM order should be
 *   fixed instead.
 * @reports
 *   - `value`: the `tabindex` value, a whole number above 0.
 * @reason-codes
 *   - `TABINDEX_POSITIVE` (cantTell): the element has a tabindex above 0,
 *     which moves it ahead of the page's natural tab order.
 *     It leans fail when Tab reaches the element before a tab stop that
 *     comes earlier in the document, and pass when the page's tab order is
 *     its document order all the same (the positive tabindex values are on
 *     its first tab stops, in increasing order).
 *     Basis: WCAG 2.4.3 (best practice); F44 (not settled).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 */

const id = 'tabindex';

const meta = {
  title: 'tabindex should not be greater than 0',
  description: 'Checks that tabindex values are 0 or negative, not a positive number.',
  i18n: {
    titleKey: 'tabindex_title',
    descriptionKey: 'tabindex_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    TABINDEX_POSITIVE: {
      steps: [
        'Click just before the start of the page, then press Tab repeatedly, watching the focus outline.',
        'Note when the element the report names gets focus, compared with where it sits on screen.',
        'Check whether the focus order still follows the visual and reading order of the page.'
      ],
      passWhen: 'Focus moves through the page in an order that matches its layout and meaning.',
      failWhen:
        'The positive tabindex makes focus jump out of reading order, which can fail WCAG 2.4.3 (F44) and is against best practice.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[tabindex]')
    : helpers.queryAll('[tabindex]');

  const occurrences = [];
  let applicableCount = 0;

  // The document's tab stops, in document order and in the order Tab
  // visits them (positive tabindex first, by value, then the rest), worked
  // out once, when a positive tabindex is found. Light DOM only: a shadow
  // tree has its own order.
  const TAB_CANDIDATES =
    'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable]';
  let order = null;
  function tabOrder() {
    if (order) return order;
    const stops = [];
    try {
      const doc = ctx.document;
      for (const d of dom.querySelectorAll(doc, TAB_CANDIDATES)) {
        let info = null;
        try {
          info = helpers.getFocusableInfo(d, ctx);
        } catch {}
        if (!info || !info.tabbable) continue;
        if (helpers.isHiddenContent && helpers.isHiddenContent(d)) continue;
        const t = Number(String(dom.getAttribute(d, 'tabindex') || '').trim());
        stops.push({ el: d, value: Number.isInteger(t) && t > 0 ? t : 0 });
      }
    } catch {}
    const visit = stops
      .map((s, i) => ({ ...s, i }))
      .sort((a, b) => {
        if (a.value > 0 && b.value > 0) return a.value - b.value || a.i - b.i;
        if (a.value > 0) return -1;
        if (b.value > 0) return 1;
        return a.i - b.i;
      });
    const position = new Map();
    visit.forEach((s, k) => position.set(s.el, k));
    order = { stops, position, reordered: visit.some((s, k) => s.i !== k) };
    return order;
  }
  // Whether Tab reaches el before a tab stop that comes earlier in the
  // document. null when el is not a tab stop of the document.
  function jumpsAhead(el) {
    const o = tabOrder();
    if (!o.position.has(el)) return null;
    const mine = o.position.get(el);
    for (const s of o.stops) {
      if (s.el === el) return false;
      if (o.position.get(s.el) > mine) return true;
    }
    return false;
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'tabindex') || '').trim();
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isInteger(n)) continue;

    applicableCount += 1;

    if (n <= 0) continue;

    const jumps = jumpsAhead(el);
    let lean;
    if (jumps === true) {
      lean = {
        toward: 'fail',
        why: 'Tab reaches this element before tab stops that come earlier in the page, so focus jumps out of document order.',
        signals: [
          { signal: 'tabindex-value', value: n },
          { signal: 'tab-order-matches-dom-order', value: false }
        ],
        caution: 'The page may lay its content out in an order that differs from the document.',
        i18n: {
          whyKey: 'tabindex_lean_why_reordered',
          cautionKey: 'tabindex_lean_caution_reordered'
        }
      };
    } else if (jumps === false && !tabOrder().reordered) {
      lean = {
        toward: 'pass',
        why: 'The positive tabindex values leave the tab order as the document order: they are on the page’s first tab stops, in increasing order.',
        signals: [
          { signal: 'tabindex-value', value: n },
          { signal: 'tab-order-matches-dom-order', value: true }
        ],
        caution:
          'A positive tabindex stays fragile: content added before these elements will be visited after them.',
        i18n: {
          whyKey: 'tabindex_lean_why_inOrder',
          cautionKey: 'tabindex_lean_caution_inOrder'
        }
      };
    }
    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(lean ? { lean } : {}),
        summary: 'This element has a positive tabindex, overriding the natural tab order.',
        hint: 'Use tabindex="0" to add the element to the tab order, or a negative value to take it out. If the tab order needs to change, change the order of the content instead.',
        i18n: {
          summaryKey: 'tabindex_summary_cantTell',
          hintKey: 'tabindex_hint_cantTell',
          params: { value: String(n) }
        },
        data: {
          details: { reasonCode: 'TABINDEX_POSITIVE', value: n }
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
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
