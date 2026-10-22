/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-owns-valid
 * @atomic true
 * @summary aria-owns must give each element one owner, and never an ancestor of the owner
 * @standard WCAG 2.2
 * @sc 1.3.1, 4.1.2
 * @applicability
 *   Elements the page shows with an `aria-owns` naming at least one
 *   element in the same tree.
 * @expectation
 *   WAI-ARIA: an element has only one owner, so its id is in no more than
 *   one `aria-owns`, and an element cannot own one that contains it.
 *   - An element named by two or more `aria-owns`: fail
 *     (`ARIA_OWNS_DUPLICATE`), reported on the element owned. The browser
 *     gives it to one owner, by order, so the structure the other owners
 *     state is lost.
 *   - An `aria-owns` naming the element itself or one of its ancestors:
 *     fail (`ARIA_OWNS_ANCESTOR`), reported on the owner. The browser
 *     ignores that ownership, as it would make a cycle.
 *   - Otherwise: pass.
 * @reports
 *   - `ownerCount`: for `ARIA_OWNS_DUPLICATE`, how many elements name the
 *     owned element in `aria-owns`.
 *   - `ownedId`: the id named.
 * @implementation-notes
 * - Chromium, checked: an element named by two owners is a child of one of
 *   them only, and an owner naming its ancestor gets no such child.
 * - Each `aria-owns` is resolved once (`resolveIdRefs`, cached per tree);
 *   the conflicts are then found in one pass over the owners.
 */

const id = 'aria-owns-valid';

const meta = {
  title: 'aria-owns must give each element one owner, and never an ancestor of the owner',
  description:
    'Checks that no element is named by more than one aria-owns, and that no aria-owns names the element itself or one of its ancestors.',
  i18n: {
    titleKey: 'ariaOwnsValid_title',
    descriptionKey: 'ariaOwnsValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.1', '4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    },
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
  coverage: {
    facetsBySc: {
      '1.3.1': ['aria-owns-valid'],
      '4.1.2': ['aria-owns-valid']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function visibility(el) {
    try {
      return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {
      return null;
    }
  }

  const fails = [];
  let applicableCount = 0;
  // Each owned element, with the owners that name it, in document order.
  const ownersOf = new Map();

  for (const owner of helpers.queryAllSmart('[aria-owns]')) {
    if (!owner) continue;
    const value = dom.getAttribute(owner, 'aria-owns');
    if (!trim(value)) continue;
    const refs = helpers.resolveIdRefs(value, ctx, {}, owner).refs;
    if (!refs.length) continue;
    applicableCount += 1;

    for (const ref of refs) {
      if (ref === owner || dom.contains(ref, owner)) {
        const ownedId = trim(dom.get(ref, 'id'));
        fails.push(
          helpers.reportOccurrence(owner, {
            summary: `This element’s aria-owns names ${ownedId}, which contains the element itself.`,
            hint: 'Remove that id from aria-owns: an element cannot own one of its ancestors, and the browser ignores it.',
            i18n: {
              summaryKey: 'ariaOwnsValid_summary_fail_ancestor',
              hintKey: 'ariaOwnsValid_hint_fail_ancestor',
              params: { id: ownedId }
            },
            data: {
              details: { reasonCode: 'ARIA_OWNS_ANCESTOR', ownedId },
              visibilityFilter: visibility(owner) || {
                targetSet: 'acc',
                accEligible: null,
                reasons: []
              }
            }
          })
        );
        continue;
      }
      const list = ownersOf.get(ref);
      if (list) list.push(owner);
      else ownersOf.set(ref, [owner]);
    }
  }

  for (const [owned, owners] of ownersOf) {
    if (owners.length < 2) continue;
    const ownedId = trim(dom.get(owned, 'id'));
    fails.push(
      helpers.reportOccurrence(owned, {
        summary: `This element is named in the aria-owns of ${owners.length} elements, but it can have only one owner.`,
        hint: 'Keep its id in one aria-owns; the browser gives it to only one of them.',
        i18n: {
          summaryKey: 'ariaOwnsValid_summary_fail_duplicate',
          hintKey: 'ariaOwnsValid_hint_fail_duplicate',
          params: { count: String(owners.length), id: ownedId }
        },
        data: {
          details: { reasonCode: 'ARIA_OWNS_DUPLICATE', ownerCount: owners.length, ownedId },
          visibilityFilter: visibility(owned) || {
            targetSet: 'acc',
            accEligible: null,
            reasons: []
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, [], rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
