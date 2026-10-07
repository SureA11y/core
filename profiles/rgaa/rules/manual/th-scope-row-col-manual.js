/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check th-scope-row-col
 * @atomic true
 * @summary A header with a scope attribute must use scope="row" or scope="col"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <th> whose scope attribute is "rowgroup" or
 *   "colgroup" (compared without regard to case or surrounding spaces),
 *   except in a <table> with role="presentation" or role="none", which is
 *   not a data table. Headers hidden by the default hidden-content policy
 *   are not checked. A page with none is notApplicable.
 * @expectation
 *   Such a header is asked about (cantTell). RGAA gives a <th> two
 *   choices. A header over a whole row or column that has a scope uses
 *   scope="row" or scope="col" (5.7.2). A header over only part of a row
 *   or column has no scope, no role="rowheader" or "columnheader", and a
 *   unique id (5.7.3); the glossary "En-tête de colonne ou de ligne" adds
 *   that only a <th> can be used then. So scope="rowgroup" or "colgroup"
 *   fails one of the two tests, but which one depends on how much of the
 *   table the header covers, which only a person can tell.
 * @implementation-notes
 * - scope-attr-valid accepts rowgroup and colgroup, as WCAG technique H63
 *   does, and reports only values outside row, col, rowgroup and colgroup.
 * - Other invalid values (empty, misspelled) are left to scope-attr-valid.
 * - Manual (cantTell): the rule never passes.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'th-scope-row-col';

const meta = {
  title: 'Table headers use scope="row" or scope="col"',
  description:
    'Flags a <th> with scope="rowgroup" or scope="colgroup", which RGAA does not accept, for a person to tell whether it covers a whole row or column.',
  i18n: {
    titleKey: 'thScopeRowCol_title',
    descriptionKey: 'thScopeRowCol_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // The resolved explicit role: the first token of the role fallback list
  // that names a known role, lower-cased, or '' when none does.
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('th[scope]')
    : helpers.queryAll('th[scope]');

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const scope = String(dom.getAttribute(el, 'scope') || '')
      .trim()
      .toLowerCase();
    if (scope !== 'rowgroup' && scope !== 'colgroup') continue;
    const table = dom.get(el, 'closest') ? dom.closest(el, 'table') : null;
    if (table) {
      const role = explicitRole(table);
      if (role === 'presentation' || role === 'none') continue;
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This header has scope="${scope}".`,
        hint: 'If the header covers a whole row or column, use scope="row" or scope="col". If it covers only part of one, remove scope, give the <th> a unique id and list that id in the headers attribute of the cells it covers.',
        i18n: {
          summaryKey: 'thScopeRowCol_summary_cantTell',
          hintKey: 'thScopeRowCol_hint_cantTell',
          params: { scope }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the header covers a whole row or column, or only part of one.',
          evidence: { scope }
        },
        data: {
          details: { reasonCode: 'groupScope', scope },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
