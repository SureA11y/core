/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check duplicate-id
 * @atomic true
 * @summary Every id value must be unique within its own tree
 * @standard WCAG 2.1
 * @sc 4.1.1
 * @applicability
 *   Applies to any element carrying a non-empty id attribute. Visibility
 *   is irrelevant. A duplicate id breaks the same lookups whether the
 *   element renders or not, which is why ACT 3ea0c8 evaluates hidden
 *   elements too.
 * @expectation
 *   No other element in the same tree carries the same id value. Ids are
 *   scoped per document tree and per shadow tree, so the same id inside
 *   two different shadow roots is not a duplicate.
 * @implementation-notes
 * - WCAG-VERSION SCOPED. SC 4.1.1 Parsing was removed in WCAG 2.2, so this
 *   rule is tagged `wcag2a` (its 2.0/2.1 origin) plus `wcag22-removed`.
 *   The engine acts on that tag itself: under a 2.2 target, which is the
 *   default, this rule still runs and still reports every duplicate it
 *   finds, but its fail is coerced to `cantTell` with a `wcagVersionScope`
 *   field saying why (see scopeOutcomeToWcagVersion in
 *   `src/core/dom-runner.js`). A consumer targeting 2.0 or 2.1
 *   (`engineOptions.wcagVersion`, or a tag set that implies it) gets the
 *   real 4.1.1 failure; one that would rather not see the rule at all
 *   under 2.2 still excludes it with `excludeTags: ['wcag22-removed']`.
 *   The alternative, dropping the SC mapping entirely, would have made a
 *   genuine 2.0/2.1 failure invisible to anyone conformance-testing
 *   against those versions. See `docs/ENGINE_OPTIONS.md` for the option
 *   and the tag, and `docs/DESIGN_CHALLENGES.md` for the decision history.
 * - The defect outlives its Success Criterion: a duplicate id breaks
 *   `<label for>` association, fragment navigation, `getElementById`, and
 *   every ID-reference attribute, none of which stopped mattering when
 *   4.1.1 was retired. The SC was removed because browsers recover from
 *   malformed markup, not because ids became free-form.
 * - Scoping is per ROOT NODE, not per document: `getRootNode()` groups
 *   light DOM against the document and each shadow tree against itself,
 *   matching the DOM's own id-lookup scope. Two components that each use
 *   `id="title"` inside their own shadow root are correct markup and are
 *   not reported.
 * - Overlaps `duplicate-id-aria` by design, and the two say different
 *   things. That rule reports a duplicate id that an ARIA attribute
 *   actually references, as a `cantTell` under 4.1.2, the reference
 *   resolves to the first match, so whether the right element was named is
 *   an authoring question. This one is the flat structural fact under
 *   4.1.1, for every id, referenced or not.
 * - Detection is document-wide while reporting follows the scanned scope,
 *   the same split `duplicate-id-aria` uses: a `contextSelector` narrows
 *   which duplicates get reported, never which ones count as duplicates.
 */

const id = 'duplicate-id';

const meta = {
  title: 'IDs must be unique',
  description:
    'Checks that every non-empty id attribute value is unique within its own document or shadow tree (WCAG 2.0/2.1 SC 4.1.1, removed in WCAG 2.2).',
  i18n: {
    titleKey: 'duplicateId_title',
    descriptionKey: 'duplicateId_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag411', 'wcag22-removed', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.1',
      requirement: '4.1.1',
      title: 'Parsing',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.1': ['id-unique-page-wide'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // Detection spans the whole document; see the header comment on scope.
  const all = new Set();
  try {
    const nodes = document.querySelectorAll ? document.querySelectorAll('[id]') : [];
    for (const el of nodes) all.add(el);
  } catch {
    // no-throw: fall through to the helper-provided set below
  }

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;

  // queryAllSmart reaches into open shadow roots when includeShadowDom is on,
  // which document.querySelectorAll never does.
  let inScope = null;
  if (queryAllSmart) {
    try {
      const scoped = queryAllSmart('[id]');
      const list = Array.isArray(scoped) ? scoped : Array.from(scoped || []);
      inScope = new Set(list);
      for (const el of list) all.add(el);
    } catch {
      inScope = null;
    }
  }

  // Ids resolve within their own tree, so group by root before comparing.
  function rootOf(el) {
    try {
      if (typeof el.getRootNode === 'function') return el.getRootNode();
    } catch {
      // fall through
    }
    return document;
  }

  const byRootAndId = new Map(); // root -> Map(idValue -> element[])
  let applicableCount = 0;

  for (const el of all) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) continue;
    const value = String(el.getAttribute('id') || '').trim();
    if (!value) continue;

    applicableCount += 1;

    const root = rootOf(el);
    let idMap = byRootAndId.get(root);
    if (!idMap) {
      idMap = new Map();
      byRootAndId.set(root, idMap);
    }
    const bucket = idMap.get(value);
    if (bucket) bucket.push(el);
    else idMap.set(value, [el]);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];

  for (const idMap of byRootAndId.values()) {
    for (const [value, els] of idMap) {
      if (els.length <= 1) continue;

      for (const el of els) {
        if (inScope && !inScope.has(el)) continue;

        const eligInfo = helpers.getEligibilityInfo
          ? (() => {
              try {
                return helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' });
              } catch {
                return null;
              }
            })()
          : null;

        occurrences.push(
          helpers.reportOccurrence(el, {
            summary: `The id "${value}" is used on ${els.length} elements in the same tree.`,
            hint: 'Give each element its own id. A duplicate breaks <label for>, fragment links, getElementById and every ID-reference attribute, all of which resolve to the first match only.',
            i18n: {
              summaryKey: 'duplicateId_summary_fail',
              hintKey: 'duplicateId_hint_fail',
              params: { id: value, count: String(els.length) }
            },
            data: {
              details: {
                reasonCode: 'DUPLICATE_ID',
                id: value,
                count: els.length
              },
              visibilityFilter: eligInfo || { targetSet: 'dom', accEligible: null, reasons: [] }
            }
          })
        );
      }
    }
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
