/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check accesskeys
 * @atomic true
 * @summary accesskey values must be unique on the page
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever two or more elements carry a non-empty accesskey
 *   attribute: only then can two of them collide.
 * @expectation
 *   Every accesskey value on the page is unique. Duplicate accesskeys
 *   make keyboard-shortcut activation ambiguous: only one of the
 *   elements sharing the key can actually be reached by it, and which
 *   one is browser/platform-dependent.
 * @reports
 *   - `accesskey`: the shared key, in lower case.
 *   - `duplicateCount`: how many elements on the page share it, this one
 *     included.
 *   - `others`: the other elements with this key, as the message names
 *     them (`<button> "Save"`).
 * @reason-codes
 *   - `ACCESSKEY_DUPLICATE` (cantTell): this element's accesskey value is
 *     also used by another element on the page, so the shortcut may not
 *     reach it.
 *     It leans fail: the page states it.
 *     Basis: WCAG 2.1.1 (best practice); HTML accesskey attribute
 *     (not settled).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 */

const id = 'accesskeys';

const meta = {
  title: 'accesskey values must be unique',
  description: 'Checks that no two elements on the page share the same accesskey attribute value.',
  i18n: {
    titleKey: 'accesskeys_title',
    descriptionKey: 'accesskeys_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[accesskey]')
    : helpers.queryAll('[accesskey]');

  const groups = new Map(); // normalized key -> elements[]
  let keyedCount = 0;
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'accesskey') || '').trim();
    if (!raw) continue;
    keyedCount += 1;
    const key = raw.toLowerCase();
    const list = groups.get(key) || [];
    list.push(el);
    groups.set(key, list);
  }

  const occurrences = [];
  for (const [key, els] of groups) {
    if (els.length <= 1) continue;
    for (const el of els) {
      // The other elements with this key, at most three, for the message.
      const otherEls = els.filter((o) => o !== el);
      const named = otherEls.slice(0, 3).map((o) => helpers.describeElement(o, { text: true }));
      const others = otherEls.length > 3 ? `${named.join(', ')}, …` : named.join(', ');
      const value = String(dom.getAttribute(el, 'accesskey') || '').trim();
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This element's accesskey="${value}" is also used by ${others}, so the shortcut may reach only one of them.`,
          hint: 'Give each accesskey its own value.',
          i18n: {
            summaryKey: 'accesskeys_summary_cantTell_others',
            hintKey: 'accesskeys_hint_cantTell',
            params: { accesskey: key, duplicateCount: String(els.length), value, others }
          },
          lean: {
            toward: 'fail',
            why: 'Another element on the page uses the same access key.',
            signals: [{ signal: 'accesskey-shared', value: true }],
            i18n: { whyKey: 'accesskeys_lean_why' }
          },
          data: {
            details: {
              reasonCode: 'ACCESSKEY_DUPLICATE',
              accesskey: key,
              duplicateCount: els.length,
              others: otherEls.map((o) => helpers.describeElement(o, { text: true }))
            }
          }
        })
      );
    }
  }

  if (keyedCount < 2) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    // Every value differs, which needs no judgment.
    // A pass is a claim about the whole page, and a scoped scan saw only part
    // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
    return {
      ruleId: rule.ruleId,
      outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
