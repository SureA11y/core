/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check skip-link-placement
 * @atomic true
 * @summary A skip link must be visible, at least on focus, and sit at the same place on every page
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that has a skip link: a
 *   same-page link outside the main content zone (the first visible <main>,
 *   or failing one a visible role="main") whose target is <main>, or an
 *   element inside or just before it with no navigation block, link or
 *   other focusable element in between, as skip-link-present recognises
 *   one. A page without one is notApplicable here: skip-link-present
 *   reports it, and skip-link a link that does not work.
 * @expectation
 *   RGAA 12.7.2, conditions 1 to 3: the link sits at the same place in the
 *   presentation, comes in the same relative order in the source, and is
 *   visible or, failing that, visible when it takes focus.
 *   - Visibility needs a layout (a browser). A link that is not visible at
 *     rest is focused, as by the keyboard, and measured again. It fails
 *     when it is still not visible: no size, outside the page, clipped by
 *     an ancestor, fully transparent or `visibility: hidden`
 *     (SKIP_LINK_NOT_VISIBLE). It is asked about when something may cover
 *     it, or an animation starts on focus (SKIP_LINK_VISIBILITY_UNKNOWN).
 *     Without a layout (jsdom) visibility is always asked about.
 *   - Place and order need the site's other pages, through the
 *     `crawl.skipLinks` probe. The link fails when another page measured at
 *     the same viewport width shows it more than 24 CSS pixels away
 *     (SKIP_LINK_POSITION_DIFFERS). It is asked about when its focus order
 *     differs (SKIP_LINK_ORDER_DIFFERS), since what the order is relative to
 *     is a person's call; when no other page was measured at the same width
 *     (SKIP_LINK_VIEWPORT_DIFFERS); and when the probe brings no other page
 *     with a skip link (SKIP_LINK_SINGLE_PAGE).
 *   It passes when it is visible, at least on focus, and every other page
 *   shows it at the same place and in the same focus order.
 * @implementation-notes
 * - The result always carries the page's own record in
 *   `data.page`: { url, viewportWidth, skipLink: { text, href, focusOrder,
 *   x, y, width, height } | null }, the box in page coordinates where the
 *   link shows (on focus when hidden at rest), null without a layout or
 *   when the link is not visible. The record is flat because the engine
 *   cuts probes deeper than six levels. A crawler scans each
 *   page once, collects these records and passes them back as
 *   `engineOptions.probes['crawl.skipLinks'] = { pages: [...] }`. The page's
 *   own URL is left out of the comparison.
 * - focusOrder is the link's index among the page's elements in sequential
 *   focus order (positive tabindex first, then document order).
 * - Focus, the style attribute and transitions are put back after the
 *   focused measurement.
 * - The main zone and target tests are copies of skip-link-present's, since
 *   a rule's runInPage cannot import another's code; the two must change
 *   together.
 * - Opt-in (tag `rgaa`): WCAG 2.4.1 does not ask for a skip link.
 */

const id = 'skip-link-placement';

const meta = {
  title: 'Skip links are visible and at the same place on every page',
  description:
    'Checks that the link to the main content is visible, at least when it takes focus, and that the site’s other pages show it at the same place and in the same focus order (RGAA 12.7.2).',
  i18n: {
    titleKey: 'skipLinkPlacement_title',
    descriptionKey: 'skipLinkPlacement_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'keyboard', 'navigation', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
  const CONTAINED_BY = 16; // Node.DOCUMENT_POSITION_CONTAINED_BY
  const MAX_SHIFT = 24; // CSS pixels between two pages before the place differs
  const view = document.defaultView || null;

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function attr(el, name) {
    try {
      return el.getAttribute(name);
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

  function linkName(el) {
    const al = norm(attr(el, 'aria-label'));
    if (al) return al;
    return norm(el.textContent) || norm(attr(el, 'title'));
  }

  // ---- The skip link, found as skip-link-present finds one ----

  function sameDocumentFragment(el) {
    const href = String(attr(el, 'href') || '').trim();
    let fragment = null;
    if (href.charAt(0) === '#') {
      fragment = href.slice(1);
    } else if (href.indexOf('#') !== -1) {
      try {
        const url = new URL(href, document.baseURI);
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
    const root = el.getRootNode ? el.getRootNode() : document;
    let target = null;
    try {
      if (root && typeof root.getElementById === 'function') target = root.getElementById(fragment);
      if (!target) target = document.getElementById(fragment);
    } catch {}
    if (!target) {
      try {
        target = document.querySelector('a[name="' + fragment.replace(/(["\\])/g, '\\$1') + '"]');
      } catch {}
    }
    return target;
  }

  function isNavigation(el) {
    const tag = String(el.localName || el.tagName || '').toLowerCase();
    const role = norm(attr(el, 'role')).toLowerCase().split(' ')[0];
    if (role) return role === 'navigation';
    return tag === 'nav';
  }

  function isFocusable(el) {
    const tag = String(el.localName || el.tagName || '').toLowerCase();
    const tabindex = attr(el, 'tabindex');
    if (tabindex != null && /^\s*-/.test(tabindex)) return false;
    if (tabindex != null && /^\s*\d/.test(tabindex)) return true;
    if (tag === 'a' || tag === 'area') return el.hasAttribute('href');
    if (tag === 'input') return String(attr(el, 'type') || '').toLowerCase() !== 'hidden';
    if (['button', 'select', 'textarea', 'iframe', 'summary'].includes(tag)) return true;
    const ce = attr(el, 'contenteditable');
    return ce != null && ce.toLowerCase() !== 'false';
  }

  function scan(from, to, found) {
    const walker = document.createTreeWalker(document, 1);
    walker.currentNode = from;
    let count = 0;
    for (let n = walker.nextNode(); n && n !== to; n = walker.nextNode()) {
      if (++count > 5000) {
        found.navigation = true;
        break;
      }
      if (n.contains(to)) continue;
      if (!isEligible(n)) continue;
      if (isNavigation(n)) found.navigation = true;
      else if (isFocusable(n)) found.focusable = true;
    }
    return found;
  }

  function between(target, main) {
    const found = { navigation: false, focusable: false };
    if (target === main) return found;
    let inside = false;
    try {
      inside = main.contains(target);
    } catch {}
    if (inside) return scan(main, target, found);
    let pos = 0;
    try {
      pos = target.compareDocumentPosition(main);
    } catch {}
    if (!(pos & FOLLOWING) && !(pos & CONTAINED_BY)) return null;
    return scan(target, main, found);
  }

  const mains = query('main').filter(isEligible);
  const main = mains.length ? mains[0] : query('[role="main"]').filter(isEligible)[0] || null;

  let skipLink = null;
  if (main) {
    for (const el of query('a[href]')) {
      if (main.contains(el)) continue;
      const fragment = sameDocumentFragment(el);
      if (fragment == null) continue;
      const target = resolveTarget(el, fragment);
      if (!target || !isEligible(target)) continue;
      const path = between(target, main);
      if (path && !path.navigation && !path.focusable) {
        skipLink = el;
        break;
      }
    }
  }

  function pageUrl(u) {
    try {
      const url = new URL(String(u), document.baseURI);
      url.hash = '';
      return url.href;
    } catch {
      return String(u || '');
    }
  }
  const here = pageUrl(document.URL);
  const viewportWidth = view && Number.isFinite(view.innerWidth) ? view.innerWidth : null;

  if (!skipLink) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { page: { url: here, viewportWidth, skipLink: null } }
    };
  }

  // ---- Focus order ----

  function focusOrderOf(el) {
    const getInfo =
      typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    const candidates = query(
      'a[href],area[href],button,input,select,textarea,summary,iframe,[tabindex],[contenteditable]'
    );
    const positive = [];
    const rest = [];
    for (const c of candidates) {
      let tabbable;
      try {
        tabbable = getInfo ? !!(getInfo(c, ctx) || {}).tabbable : isFocusable(c);
      } catch {
        tabbable = false;
      }
      if (!tabbable) continue;
      const t = parseInt(attr(c, 'tabindex'), 10);
      if (t > 0) positive.push([t, c]);
      else rest.push(c);
    }
    positive.sort((a, b) => a[0] - b[0]);
    const order = positive.map((p) => p[1]).concat(rest);
    const i = order.indexOf(el);
    return i === -1 ? null : i;
  }

  // ---- Visibility, where the page has a layout ----

  function hasLayout() {
    const probe = document.documentElement || null;
    if (!probe || typeof probe.getClientRects !== 'function') return false;
    try {
      const rects = probe.getClientRects();
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  function styleOf(el) {
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  }

  // 'visible', 'hidden' (certainly not visible) or 'unknown' (something may
  // cover it), with its rect in page coordinates.
  function visibility(el) {
    const r = el.getBoundingClientRect();
    const sx = view.scrollX || 0;
    const sy = view.scrollY || 0;
    const rect = {
      x: Math.round(r.left + sx),
      y: Math.round(r.top + sy),
      width: Math.round(r.width),
      height: Math.round(r.height)
    };
    const cs = styleOf(el);
    if (!cs || cs.visibility === 'hidden' || cs.visibility === 'collapse') {
      return { state: 'hidden', rect };
    }
    if (r.width < 2 || r.height < 2) return { state: 'hidden', rect };
    // Outside the page: left of or above its origin.
    if (r.right + sx <= 0 || r.bottom + sy <= 0) return { state: 'hidden', rect };
    let visible = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = styleOf(n);
      if (!s) continue;
      if (parseFloat(s.opacity) === 0) return { state: 'hidden', rect };
      const clip = String(s.clip || '');
      if (/rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)/.test(clip)) {
        return { state: 'hidden', rect };
      }
      const clipPath = String(s.clipPath || '');
      if (/inset\(\s*50%/.test(clipPath)) return { state: 'hidden', rect };
      if (n !== el && (s.overflowX !== 'visible' || s.overflowY !== 'visible')) {
        const b = n.getBoundingClientRect();
        visible = {
          left: Math.max(visible.left, s.overflowX !== 'visible' ? b.left : -Infinity),
          top: Math.max(visible.top, s.overflowY !== 'visible' ? b.top : -Infinity),
          right: Math.min(visible.right, s.overflowX !== 'visible' ? b.right : Infinity),
          bottom: Math.min(visible.bottom, s.overflowY !== 'visible' ? b.bottom : Infinity)
        };
        if (visible.right - visible.left < 2 || visible.bottom - visible.top < 2) {
          return { state: 'hidden', rect };
        }
      }
    }
    // Something positioned over it may hide it: asked about, not decided.
    const cx = (visible.left + visible.right) / 2;
    const cy = (visible.top + visible.bottom) / 2;
    if (cx >= 0 && cy >= 0 && cx < view.innerWidth && cy < view.innerHeight) {
      try {
        const top = document.elementFromPoint(cx, cy);
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          return { state: 'unknown', rect };
        }
      } catch {}
    }
    return { state: 'visible', rect };
  }

  function deepActiveElement() {
    let cur = document.activeElement || null;
    let guard = 0;
    while (cur && cur.shadowRoot && cur.shadowRoot.activeElement && guard++ < 20) {
      cur = cur.shadowRoot.activeElement;
    }
    return cur;
  }

  // The link focused as by the keyboard, transitions off, then put back.
  function visibilityOnFocus(el) {
    const previous = deepActiveElement();
    const hadStyle = el.hasAttribute('style');
    const styleAttr = el.getAttribute('style');
    try {
      el.style.setProperty('transition', 'none', 'important');
      el.focus({ preventScroll: true, focusVisible: true });
      if (deepActiveElement() !== el) return null;
      if (typeof el.getAnimations === 'function' && el.getAnimations().length) {
        return { state: 'unknown', rect: null, animated: true };
      }
      return visibility(el);
    } catch {
      return null;
    } finally {
      try {
        if (previous && previous !== document.body && typeof previous.focus === 'function') {
          if (deepActiveElement() !== previous) previous.focus({ preventScroll: true });
        } else if (deepActiveElement() === el) {
          el.blur();
        }
      } catch {}
      // Reading the attribute first makes Chromium write the inline style
      // back to it; removed before that, it comes back as style="".
      el.getAttribute('style');
      if (hadStyle) el.setAttribute('style', styleAttr);
      else el.removeAttribute('style');
    }
  }

  const layout = view && hasLayout();
  let shown = null; // { state, rect, onFocus }
  if (layout) {
    const atRest = visibility(skipLink);
    if (atRest.state === 'visible') shown = { ...atRest, onFocus: false };
    else {
      const focused = visibilityOnFocus(skipLink);
      shown = focused
        ? { ...focused, onFocus: true }
        : { state: 'unknown', rect: atRest.rect, onFocus: true };
    }
  }

  // Flat, so it survives the engine's depth cap on probes.
  const where = shown && shown.state === 'visible' ? shown.rect : null;
  const record = {
    text: linkName(skipLink),
    href: String(attr(skipLink, 'href') || '').trim(),
    focusOrder: focusOrderOf(skipLink),
    x: where ? where.x : null,
    y: where ? where.y : null,
    width: where ? where.width : null,
    height: where ? where.height : null
  };

  // ---- The other pages ----

  const probes =
    ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;
  const probe =
    probes && probes['crawl.skipLinks'] && typeof probes['crawl.skipLinks'] === 'object'
      ? probes['crawl.skipLinks']
      : null;
  const others = (probe && Array.isArray(probe.pages) ? probe.pages : []).filter(
    (p) =>
      p &&
      typeof p === 'object' &&
      p.url &&
      pageUrl(p.url) !== here &&
      p.skipLink &&
      typeof p.skipLink === 'object' &&
      (typeof p.skipLink.x === 'number' || typeof p.skipLink.focusOrder === 'number')
  );

  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const moved = [];
  const reordered = [];
  let measured = 0;
  let comparable = 0;
  for (const p of others) {
    const r = p.skipLink;
    const hasRect = num(r.x) != null && num(r.y) != null;
    if (hasRect) measured += 1;
    if (where && hasRect && num(p.viewportWidth) != null && p.viewportWidth === viewportWidth) {
      comparable += 1;
      const dx = Math.abs(r.x - where.x);
      const dy = Math.abs(r.y - where.y);
      if (dx > MAX_SHIFT || dy > MAX_SHIFT) moved.push({ url: String(p.url), x: r.x, y: r.y });
    }
    const o = num(p.skipLink.focusOrder);
    if (o != null && record.focusOrder != null && o !== record.focusOrder) {
      reordered.push({ url: String(p.url), focusOrder: o });
    }
  }

  // ---- Findings ----

  const MESSAGES = {
    SKIP_LINK_NOT_VISIBLE: {
      summary: () =>
        'This skip link is not visible, and it stays hidden when it takes focus (no size, outside the page, clipped, transparent or visibility: hidden).',
      hint: 'Show the skip link at all times, or at least when it takes keyboard focus, for instance by moving it back into view in a :focus rule (RGAA 12.7.2).',
      key: 'fail_notVisible'
    },
    SKIP_LINK_POSITION_DIFFERS: {
      summary: (p) =>
        `This skip link is not at the same place on other pages of the site, measured at the same window width: ${p.pages}.`,
      hint: 'Place the skip link at the same position on every page, usually first in the page header (RGAA 12.7.2).',
      key: 'fail_positionDiffers'
    },
    SKIP_LINK_VISIBILITY_UNKNOWN: {
      summary: () =>
        'Whether this skip link is visible could not be settled: something may cover it, it is animated when it takes focus, or the page was not rendered.',
      hint: 'Tab to the skip link and check that it is visible when it has focus (RGAA 12.7.2).',
      key: 'cantTell_visibility',
      needed: 'Whether the skip link is visible, at least when it takes focus.'
    },
    SKIP_LINK_ORDER_DIFFERS: {
      summary: (p) =>
        `This skip link comes at another place in the focus order on other pages of the site: ${p.pages}.`,
      hint: 'Check that the skip link comes in the same order relative to the rest of the page on every page (RGAA 12.7.2).',
      key: 'cantTell_orderDiffers',
      needed: 'Whether the skip link comes in the same relative order in the source of every page.'
    },
    SKIP_LINK_VIEWPORT_DIFFERS: {
      summary: () =>
        'The other pages of the site were measured at another window width, so the place of this skip link could not be compared.',
      hint: 'Measure every page at the same window width, or check on the site that the skip link is at the same place on every page (RGAA 12.7.2).',
      key: 'cantTell_viewportDiffers',
      needed: 'Whether the skip link is at the same place on every page.'
    },
    SKIP_LINK_SINGLE_PAGE: {
      summary: () =>
        'Only this page was available, so whether the skip link is at the same place and in the same order on the other pages of the site could not be checked.',
      hint: 'Scan several pages of the site and pass their skip link records as the crawl.skipLinks probe, or check on the site that the skip link is at the same place and in the same order on every page (RGAA 12.7.2).',
      key: 'cantTell_singlePage',
      needed: 'Whether the skip link is at the same place and in the same order on every page.'
    }
  };

  const fails = [];
  const questions = [];
  function report(reasonCode, extra) {
    const msg = MESSAGES[reasonCode];
    const pages = (extra.pages || []).map((p) => p.url).join(', ');
    const params = { pages };
    const occ = helpers.reportOccurrence(skipLink, {
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: `skipLinkPlacement_summary_${msg.key}`,
        hintKey: `skipLinkPlacement_hint_${msg.key}`,
        params
      },
      ...(msg.needed
        ? {
            uncertainty: {
              code:
                reasonCode === 'SKIP_LINK_VISIBILITY_UNKNOWN' ? 'not-computable' : 'out-of-scope',
              needed: msg.needed,
              evidence: { reasonCode, ...extra }
            }
          }
        : {}),
      data: { details: { reasonCode, ...extra } }
    });
    (msg.needed ? questions : fails).push(occ);
  }

  if (!shown || shown.state === 'unknown') {
    report('SKIP_LINK_VISIBILITY_UNKNOWN', {
      cause: !shown ? 'noLayout' : shown.animated ? 'animation' : 'covered'
    });
  } else if (shown.state === 'hidden') {
    report('SKIP_LINK_NOT_VISIBLE', { rect: shown.rect });
  }

  if (moved.length) report('SKIP_LINK_POSITION_DIFFERS', { x: where.x, y: where.y, pages: moved });
  if (reordered.length) {
    report('SKIP_LINK_ORDER_DIFFERS', { focusOrder: record.focusOrder, pages: reordered });
  }
  if (!others.length) report('SKIP_LINK_SINGLE_PAGE', {});
  else if (where && measured && !comparable) {
    report('SKIP_LINK_VIEWPORT_DIFFERS', { viewportWidth });
  }

  const data = { page: { url: here, viewportWidth, skipLink: record } };
  if (!fails.length && !questions.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], data };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate'),
    data
  };
}

module.exports = { id, meta, runInPage, applicability };
