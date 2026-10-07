/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check skip-link-present
 * @atomic true
 * @summary A page with navigation before its main content must have a working link to it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document. RGAA 12.7.1 step 1 finds the
 *   main content zone through the visible <main> element; the rule takes
 *   the first one, or, failing one, a visible role="main". With neither,
 *   the rule asks a person to locate the zone, unless the page has no link
 *   and no navigation block, which is notApplicable. A run narrowed by
 *   contextSelector or engineOptions.fragment is notApplicable.
 * @expectation
 *   A same-page link outside the main content zone leads to it: its
 *   fragment resolves to <main>, or to an element inside it or before it
 *   with no navigation block, link or other focusable element between that
 *   element and the start of the zone. RGAA
 *   12.7.1 accepts a skip link just before the zone or a quick-access link
 *   to it; a main landmark or headings alone do not count. The rule fails:
 *   - when a navigation block (<nav> or role="navigation") comes before
 *     the main zone and no link leads to it; the 12.7 particular case, a
 *     one-page site, turns on the presence of navigation, so with navigation
 *     the link is needed;
 *   - on a skip link whose target does not exist, whether or not the page
 *     has navigation.
 *   It asks instead of failing when no navigation block comes before the
 *   main zone and no link leads to it (a one-page site may not need one),
 *   and on a skip link whose target exists but is hidden, or sits before
 *   the zone with links or other focusable elements, but no navigation
 *   block, between the two. A skip link to a target inside navigation,
 *   after the zone, or with navigation between it and the zone leads
 *   elsewhere (to a menu, a search form, the footer) and does not count.
 * @implementation-notes
 * - A skip link is recognised as skip-link recognises one: its accessible
 *   name follows a common skip-link wording in one of the shipped locales
 *   (English, French, German, Spanish, Japanese), or it is the page's first
 *   link and comes before the main zone. The wording list is a copy of
 *   skip-link's, since a rule's runInPage cannot import another's code; the
 *   two must change together.
 * - A link that leads to the main zone passes whatever its wording and
 *   position. Whether it is visible, or becomes visible on focus, is the
 *   business of 12.7.2 (skip-link) and is not checked.
 * - Links and navigation blocks are found with the engine's hidden-content
 *   policy: a display:none link cannot be focused and is not counted.
 * - Opt-in (tag `rgaa`): WCAG 2.4.1 accepts a main landmark or headings as
 *   a bypass mechanism (bypass-blocks-present), so the rule runs only under
 *   the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'skip-link-present';

const meta = {
  title: 'Pages have a skip link to the main content',
  description:
    'Checks that a page with navigation before its main content has a working same-page link to that content.',
  i18n: {
    titleKey: 'skipLinkPresent_title',
    descriptionKey: 'skipLinkPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'keyboard', 'navigation', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

// Not applicable while a modal dialog is open either: the rest of the page
// is inert then, so the scan sees the dialog, not the page's own zones and
// links (helpers.isModalDialogOpen, as core's whole-page rules use it).
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isWholeDocumentScope && !helpers.isWholeDocumentScope()) return false;
  return !(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
  const CONTAINED_BY = 16; // Node.DOCUMENT_POSITION_CONTAINED_BY

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function attr(el, name) {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  }

  function query(sel) {
    return helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);
  }

  function isEligible(el) {
    const r = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  function precedes(a, b) {
    try {
      return !!(dom.compareDocumentPosition(a, b) & FOLLOWING);
    } catch {
      return false;
    }
  }

  // Skip-link wording in the shipped locales, the same list core's skip-link
  // rule uses (helpers.hasSkipLinkWording, docs/RULE_HELPERS.md).
  const hasSkipWording = (name) => helpers.hasSkipLinkWording(name);

  function linkName(el) {
    const al = norm(attr(el, 'aria-label'));
    if (al) return al;
    const alb = norm(attr(el, 'aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/)) {
        try {
          const ref = helpers.getElementByIdInTree(el, refId);
          if (ref) parts.push(norm(dom.textContent(ref)));
        } catch {}
      }
      const joined = norm(parts.join(' '));
      if (joined) return joined;
    }
    return norm(dom.textContent(el)) || norm(attr(el, 'title'));
  }

  // The fragment of a link to this same page, or null.
  function sameDocumentFragment(el) {
    const href = String(attr(el, 'href') || '').trim();
    let fragment = null;
    if (href.charAt(0) === '#') {
      fragment = href.slice(1);
    } else if (href.indexOf('#') !== -1) {
      try {
        const url = new URL(href, dom.baseURI(document));
        const here = new URL(document.URL);
        url.hash = '';
        here.hash = '';
        if (url.href === here.href) fragment = href.slice(href.indexOf('#') + 1);
      } catch {}
    }
    if (fragment == null) return null;
    try {
      fragment = decodeURIComponent(fragment);
    } catch {}
    fragment = fragment.trim();
    if (!fragment || fragment.toLowerCase() === 'top') return null;
    return fragment;
  }

  function resolveTarget(el, fragment) {
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : document;
    let target = null;
    try {
      if (root && typeof dom.get(root, 'getElementById') === 'function')
        target = dom.getElementById(root, fragment);
      // eslint-disable-next-line safe-dom/tree-scoped-ids -- a fragment link's target is looked up in the document (HTML's indicated part of the document)
      if (!target) target = dom.getElementById(document, fragment);
    } catch {}
    if (!target) {
      try {
        target = dom.querySelector(
          document,
          'a[name="' + fragment.replace(/(["\\])/g, '\\$1') + '"]'
        );
      } catch {}
    }
    return target;
  }

  function isNavigation(el) {
    const tag = String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
    const role = helpers.aria.getExplicitRole(el);
    if (role) return role === 'navigation';
    return tag === 'nav';
  }

  function isFocusable(el) {
    const tag = String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
    const tabindex = attr(el, 'tabindex');
    if (tabindex != null && /^\s*-/.test(tabindex)) return false;
    if (tabindex != null && /^\s*\d/.test(tabindex)) return true;
    if (tag === 'a' || tag === 'area') return dom.hasAttribute(el, 'href');
    if (tag === 'input') return String(attr(el, 'type') || '').toLowerCase() !== 'hidden';
    if (['button', 'select', 'textarea', 'iframe', 'summary'].includes(tag)) return true;
    const ce = attr(el, 'contenteditable');
    return ce != null && ce.toLowerCase() !== 'false';
  }

  function scan(from, to, stopAtTo, found) {
    const walker = dom.createTreeWalker(document, document, 1);
    walker.currentNode = from;
    let count = 0;
    for (let n = walker.nextNode(); n && n !== to; n = walker.nextNode()) {
      if (++count > 5000) {
        found.navigation = true;
        break;
      }
      if (stopAtTo && dom.contains(n, to)) continue;
      if (!isEligible(n)) continue;
      if (isNavigation(n)) found.navigation = true;
      else if (isFocusable(n)) found.focusable = true;
    }
    return found;
  }

  // What keyboard navigation passes between `target` and the start of the
  // main content: null when `target` is after `main`. For a target inside
  // `main`, what lies between the start of `main` and the target.
  function between(target, main) {
    const found = { navigation: false, focusable: false };
    if (target === main) return found;
    let inside = false;
    try {
      inside = dom.contains(main, target);
    } catch {}
    if (inside) return scan(main, target, true, found);
    let pos = 0;
    try {
      pos = dom.compareDocumentPosition(target, main);
    } catch {}
    if (!(pos & FOLLOWING) && !(pos & CONTAINED_BY)) return null;
    return scan(target, main, true, found);
  }

  const mains = query('main').filter(isEligible);
  const main = mains.length
    ? mains[0]
    : query('[role~="main" i]').filter(
        (el) => helpers.aria.getExplicitRole(el) === 'main' && isEligible(el)
      )[0] || null;
  const navigations = query('nav, [role~="navigation" i]').filter(isNavigation);
  const links = query('a[href]');

  if (!main) {
    // Without <main> the zone cannot be located; a person finds it. A page
    // with no link and no navigation has nothing to skip.
    if (!links.length && !navigations.length) {
      return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }
    const target = dom.body(document) || dom.documentElement(document);
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(
        [],
        [
          helpers.reportOccurrence(target, {
            summary:
              'The page has no <main> element, so the main content zone and a link to it could not be found.',
            hint: 'Mark the main content with a <main> element, and add a link before it, such as "Skip to content", whose href is the id of that element.',
            i18n: {
              summaryKey: 'skipLinkPresent_summary_cantTell_noMain',
              hintKey: 'skipLinkPresent_hint_cantTell_noMain',
              params: {}
            },
            uncertainty: {
              code: 'judgement-required',
              needed:
                'Where the main content zone is, and whether a link lets a person skip to it.',
              evidence: { reasonCode: 'mainNotFound' }
            },
            data: {
              details: { reasonCode: 'mainNotFound' },
              visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
            }
          })
        ],
        rule.defaultSeverity || 'moderate'
      )
    };
  }

  const navBefore = navigations.filter(
    (n) => !dom.contains(main, n) && !dom.contains(n, main) && precedes(n, main)
  );

  const positional = links.length && precedes(links[0], main) ? links[0] : null;

  const fails = [];
  const questions = [];
  let reached = false;

  for (const el of links) {
    // A link inside the main content does not lead to it.
    if (dom.contains(main, el)) continue;
    const fragment = sameDocumentFragment(el);
    if (fragment == null) continue;
    const target = resolveTarget(el, fragment);
    const usable = !!target && isEligible(target);
    const path = target ? between(target, main) : null;
    if (usable && path && !path.navigation && !path.focusable) {
      reached = true;
      break;
    }
    const name = linkName(el);
    if (el !== positional && !hasSkipWording(name)) continue;
    const href = String(attr(el, 'href') || '').trim();

    if (!target) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This skip link points to "${href}", which does not exist in the page.`,
          hint: 'Point the skip link at the id of the <main> element, or add that id.',
          i18n: {
            summaryKey: 'skipLinkPresent_summary_fail_targetMissing',
            hintKey: 'skipLinkPresent_hint_fail_targetMissing',
            params: { href }
          },
          data: { details: { reasonCode: 'skipLinkTargetMissing', href } }
        })
      );
      continue;
    }

    // A target inside navigation, after the main content, or with
    // navigation between it and the main content is another quick-access
    // link, not one to the main content.
    const inNavigation = (() => {
      for (let p = target; p && dom.nodeType(p) === 1; p = dom.parentElement(p)) {
        if (isNavigation(p)) return true;
      }
      return false;
    })();
    if (!usable || (path && !path.navigation && !inNavigation)) {
      const reasonCode = usable ? 'skipLinkTargetNotMain' : 'skipLinkTargetHidden';
      questions.push(
        helpers.reportOccurrence(el, {
          summary: usable
            ? `This skip link points to "${href}", which is not the start of the main content: links or other focusable elements lie between them.`
            : `This skip link points to "${href}", which is hidden.`,
          hint: 'Check that activating the link moves reading and keyboard focus to the start of the main content. Pointing it at the <main> element does this.',
          i18n: {
            summaryKey: usable
              ? 'skipLinkPresent_summary_cantTell_targetNotMain'
              : 'skipLinkPresent_summary_cantTell_targetHidden',
            hintKey: 'skipLinkPresent_hint_cantTell_target',
            params: { href }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether this link lets a person skip to the main content.',
            evidence: { reasonCode, href }
          },
          data: { details: { reasonCode, href } }
        })
      );
    }
  }

  if (reached) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  if (!fails.length && !questions.length) {
    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(main, ctx, { targetSet: 'acc' })
      : null;
    const visibilityFilter = eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] };
    if (navBefore.length) {
      fails.push(
        helpers.reportOccurrence(main, {
          summary:
            'Navigation comes before the main content, and no link on the page leads to the main content.',
          hint: 'Add a link at the start of the page, such as "Skip to content", whose href is the id of the <main> element.',
          i18n: {
            summaryKey: 'skipLinkPresent_summary_fail_noLink',
            hintKey: 'skipLinkPresent_hint_fail_noLink',
            params: {}
          },
          data: {
            details: { reasonCode: 'noSkipLink', navigationCount: navBefore.length },
            visibilityFilter
          }
        })
      );
    } else {
      questions.push(
        helpers.reportOccurrence(main, {
          summary:
            'No link on the page leads to the main content, and no navigation block comes before it.',
          hint: 'A skip link to the main content is needed unless the site is a single page that has no use for one. Check the content before <main>, and add a link to it if that content repeats or can be skipped.',
          i18n: {
            summaryKey: 'skipLinkPresent_summary_cantTell_noNavigation',
            hintKey: 'skipLinkPresent_hint_cantTell_noNavigation',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the page belongs to a one-page site that has no use for a skip link.',
            evidence: { reasonCode: 'noNavigationBeforeMain' }
          },
          data: { details: { reasonCode: 'noNavigationBeforeMain' }, visibilityFilter }
        })
      );
    }
  }

  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate')
  };
}

module.exports = { id, meta, runInPage, applicability };
