/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check embed-image-role-img
 * @atomic true
 * @summary An embedded image must have role="img" and a text alternative, or an adjacent link to an alternative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <embed> elements whose type attribute starts with image/
 *   (RGAA 1.1.7 covers "balise <embed> avec l'attribut type="image/…""
 *   only; an <embed> with another type, or none, is out of scope). An
 *   <embed> with aria-hidden="true", on itself or an ancestor, or with
 *   role="none"/"presentation", is left out: it is marked decorative, which
 *   1.2.6 covers. Content hidden with CSS or the hidden attribute is left
 *   out too. A page with none is notApplicable.
 * @expectation
 *   RGAA 1.1.7 passes when one of these holds:
 *   - the <embed> has a text alternative (aria-labelledby, aria-label or
 *     title) and role="img";
 *   - it is immediately followed by a link or button that gives access to
 *     an alternative content;
 *   - a mechanism lets the user replace it with an alternative content.
 *   Passes: role="img" and a text alternative.
 *   Fails: no text alternative and no link or button right after it.
 *   Asks (cantTell):
 *   - a text alternative without role="img". The test wording requires
 *     both, but the methodology validates on the alternative alone (steps 2
 *     to 4), so RGAA does not say which reading wins;
 *   - no text alternative, but a link or button right after the <embed>
 *     (does it lead to an alternative content?).
 * @implementation-notes
 * - "Immediately followed" is read in the markup: the next sibling, skipping
 *   white space and comments, is a link (a[href], role="link") or a button
 *   (button, input of type button/submit/reset/image, role="button"), or
 *   starts with one (a <p> whose first content is the link).
 * - The replacement mechanism cannot be detected. It is rare and page-level;
 *   a page that offers one should record it and ignore these failures.
 * - aria-labelledby counts when it resolves to text.
 * - Opt-in (tag `rgaa`): embed-text-alternative-present covers WCAG 1.1.1
 *   for every <embed>; this rule follows RGAA's scope and conditions, and
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'embed-image-role-img';

const meta = {
  title: 'Embedded images have role="img" and a text alternative',
  description:
    'Checks that each <embed type="image/…"> has role="img" and a text alternative (aria-labelledby, aria-label or title), or is followed by a link or button to an alternative content.',
  i18n: {
    titleKey: 'embedImageRoleImg_title',
    descriptionKey: 'embedImageRoleImg_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'embed', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const firstRole = (el) => trim(attr(el, 'role')).toLowerCase().split(' ')[0];
  const parentOf = (el) =>
    helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el) || null;

  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function textAlternative(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        if (info && info.present && trim(info.value)) return info.mechanism;
      } catch {}
    } else if (trim(attr(el, 'aria-label'))) {
      return 'aria-label';
    }
    return trim(attr(el, 'title')) ? 'title' : '';
  }

  const NATIVE_LINK_OR_BUTTON =
    'a[href], button, input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="image" i]';

  // A role attribute is a fallback list read in any case: an element is a
  // link or a button by role when that is its first known role, so
  // role="tab link" is a tab.
  function isLinkOrButton(node) {
    if (dom.matches(node, NATIVE_LINK_OR_BUTTON)) return true;
    const role =
      helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(node)
        : '';
    return role === 'link' || role === 'button';
  }

  function isBlank(n) {
    return !!n && ((dom.nodeType(n) === 3 && !trim(dom.nodeValue(n))) || dom.nodeType(n) === 8);
  }

  function followingLinkOrButton(el) {
    let node = dom.nextSibling(el);
    while (isBlank(node)) node = dom.nextSibling(node);
    while (node && dom.nodeType(node) === 1) {
      try {
        if (isLinkOrButton(node)) return node;
      } catch {
        return null;
      }
      let child = dom.firstChild(node);
      while (isBlank(child)) child = dom.nextSibling(child);
      node = child;
    }
    return null;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('embed[type]')
    : helpers.queryAll('embed[type]');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;

  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const type = trim(attr(el, 'type')).toLowerCase();
    if (!type.startsWith('image/')) continue;
    if (insideAriaHidden(el)) continue;
    const role = firstRole(el);
    if (role === 'none' || role === 'presentation') continue;
    applicableCount += 1;

    const source = textAlternative(el);
    const isRoleImg = role === 'img';
    if (source && isRoleImg) continue;

    if (source) {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: `This embedded image has a text alternative (${source}) but no role="img".`,
          hint: 'RGAA 1.1.7 asks for a text alternative and role="img". Add role="img", or check that the alternative is rendered by assistive technologies.',
          i18n: {
            summaryKey: 'embedImageRoleImg_summary_cantTell_noRole',
            hintKey: 'embedImageRoleImg_hint_cantTell_noRole',
            params: { source }
          },
          data: {
            details: { reasonCode: 'alternativeWithoutRoleImg', source, type },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    const adjacent = followingLinkOrButton(el);
    if (adjacent) {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary:
            'This embedded image has no text alternative but is followed by a link or button.',
          hint: 'Check that the link or button gives access to an alternative content. If not, give the <embed> role="img" and an aria-label or aria-labelledby.',
          i18n: {
            summaryKey: 'embedImageRoleImg_summary_cantTell_adjacent',
            hintKey: 'embedImageRoleImg_hint_cantTell_adjacent'
          },
          data: { details: { reasonCode: 'adjacentLinkOrButton', type }, visibilityFilter: VF }
        })
      );
      continue;
    }

    fails.push(
      helpers.reportOccurrence(el, {
        summary:
          'This embedded image has no text alternative and no link or button to an alternative content after it.',
        hint: 'Give the <embed> role="img" and an aria-label or aria-labelledby, or follow it with a link or button to an alternative content.',
        i18n: {
          summaryKey: 'embedImageRoleImg_summary_fail',
          hintKey: 'embedImageRoleImg_hint_fail'
        },
        data: {
          details: { reasonCode: 'noAlternative', type, roleImg: isRoleImg },
          visibilityFilter: VF
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
