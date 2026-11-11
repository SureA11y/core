/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-owns-valid
 * @atomic true
 * @summary aria-owns must give each element one owner, and never an ancestor of the owner
 * @standard WCAG 2.2
 * @sc 1.3.1
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
 *     cantTell (`ARIA_OWNS_ANCESTOR`), reported on the owner. The
 *     ownership is impossible (it would make a cycle) and is ignored, so the
 *     structure the document itself states still stands: the WAI-ARIA
 *     violation is certain, but a relationship the page shows is lost only
 *     if it differs from that structure, which a person settles.
 *   - Otherwise: pass.
 * @reports
 *   - `ownerCount`: for `ARIA_OWNS_DUPLICATE`, how many elements name the
 *     owned element in `aria-owns`.
 *   - `ownedId`: the id named.
 * @reason-codes
 *   - `ARIA_OWNS_DUPLICATE` (fail): an element named in the aria-owns of two or
 *     more elements, so the browser gives it to one owner and the structure the
 *     others state is lost.
 *     Basis: WCAG 1.3.1; WAI-ARIA 1.2 aria-owns (MUST).
 *   - `ARIA_OWNS_ANCESTOR` (cantTell): an aria-owns that names the element
 *     itself or one of its ancestors, an ownership that is ignored, leaving
 *     the document's own structure. A WAI-ARIA violation; whether it also
 *     fails SC 1.3.1 depends on the relationship the page shows.
 *     Basis: WAI-ARIA 1.2 aria-owns (MUST); WCAG 1.3.1 (not settled).
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
  tags: ['wcag2a', 'wcag131', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.3.1': ['aria-owns-valid']
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
  const questions = [];
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
        // The ownership is impossible, so the markup's own structure still
        // stands: a WAI-ARIA violation whose WCAG effect depends on whether
        // the page shows the relationship the author tried to state.
        // An element naming its own id is said so, rather than as an
        // ancestor that contains it.
        const self = ref === owner;
        questions.push(
          helpers.reportOccurrence(owner, {
            summary: self
              ? `This element’s aria-owns names its own id, ${ownedId}.`
              : `This element’s aria-owns names ${ownedId}, which contains the element itself.`,
            hint: self
              ? 'Remove its own id from aria-owns: an element cannot own itself, and the browser ignores it.'
              : 'Remove that id from aria-owns: an element cannot own one of its ancestors, and the browser ignores it.',
            i18n: {
              summaryKey: self
                ? 'ariaOwnsValid_summary_cantTell_self'
                : 'ariaOwnsValid_summary_fail_ancestor',
              hintKey: self
                ? 'ariaOwnsValid_hint_cantTell_self'
                : 'ariaOwnsValid_hint_fail_ancestor',
              params: { id: ownedId }
            },
            uncertainty: {
              code: 'spec-only',
              needed:
                'Whether the page shows a relationship between the two elements that their place in the document does not already state.',
              evidence: { ownedId, relation: 'ancestor-or-self' }
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
    // The competing owners, as the reader finds them in the markup: the
    // first three, in document order.
    const ownerNames = owners
      .slice(0, 3)
      .map((o) => helpers.describeElement(o, { role: true }))
      .filter(Boolean);
    const ownersText =
      ownerNames.length === Math.min(owners.length, 3)
        ? ownerNames.join(', ') + (owners.length > 3 ? ', …' : '')
        : '';
    fails.push(
      helpers.reportOccurrence(owned, {
        summary: ownersText
          ? `This element is named in the aria-owns of ${owners.length} elements (${ownersText}), but it can have only one owner.`
          : `This element is named in the aria-owns of ${owners.length} elements, but it can have only one owner.`,
        hint: 'Keep its id in one aria-owns; the browser gives it to only one of them.',
        i18n: {
          summaryKey: ownersText
            ? 'ariaOwnsValid_summary_fail_duplicateNamed'
            : 'ariaOwnsValid_summary_fail_duplicate',
          hintKey: 'ariaOwnsValid_hint_fail_duplicate',
          params: { count: String(owners.length), id: ownedId, owners: ownersText }
        },
        data: {
          details: {
            reasonCode: 'ARIA_OWNS_DUPLICATE',
            ownerCount: owners.length,
            ownedId,
            owners: ownerNames
          },
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
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
