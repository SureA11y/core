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
 *   WCAG 1.4.12: with line height at 1.5 times the font
 *   size, spacing after paragraphs at 2 times, letter spacing at 0.12 times
 *   and word spacing at 0.16 times, no content or functionality is lost.
 *   - In a browser, the spacing is applied as a style sheet that wins over
 *     the page's own (inline `!important` aside, which avoid-inline-spacing
 *     reports), and each line of text is measured before and after against
 *     the boxes that clip it: those on its containing block chain with
 *     `overflow: hidden` or `clip`, or `contain: paint`, and the viewport
 *     on an axis the page keeps from scrolling, or for text in a fixed box,
 *     which doesn't scroll with the page. A
 *     line that was inside and ends at least half outside (half its
 *     height, or half an em across) fails: the container cuts that text off
 *     (TEXT_CLIPPED). A line pushed out by less is asked about
 *     (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other
 *     text it did not overlap before (TEXT_OVERLAPS). Text moved by an
 *     animation that repeats for ever (a ticker) is asked about however far
 *     it goes (TEXT_CLIPPED_MOVING): it passes through the edge anyway, and
 *     one frame can't tell whether any of it is lost. Where the page is
 *     scroll-locked, both of the viewport's axes hidden while content already
 *     lay beyond it, as behind a cookie banner, text the spacing moves out of
 *     the viewport is asked about (VIEWPORT_SCROLL_LOCKED): the lock is
 *     usually a passing state, and the engine can't see past it. Text inside a
 *     <marquee> is left out: browsers move it outside the Web Animations
 *     API, so the engine can't hold it still, and its finding would depend
 *     on when the scan ran; deprecated-elements-not-used asks about the
 *     marquee (2.2.2). Text its box already
 *     cut off before the spacing (a fixed-height excerpt) is asked about
 *     when the spacing cuts off lines it showed in full (TEXT_CLIPPED_FURTHER):
 *     the excerpt was cut on purpose, but shows less. A box that grows with
 *     its lines, as line-clamp does, shows as many and is left alone.
 *   - In any environment, a style sheet rule that sets line-height,
 *     letter-spacing or word-spacing below those values with `!important`
 *     is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style
 *     sheet to the page cannot override it, though a user style sheet can.
 *     A value relative to the font size is read as declared, and a computed
 *     one meets the value within the rounding browsers report lengths with,
 *     so a rule setting exactly the minimum is not asked about.
 *   - The spacing is applied with a <style> element, or, where the page's
 *     Content Security Policy blocks one, as a style sheet the document
 *     adopts. Where neither applies, the page is asked about
 *     (SPACING_NOT_APPLIED) instead of measured, never passed.
 *   Without a layout and with no such rule, the rule is notApplicable, with
 *   `data.reason: 'noLayout'`.
 *   - Only text inside the scan's scope (contextSelector) and not excluded
 *     (excludeSelectors) is judged. Text elsewhere on the page is still
 *     measured, since text in scope can come to overlap it. While a modal
 *     dialog is open, the page behind it is left out altogether: the
 *     browser makes it inert, and the scan judges the dialog.
 *   - Margin (`overflow-px`): of the text a clipping box keeps in full, the
 *     line that came closest to being cut off. `value` is how far it reaches
 *     past the box's edge, negative while it is still inside, against 2px,
 *     past which a line is partly cut off (the first finding);
 *     `context.axis` and `context.text` say
 *     which edge and which text. It is measured where text grows with more
 *     spacing, the inline end (the right, or the left in right-to-left
 *     text) and the bottom; a start edge counts only once a line is past it.
 *     An axis on which the box grew with the spacing (a block of auto
 *     height) follows its content and is left out, and vertical text gets
 *     no margin. Text a repeating animation moves (a ticker) is left out,
 *     since where it stands depends on the point the animation was held
 *     at, and so is a box that cuts off other text: it is a finding.
 *     Only a line within 8px of the limit (from 6px inside the edge) counts
 *     as close, so text deeper inside its box gives no margin.
 *     `measuredCount` counts the pairs of text and clipping box compared;
 *     like the findings, the margin covers the first 3,000 text nodes.
 * @reports
 *   - `text`: the start of the text, up to 60 characters. Not on a style
 *     sheet rule's finding.
 *   - `lines.shownBefore`, `lines.shownAfter` (TEXT_CLIPPED_FURTHER): how
 *     many lines of the text its box showed in full without and with the
 *     spacing.
 *   - `metrics.overflowPx` (cut-off text): how far, in CSS pixels, the line
 *     went past the edge of the box that clips it, with the spacing applied.
 *   - `metrics.thresholdPx` (cut-off text): how far it may go before it
 *     fails: half an em across, or half the line's height down.
 *   - `metrics.axis` (cut-off text): `x` when the line went past a side, `y`
 *     past the top or bottom.
 *   - `container.widthPx`, `container.heightPx` (cut-off text): the size of
 *     the clipping box with the spacing applied.
 *   - `viewport.width`, `viewport.height` (cut-off or overlapping text): the
 *     viewport the page was laid out in, in CSS pixels. Text that fits at
 *     one width can be cut off at another.
 *   - `other` (overlapping text): the text it comes to overlap.
 *   - `selector`, `property`, `value` (a style sheet rule): the rule's
 *     selector and the declaration that forces the spacing.
 * @reason-codes
 *   - `TEXT_CLIPPED` (fail): with the WCAG text spacing applied, a line of
 *     text ends at least half outside the box that clips it, so it is cut
 *     off.
 *     Basis: WCAG 1.4.12; F104.
 *   - `TEXT_CLIPPED_PARTLY` (cantTell): with the spacing applied, a line of
 *     text reaches past the edge of the box that clips it by less than half;
 *     whether it can still be read is for a person to judge.
 *     Basis: WCAG 1.4.12 (not settled); F104 (not settled).
 *   - `TEXT_CLIPPED_MOVING` (cantTell): text moved by an animation that
 *     repeats for ever reaches past the edge of its clipping box with the
 *     spacing applied; whether any of it is lost is for a person to judge.
 *     Basis: WCAG 1.4.12 (not settled).
 *   - `TEXT_CLIPPED_SCRIPT_SIZED` (cantTell): text cut off as TEXT_CLIPPED
 *     is, by a box the page's script sized to fit that text before the
 *     spacing (an inline width or height on the box, or on the box its
 *     percentage size is taken from, equal to the text's own size). The
 *     script may size it again once the text grows, after the moment the
 *     scan measures in.
 *     It leans pass for the floating label of an Angular Material outlined
 *     form field, whose script fits the outline to the label again.
 *     Basis: WCAG 1.4.12 (not settled).
 *   - `TEXT_CLIPPED_FURTHER` (cantTell): text its box already cut off shows
 *     fewer lines in full once the spacing is applied; whether the excerpt
 *     still serves its purpose is for a person to judge.
 *     It leans fail when the excerpt shows no line in full with the spacing.
 *     Basis: WCAG 1.4.12 (not settled).
 *   - `TEXT_OVERLAPS` (cantTell): with the spacing applied, text comes to
 *     overlap other text it did not overlap before.
 *     It leans fail when the overlap covers more than half the smaller
 *     line's height and more than an em across.
 *     Basis: WCAG 1.4.12 (not settled); F104 (not settled).
 *   - `VIEWPORT_SCROLL_LOCKED` (cantTell): the page is scroll-locked, and
 *     the spacing moves text out of the viewport, where it can't be
 *     scrolled to while the lock lasts.
 *     It leans pass when an overlay is open: a dialog, or a fixed box at the
 *     bottom of the viewport or covering half of it.
 *     Basis: WCAG 1.4.12 (not settled).
 *   - `SPACING_NOT_APPLIED` (cantTell): the page's Content Security Policy
 *     kept the spacing from being applied, so the text could not be
 *     measured with it.
 *     Basis: WCAG 1.4.12 (not settled).
 *   - `STYLESHEET_IMPORTANT` (cantTell): a style sheet rule sets
 *     line-height, letter-spacing or word-spacing below the WCAG values with
 *     !important, which a tool's own style sheet cannot override.
 *     It leans fail when the value is resolved and the text can wrap.
 *     Basis: WCAG 1.4.12 (not settled); CSS Cascade important declarations.
 * @implementation-notes
 * - The spacing sheet is one cascade layer declared before every other
 *   style: layered `!important` declarations beat unlayered ones and later
 *   layers, as a user style sheet would. It is removed afterwards, and the
 *   scroll position put back.
 * - Text that was already outside its clipping box before (a carousel
 *   slide, text hidden off screen) is not counted, nor is text inside a
 *   <marquee>: browsers move it outside the Web Animations API, so the
 *   engine can't hold it still, and where it stands depends on when the
 *   scan ran. deprecated-elements-not-used reports the marquee (2.2.2).
 *   A scrolling ancestor (`overflow: auto` or `scroll`) keeps its content
 *   reachable and does not clip.
 * - The viewport takes the overflow of <html>, or of <body> while <html> is
 *   `overflow: visible` (CSS Overflow 3 §3.3), and <body>'s own box then
 *   clips nothing. On an axis where that overflow is `hidden` or `clip`
 *   the viewport is the clipping box, at the scroll position the page was
 *   found at, and the finding goes on the element that set it. With
 *   `overflow` set on <html>, or any containment on either element (which
 *   stops the propagation in Chromium), <body> clips its own box. Text in a
 *   box fixed to the viewport is judged against the viewport on the axes the
 *   box doesn't scroll; a sticky box scrolls with its container and is not.
 *   Content already beyond the viewport counts as a scroll lock whether the
 *   document's scroll size shows it or a box out of flow holds it: a
 *   `body { position: fixed }` lock, or a fixed box that already reached past
 *   the viewport.
 *   Only text wholly inside the viewport before the spacing is judged
 *   against it.
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
  coverage: { facetsBySc: { '1.4.12': ['text-spacing-content-loss'] } },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'TEXT_CLIPPED',
    'TEXT_CLIPPED_MOVING',
    'TEXT_CLIPPED_PARTLY',
    'TEXT_CLIPPED_FURTHER',
    'TEXT_OVERLAPS',
    'VIEWPORT_SCROLL_LOCKED',
    'TEXT_CLIPPED_SCRIPT_SIZED',
    'SPACING_NOT_APPLIED'
  ],
  margin: { measure: 'overflow-px', unit: 'px', limit: 'max', band: { absolute: 8 } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    SPACING_NOT_APPLIED: {
      steps: [
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important. Rules added in the Styles pane are not blocked by the page's security policy.",
        'Scroll through the whole page and look for text that is cut off, overlaps other text or disappears.',
        'Where text is cut off, check whether the page offers a way to show all of it, such as a "Read more" link or a button that expands the box. It only counts if you can use it with the keyboard and, with the spacing still applied, it shows the whole text.',
        'Check that controls and menus still work and show all their text.'
      ],
      passWhen:
        'All text stays visible and readable, or any text that is cut off can be shown in full with the keyboard, and nothing stops working with the spacing applied.',
      failWhen:
        'Some text is cut off, overlaps or is lost with the spacing applied and cannot be shown in full another way, which fails WCAG 1.4.12.'
    },
    STYLESHEET_IMPORTANT: {
      steps: [
        'Note the rule, property and value the report gives, and find an element it styles in the Elements panel.',
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        "Check in the Computed tab whether the element's line-height, letter-spacing and word-spacing now have those values.",
        "If they don't, give the element the same values in its own style (the element.style section at the top of the Styles pane), as a user style sheet would, and check whether its text stays readable."
      ],
      passWhen:
        "A user's spacing still takes effect on the element, or the content reads fine without it.",
      failWhen:
        "The page's !important rule keeps the user's spacing from applying, which fails WCAG 1.4.12."
    },
    TEXT_CLIPPED_FURTHER: {
      steps: [
        'Find the text excerpt the report names and note how many lines it shows in full.',
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        "Count the lines it shows now, and check whether a 'read more' link or other way still reaches the full text."
      ],
      passWhen: 'The excerpt still does its job, and the full text can be reached another way.',
      failWhen:
        'The spacing cuts off content that cannot be reached any other way, which fails WCAG 1.4.12.'
    },
    TEXT_CLIPPED_MOVING: {
      steps: [
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        'Find the moving text the report names and watch it through at least one full cycle of its animation.',
        'Pause it if there is a control, and check that all of its text can be read at some point.'
      ],
      passWhen: 'Every part of the moving text can still be read during its cycle.',
      failWhen:
        'Some of the text never appears in full with the spacing applied, which fails WCAG 1.4.12.'
    },
    TEXT_CLIPPED_SCRIPT_SIZED: {
      steps: [
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        "Find the text the report names and wait a moment: the page's own script may resize the box around it to fit the longer text.",
        'If it still looks cut off, make the browser window a little narrower or wider, or click somewhere empty on the page, which makes many pages size their boxes again.',
        'Read the text and check that all of it is shown.'
      ],
      passWhen:
        'Once the page has reacted, the box fits the text and all of it can be read with the spacing applied.',
      failWhen:
        'The text stays cut off with the spacing applied, even after the page has had time to react, which fails WCAG 1.4.12.'
    },
    TEXT_CLIPPED_PARTLY: {
      steps: [
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        'Find the text the report names and look at the edge of the box that cuts it off.',
        'Read the text and check whether every letter can still be made out, including the tops and tails of letters.',
        'Where text is cut off, check whether the page offers a way to show all of it, such as a "Read more" link or a button that expands the box. It only counts if you can use it with the keyboard and, with the spacing still applied, it shows the whole text.'
      ],
      passWhen:
        'Only a sliver at the edge is cut and all the text can still be read, or the whole text can be shown with the keyboard another way, with the spacing still applied.',
      failWhen:
        'Part of the text is cut off so it can no longer be read, and it cannot be shown in full another way, which fails WCAG 1.4.12 (F104).'
    },
    TEXT_OVERLAPS: {
      steps: [
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        'Find the text the report names and the text it now overlaps.',
        'Read both and check whether either one becomes hard to read where they overlap.'
      ],
      passWhen: 'The overlap is only a sliver at the edges and both texts stay readable.',
      failWhen:
        'Text is drawn over other text so that either becomes unreadable, which fails WCAG 1.4.12 (F104).'
    },
    VIEWPORT_SCROLL_LOCKED: {
      steps: [
        'Close any banner, dialog or overlay that is open on the page, so the page can scroll.',
        "In the developer tools' Styles pane, add a new style rule for * setting line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important, and a rule for p setting margin-bottom: 2em !important.",
        'Scroll to the text the report names and check that it can be reached and read.'
      ],
      passWhen:
        'Once the overlay is closed, the page scrolls and all of the text can be reached and read.',
      failWhen: 'The text stays out of reach with the spacing applied, which fails WCAG 1.4.12.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const view = dom.defaultView(document) || null;

  const MIN_RATIO = { 'line-height': 1.5, 'letter-spacing': 0.12, 'word-spacing': 0.16 };
  const SPACING_PROPS = Object.keys(MIN_RATIO);
  const MAX_TEXT_NODES = 3000;
  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
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
        styleOf(dom.documentElement(document)) && styleOf(dom.documentElement(document)).fontSize
      );
      return (n * (root || 16)) / fontSize;
    }
    if (unit === '%') return prop === 'line-height' ? n / 100 : null;
    return prop === 'line-height' ? n : null;
  }
  // A value relative to the font size is the ratio itself: em for any of
  // the three, unitless or a percentage for line-height. Read as declared it
  // is exact, where a computed one comes in px, rounded (#108).
  function declaredRatio(prop, value) {
    const m = /^(\d*\.?\d+)(em|%)?$/.exec(
      String(value || '')
        .trim()
        .toLowerCase()
    );
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (m[2] === 'em') return n;
    if (prop !== 'line-height') return null;
    return m[2] === '%' ? n / 100 : n;
  }
  // Browsers report computed lengths to six significant digits (11pt is
  // 14.6667px), so a ratio of two of them can fall short of the minimum by
  // a few millionths where the declared values meet it exactly.
  const meetsMinimum = (prop, ratio) => ratio >= MIN_RATIO[prop] * (1 - 1e-5);
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  // The text el shows, collapsed and cut to 60 characters: not the text of
  // a <style>, <script> or <noscript> inside it, which isn't shown.
  const UNSHOWN = new Set(['style', 'script', 'noscript']);
  function textOf(el) {
    let text = '';
    try {
      const walker = dom.createTreeWalker(document, el, 4);
      for (let n = walker.nextNode(); n && text.length < 200; n = walker.nextNode()) {
        const parent = dom.parentElement(n);
        if (parent && UNSHOWN.has(String(dom.localName(parent) || '').toLowerCase())) continue;
        text += dom.nodeValue(n) || '';
      }
    } catch {
      text = String(dom.textContent(el) || '');
    }
    return text.replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  // ---- Style sheet rules that force spacing with !important ----

  const importantFindings = [];
  (function readSheets() {
    const seen = new Set();
    // `style` is a rule's declarations, `selector` its selector resolved
    // against the rules it is nested in, `scopes` the @scope blocks around
    // it, whose subtrees alone it reaches, and `shown` the selector as the
    // author wrote it, for the message.
    function check(style, selector, scopes, shown) {
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
        // Inert text is still drawn, so it is judged (isHiddenContent).
        let targets;
        try {
          targets = helpers.queryAllSmart
            ? helpers.queryAllSmart(selector, { inert: true })
            : helpers.queryAll(selector);
        } catch {
          targets = [];
        }
        for (const el of targets) {
          if (!el || seen.has(el) || !textOf(el) || !inRoot(el) || !inScopes(el, scopes)) continue;
          const cs = styleOf(el);
          const fontSize = px(cs && cs.fontSize) || 16;
          const declared = declaredRatio(prop, value);
          const ratio =
            declared !== null ? declared : ratioOf(prop, cs && cs.getPropertyValue(prop), fontSize);
          // A value that already meets the metric leaves nothing to override.
          if (ratio == null ? false : meetsMinimum(prop, ratio)) continue;
          seen.add(el);
          importantFindings.push({
            el,
            prop,
            value,
            ratio,
            selector: String(shown)
          });
          break;
        }
      }
    }
    // A sheet or a group rule whose media or @supports condition doesn't
    // hold now (@media print on a screen scan) blocks no user's spacing.
    const applies = (x) =>
      typeof helpers.cssConditionApplies === 'function' ? helpers.cssConditionApplies(x) : true;
    // The selector list's own commas, not those inside :is() and the like.
    function splitSelectorList(text) {
      const parts = [];
      let depth = 0;
      let current = '';
      for (const ch of String(text || '')) {
        if (ch === '(') depth += 1;
        if (ch === ')') depth = Math.max(0, depth - 1);
        if (depth === 0 && ch === ',') {
          parts.push(current);
          current = '';
          continue;
        }
        current += ch;
      }
      parts.push(current);
      return parts.map((x) => x.trim()).filter(Boolean);
    }
    // A nested rule's selector, resolved against its parent's: `&` stands
    // for the parent, and a selector without one is a descendant of it
    // (CSS Nesting), so `.card { p {} }` reaches only the p in a .card.
    function nestedSelector(selector, parent) {
      if (!parent) return selector;
      return splitSelectorList(selector)
        .map((part) =>
          part.indexOf('&') !== -1
            ? part.split('&').join(':is(' + parent + ')')
            : ':is(' + parent + ') ' + part
        )
        .join(', ');
    }
    // The root (document or shadow root) of the sheet being read.
    let sheetRoot = document;
    function inRoot(el) {
      try {
        return dom.getRootNode(el) === sheetRoot;
      } catch {
        return false;
      }
    }
    // Whether el is inside every @scope around the rule: at or below an
    // element its start matches, and not at or below one its end matches
    // there. A scope with no start is rooted at its <style>'s parent.
    function inScopes(el, scopes) {
      for (const scope of scopes) {
        try {
          let root = null;
          if (scope.start) root = dom.closest(el, scope.start);
          else if (scope.owner && dom.contains(scope.owner, el)) root = scope.owner;
          if (!root) return false;
          const limit = scope.end ? dom.closest(el, scope.end) : null;
          if (limit && limit !== root && dom.contains(root, limit)) return false;
        } catch {
          // A scope that can't be read is taken to hold el.
        }
      }
      return true;
    }
    function scopeOf(r) {
      let owner = null;
      try {
        const node = r.parentStyleSheet && r.parentStyleSheet.ownerNode;
        owner = node ? dom.parentElement(node) : null;
      } catch {}
      return { start: r.start || '', end: r.end || '', owner };
    }
    function walk(rules, depth, parent, scopes, parentShown) {
      if (!rules || depth > 8) return;
      for (const r of rules) {
        if (!r || !applies(r)) continue;
        let selector = parent;
        let shown = parentShown;
        if (r.type === CSS_STYLE_RULE && r.selectorText && r.style) {
          selector = nestedSelector(String(r.selectorText), parent);
          shown = r.selectorText;
          check(r.style, selector, scopes, r.selectorText);
        } else if (parent && r.style && !r.selectorText) {
          // Declarations straight inside an at-rule within a style rule
          // (`h1 { @media screen { letter-spacing: 0 !important } }`) belong
          // to that rule's selector.
          check(r.style, parent, scopes, parentShown);
        }
        const isScope = !!(r.constructor && r.constructor.name === 'CSSScopeRule');
        let nested = null;
        try {
          // An @import's sheet holds rules of its own.
          nested = r.type === CSS_IMPORT_RULE ? r.styleSheet && r.styleSheet.cssRules : r.cssRules;
        } catch {}
        if (nested)
          walk(nested, depth + 1, selector, isScope ? scopes.concat(scopeOf(r)) : scopes, shown);
      }
    }
    try {
      // The document's sheets, adopted ones too, and each open shadow
      // root's, whose rules reach only the elements of that root: the scan
      // finds elements in shadow roots, which a document rule doesn't style.
      const sheets = helpers.getStyleSheets
        ? helpers.getStyleSheets()
        : Array.from(dom.styleSheets(document) || []).map((sheet) => ({ sheet, root: document }));
      for (const { sheet, root } of sheets) {
        if (!applies(sheet)) continue;
        sheetRoot = root;
        // Another origin's sheet: its text from engineOptions.styleSheetTexts,
        // if given (helpers.cssRulesOf); otherwise not inspectable.
        let rules = null;
        try {
          rules = helpers.cssRulesOf ? helpers.cssRulesOf(sheet) : sheet.cssRules;
        } catch {
          continue;
        }
        walk(rules, 0, '', [], '');
      }
    } catch {}
  })();

  // ---- Lines of text, before and after the spacing ----

  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!view || !probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    if (typeof dom.get(document, 'createRange') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const clipped = [];
  const partly = [];
  const moving = [];
  const locked = [];
  const scriptSized = [];
  const clippedFurther = [];
  const overlaps = [];
  let textCount = 0;
  // Every text line and clipping box compared, and those whose text stayed in
  // full: the margin's measuredCount and candidates (src/core/margin.js).
  let measuredPairs = 0;
  const marginCandidates = [];
  // Clipping boxes already reported as a finding.
  const reportedClip = new Set();
  // A page whose Content Security Policy kept the spacing from applying.
  let spacingNotApplied = false;

  if (hasLayout() && dom.body(document)) {
    const SKIP = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'select']);

    // The text this scan judges: inside the scope (contextSelector), not
    // excluded (excludeSelectors), and not behind an open modal dialog. Text
    // elsewhere on the page is still measured, since in-scope text can come
    // to overlap it, but never reported, and never the margin. The page
    // behind an open modal is left out altogether: the browser makes it
    // inert, and the scan judges the dialog.
    const roots = (Array.isArray(ctx.root) ? ctx.root : [ctx.root]).filter(Boolean);
    const wholeDocument =
      !roots.length || roots.some((r) => r === document || r === dom.documentElement(document));
    function inScope(el) {
      if (wholeDocument) return true;
      return roots.some((r) => {
        try {
          return r === el || (typeof dom.get(r, 'contains') === 'function' && dom.contains(r, el));
        } catch {
          return false;
        }
      });
    }
    function isExcluded(el) {
      try {
        return typeof helpers.isExcluded === 'function' && !!helpers.isExcluded(el);
      } catch {
        return false;
      }
    }
    let modalOpen = false;
    try {
      modalOpen = typeof helpers.isModalDialogOpen === 'function' && !!helpers.isModalDialogOpen();
    } catch {
      modalOpen = false;
    }
    function isBehindModal(el) {
      if (!modalOpen || typeof helpers.isAccTreeEligible !== 'function') return false;
      try {
        const r = helpers.isAccTreeEligible(el);
        return !!(
          r &&
          r.eligible === false &&
          Array.isArray(r.reasons) &&
          r.reasons.includes('modalInert')
        );
      } catch {
        return false;
      }
    }

    // Text inside a <marquee> is left out. A marquee carries its text
    // through its edges for ever, as a CSS ticker does, but browsers run it
    // outside the Web Animations API, so the engine can neither hold it
    // still for the scan (settleAnimations) nor tell that it moves: where
    // its text stands, and so the finding, would depend on when the scan
    // ran. The marquee itself is reported under WCAG 2.2.2
    // (deprecated-elements-not-used).
    const marqueeCache = new Map();
    function inMarquee(el) {
      const path = [];
      let found = false;
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        if (marqueeCache.has(a)) {
          found = marqueeCache.get(a);
          break;
        }
        path.push(a);
        if (dom.localName(a) === 'marquee') {
          found = true;
          break;
        }
      }
      for (const a of path) marqueeCache.set(a, found);
      return found;
    }

    const nodes = [];
    const judged = new Set();
    const walker = dom.createTreeWalker(document, dom.body(document), 4);
    for (let n = walker.nextNode(); n && nodes.length < MAX_TEXT_NODES; n = walker.nextNode()) {
      if (!/\S/.test(dom.nodeValue(n) || '')) continue;
      const parent = dom.parentElement(n);
      if (!parent || SKIP.has(String(dom.localName(parent)))) continue;
      if (isBehindModal(parent) || inMarquee(parent)) continue;
      // Text the page does not render (display:none, a closed <details>,
      // content-visibility:hidden) is never judged, so it does not take a
      // place in the budget either.
      try {
        if (
          typeof dom.get(parent, 'checkVisibility') === 'function' &&
          !dom.checkVisibility(parent)
        )
          continue;
      } catch {}
      nodes.push(n);
      if (inScope(parent) && !isExcluded(parent)) judged.add(n);
    }

    // The three walks below go up from a text's element, and the texts
    // inside one box share the walk above it: each keeps its answer per
    // element on the way, so a later walk stops at the first element already
    // answered and takes the rest from it. Callers only read the lists.

    // Ancestors that clip on an axis: [{ el, x, y }]. Past an ancestor that
    // scrolls on an axis, outer ancestors no longer clip the text on that
    // axis: what goes past them can be scrolled to. What lies above an
    // element depends on the axes that already scroll below it, so it is
    // kept per element and per those axes.
    const clipCache = new Map();
    const clipAboveCache = new Map();
    // CSS Overflow 3 §3.3: while <html> is `overflow: visible` on both axes,
    // <body>'s overflow applies to the viewport and its own box clips
    // nothing; `body { overflow: hidden }` is how a cookie banner locks the
    // page's scroll. Like <html>'s, the viewport's is not taken as a clipping
    // box. Chromium stops the propagation when either element has any
    // containment (`contain` other than none, or content-visibility: auto),
    // and then <body> clips its own box.
    const bodyEl = dom.body(document);
    const bodyIsViewport = (() => {
      const root = dom.documentElement(document);
      if (!bodyEl || !root || dom.localName(bodyEl) !== 'body') return false;
      const rs = styleOf(root);
      const bs = styleOf(bodyEl);
      if (!rs || !bs) return false;
      if (rs.overflowX !== 'visible' || rs.overflowY !== 'visible') return false;
      const contained = (cs) =>
        (!!cs.contain && cs.contain !== 'none') ||
        (!!cs.contentVisibility && cs.contentVisibility !== 'visible');
      return !contained(rs) && !contained(bs);
    })();

    // Whether el's box, or the content overflowing it, reaches past the
    // viewport on each axis, as drawn now.
    function pastViewport(el) {
      const se = dom.get(document, 'compatMode') === 'BackCompat' ? bodyEl : rootEl;
      const w = Number(dom.get(se, 'clientWidth')) || view.innerWidth || 0;
      const h = Number(dom.get(se, 'clientHeight')) || view.innerHeight || 0;
      const r = dom.getBoundingClientRect(el);
      if (!r || !w || !h) return { x: false, y: false };
      const right = Math.max(r.right, r.left + (Number(dom.get(el, 'scrollWidth')) || 0));
      const bottom = Math.max(r.bottom, r.top + (Number(dom.get(el, 'scrollHeight')) || 0));
      return { x: r.left < -1 || right > w + 1, y: r.top < -1 || bottom > h + 1 };
    }

    // The viewport clips on each axis its used overflow hides. `locked`: both
    // hidden with content already beyond, a scroll lock the engine can't see past.
    const rootEl = dom.documentElement(document);
    const viewportClippers = (() => {
      const rs = rootEl && styleOf(rootEl);
      if (!rs) return [];
      const own = rs.overflowX !== 'visible' || rs.overflowY !== 'visible';
      const el = own ? rootEl : bodyIsViewport ? bodyEl : null;
      const cs = el && (own ? rs : styleOf(el));
      if (!cs) return [];
      const hides = (v) => v === 'hidden' || v === 'clip';
      const x = hides(cs.overflowX);
      const y = hides(cs.overflowY);
      const quirks = dom.get(document, 'compatMode') === 'BackCompat';
      const se = quirks ? bodyEl : rootEl;
      // A <body> taken out of flow, as `body { position: fixed }` locks the
      // page behind a banner, leaves the scroll size at the viewport's though
      // its content lies beyond, so its own box counts too.
      const bodyPast = bodyEl ? pastViewport(bodyEl) : { x: false, y: false };
      const beyond = (scrollSize, clientSize, offset, past) =>
        (Number(dom.get(se, scrollSize)) || 0) > (Number(dom.get(se, clientSize)) || 0) + 1 ||
        offset > 0 ||
        past;
      const lockedX = x && y && beyond('scrollWidth', 'clientWidth', view.scrollX || 0, bodyPast.x);
      const lockedY =
        x && y && beyond('scrollHeight', 'clientHeight', view.scrollY || 0, bodyPast.y);
      const out = [];
      if (x && y && lockedX === lockedY) out.push({ el, x, y, viewport: true, locked: lockedX });
      else {
        if (x) out.push({ el, x: true, y: false, viewport: true, locked: lockedX });
        if (y) out.push({ el, x: false, y: true, viewport: true, locked: lockedY });
      }
      return out;
    })();
    const viewportTail = (scrolls) =>
      viewportClippers.filter((c) => !(c.x && scrolls & 1) && !(c.y && scrolls & 2));
    function viewportBox() {
      const se = dom.get(document, 'compatMode') === 'BackCompat' ? bodyEl : rootEl;
      const left = view.scrollX || 0;
      const top = view.scrollY || 0;
      return {
        left,
        top,
        right: left + (Number(dom.get(se, 'clientWidth')) || view.innerWidth),
        bottom: top + (Number(dom.get(se, 'clientHeight')) || view.innerHeight)
      };
    }

    // A viewport clipper set by a fixed box has a key of its own, as the box
    // may clip its own content too.
    const keyOf = (c) => c.key || c.el;
    function clippersOf(el) {
      if (clipCache.has(el)) return clipCache.get(el);
      const path = [];
      let tail = null;
      let scrolls = 0; // 1: x scrolls below, 2: y does
      // A box clips only what its containing block chain runs through: an
      // absolutely positioned popup whose containing block is outside an
      // overflow: hidden box escapes it (#110). contain: paint clips both
      // axes. Bounded as a safety net only: a walk up a real tree ends.
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && a !== dom.documentElement(document) && i < 100000;
        a = helpers.containingBlockOf(a), i++
      ) {
        const known = clipAboveCache.get(a);
        if (known && known[scrolls]) {
          tail = known[scrolls];
          break;
        }
        const cs = a === bodyEl && bodyIsViewport ? null : styleOf(a);
        let own = null;
        let after = scrolls;
        if (cs) {
          const paint = /\b(paint|strict|content)\b/.test(String(cs.contain || ''));
          const x =
            !(scrolls & 1) && (paint || cs.overflowX === 'hidden' || cs.overflowX === 'clip');
          const y =
            !(scrolls & 2) && (paint || cs.overflowY === 'hidden' || cs.overflowY === 'clip');
          if (x || y) own = { el: a, x, y };
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') after |= 1;
          if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') after |= 2;
        }
        path.push({ a, scrolls, own });
        scrolls = after;
        if (scrolls === 3) break;
        // A fixed box placed against the viewport doesn't scroll with the
        // page: what it holds outside the viewport can't be scrolled to.
        // One that already reached past the viewport, as a whole page held
        // in a fixed box does, is locked like the viewport.
        if (cs && cs.position === 'fixed' && !helpers.containingBlockOf(a)) {
          const x = !(scrolls & 1);
          const y = !(scrolls & 2);
          const past = pastViewport(a);
          const locked = (x && past.x) || (y && past.y);
          tail = [{ el: a, key: { fixed: a }, x, y, viewport: true, locked }];
          break;
        }
      }
      if (!tail) tail = viewportTail(scrolls);
      for (let i = path.length - 1; i >= 0; i--) {
        const { a, scrolls: at, own } = path[i];
        if (own) tail = [own, ...tail];
        const known = clipAboveCache.get(a) || [];
        known[at] = tail;
        clipAboveCache.set(a, known);
      }
      clipCache.set(el, tail);
      return tail;
    }

    // Every ancestor that clips what it paints, scrolling ones included: an
    // overlap is between text as painted, and a box that scrolls paints
    // nothing of what it has scrolled out of view.
    const paintClipCache = new Map();
    function paintClippersOf(el) {
      if (paintClipCache.has(el)) return paintClipCache.get(el);
      const path = [];
      let tail = [];
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && a !== dom.documentElement(document) && i < 100000;
        a = helpers.containingBlockOf(a), i++
      ) {
        if (paintClipCache.has(a)) {
          tail = paintClipCache.get(a);
          break;
        }
        const cs = styleOf(a);
        let own = null;
        if (cs && dom.localName(a) !== 'body') {
          const paint = /\b(paint|strict|content)\b/.test(String(cs.contain || ''));
          const x = paint || (!!cs.overflowX && cs.overflowX !== 'visible');
          const y = paint || (!!cs.overflowY && cs.overflowY !== 'visible');
          if (x || y) own = { el: a, x, y };
        }
        path.push({ a, own });
      }
      for (let i = path.length - 1; i >= 0; i--) {
        const { a, own } = path[i];
        if (own) tail = [own, ...tail];
        paintClipCache.set(a, tail);
      }
      return tail;
    }
    // Text in a fixed or sticky box lies over whatever scrolls under it, so
    // where it meets other text depends on the scroll position, not on the
    // spacing.
    const pinnedCache = new Map();
    function pinned(el) {
      if (pinnedCache.has(el)) return pinnedCache.get(el);
      const path = [];
      let found = false;
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        if (pinnedCache.has(a)) {
          found = pinnedCache.get(a);
          break;
        }
        path.push(a);
        const cs = styleOf(a);
        if (cs && (cs.position === 'fixed' || cs.position === 'sticky')) {
          found = true;
          break;
        }
      }
      for (const a of path) pinnedCache.set(a, found);
      return found;
    }

    function shown(el) {
      try {
        return typeof dom.get(el, 'checkVisibility') === 'function'
          ? dom.checkVisibility(el, { opacityProperty: true, visibilityProperty: true })
          : true;
      } catch {
        return true;
      }
    }

    const sx = () => view.scrollX || 0;
    const sy = () => view.scrollY || 0;
    function linesOf(node) {
      const range = dom.createRange(document);
      try {
        range.selectNodeContents(node);
        const out = [];
        const ox = sx();
        const oy = sy();
        for (const r of dom.getClientRects(range)) {
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
    // The box el clips its content to, in the same units as the lines'
    // rectangles: the bounding rectangle is what the page draws, after CSS
    // zoom and transforms, while the borders and clientWidth/clientHeight
    // are layout sizes, so they are scaled by how much larger el is drawn
    // than laid out (offsetWidth/offsetHeight).
    function boxOf(el) {
      const r = dom.getBoundingClientRect(el);
      const cs = styleOf(el);
      const ow = Number(dom.get(el, 'offsetWidth')) || 0;
      const oh = Number(dom.get(el, 'offsetHeight')) || 0;
      const kx = ow > 0 && r.width > 0 ? r.width / ow : 1;
      const ky = oh > 0 && r.height > 0 ? r.height / oh : 1;
      const bl = (px(cs && cs.borderLeftWidth) || 0) * kx;
      const bt = (px(cs && cs.borderTopWidth) || 0) * ky;
      const ox = sx();
      const oy = sy();
      return {
        left: r.left + ox + bl,
        top: r.top + oy + bt,
        right: r.left + ox + bl + dom.get(el, 'clientWidth') * kx,
        bottom: r.top + oy + bt + dom.get(el, 'clientHeight') * ky
      };
    }

    function measure() {
      const lines = new Map();
      const boxes = new Map();
      for (const n of nodes) {
        lines.set(n, linesOf(n));
        for (const c of clippersOf(dom.parentElement(n))) {
          if (!boxes.has(keyOf(c))) boxes.set(keyOf(c), c.viewport ? viewportBox() : boxOf(c.el));
        }
        for (const c of paintClippersOf(dom.parentElement(n))) {
          if (!boxes.has(c.el)) boxes.set(c.el, boxOf(c.el));
        }
      }
      return { lines, boxes };
    }

    const scroll = [sx(), sy()];
    const before = measure();

    // A box the page's script fitted to its text as it was: an inline width
    // or height, on the box or on the one its percentage size is taken from,
    // that gives the text's own size before the spacing, as Angular
    // Material's outlined field sets its notch to the floating label's
    // width. The script may fit it again once the text grows, which a scan
    // taken in one moment can't see. Inline styles are read before the
    // page's scripts can run; sizes are compared in layout pixels.
    function scriptSizing(el, n) {
      const lines = before.lines.get(n) || [];
      if (!lines.length) return null;
      const r = dom.getBoundingClientRect(el);
      const ow = Number(dom.get(el, 'offsetWidth')) || 0;
      const oh = Number(dom.get(el, 'offsetHeight')) || 0;
      const kx = ow > 0 && r && r.width > 0 ? r.width / ow : 1;
      const ky = oh > 0 && r && r.height > 0 ? r.height / oh : 1;
      const text = {
        width:
          (Math.max(...lines.map((l) => l.right)) - Math.min(...lines.map((l) => l.left))) / kx,
        height:
          (Math.max(...lines.map((l) => l.bottom)) - Math.min(...lines.map((l) => l.top))) / ky
      };
      const cb = helpers.containingBlockOf(el) || dom.parentElement(el);
      for (const [by, box] of [
        ['self', el],
        ['containing-block', cb]
      ]) {
        if (!box || dom.nodeType(box) !== 1) continue;
        const style = String(dom.getAttribute(box, 'style') || '');
        const re = /(?:^|;)\s*((?:min-|max-)?(width|height))\s*:\s*([^;]*)/gi;
        let m;
        while ((m = re.exec(style))) {
          const size = text[m[2].toLowerCase()];
          for (const v of m[3].match(/\d*\.?\d+px/g) || []) {
            if (Math.abs(parseFloat(v) - size) <= 1.5) {
              return { box, by, property: m[1].toLowerCase(), value: m[3].trim() };
            }
          }
        }
      }
      return null;
    }
    const fontSizes = new Map();
    for (const n of nodes) {
      const cs = styleOf(dom.parentElement(n));
      fontSizes.set(n, px(cs && cs.fontSize) || 16);
    }

    // Text a person could see before the spacing: rendered, and wholly
    // inside every ancestor that clips it. Visually hidden text (a 1px box
    // with overflow hidden), text scrolled out of a carousel or hidden by
    // opacity or visibility is left out.
    const visibleBefore = new Set();
    for (const n of nodes) {
      const lines = before.lines.get(n) || [];
      if (!lines.length || !shown(dom.parentElement(n))) continue;
      const inside = clippersOf(dom.parentElement(n)).every((c) => {
        if (c.viewport) return true;
        const b0 = before.boxes.get(keyOf(c));
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

    const spacingCss =
      `@layer ${LAYER} {` +
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
      'p { margin-bottom: 2em !important; }' +
      '}';
    const sheet = dom.createElement(document, 'style');
    dom.setAttribute(sheet, 'data-surea11y', LAYER);
    sheet.textContent = spacingCss;
    // The spacing as a style sheet of the document's own, when a Content
    // Security Policy keeps an added <style> from applying: the browser
    // gives a blocked one no style sheet. null where there is none either.
    function adoptSpacing() {
      try {
        const Sheet = view && view.CSSStyleSheet;
        const sheets = dom.get(document, 'adoptedStyleSheets');
        if (typeof Sheet !== 'function' || !Array.isArray(sheets)) return null;
        const adopted = new Sheet();
        adopted.replaceSync(spacingCss);
        document.adoptedStyleSheets = sheets.concat([adopted]);
        return adopted;
      } catch {
        return null;
      }
    }
    // Never left on the user's page: when the page's own code breaks one way
    // of taking the sheet out, the next is tried, and at worst it is emptied.
    function removeSpacing(adopted) {
      try {
        if (dom.parentNode(sheet)) dom.removeChild(dom.parentNode(sheet), sheet);
      } catch {}
      try {
        if (dom.parentNode(sheet)) sheet.remove();
      } catch {}
      try {
        if (dom.parentNode(sheet)) sheet.textContent = '';
      } catch {}
      if (adopted) {
        try {
          document.adoptedStyleSheets = dom
            .get(document, 'adoptedStyleSheets')
            .filter((s) => s !== adopted);
        } catch {}
      }
    }
    let after;
    // Whether the spacing reached the page. Without it nothing is measured,
    // since the text would be compared with itself: never a pass.
    let spacingApplied;
    let adopted = null;
    try {
      const head = dom.head(document) || dom.documentElement(document);
      dom.insertBefore(head, sheet, dom.firstChild(head));
      spacingApplied = !!sheet.sheet;
      if (!spacingApplied) {
        removeSpacing(null);
        adopted = adoptSpacing();
        spacingApplied = !!adopted;
      }
      if (spacingApplied) after = measure();
    } finally {
      removeSpacing(adopted);
      try {
        view.scrollTo(scroll[0], scroll[1]);
      } catch {}
    }
    spacingNotApplied = !spacingApplied;

    // Whether an element from `from` up to (not including) `stop` is moved
    // by an animation that repeats for ever: a ticker. Its text
    // passes through the clipping box and comes back, so one frame can't
    // tell whether it is lost. The engine holds such an animation at its
    // start for the scan (see settleAnimations). An animation that only
    // fades or recolours (a blinking cursor) moves nothing and doesn't count.
    // Property names as getKeyframes() spells them (camelCase); a keyframe's
    // own `offset`, `easing` and `composite` are not properties.
    const MOVING_PROPS =
      /^(transform|translate|rotate|scale|left|right|top|bottom|inset|margin|offsetPath|offsetDistance|offsetAnchor|offsetPosition)/;
    // The elements such an animation targets, read once from the document's
    // animations: asking each ancestor of each text for its own costs an
    // animation lookup per element.
    let movedForEver = null;
    function movedForEverTargets() {
      if (movedForEver) return movedForEver;
      movedForEver = new Set();
      let animations;
      try {
        animations =
          typeof dom.get(document, 'getAnimations') === 'function'
            ? dom.getAnimations(document)
            : [];
      } catch {
        animations = [];
      }
      for (const a of animations) {
        try {
          if (a.playState !== 'running' || !a.effect || !a.effect.target) continue;
          if (a.effect.getComputedTiming().iterations !== Infinity) continue;
          const frames = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
          if (frames.some((f) => Object.keys(f).some((k) => MOVING_PROPS.test(k)))) {
            movedForEver.add(a.effect.target);
          }
        } catch {}
      }
      return movedForEver;
    }
    function isMovedForEver(from, stop) {
      const targets = movedForEverTargets();
      if (!targets.size) return false;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (let el = from, i = 0; el && el !== stop && i < 100000; el = dom.parentElement(el), i++) {
        if (targets.has(el)) return true;
      }
      return false;
    }

    // How far a line sits outside a box, along the axes the box clips.
    function outside(line, box, c) {
      const dy = c.y ? Math.max(0, box.top - line.top, line.bottom - box.bottom) : 0;
      const dx = c.x ? Math.max(0, box.left - line.left, line.right - box.right) : 0;
      return { dx, dy };
    }
    function insideBefore(n, c) {
      const b0 = before.boxes.get(keyOf(c));
      const lines = before.lines.get(n) || [];
      return (
        !!b0 &&
        lines.length > 0 &&
        lines.every((l) => {
          const o = outside(l, b0, c);
          return o.dx <= 1 && o.dy <= 1;
        })
      );
    }

    // The same distance, signed: negative while the line is inside the box,
    // by how much. It is measured on the side text grows toward with more
    // spacing, the inline end (the right, or the left in right-to-left text)
    // and the bottom: text set flush against its start edge is not close to
    // being cut off there. The start side counts only once a line is past it.
    // Its closest approach to the threshold is the margin.
    const growthOf = new Map();
    function growth(el) {
      if (!growthOf.has(el)) {
        const st = styleOf(el);
        const horizontal = !st || !/^vertical|^sideways/.test(st.writingMode || '');
        growthOf.set(el, { horizontal, rtl: !!st && st.direction === 'rtl' });
      }
      return growthOf.get(el);
    }
    // A line more than this far outside its box is partly cut off: the first
    // finding (TEXT_CLIPPED_PARTLY), so it is also the margin's limit. The
    // limit was half the line, where text counts as lost, which left the
    // reported room about six times too large.
    const PARTLY_PX = 2;
    // A box that grew with the spacing on an axis follows its content there
    // (a height: auto block), so it can't cut text off on that axis.
    function closestApproach(lines, box, c, textEl, boxBefore) {
      const g = growth(textEl);
      // Vertical text grows along the other axes; it gets no margin.
      if (!g.horizontal) return null;
      const grew = (sizeBefore, sizeAfter) => sizeAfter - sizeBefore > 0.5;
      const fixedX = !boxBefore || !grew(boxBefore.right - boxBefore.left, box.right - box.left);
      const fixedY = !boxBefore || !grew(boxBefore.bottom - boxBefore.top, box.bottom - box.top);
      const towards = (end, start) => (start > 0 ? Math.max(end, start) : end);
      let best = null;
      for (const l of lines) {
        const axes = [];
        if (c.x && fixedX) {
          const right = l.right - box.right;
          const left = box.left - l.left;
          axes.push({
            axis: 'x',
            value: g.rtl ? towards(left, right) : towards(right, left),
            threshold: PARTLY_PX
          });
        }
        if (c.y && fixedY) {
          axes.push({
            axis: 'y',
            value: towards(l.bottom - box.bottom, box.top - l.top),
            threshold: PARTLY_PX
          });
        }
        for (const a of axes) {
          if (!(a.value <= a.threshold)) continue;
          if (!best || a.threshold - a.value < best.threshold - best.value) best = a;
        }
      }
      return best;
    }

    for (const n of nodes) {
      const linesAfter = (after && after.lines.get(n)) || [];
      if (!linesAfter.length || !visibleBefore.has(n) || !judged.has(n)) continue;
      textCount += 1;
      const fontSize = fontSizes.get(n);
      for (const c of clippersOf(dom.parentElement(n))) {
        if (reportedClip.has(c.el)) continue;
        const b1 = after.boxes.get(keyOf(c));
        if (!b1) continue;
        // Only text the viewport showed in full before can be lost from it.
        if (c.viewport && !insideBefore(n, c)) continue;
        measuredPairs += 1;
        // The line furthest out, measured on the axis that decided it: the
        // first one past the threshold, or else the one that went furthest.
        let worst = null;
        for (const l of linesAfter) {
          const o = outside(l, b1, c);
          const height = l.bottom - l.top;
          const x = { axis: 'x', overflowPx: o.dx, thresholdPx: fontSize / 2 };
          const y = { axis: 'y', overflowPx: o.dy, thresholdPx: height / 2 };
          const lost = o.dy >= y.thresholdPx || o.dx >= x.thresholdPx;
          const some = o.dy > PARTLY_PX || o.dx > PARTLY_PX;
          if (lost) {
            worst = { lost, ...(o.dx >= x.thresholdPx ? x : y) };
            break;
          }
          if (some) {
            const m = o.dx >= o.dy ? x : y;
            if (!worst || m.overflowPx > worst.overflowPx) worst = { lost, ...m };
          }
        }
        const moved = isMovedForEver(dom.parentElement(n), c.el);
        if (worst) {
          reportedClip.add(c.el);
          const sizing =
            worst.lost && !moved && !c.locked && !c.viewport ? scriptSizing(c.el, n) : null;
          const list = moved
            ? moving
            : c.locked
              ? locked
              : sizing
                ? scriptSized
                : worst.lost
                  ? clipped
                  : partly;
          list.push({
            el: c.el,
            ...(sizing ? { sizing } : {}),
            text: textOf(dom.parentElement(n)),
            metrics: {
              overflowPx: round1(worst.overflowPx),
              thresholdPx: round1(worst.thresholdPx),
              axis: worst.axis
            },
            container: {
              widthPx: round1(b1.right - b1.left),
              heightPx: round1(b1.bottom - b1.top)
            }
          });
          break;
        }
        // Text this box keeps in full: how close it came to being cut off.
        // Text a repeating animation moves is left out: where it stands
        // depends on the point the animation was held at, not on the layout.
        if (moved || c.locked) continue;
        const approach = closestApproach(
          linesAfter,
          b1,
          c,
          dom.parentElement(n),
          before.boxes.get(keyOf(c))
        );
        if (approach) {
          marginCandidates.push({
            el: c.el,
            value: approach.value,
            threshold: approach.threshold,
            context: { axis: approach.axis, text: textOf(dom.parentElement(n)) }
          });
        }
      }
    }

    // Text its box already cut off before the spacing, a fixed-height
    // excerpt, is not judged above. Lines that were shown in full and are
    // cut off once the spacing is applied are asked about: whether the
    // excerpt still serves its purpose takes a person to judge. A box that
    // grows with its lines (line-clamp counts lines) shows as many as
    // before, and is left alone.
    for (const n of nodes) {
      if (visibleBefore.has(n) || !judged.has(n)) continue;
      const linesBefore = before.lines.get(n) || [];
      const linesAfter = (after && after.lines.get(n)) || [];
      if (!linesBefore.length || !linesAfter.length || !shown(dom.parentElement(n))) continue;
      const clippers = clippersOf(dom.parentElement(n)).filter((c) => !c.viewport);
      // A line is shown in full when every box that clips it keeps it:
      // visually hidden text, cut by a 1px box of its own, shows none.
      const keeps = (l, boxes, c) => {
        const box = boxes.get(c.el);
        if (!box) return false;
        const o = outside(l, box, c);
        return o.dx <= 1 && o.dy <= 1;
      };
      const shownIn = (lines, boxes) =>
        lines.filter((l) => clippers.every((c) => keeps(l, boxes, c))).length;
      const shownBefore = shownIn(linesBefore, before.boxes);
      if (!shownBefore || shownIn(linesAfter, after.boxes) >= shownBefore) continue;
      // The box that cuts off a line it kept before.
      const cutter = clippers.find(
        (c) =>
          !reportedClip.has(c.el) &&
          linesAfter.some((l) => !keeps(l, after.boxes, c)) &&
          !isMovedForEver(dom.parentElement(n), c.el)
      );
      if (!cutter) continue;
      const b1 = after.boxes.get(cutter.el);
      reportedClip.add(cutter.el);
      clippedFurther.push({
        el: cutter.el,
        text: textOf(dom.parentElement(n)),
        lines: { shownBefore, shownAfter: shownIn(linesAfter, after.boxes) },
        container: {
          widthPx: round1(b1.right - b1.left),
          heightPx: round1(b1.bottom - b1.top)
        }
      });
    }

    // Text that comes to overlap text from another element.
    if (after) {
      const BAND = 40;
      const buckets = new Map();
      const entries = [];
      for (const n of nodes) {
        if (!visibleBefore.has(n) || pinned(dom.parentElement(n))) continue;
        for (const whole of after.lines.get(n) || []) {
          // Only the part of the line its clipping ancestors still show is
          // painted; what they cut off is the clipping check's.
          const l = { ...whole };
          for (const c of paintClippersOf(dom.parentElement(n))) {
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
      // Lines in one band that share no column can't overlap. Comparing
      // every pair in a band made a row of many short lines (a toolbar, a
      // tag cloud) quadratic, so a sweep across the band's lines by their
      // left edge finds the pairs whose columns meet, and they are judged
      // in the order every pair was before, which decides what is reported.
      const pairsSharingColumns = (list) => {
        const order = list.map((_, i) => i).sort((x, y) => list[x].l.left - list[y].l.left);
        const pairs = [];
        for (let k = 0; k < order.length; k++) {
          const a = list[order[k]].l;
          for (let m = k + 1; m < order.length && list[order[m]].l.left < a.right; m++) {
            pairs.push(order[k] < order[m] ? [order[k], order[m]] : [order[m], order[k]]);
          }
        }
        return pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      };
      const reported = new Set();
      for (const list of buckets.values()) {
        for (const [i, j] of pairsSharingColumns(list)) {
          // The finding goes on text this scan judges; the other text may
          // be anywhere on the page.
          const [a, b] = judged.has(list[i].n) ? [list[i], list[j]] : [list[j], list[i]];
          if (!judged.has(a.n)) continue;
          const pa = dom.parentElement(a.n);
          const pb = dom.parentElement(b.n);
          if (pa === pb || dom.contains(pa, pb) || dom.contains(pb, pa)) continue;
          if (reported.has(pa) || reported.has(pb)) continue;
          if (!intersects(a.l, b.l) || overlappedBefore(a.n, b.n)) continue;
          reported.add(pa);
          const w = Math.min(a.l.right, b.l.right) - Math.max(a.l.left, b.l.left);
          const h = Math.min(a.l.bottom, b.l.bottom) - Math.max(a.l.top, b.l.top);
          const smallerHeight = Math.min(a.l.bottom - a.l.top, b.l.bottom - b.l.top);
          overlaps.push({
            el: pa,
            text: textOf(pa),
            other: textOf(pb),
            overlap: {
              heightShare: smallerHeight > 0 ? round1(h / smallerHeight) : 0,
              widthEm: round1(w / (fontSizes.get(a.n) || 16))
            }
          });
        }
      }
    }
  }

  // ---- Findings ----

  const MESSAGES = {
    TEXT_CLIPPED: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, this element cuts off the text "${p.text}" (${p.overflowPx}px past its edge).`,
      hint: 'Let the container grow with its text: avoid fixed heights and widths with overflow: hidden on text, or let it scroll (WCAG 1.4.12).',
      key: 'fail_clipped'
    },
    TEXT_CLIPPED_PARTLY: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" reaches ${p.overflowPx}px past the edge of this element, which hides what goes past it.`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied that this text can still be read in full (WCAG 1.4.12).',
      key: 'cantTell_clippedPartly',
      needed: 'Whether the text that reaches past the edge of the element can still be read.'
    },
    TEXT_CLIPPED_MOVING: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" reaches ${p.overflowPx}px past the edge of this element, but it moves on a repeating animation, such as a marquee, and passes through that edge anyway.`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied that this moving text can still be read in full as it passes (WCAG 1.4.12). Moving content also needs a way to pause it (WCAG 2.2.2).',
      key: 'cantTell_clippedMoving',
      needed: 'Whether the moving text can still be read in full with the spacing applied.'
    },
    TEXT_CLIPPED_SCRIPT_SIZED: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, this element cuts off the text "${p.text}" (${p.overflowPx}px past its edge), but the page's script sized it to fit that text as it was, and may size it again once the text grows.`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied, once the page has had a moment to react, that this text shows in full; if it stays cut off, let the container grow with its text (WCAG 1.4.12).',
      key: 'cantTell_clippedScriptSized',
      needed:
        "Whether the page's script resizes the element to fit the text once the spacing is applied."
    },
    TEXT_CLIPPED_FURTHER: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, this element shows ${p.linesAfter} of the ${p.linesBefore} lines of the text "${p.text}" it showed in full before.`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied that what this excerpt shows still serves its purpose, or let it grow with its text, as line-clamp does (WCAG 1.4.12).',
      key: 'cantTell_clippedFurther',
      needed: 'Whether the excerpt still serves its purpose with fewer lines shown.'
    },
    VIEWPORT_SCROLL_LOCKED: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" moves ${p.overflowPx}px out of the viewport, which this element keeps from scrolling though content already lay beyond it, as a scroll lock behind a cookie banner or a menu does.`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied that this text can be reached once the page scrolls again; if the page never scrolls in this state, let it scroll (WCAG 1.4.12).',
      key: 'cantTell_viewportScrollLocked',
      needed:
        'Whether the text pushed out of the viewport can be reached once the page scrolls again.'
    },
    TEXT_OVERLAPS: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" comes to overlap the text "${p.other}".`,
      hint: 'Check with the text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied that both texts can still be read (WCAG 1.4.12).',
      key: 'cantTell_overlaps',
      needed: 'Whether the overlapping texts can still be read.'
    },
    SPACING_NOT_APPLIED: {
      summary: () =>
        "The page's Content Security Policy kept the engine from applying the text spacing, so whether text is lost with it could not be measured.",
      hint: 'Check the page by hand with the text spacing of WCAG 1.4.12 (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, 2em after paragraphs) applied, or scan it with a browser setting or extension that applies it.',
      key: 'cantTell_spacingNotApplied',
      needed: 'Whether text is cut off or overlaps once the text spacing is applied.'
    },
    STYLESHEET_IMPORTANT: {
      summary: (p) =>
        `A style sheet rule (${p.selector}) sets ${p.property}: ${p.value} with !important on this text, below the spacing WCAG 1.4.12 lets users apply (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em).`,
      hint: 'Remove !important from the spacing declaration so users can increase it, or check that a user style sheet still overrides it (WCAG 1.4.12).',
      key: 'cantTell_stylesheetImportant',
      needed: 'Whether users can still apply their own text spacing to this text.'
    }
  };

  // ---- Leans ----

  // A resolved value below the metric, on text that can wrap: the shape ACT
  // 78fd32, 24afc2 and 9e45ec fail in a style attribute, here in a style
  // sheet. A value that could not be resolved, or text that can't wrap, gets
  // no lean.
  function importantLean(f) {
    if (f.ratio == null) return null;
    const cs = styleOf(f.el);
    const whiteSpace = String((cs && cs.whiteSpace) || '').toLowerCase();
    if (whiteSpace === 'nowrap' || whiteSpace === 'pre') return null;
    if (!/\s/.test(textOf(f.el))) return null;
    return {
      toward: 'fail',
      why: 'The rule forces a spacing below the WCAG value with !important on text that can wrap, so a tool that adds its own style sheet cannot increase it.',
      signals: [
        { signal: 'important-below-threshold', value: f.prop + ': ' + f.value },
        { signal: 'value-gap', value: Math.round((f.ratio / MIN_RATIO[f.prop]) * 100) / 100 }
      ],
      caution:
        "A user style sheet still wins over the page; only tools that add the spacing as the page's own style lose to it.",
      i18n: {
        whyKey: 'textSpacingContentLoss_lean_why_stylesheetImportant',
        cautionKey: 'textSpacingContentLoss_lean_caution_stylesheetImportant'
      }
    };
  }

  // An open overlay, which is what usually locks the page's scrolling while
  // it shows: a dialog, or a fixed box at the bottom of the viewport (a
  // consent banner) or covering half of it. Once it closes the page scrolls.
  // Read once, when a scroll-locked finding needs it.
  let overlay;
  function openOverlay() {
    if (overlay !== undefined) return overlay;
    overlay = null;
    try {
      for (const el of helpers.queryAll(
        'dialog[open], [aria-modal="true" i], [role~="dialog" i], [role~="alertdialog" i]'
      ) || []) {
        const tag = String(dom.localName(el) || '').toLowerCase();
        const role = helpers.aria.getAuthorRole(el);
        const isDialog =
          tag === 'dialog' ||
          role === 'dialog' ||
          role === 'alertdialog' ||
          dom.getAttribute(el, 'aria-modal') !== null;
        if (!isDialog) continue;
        const r = dom.getBoundingClientRect(el);
        if (r && r.width > 0 && r.height > 0) {
          overlay = 'dialog';
          return overlay;
        }
      }
      const vw = view && view.innerWidth;
      const vh = view && view.innerHeight;
      if (!vw || !vh) return overlay;
      const all = dom.querySelectorAll(document, 'body *') || [];
      for (let i = 0; i < all.length && i < 5000; i++) {
        const cs = styleOf(all[i]);
        if (!cs || cs.position !== 'fixed') continue;
        const r = dom.getBoundingClientRect(all[i]);
        if (!r || !(r.width > 0 && r.height > 0)) continue;
        const atBottom = r.bottom >= vh - 1 && r.width >= vw * 0.9;
        const covers = r.width * r.height >= vw * vh * 0.5;
        if (atBottom || covers) {
          overlay = covers ? 'fixed-covering' : 'fixed-bottom';
          return overlay;
        }
      }
    } catch {
      overlay = null;
    }
    return overlay;
  }

  function scrollLockedLean() {
    const kind = openOverlay();
    if (!kind) return null;
    return {
      toward: 'pass',
      why: 'An overlay is open, such as a dialog or a consent banner, which is what usually locks scrolling; once it closes the page scrolls and the text can be reached.',
      signals: [{ signal: 'open-overlay', value: kind }],
      caution: 'Some pages lock scrolling for good and scroll an inner pane instead.',
      i18n: {
        whyKey: 'textSpacingContentLoss_lean_why_scrollLocked',
        cautionKey: 'textSpacingContentLoss_lean_caution_scrollLocked'
      }
    };
  }

  // Angular Material's outlined form field sizes its notch to the floating
  // label, calc(<width>px * var(--mat-mdc-form-field-floating-label-scale,
  // 0.75) + 9px), and sizes it again when the label's size changes.
  function scriptSizedLean(sizing) {
    const cls = String(dom.getAttribute(sizing.box, 'class') || '');
    if (
      !/(^|\s)mdc-notched-outline__notch(\s|$)/.test(cls) ||
      !/var\(\s*--mat-mdc-form-field-floating-label-scale/.test(sizing.value)
    ) {
      return null;
    }
    return {
      toward: 'pass',
      why: 'The text is the floating label of an Angular Material outlined form field, whose script fits the outline to the label again when the label grows.',
      signals: [{ signal: 'self-resizing-component', value: 'angular-material-notched-outline' }],
      caution:
        'Older versions of the library set the outline width only once; check that the label shows in full with the spacing applied.',
      i18n: {
        whyKey: 'textSpacingContentLoss_lean_why_scriptSized',
        cautionKey: 'textSpacingContentLoss_lean_caution_scriptSized'
      }
    };
  }

  const fails = [];
  const questions = [];
  // `params` fill in the summary; `details` are what the rule found, with
  // the measurements behind it.
  function report(reasonCode, el, params, details, uncertaintyCode, lean) {
    const msg = MESSAGES[reasonCode];
    const occ = helpers.reportOccurrence(el, {
      ...(lean ? { lean } : {}),
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
      data: { details: { reasonCode, ...details } }
    });
    (msg.needed ? questions : fails).push(occ);
  }

  // Whether text gets cut off or overlaps depends on the viewport it was
  // laid out in, so those findings say which one. Read on its own, in a
  // baseline or a SARIF result, such a finding can still be reproduced.
  const viewport = view ? { width: view.innerWidth, height: view.innerHeight } : null;
  const at = { viewportWidth: String(viewport && viewport.width) };
  for (const [reasonCode, list, uncertaintyCode] of [
    ['TEXT_CLIPPED', clipped],
    ['TEXT_CLIPPED_PARTLY', partly, 'judgement-required'],
    ['TEXT_CLIPPED_MOVING', moving, 'judgement-required'],
    ['VIEWPORT_SCROLL_LOCKED', locked, 'runtime-dependent'],
    ['TEXT_CLIPPED_SCRIPT_SIZED', scriptSized, 'runtime-dependent']
  ]) {
    for (const f of list) {
      const { text, metrics, container, sizing } = f;
      const params = { text, overflowPx: String(Math.round(metrics.overflowPx)), ...at };
      const lean =
        reasonCode === 'VIEWPORT_SCROLL_LOCKED'
          ? scrollLockedLean()
          : sizing
            ? scriptSizedLean(sizing)
            : null;
      // Which inline size the script set, and on which box.
      const sizedBy = sizing
        ? { box: sizing.by, property: sizing.property, value: sizing.value }
        : null;
      report(
        reasonCode,
        f.el,
        params,
        { text, metrics, container, viewport, ...(sizedBy ? { sizedBy } : {}) },
        uncertaintyCode,
        lean
      );
    }
  }
  for (const f of clippedFurther) {
    const { text, lines, container } = f;
    report(
      'TEXT_CLIPPED_FURTHER',
      f.el,
      {
        text,
        linesBefore: String(lines.shownBefore),
        linesAfter: String(lines.shownAfter),
        ...at
      },
      { text, lines, container, viewport },
      'judgement-required',
      lines.shownAfter === 0
        ? {
            toward: 'fail',
            why: 'The excerpt showed whole lines before the spacing and shows none in full with it.',
            signals: [
              { signal: 'lines-shown-after', value: 0 },
              { signal: 'lines-shown-before', value: lines.shownBefore }
            ],
            caution: 'The full text may be offered elsewhere, such as through a "read more" link.',
            i18n: {
              whyKey: 'textSpacingContentLoss_lean_why_clippedFurther',
              cautionKey: 'textSpacingContentLoss_lean_caution_clippedFurther'
            }
          }
        : null
    );
  }
  // Text drawn over more than half the height of the other line and more
  // than an em along it can't be read; a sliver at a line's edge can.
  for (const f of overlaps) {
    const { text, other, overlap } = f;
    report(
      'TEXT_OVERLAPS',
      f.el,
      { text, other, ...at },
      { text, other, viewport },
      'judgement-required',
      overlap.heightShare > 0.5 && overlap.widthEm > 1
        ? {
            toward: 'fail',
            why: 'With the spacing applied, the text is drawn over more than half the height of the other text, for more than an em along it.',
            signals: [
              { signal: 'overlap-height-share', value: overlap.heightShare },
              { signal: 'overlap-width-em', value: overlap.widthEm }
            ],
            caution:
              'Text overlapping a transparent or decorative text layer may still be readable.',
            i18n: {
              whyKey: 'textSpacingContentLoss_lean_why_overlaps',
              cautionKey: 'textSpacingContentLoss_lean_caution_overlaps'
            }
          }
        : null
    );
  }
  if (spacingNotApplied) {
    report(
      'SPACING_NOT_APPLIED',
      dom.documentElement(document),
      {},
      { reason: 'contentSecurityPolicy' },
      'runtime-dependent'
    );
  }
  for (const f of importantFindings) {
    const params = { selector: f.selector, property: f.prop, value: f.value };
    report('STYLESHEET_IMPORTANT', f.el, params, params, 'runtime-dependent', importantLean(f));
  }

  // The text that came closest to being cut off while staying readable,
  // reported as the result's margin whatever the outcome. A box that cuts
  // off other text is a finding, so it is not the margin, even when the
  // first text measured in it fit.
  const margin = {
    marginCandidates: marginCandidates.filter((m) => !reportedClip.has(m.el)),
    measuredCount: measuredPairs
  };
  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious'),
      ...margin
    };
  }
  if (textCount)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], ...margin };
  return {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    ...(hasLayout() ? {} : { data: { reason: 'noLayout' } })
  };
}

module.exports = { id, meta, runInPage };
