/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check heading-content-present
 * @atomic true
 * @summary A heading must have text or an image text alternative in its content
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the headings RGAA defines (glossary "Titre"), included in the
 *   accessibility tree: <h1>-<h6> without a role other than heading, and
 *   elements with role="heading" and an aria-level attribute. An element
 *   with role="heading" but no aria-level is not an RGAA heading;
 *   heading-role-level-present reports it. A heading hidden only visually
 *   (a screen-reader-only class) is still a heading, as the glossary says. A
 *   page with none is notApplicable.
 * @expectation
 *   The heading's content holds text, or an image with a text alternative
 *   (alt, aria-label, aria-labelledby, title, or the <title> of an <svg>).
 *   RGAA 9.1.2 asks whether the content of each heading is relevant; a
 *   heading with no content has nothing to judge, so it fails. When the
 *   content gives no text but the heading is not empty, the rule asks
 *   instead:
 *   - the heading is named only by its own title, aria-label or
 *     aria-labelledby, or by an aria-label on an element inside it: 9.1.2
 *     judges the content, and whether such a name makes it relevant is left
 *     to a person;
 *   - the content is text hidden from assistive technologies
 *     (aria-hidden="true"), an image with no text alternative, text added
 *     by CSS (::before, ::after), or an embedded element such as a form
 *     field or a frame.
 * @implementation-notes
 * - Content inside hidden, display:none or visibility:hidden elements is not
 *   content: nobody sees or hears it.
 * - CSS-generated text is read from the computed ::before and ::after
 *   content, only where the page has a layout (a browser). jsdom does not
 *   compute it, so there a heading whose only content is generated fails.
 * - Opt-in (tag `rgaa`): the WCAG side is empty-heading, which asks about a
 *   heading with no accessible name and accepts title or aria-label. The
 *   rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own
 *   id.
 */

const id = 'heading-content-present';

const meta = {
  title: 'Headings have content',
  description:
    'Checks that each heading holds text or an image with a text alternative, rather than being empty or named only by attributes.',
  i18n: {
    titleKey: 'headingContentPresent_title',
    descriptionKey: 'headingContentPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'headings', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
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

  // The name an element gets from its own attributes.
  function ownAttributeName(el) {
    return (
      idRefText(el, attr(el, 'aria-labelledby')) ||
      norm(attr(el, 'aria-label')) ||
      norm(attr(el, 'title'))
    );
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
          // An SVG <title> names its parent; its text is content only there.
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

  function isHeading(el) {
    const tag = tagOf(el);
    const role = firstKnownRole(el);
    if (/^h[1-6]$/.test(tag)) return !role || role === 'heading';
    return role === 'heading' && el.hasAttribute && el.hasAttribute('aria-level');
  }

  function isIncluded(el) {
    const r = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  const selector = 'h1, h2, h3, h4, h5, h6, [role]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const fails = [];
  const questions = [];
  let applicableCount = 0;
  const seen = new Set();

  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isHeading(el) || !isIncluded(el)) continue;
    applicableCount += 1;

    const found = analyse(el);
    if (found.text || found.alternative) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;
    const visibilityFilter = eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] };
    const attributeName = ownAttributeName(el);

    if (attributeName || found.descendantAriaName) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary: attributeName
            ? `This heading has no text in its content; its only name, "${attributeName}", comes from an attribute.`
            : 'This heading has no text in its content; its only name comes from an aria-label inside it.',
          hint: 'Check whether the heading is relevant to someone who sees the page. Put its text in the heading itself rather than in title or aria-label.',
          i18n: {
            summaryKey: attributeName
              ? 'headingContentPresent_summary_cantTell_nameOutsideContent'
              : 'headingContentPresent_summary_cantTell_descendantName',
            hintKey: 'headingContentPresent_hint_cantTell_nameOutsideContent',
            params: { name: attributeName }
          },
          uncertainty: {
            code: 'judgement-required',
            needed:
              'Whether a heading whose text comes only from an attribute has relevant content.',
            evidence: { reasonCode: 'nameOutsideContent' }
          },
          data: {
            details: { reasonCode: 'nameOutsideContent', name: attributeName || null },
            visibilityFilter
          }
        })
      );
      continue;
    }

    if (found.hiddenText || found.unlabelledImage || found.generated || found.embedded) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary:
            'This heading has content but no text that assistive technologies read: hidden text, an image with no text alternative, CSS-generated text or an embedded element.',
          hint: 'Check what the heading shows. Give it text, or give its image a text alternative, so the heading says what the section is about.',
          i18n: {
            summaryKey: 'headingContentPresent_summary_cantTell_contentNotReadable',
            hintKey: 'headingContentPresent_hint_cantTell_contentNotReadable',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the heading content a person sees is relevant.',
            evidence: {
              reasonCode: 'contentNotReadable',
              hiddenText: found.hiddenText,
              unlabelledImage: found.unlabelledImage,
              generated: found.generated,
              embedded: found.embedded
            }
          },
          data: {
            details: {
              reasonCode: 'contentNotReadable',
              hiddenText: found.hiddenText,
              unlabelledImage: found.unlabelledImage,
              generated: found.generated,
              embedded: found.embedded
            },
            visibilityFilter
          }
        })
      );
      continue;
    }

    fails.push(
      helpers.reportOccurrence(el, {
        summary: 'This heading is empty: it has no text and no image with a text alternative.',
        hint: 'Put the heading text inside the heading, or remove the heading if it is not needed.',
        i18n: {
          summaryKey: 'headingContentPresent_summary_fail_empty',
          hintKey: 'headingContentPresent_hint_fail_empty',
          params: {}
        },
        data: { details: { reasonCode: 'emptyHeading' }, visibilityFilter }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate')
  };
}

module.exports = { id, meta, runInPage };
