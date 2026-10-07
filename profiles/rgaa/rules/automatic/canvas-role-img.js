/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check canvas-role-img
 * @atomic true
 * @summary A <canvas> must have role="img" with an ARIA name, fallback content, or an adjacent link to an alternative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <canvas> elements. One with aria-hidden="true", on itself or
 *   an ancestor, or with role="none"/"presentation", is left out: it is
 *   marked decorative, which canvas-decorative-aria-hidden checks (1.2.5).
 *   Content hidden with CSS or the hidden attribute is left out too. A page
 *   with none is notApplicable.
 * @expectation
 *   RGAA 1.1.8 passes when one of these holds:
 *   - the <canvas> has role="img" and a text alternative from
 *     aria-labelledby or aria-label (steps 3 and 4);
 *   - otherwise, alternative content sits between <canvas> and </canvas>,
 *     or a link or button right after it gives access to an alternative
 *     content, or a mechanism replaces it (step 6).
 *   Passes: role="img" with aria-labelledby or aria-label; or, without
 *   role="img", fallback content (text, or an element with alt or
 *   aria-label text).
 *   Fails:
 *   - role="img" with no aria-labelledby or aria-label. The methodology's
 *     note is explicit: "si l'élément <canvas> dispose d'un rôle img, son
 *     alternative ne peut être fournie que par les techniques listées à
 *     l'étape 4", so fallback content, title and an adjacent link do not
 *     count;
 *   - no role="img", an aria-label, aria-labelledby or title, but no
 *     fallback content and no link or button after it (the name alone is
 *     not one of the step 6 options);
 *   - nothing at all.
 *   Asks (cantTell): no role="img" and no fallback content, but a link or
 *   button right after the <canvas> (does it lead to an alternative
 *   content?).
 * @implementation-notes
 * - "Immediately followed" is read in the markup: the next sibling, skipping
 *   white space and comments, is a link (a[href], role="link") or a button
 *   (button, input of type button/submit/reset/image, role="button"), or
 *   starts with one.
 * - The replacement mechanism cannot be detected. It is rare and page-level;
 *   a page that offers one should record it and ignore these failures.
 * - Whether the fallback content is a relevant alternative is 1.3.7, and
 *   whether assistive technologies render it is 1.3.8, both for a person.
 * - Opt-in (tag `rgaa`): canvas-text-alternative-present covers WCAG 1.1.1,
 *   which accepts a name without role="img" and has no adjacent-link
 *   option; this rule runs only under the rgaa-4.1.2 profile, the `rgaa`
 *   tag or its own id.
 */

const id = 'canvas-role-img';

const meta = {
  title: '<canvas> images have role="img" with an ARIA name, or fallback content',
  description:
    'Checks each <canvas> against RGAA 1.1.8: role="img" named by aria-labelledby or aria-label, or fallback content, or a link or button to an alternative content right after it.',
  i18n: {
    titleKey: 'canvasRoleImg_title',
    descriptionKey: 'canvasRoleImg_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'canvas', 'atomic', 'automatic'],
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

  function ariaName(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        return info && info.present && trim(info.value) ? info.mechanism : '';
      } catch {}
    }
    return trim(attr(el, 'aria-label')) ? 'aria-label' : '';
  }

  function hasFallback(el) {
    if (trim(dom.textContent(el))) return true;
    for (const d of Array.from(dom.querySelectorAll(el, '[alt], [aria-label]'))) {
      if (trim(attr(d, 'alt')) || trim(attr(d, 'aria-label'))) return true;
    }
    return false;
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
    ? helpers.queryAllSmart('canvas')
    : helpers.queryAll('canvas');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  function fail(el, reasonCode, summary, summaryKey, params, extra) {
    fails.push(
      helpers.reportOccurrence(el, {
        summary,
        hint:
          reasonCode === 'roleImgWithoutAriaName'
            ? 'Name the canvas with aria-label or aria-labelledby, or remove role="img" and put the alternative content between <canvas> and </canvas>.'
            : 'Give the canvas role="img" and an aria-label or aria-labelledby, or put alternative content between <canvas> and </canvas>, or follow it with a link or button to an alternative content.',
        i18n: {
          summaryKey,
          hintKey:
            reasonCode === 'roleImgWithoutAriaName'
              ? 'canvasRoleImg_hint_fail_roleImg'
              : 'canvasRoleImg_hint_fail',
          ...(params ? { params } : {})
        },
        data: { details: { reasonCode, ...(extra || {}) }, visibilityFilter: VF }
      })
    );
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (insideAriaHidden(el)) continue;
    const role = firstRole(el);
    if (role === 'none' || role === 'presentation') continue;
    applicableCount += 1;

    const mechanism = ariaName(el);
    const fallback = hasFallback(el);

    if (role === 'img') {
      if (mechanism) continue;
      fail(
        el,
        'roleImgWithoutAriaName',
        'This <canvas role="img"> has no aria-labelledby or aria-label; with role="img", fallback content, title and an adjacent link do not count.',
        'canvasRoleImg_summary_fail_roleImg',
        null,
        { fallback, title: !!trim(attr(el, 'title')) }
      );
      continue;
    }

    if (fallback) continue;

    if (followingLinkOrButton(el)) {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: 'This <canvas> has no alternative but is followed by a link or button.',
          hint: 'Check that the link or button gives access to an alternative content. If not, give the canvas role="img" and an aria-label or aria-labelledby.',
          i18n: {
            summaryKey: 'canvasRoleImg_summary_cantTell_adjacent',
            hintKey: 'canvasRoleImg_hint_cantTell_adjacent'
          },
          data: { details: { reasonCode: 'adjacentLinkOrButton' }, visibilityFilter: VF }
        })
      );
      continue;
    }

    const source = mechanism || (trim(attr(el, 'title')) ? 'title' : '');
    if (source) {
      fail(
        el,
        'nameWithoutRoleImg',
        `This <canvas> is named by ${source} but has no role="img" and no fallback content.`,
        'canvasRoleImg_summary_fail_noRole',
        { source },
        { source }
      );
      continue;
    }

    fail(
      el,
      'noAlternative',
      'This <canvas> has no text alternative, no fallback content and no link or button to an alternative content after it.',
      'canvasRoleImg_summary_fail',
      null,
      null
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
