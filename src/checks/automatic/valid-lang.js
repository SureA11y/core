/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check valid-lang
 * @atomic true
 * @summary Any element's lang attribute must be a syntactically valid language tag
 * @standard WCAG 2.2
 * @sc 3.1.2
 * @applicability
 *   Applies to any element other than the root <html> with a non-empty
 *   lang attribute AND at least some non-whitespace "governed text" that
 *   actually inherits its language from that element, per ACT de46e4:
 *   - Descendant text/alt is governed by the nearest lang-carrying
 *     ancestor only, a nested descendant with its own non-empty lang
 *     re-scopes everything inside it, so that subtree no longer counts
 *     toward the outer element's applicability (it counts toward the
 *     nested element's own, if that one is also being evaluated).
 *   - A non-empty alt attribute on img/area/input[type=image] counts as
 *     governed text, the same as a text node.
 *   - Text (or alt) that CSS keeps out of the render tree (display:none,
 *     the hidden attribute, ...) does not count. aria-hidden and
 *     offscreen positioning do NOT exempt text, per ACT's own failed
 *     examples for both, only actual non-rendering does.
 * @expectation
 *   The lang value matches a valid BCP47 language-tag syntax. WCAG 3.1.2
 *   (Language of Parts) requires that when a passage's language differs
 *   from the page's default, it is identified programmatically. An
 *   invalid tag fails to identify a real language at all.
 * @implementation-notes
 * - Distinct, atomic decision from html-lang-attr-present (that
 *   rule covers the root <html> element only, for SC 3.1.1); this rule
 *   covers every other element, for SC 3.1.2.
 * - Same minimal BCP47 *syntax* check as html-lang-attr-present (primary
 *   subtag + optional subtags), not IANA Language Subtag Registry
 *   validation, same documented scope limitation (syntactically
 *   well-formed but unregistered tags like "xx-ZZ" are not flagged).
 */

const id = 'valid-lang';

const meta = {
  title: 'Element lang attribute must be syntactically valid',
  description:
    'Checks that any element (other than the root <html>) with a non-empty lang attribute uses a syntactically valid language tag.',
  i18n: {
    titleKey: 'validLang_title',
    descriptionKey: 'validLang_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag312', 'structure', 'language', 'atomic', 'automatic'],
  wcagSc: ['3.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.1.2',
      title: 'Language of Parts',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '3.1.2': ['element-lang-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // Shape alone accepts unregistered tags such as "eng" and "em-US", so the
  // primary subtag is checked against the IANA registry via the shared helper.
  const BCP47_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;
  const isValidTag =
    typeof helpers.isValidLanguageTag === 'function'
      ? helpers.isValidLanguageTag
      : (v) => BCP47_RE.test(String(v || ''));

  function isDomVisible(node) {
    if (!node) return false;
    if (helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(node, ctx, { targetSet: 'dom' }).eligible;
    if (helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(node, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  function hasOwnNonEmptyLang(node) {
    try {
      const v = node.getAttribute ? node.getAttribute('lang') : null;
      return v != null && v.trim() !== '';
    } catch {
      return false;
    }
  }

  function isAltBearing(node) {
    const tag = (node.tagName || '').toLowerCase();
    if (tag === 'img' || tag === 'area') return true;
    if (tag !== 'input') return false;
    try {
      return (node.getAttribute('type') || '').toLowerCase() === 'image';
    } catch {
      return false;
    }
  }

  // "Governed text": non-whitespace text (or alt) that inherits its
  // language from `root`, per ACT de46e4, see @applicability above. Walks
  // the flat subtree, stopping at any descendant carrying its own non-empty
  // lang (that subtree governs itself, not `root`), and treating
  // display:none/hidden content as absent. Bails out as soon as any
  // qualifying text is found; a node-visit budget guards pathological
  // markup the same way other subtree walks in this engine do.
  const MAX_VISITS = 5000;
  function hasGovernedText(root) {
    let found = false;
    let visits = 0;

    function walk(node, isRoot) {
      if (found || visits++ > MAX_VISITS) return;
      if (!node || node.nodeType !== 1) return;
      if (!isRoot && hasOwnNonEmptyLang(node)) return; // re-scoped to itself

      if (isAltBearing(node)) {
        const alt = node.getAttribute ? node.getAttribute('alt') : null;
        if (alt != null && alt.trim() !== '' && isDomVisible(node)) found = true;
        return; // alt-bearing elements have no other text to walk into
      }

      if (!isDomVisible(node)) return;

      const kids = node.childNodes ? Array.from(node.childNodes) : [];
      for (const kid of kids) {
        if (found) return;
        if (kid.nodeType === 3) {
          if (String(kid.nodeValue || '').trim()) {
            found = true;
            return;
          }
        } else if (kid.nodeType === 1) {
          walk(kid, false);
        }
      }
    }

    walk(root, true);
    return found;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[lang]')
    : helpers.queryAll('[lang]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.tagName && el.tagName.toLowerCase() === 'html') continue;

    const rawAttr = el.getAttribute('lang');
    if (rawAttr === null || rawAttr === '') continue; // ACT de46e4: empty is out of scope

    // The rule applies only where text actually inherits the language from
    // THIS element specifically, not merely where the subtree has any text
    // at all, which could all belong to a nested element's own (possibly
    // valid) lang instead. See hasGovernedText's doc comment.
    if (!hasGovernedText(el)) continue;

    applicableCount += 1;

    // A whitespace-only value is in scope and has no primary language tag.
    const raw = String(rawAttr).trim();
    if (isValidTag(raw)) continue;

    const tag = el.tagName.toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This lang attribute value ("${raw}") is not a syntactically valid language tag.`,
        hint: 'Use a valid BCP47 language tag (e.g. "fr", "es-MX").',
        i18n: {
          summaryKey: 'validLang_summary_fail',
          hintKey: 'validLang_hint_fail',
          params: { element: tag, value: raw }
        },
        data: {
          details: { reasonCode: 'ELEMENT_LANG_INVALID', element: tag, value: raw }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
