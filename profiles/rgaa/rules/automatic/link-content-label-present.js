/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-content-label-present
 * @atomic true
 * @summary A link must have text or an image text alternative in its content
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links included in the accessibility tree: <a> with an href
 *   (or, in SVG, an xlink:href), and elements with role="link". An <a href>
 *   whose role is another widget (role="button", role="tab") is not a link
 *   to assistive technologies and is not matched. <area> is not matched:
 *   RGAA judges its text alternative under 1.1.2. A page with no link is
 *   notApplicable.
 * @expectation
 *   The content of the link holds text, or an image with a text alternative
 *   (alt, aria-label, aria-labelledby, title, or the <title> or <text> of
 *   an <svg>). RGAA 6.2.1 asks for "un intitulé entre <a> et </a>", and
 *   its methodology checks that the content of the element contains a label
 *   ("texte ou alternative"). A name given only by aria-label,
 *   aria-labelledby or title on the link itself does not count: the RGAA
 *   glossary "Intitulé (ou nom accessible) de lien", Note 4, says a link
 *   with no content fails 6.2. An image that has no text alternative, or
 *   that is hidden with aria-hidden="true", gives the link no label. The
 *   rule asks instead of failing when the content holds text added by CSS
 *   (::before, ::after), an embedded element such as a form field, or an
 *   element named by its own aria-label, or when text hidden from assistive
 *   technologies (aria-hidden="true") sits beside a name from aria-label,
 *   aria-labelledby or title. Hidden text with no such name leaves the link
 *   with no label at all, and fails.
 * @implementation-notes
 * - Content inside hidden, display:none or visibility:hidden elements is not
 *   content: nobody sees or hears it.
 * - CSS-generated text is read from the computed ::before and ::after
 *   content, only where the page has a layout (a browser). jsdom does not
 *   compute it, so there a link whose only content is generated fails.
 * - Opt-in (tag `rgaa`): WCAG accepts any accessible name, which
 *   link-name-present checks, so the rule runs only under the rgaa-4.1.2
 *   profile, the `rgaa` tag or its own id.
 */

const id = 'link-content-label-present';

const meta = {
  title: 'Links have a label in their content',
  description:
    'Checks that each link holds text or an image with a text alternative, rather than being named only by aria-label, aria-labelledby or title.',
  i18n: {
    titleKey: 'linkContentLabelPresent_title',
    descriptionKey: 'linkContentLabelPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { document, window, helpers, rule } = ctx;
  const win = window || (document && document.defaultView) || null;

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

  function firstKnownRole(el) {
    const tokens = String(attr(el, 'role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!tokens.length) return '';
    if (!helpers.aria || typeof helpers.aria.isKnownRole !== 'function') return tokens[0];
    for (const t of tokens) {
      try {
        if (helpers.aria.isKnownRole(t)) return t;
      } catch {}
    }
    return '';
  }

  function styleOf(el, pseudo) {
    if (!win || typeof win.getComputedStyle !== 'function') return null;
    try {
      return win.getComputedStyle(el, pseudo || null);
    } catch {
      return null;
    }
  }

  function isNotRendered(el) {
    if (el.hasAttribute && el.hasAttribute('hidden')) return true;
    const cs = styleOf(el);
    return !!(cs && cs.display === 'none');
  }

  function isVisibilityHidden(el) {
    const cs = el ? styleOf(el) : null;
    return !!(cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse'));
  }

  // Pseudo-element styles are read only where the page has a layout: jsdom
  // does not compute them, and reports each attempt as not implemented.
  function hasLayout() {
    const probe = document.documentElement || document.body || null;
    if (!probe || typeof probe.getClientRects !== 'function') return false;
    try {
      const rects = probe.getClientRects();
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }
  const pseudoSupported = hasLayout();

  function hasGeneratedContent(el) {
    if (!pseudoSupported) return false;
    for (const pseudo of ['::before', '::after']) {
      const cs = styleOf(el, pseudo);
      const c = cs ? String(cs.content || '').trim() : '';
      if (!c || c === 'none' || c === 'normal' || c === '""' || c === "''") continue;
      return true;
    }
    return false;
  }

  function idRefText(el, value) {
    const root = el.getRootNode ? el.getRootNode() : document;
    const parts = [];
    for (const ref of String(value || '')
      .split(/\s+/)
      .filter(Boolean)) {
      let target = null;
      try {
        target =
          root && typeof root.getElementById === 'function'
            ? root.getElementById(ref)
            : document.getElementById(ref);
        if (!target) target = document.getElementById(ref);
      } catch {}
      if (target) parts.push(norm(target.textContent));
    }
    return norm(parts.join(' '));
  }

  function tagOf(el) {
    return String(el.localName || el.tagName || '').toLowerCase();
  }

  function isImage(el) {
    const tag = tagOf(el);
    if (tag === 'img' || tag === 'svg') return true;
    if (tag === 'input') return String(attr(el, 'type') || '').toLowerCase() === 'image';
    return firstKnownRole(el) === 'img';
  }

  // The image's text alternative, per the RGAA glossary "Alternative
  // textuelle (image)"; for <svg>, its <title> child and <text> content too.
  function imageAlternative(el) {
    const tag = tagOf(el);
    const aria = idRefText(el, attr(el, 'aria-labelledby')) || norm(attr(el, 'aria-label'));
    if (aria) return aria;
    if (tag === 'img' || tag === 'input') {
      return norm(attr(el, 'alt')) || norm(attr(el, 'title'));
    }
    if (tag === 'svg') {
      const parts = [];
      for (const child of Array.from(el.children || [])) {
        if (tagOf(child) === 'title') parts.push(norm(child.textContent));
      }
      for (const t of Array.from(el.querySelectorAll ? el.querySelectorAll('text') : [])) {
        parts.push(norm(t.textContent));
      }
      return norm(parts.join(' '));
    }
    return '';
  }

  const EMBEDDED = new Set([
    'iframe',
    'frame',
    'video',
    'audio',
    'input',
    'select',
    'textarea',
    'meter',
    'progress',
    'object',
    'embed',
    'canvas'
  ]);

  function analyse(root) {
    const found = {
      text: false,
      alternative: false,
      hiddenText: false,
      unlabelledImage: false,
      generated: false,
      embedded: false,
      descendantAriaName: false
    };
    if (hasGeneratedContent(root)) found.generated = true;

    function walk(node, atHidden, depth) {
      if (depth > 200) return;
      for (const child of Array.from(node.childNodes || [])) {
        if (child.nodeType === 3) {
          if (!norm(child.data)) continue;
          if (isVisibilityHidden(child.parentElement)) continue;
          if (atHidden) found.hiddenText = true;
          else found.text = true;
          continue;
        }
        if (child.nodeType !== 1) continue;
        const tag = tagOf(child);
        if (tag === 'script' || tag === 'style' || tag === 'template' || tag === 'desc') continue;
        if (tag === 'title') {
          // The <title> child of an SVG link is part of its label.
          const text = norm(child.textContent);
          if (text) {
            if (atHidden) found.hiddenText = true;
            else found.text = true;
          }
          continue;
        }
        if (isNotRendered(child)) continue;
        const hidden = atHidden || String(attr(child, 'aria-hidden') || '').trim() === 'true';
        if (!hidden && hasGeneratedContent(child)) found.generated = true;

        if (isImage(child)) {
          if (hidden) continue;
          if (imageAlternative(child)) found.alternative = true;
          else found.unlabelledImage = true;
          continue;
        }
        if (EMBEDDED.has(tag)) {
          if (tag === 'input' && String(attr(child, 'type') || '').toLowerCase() === 'hidden') {
            continue;
          }
          if (!hidden) {
            const alt = norm(attr(child, 'aria-label')) || norm(attr(child, 'title'));
            if ((tag === 'object' || tag === 'embed' || tag === 'canvas') && alt) {
              found.alternative = true;
            } else {
              found.embedded = true;
            }
          }
          if (tag === 'object' || tag === 'canvas') walk(child, hidden, depth + 1);
          continue;
        }
        if (!hidden && (norm(attr(child, 'aria-label')) || norm(attr(child, 'aria-labelledby')))) {
          found.descendantAriaName = true;
        }
        walk(child, hidden, depth + 1);
      }
    }

    walk(root, false, 0);
    return found;
  }

  function isLink(el) {
    const tag = tagOf(el);
    const role = firstKnownRole(el);
    if (tag === 'a' && (el.hasAttribute('href') || el.hasAttribute('xlink:href'))) {
      // A focusable link keeps its role under none/presentation.
      return !role || role === 'link' || role === 'none' || role === 'presentation';
    }
    return role === 'link';
  }

  function isIncluded(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  const selector = 'a, [role]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const fails = [];
  const questions = [];
  let applicableCount = 0;
  const seen = new Set();

  for (const el of nodes) {
    if (!el || !el.getAttribute || seen.has(el)) continue;
    seen.add(el);
    if (!isLink(el) || !isIncluded(el)) continue;
    applicableCount += 1;

    const found = analyse(el);
    if (found.text || found.alternative) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;
    const visibilityFilter = eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] };

    let source = '';
    if (idRefText(el, attr(el, 'aria-labelledby'))) source = 'aria-labelledby';
    else if (norm(attr(el, 'aria-label'))) source = 'aria-label';
    else if (norm(attr(el, 'title'))) source = 'title';

    // Hidden text with no name at all leaves the link with no label for
    // anyone using assistive technologies, which fails.
    if (
      found.generated ||
      found.embedded ||
      found.descendantAriaName ||
      (found.hiddenText && source)
    ) {
      const evidence = {
        reasonCode: 'contentNotReadable',
        hiddenText: found.hiddenText,
        generated: found.generated,
        embedded: found.embedded,
        descendantAriaName: found.descendantAriaName
      };
      questions.push(
        helpers.reportOccurrence(el, {
          summary:
            'This link has content but no text or image text alternative that assistive technologies read: hidden text, CSS-generated text, an embedded element, or an element named by aria-label.',
          hint: 'Check whether the link content gives it a label. Put the link text inside the link, or give its image a text alternative.',
          i18n: {
            summaryKey: 'linkContentLabelPresent_summary_cantTell_contentNotReadable',
            hintKey: 'linkContentLabelPresent_hint_cantTell_contentNotReadable',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the link content that is not plain text gives the link a label.',
            evidence
          },
          data: { details: evidence, visibilityFilter }
        })
      );
      continue;
    }

    fails.push(
      helpers.reportOccurrence(el, {
        summary: source
          ? `This link has no text or image text alternative in its content; its name comes only from ${source}.`
          : 'This link has no text or image text alternative in its content.',
        hint: 'Put the link text inside the link, or an image with a text alternative. A name given only by aria-label, aria-labelledby or title does not count for RGAA 6.2.',
        i18n: {
          summaryKey: source
            ? 'linkContentLabelPresent_summary_fail_nameOutsideContent'
            : 'linkContentLabelPresent_summary_fail_noLabel',
          hintKey: 'linkContentLabelPresent_hint_fail',
          params: { source }
        },
        data: {
          details: {
            reasonCode: source ? 'nameOutsideContent' : 'noContentLabel',
            nameSource: source || null,
            unlabelledImage: found.unlabelledImage
          },
          visibilityFilter
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
