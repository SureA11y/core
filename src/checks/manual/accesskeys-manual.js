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
  const { helpers, rule } = ctx;
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[accesskey]')
    : helpers.queryAll('[accesskey]');

  const groups = new Map(); // normalized key -> elements[]
  let keyedCount = 0;
  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('accesskey') || '').trim();
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
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: "This element's accesskey is shared with another element on the page.",
          hint: 'Make each accesskey value unique across the page.',
          i18n: {
            summaryKey: 'accesskeys_summary_cantTell',
            hintKey: 'accesskeys_hint_cantTell',
            params: { accesskey: key, duplicateCount: String(els.length) }
          },
          data: {
            details: {
              reasonCode: 'ACCESSKEY_DUPLICATE',
              accesskey: key,
              duplicateCount: els.length
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
