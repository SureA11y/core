/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check text-spacing-content-loss
 * @atomic true
 * @summary Text must stay readable when the user increases text spacing
 * @standard WCAG 2.2
 * @sc 1.4.12
 * @applicability
 *   Applies to a page with visible text. The loss of content needs a layout
 *   (a browser): without one, only the style sheets are read.
 * @expectation
 *   WCAG 1.4.12 and RGAA 10.12.1: with line height at 1.5 times the font
 *   size, spacing after paragraphs at 2 times, letter spacing at 0.12 times
 *   and word spacing at 0.16 times, no content or functionality is lost.
 *   - In a browser, the spacing is applied as a style sheet that wins over
 *     the page's own (inline `!important` aside, which avoid-inline-spacing
 *     reports), and each line of text is measured before and after against
 *     the ancestors that clip it (`overflow: hidden` or `clip`). A line that
 *     was inside and ends at least half outside (half its height, or half
 *     an em across) fails: the container cuts that text off
 *     (TEXT_CLIPPED). A line pushed out by less is asked about
 *     (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other
 *     text it did not overlap before (TEXT_OVERLAPS).
 *   - In any environment, a style sheet rule that sets line-height,
 *     letter-spacing or word-spacing below those values with `!important`
 *     is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style
 *     sheet to the page cannot override it, though a user style sheet can.
 *   Without a layout and with no such rule, the rule is notApplicable, with
 *   `data.reason: 'noLayout'`.
 * @implementation-notes
 * - The spacing sheet is one cascade layer declared before every other
 *   style: layered `!important` declarations beat unlayered ones and later
 *   layers, as a user style sheet would. It is removed afterwards, and the
 *   scroll position put back.
 * - Text that was already outside its clipping box before (a carousel
 *   slide, text hidden off screen) is not counted. A scrolling ancestor
 *   (`overflow: auto` or `scroll`) keeps its content reachable and does not
 *   clip.
 * - Lines are read with Range.getClientRects() on each text node, up to
 *   3,000 text nodes per page.
 * - The thresholds are the ones avoid-inline-spacing uses: line-height 1.5,
 *   letter-spacing 0.12, word-spacing 0.16, as multiples of the font size.
 */

const id = 'text-spacing-content-loss';

const meta = {
  title: 'Text stays readable when the user increases text spacing',
  description:
    'Applies the WCAG 1.4.12 text spacing in the browser and checks that no text is cut off or made to overlap, and asks about style sheet rules that force spacing with !important.',
  i18n: {
    titleKey: 'textSpacingContentLoss_title',
    descriptionKey: 'textSpacingContentLoss_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.12'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.12',
      title: 'Text Spacing',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.4.12': ['text-spacing-content-loss'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;
  const view = document.defaultView || null;

  const MIN_RATIO = { 'line-height': 1.5, 'letter-spacing': 0.12, 'word-spacing': 0.16 };
  const SPACING_PROPS = Object.keys(MIN_RATIO);
  const MAX_TEXT_NODES = 3000;
  const CSS_STYLE_RULE = 1;
  const LAYER = 'surea11y-text-spacing';

  function styleOf(el, pseudo) {
    try {
      return view.getComputedStyle(el, pseudo || null);
    } catch {
      return null;
    }
  }
  function px(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  // A spacing value as a multiple of the font size, or null when it cannot
  // be read. A computed value is in px; a declared one, which is all a DOM
  // emulator returns, may be in em, rem or %, or unitless for line-height.
  function ratioOf(prop, value, fontSize) {
    const v = String(value == null ? '' : value)
      .trim()
      .toLowerCase();
    if (v === 'normal') return prop === 'line-height' ? 1.2 : 0;
    const m = /^(-?\d*\.?\d+)(px|em|rem|%)?$/.exec(v);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2] || '';
    if (unit === 'px') return n / fontSize;
    if (unit === 'em') return n;
    if (unit === 'rem') {
      const root = px(
        styleOf(document.documentElement) && styleOf(document.documentElement).fontSize
      );
      return (n * (root || 16)) / fontSize;
    }
    if (unit === '%') return prop === 'line-height' ? n / 100 : null;
    return prop === 'line-height' ? n : null;
  }
  function textOf(el) {
    return String(el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
  }

  // ---- Style sheet rules that force spacing with !important ----

  const importantFindings = [];
  (function readSheets() {
    const seen = new Set();
    function check(cssRule) {
      const style = cssRule.style;
      for (const prop of SPACING_PROPS) {
        let value;
        let priority;
        try {
          value = String(style.getPropertyValue(prop) || '').trim();
          priority = String(style.getPropertyPriority(prop) || '');
        } catch {
          continue;
        }
        if (!value || priority !== 'important') continue;
        if (/^(inherit|initial|unset|revert|revert-layer)$/i.test(value)) continue;
        let targets;
        try {
          targets = helpers.queryAllSmart
            ? helpers.queryAllSmart(cssRule.selectorText)
            : helpers.queryAll(cssRule.selectorText);
        } catch {
          targets = [];
        }
        for (const el of targets) {
          if (!el || seen.has(el) || !textOf(el)) continue;
          const cs = styleOf(el);
          const fontSize = px(cs && cs.fontSize) || 16;
          const ratio = ratioOf(prop, cs && cs.getPropertyValue(prop), fontSize);
          // A value that already meets the metric leaves nothing to override.
          if (ratio == null ? false : ratio >= MIN_RATIO[prop]) continue;
          seen.add(el);
          importantFindings.push({ el, prop, value, selector: String(cssRule.selectorText) });
          break;
        }
      }
    }
    function walk(rules, depth) {
      if (!rules || depth > 8) return;
      for (const r of rules) {
        if (!r) continue;
        if (r.type === CSS_STYLE_RULE && r.selectorText && r.style) check(r);
        let nested = null;
        try {
          nested = r.cssRules || null;
        } catch {}
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of document.styleSheets || []) {
        let rules = null;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        walk(rules, 0);
      }
    } catch {}
  })();

  // ---- Lines of text, before and after the spacing ----

  function hasLayout() {
    const probe = document.documentElement || null;
    if (!view || !probe || typeof probe.getClientRects !== 'function') return false;
    if (typeof document.createRange !== 'function') return false;
    try {
      const rects = probe.getClientRects();
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const clipped = [];
  const partly = [];
  const overlaps = [];
  let textCount = 0;

  if (hasLayout() && document.body) {
    const SKIP = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'select']);
    const nodes = [];
    const walker = document.createTreeWalker(document.body, 4);
    for (let n = walker.nextNode(); n && nodes.length < MAX_TEXT_NODES; n = walker.nextNode()) {
      if (!/\S/.test(n.nodeValue || '')) continue;
      const parent = n.parentElement;
      if (!parent || SKIP.has(String(parent.localName))) continue;
      nodes.push(n);
    }

    const clipCache = new Map();
    // Ancestors that clip on an axis: [{ el, x, y }]. Past an ancestor that
    // scrolls on an axis, outer ancestors no longer clip the text on that
    // axis: what goes past them can be scrolled to.
    function clippersOf(el) {
      if (clipCache.has(el)) return clipCache.get(el);
      const out = [];
      let scrollX = false;
      let scrollY = false;
      for (
        let a = el;
        a && a.nodeType === 1 && a !== document.documentElement;
        a = a.parentElement
      ) {
        const cs = styleOf(a);
        if (!cs) continue;
        const x = !scrollX && (cs.overflowX === 'hidden' || cs.overflowX === 'clip');
        const y = !scrollY && (cs.overflowY === 'hidden' || cs.overflowY === 'clip');
        if (x || y) out.push({ el: a, x, y });
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') scrollX = true;
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') scrollY = true;
        if (scrollX && scrollY) break;
      }
      clipCache.set(el, out);
      return out;
    }

    function shown(el) {
      try {
        return typeof el.checkVisibility === 'function'
          ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
          : true;
      } catch {
        return true;
      }
    }

    const sx = () => view.scrollX || 0;
    const sy = () => view.scrollY || 0;
    function linesOf(node) {
      const range = document.createRange();
      try {
        range.selectNodeContents(node);
        const out = [];
        const ox = sx();
        const oy = sy();
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.height < 1) continue;
          out.push({
            left: r.left + ox,
            top: r.top + oy,
            right: r.right + ox,
            bottom: r.bottom + oy
          });
        }
        return out;
      } catch {
        return [];
      } finally {
        try {
          range.detach();
        } catch {}
      }
    }
    function boxOf(el) {
      const r = el.getBoundingClientRect();
      const cs = styleOf(el);
      const bl = px(cs && cs.borderLeftWidth) || 0;
      const bt = px(cs && cs.borderTopWidth) || 0;
      const ox = sx();
      const oy = sy();
      return {
        left: r.left + ox + bl,
        top: r.top + oy + bt,
        right: r.left + ox + bl + el.clientWidth,
        bottom: r.top + oy + bt + el.clientHeight
      };
    }

    function measure() {
      const lines = new Map();
      const boxes = new Map();
      for (const n of nodes) {
        lines.set(n, linesOf(n));
        for (const c of clippersOf(n.parentElement)) {
          if (!boxes.has(c.el)) boxes.set(c.el, boxOf(c.el));
        }
      }
      return { lines, boxes };
    }

    const scroll = [sx(), sy()];
    const before = measure();
    const fontSizes = new Map();
    for (const n of nodes) {
      const cs = styleOf(n.parentElement);
      fontSizes.set(n, px(cs && cs.fontSize) || 16);
    }

    // Text a person could see before the spacing: rendered, and wholly
    // inside every ancestor that clips it. Visually hidden text (a 1px box
    // with overflow hidden), text scrolled out of a carousel or hidden by
    // opacity or visibility is left out.
    const visibleBefore = new Set();
    for (const n of nodes) {
      const lines = before.lines.get(n) || [];
      if (!lines.length || !shown(n.parentElement)) continue;
      const inside = clippersOf(n.parentElement).every((c) => {
        const b0 = before.boxes.get(c.el);
        return (
          !!b0 &&
          lines.every((l) => {
            const o = outside(l, b0, c);
            return o.dx <= 1 && o.dy <= 1;
          })
        );
      });
      if (inside) visibleBefore.add(n);
    }

    const sheet = document.createElement('style');
    sheet.setAttribute('data-surea11y', LAYER);
    sheet.textContent =
      `@layer ${LAYER} {` +
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
      'p { margin-bottom: 2em !important; }' +
      '}';
    let after;
    try {
      const head = document.head || document.documentElement;
      head.insertBefore(sheet, head.firstChild);
      after = measure();
    } finally {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      try {
        view.scrollTo(scroll[0], scroll[1]);
      } catch {}
    }

    // How far a line sits outside a box, along the axes the box clips.
    function outside(line, box, c) {
      const dy = c.y ? Math.max(0, box.top - line.top, line.bottom - box.bottom) : 0;
      const dx = c.x ? Math.max(0, box.left - line.left, line.right - box.right) : 0;
      return { dx, dy };
    }

    const reportedClip = new Set();
    for (const n of nodes) {
      const linesAfter = (after && after.lines.get(n)) || [];
      if (!linesAfter.length || !visibleBefore.has(n)) continue;
      textCount += 1;
      const fontSize = fontSizes.get(n);
      for (const c of clippersOf(n.parentElement)) {
        if (reportedClip.has(c.el)) continue;
        const b1 = after.boxes.get(c.el);
        if (!b1) continue;
        let worst = null;
        for (const l of linesAfter) {
          const o = outside(l, b1, c);
          const height = l.bottom - l.top;
          const lost = o.dy >= height / 2 || o.dx >= fontSize / 2;
          const some = o.dy > 2 || o.dx > 2;
          if (lost) {
            worst = 'lost';
            break;
          }
          if (some) worst = 'some';
        }
        if (worst) {
          reportedClip.add(c.el);
          (worst === 'lost' ? clipped : partly).push({ el: c.el, text: textOf(n.parentElement) });
          break;
        }
      }
    }

    // Text that comes to overlap text from another element.
    if (after) {
      const BAND = 40;
      const buckets = new Map();
      const entries = [];
      for (const n of nodes) {
        if (!visibleBefore.has(n)) continue;
        for (const whole of after.lines.get(n) || []) {
          // Only the part of the line its clipping ancestors still show is
          // painted; what they cut off is the clipping check's.
          const l = { ...whole };
          for (const c of clippersOf(n.parentElement)) {
            const b = after.boxes.get(c.el);
            if (!b) continue;
            if (c.x) {
              l.left = Math.max(l.left, b.left);
              l.right = Math.min(l.right, b.right);
            }
            if (c.y) {
              l.top = Math.max(l.top, b.top);
              l.bottom = Math.min(l.bottom, b.bottom);
            }
          }
          if (l.right - l.left < 1 || l.bottom - l.top < 1) continue;
          const entry = { n, l };
          entries.push(entry);
          for (let b = Math.floor(l.top / BAND); b <= Math.floor(l.bottom / BAND); b++) {
            if (!buckets.has(b)) buckets.set(b, []);
            buckets.get(b).push(entry);
          }
        }
      }
      const intersects = (a, b) => {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w <= 0 || h <= 0) return false;
        const smaller = Math.min(
          (a.right - a.left) * (a.bottom - a.top),
          (b.right - b.left) * (b.bottom - b.top)
        );
        return w * h > smaller * 0.25;
      };
      const overlappedBefore = (n1, n2) =>
        (before.lines.get(n1) || []).some((a) =>
          (before.lines.get(n2) || []).some((b) => intersects(a, b))
        );
      const reported = new Set();
      for (const list of buckets.values()) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            const pa = a.n.parentElement;
            const pb = b.n.parentElement;
            if (pa === pb || pa.contains(pb) || pb.contains(pa)) continue;
            if (reported.has(pa) || reported.has(pb)) continue;
            if (!intersects(a.l, b.l) || overlappedBefore(a.n, b.n)) continue;
            reported.add(pa);
            overlaps.push({ el: pa, text: textOf(pa), other: textOf(pb) });
          }
        }
      }
    }
  }

  // ---- Findings ----

  const MESSAGES = {
    TEXT_CLIPPED: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied, this element cuts off the text "${p.text}".`,
      hint: 'Let the container grow with its text: avoid fixed heights and widths with overflow: hidden on text, or let it scroll (WCAG 1.4.12, RGAA 10.12.1).',
      key: 'fail_clipped'
    },
    TEXT_CLIPPED_PARTLY: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied, the text "${p.text}" reaches past the edge of this element, which hides what goes past it.`,
      hint: 'Check with the text spacing applied that this text can still be read in full (WCAG 1.4.12, RGAA 10.12.1).',
      key: 'cantTell_clippedPartly',
      needed: 'Whether the text that reaches past the edge of the element can still be read.'
    },
    TEXT_OVERLAPS: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied, the text "${p.text}" comes to overlap the text "${p.other}".`,
      hint: 'Check with the text spacing applied that both texts can still be read (WCAG 1.4.12, RGAA 10.12.1).',
      key: 'cantTell_overlaps',
      needed: 'Whether the overlapping texts can still be read.'
    },
    STYLESHEET_IMPORTANT: {
      summary: (p) =>
        `A style sheet rule (${p.selector}) sets ${p.property}: ${p.value} with !important on this text, below the spacing WCAG 1.4.12 lets users apply.`,
      hint: 'Remove !important from the spacing declaration so users can increase it, or check that a user style sheet still overrides it (WCAG 1.4.12, RGAA 10.12.1).',
      key: 'cantTell_stylesheetImportant',
      needed: 'Whether users can still apply their own text spacing to this text.'
    }
  };

  const fails = [];
  const questions = [];
  function report(reasonCode, el, params, uncertaintyCode) {
    const msg = MESSAGES[reasonCode];
    const occ = helpers.reportOccurrence(el, {
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: `textSpacingContentLoss_summary_${msg.key}`,
        hintKey: `textSpacingContentLoss_hint_${msg.key}`,
        params
      },
      ...(msg.needed
        ? { uncertainty: { code: uncertaintyCode, needed: msg.needed, evidence: { reasonCode } } }
        : {}),
      data: { details: { reasonCode, ...params } }
    });
    (msg.needed ? questions : fails).push(occ);
  }

  for (const f of clipped) report('TEXT_CLIPPED', f.el, { text: f.text });
  for (const f of partly) {
    report('TEXT_CLIPPED_PARTLY', f.el, { text: f.text }, 'judgement-required');
  }
  for (const f of overlaps) {
    report('TEXT_OVERLAPS', f.el, { text: f.text, other: f.other }, 'judgement-required');
  }
  for (const f of importantFindings) {
    report(
      'STYLESHEET_IMPORTANT',
      f.el,
      { selector: f.selector, property: f.prop, value: f.value },
      'runtime-dependent'
    );
  }

  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious')
    };
  }
  if (textCount)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    ...(hasLayout() ? {} : { data: { reason: 'noLayout' } })
  };
}

module.exports = { id, meta, runInPage };
