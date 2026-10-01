/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check main-element-structure
 * @atomic true
 * @summary The main content must be a <main> element, and only one <main> may be visible
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that declares the HTML5
 *   doctype (helpers.getDoctypeInfo). RGAA 9.2 is not applicable when the
 *   declared doctype is not the HTML5 one, and a page with no doctype
 *   declares none. A run narrowed by contextSelector or
 *   engineOptions.fragment is notApplicable.
 * @expectation
 *   Steps 4 and 5 of RGAA 9.2.1:
 *   - the main content zone is structured with a <main> element. A page
 *     with role="main" and no <main> element fails; a page with neither
 *     is asked about (cantTell), since only a person can say where its
 *     main content is;
 *   - when there are several <main> elements, all but one carry the hidden
 *     attribute. Every <main> is counted, hidden or not: CSS or
 *     aria-hidden alone does not do (« l'utilisation d'un style seul
 *     restera insuffisante », 9.2 technical note). A <main> hidden only
 *     through a hidden ancestor, or inside a closed <details> or <dialog>,
 *     is asked about, since the step speaks of the element's own
 *     attribute. A page whose every <main> carries hidden is asked about
 *     too.
 *   Steps 1 to 3 and 6 (header, navigation, footer) are left to a person.
 * @implementation-notes
 * - landmark-one-main and landmark-no-duplicate-main count the main
 *   landmarks exposed to assistive technologies: they accept role="main"
 *   and a second <main> hidden by CSS, and apply whatever the doctype.
 *   RGAA 9.2.1 judges the <main> element and its hidden attribute.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'main-element-structure';

const meta = {
  title: 'Main content uses one visible <main> element',
  description:
    'Checks that the main content is a <main> element and that every other <main> carries the hidden attribute, on HTML5 pages.',
  i18n: {
    titleKey: 'mainElementStructure_title',
    descriptionKey: 'mainElementStructure_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'landmarks', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const doctype = helpers.getDoctypeInfo ? helpers.getDoctypeInfo() : { kind: 'none' };
  if (doctype.kind !== 'html5') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const query = (sel) =>
    helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel);
  const mains = query('main');

  // hidden on an ancestor, or a closed <details>/<dialog> around it.
  function hiddenByAncestor(el) {
    const parentOf = (n) => (helpers.composedParent ? helpers.composedParent(n) : n.parentNode);
    for (let n = parentOf(el); n && n.nodeType === 1; n = parentOf(n)) {
      if (n.hasAttribute('hidden')) return true;
      const tag = String(n.localName || '').toLowerCase();
      if ((tag === 'details' || tag === 'dialog') && !n.hasAttribute('open')) return true;
    }
    return false;
  }

  function occurrence(el, reasonCode, outcome) {
    const texts = {
      extraMain: [
        'This <main> element is not the first one on the page and has no hidden attribute.',
        'Keep one visible <main> element. Give every other <main> the hidden attribute: CSS or aria-hidden alone is not enough.'
      ],
      roleMainOnly: [
        'The main content is marked with role="main" but the page has no <main> element.',
        'Use a <main> element for the main content.'
      ],
      noMain: [
        'The page has no <main> element and no role="main".',
        'Check where the main content is, and wrap it in a <main> element.'
      ],
      hiddenByAncestor: [
        'This <main> element is hidden by an ancestor but has no hidden attribute of its own.',
        'Check that only one <main> can ever be visible, and give the others the hidden attribute.'
      ],
      allHidden: [
        'Every <main> element on the page has the hidden attribute.',
        'Check that one <main> element is shown when the page is used.'
      ]
    };
    const key = outcome === 'fail' ? 'fail' : 'cantTell';
    return helpers.reportOccurrence(el, {
      summary: texts[reasonCode][0],
      hint: texts[reasonCode][1],
      i18n: {
        summaryKey: `mainElementStructure_summary_${key}_${reasonCode}`,
        hintKey: `mainElementStructure_hint_${key}_${reasonCode}`,
        params: {}
      },
      uncertainty:
        outcome === 'cantTell'
          ? {
              code: 'judgement-required',
              needed:
                reasonCode === 'noMain'
                  ? 'Where the main content zone of the page is.'
                  : 'Whether only one <main> element is ever visible.'
            }
          : undefined,
      data: {
        details: { reasonCode },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
  }

  function result(outcome, occurrences) {
    return {
      ruleId: rule.ruleId,
      outcome,
      severity: outcome === 'pass' ? 'minor' : rule.defaultSeverity || 'moderate',
      occurrences: occurrences || []
    };
  }

  if (!mains.length) {
    const roleMain = query('[role]').find((el) => {
      const tokens = String(el.getAttribute('role') || '')
        .trim()
        .toLowerCase()
        .split(/\s+/);
      return tokens[0] === 'main';
    });
    if (roleMain) return result('fail', [occurrence(roleMain, 'roleMainOnly', 'fail')]);
    return result('cantTell', [
      occurrence(document.body || document.documentElement, 'noMain', 'cantTell')
    ]);
  }

  const withoutOwnHidden = mains.filter((el) => !el.hasAttribute('hidden'));
  const shown = withoutOwnHidden.filter((el) => !hiddenByAncestor(el));

  if (shown.length > 1) {
    return result(
      'fail',
      shown.slice(1).map((el) => occurrence(el, 'extraMain', 'fail'))
    );
  }
  if (withoutOwnHidden.length > 1) {
    return result(
      'cantTell',
      withoutOwnHidden
        .filter((el) => hiddenByAncestor(el))
        .map((el) => occurrence(el, 'hiddenByAncestor', 'cantTell'))
    );
  }
  if (!withoutOwnHidden.length) {
    return result('cantTell', [occurrence(mains[0], 'allHidden', 'cantTell')]);
  }
  return result('pass');
}

module.exports = { id, meta, runInPage, applicability };
