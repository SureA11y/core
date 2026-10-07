/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-language-present
 * @atomic true
 * @summary The page must give a default language, on <html> or on every text
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document with a root <html> element. A
 *   run narrowed by contextSelector or engineOptions.fragment is
 *   notApplicable.
 * @expectation
 *   RGAA 8.3.1 accepts either of two conditions: the language (lang and/or
 *   xml:lang) is given on the <html> element, or it is given on each text
 *   element or on one of its parents. The rule
 *   - passes when <html> has a non-empty lang;
 *   - passes when <html> has a non-empty xml:lang and no lang, on an XHTML
 *     1.1 page or a page parsed as XML, where xml:lang is the attribute the
 *     methodology asks for; on any other page it asks (cantTell), because
 *     the glossary "Langue par défaut" makes lang mandatory for HTML 4 and
 *     HTML5 and requires both attributes for XHTML 1.0 served as text/html,
 *     while the test's wording (« lang et/ou xml:lang ») accepts either;
 *   - otherwise, passes when every text in <body> has an ancestor, itself
 *     included, whose nearest lang or xml:lang is non-empty, and asks when
 *     some of that text depends on xml:lang alone in the same conditions;
 *   - fails when some rendered text in <body> has no language at all, or
 *     when no element carries a language.
 * @implementation-notes
 * - The HTML version comes from helpers.getDoctypeInfo().
 * - Text inside script, style, template and noscript is not text of the
 *   page, and text in hidden content (display:none, hidden and the like)
 *   is not read, so neither counts against the page. Text in <head> (the
 *   <title>) is not part of the second condition.
 * - lang="" states that the language is unknown, so text under it has no
 *   language.
 * - html-lang-attr-present (WCAG 3.1.1) asks for lang on <html> only, so it
 *   fails a page whose language is on <body>, or on <html> through xml:lang
 *   in XHTML 1.1, both of which 8.3.1 accepts.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'page-language-present';

const meta = {
  title: 'Page gives a default language',
  description:
    'Checks that the page gives its default language with lang or xml:lang, on <html> or on an ancestor of every text.',
  i18n: {
    titleKey: 'pageLanguagePresent_title',
    descriptionKey: 'pageLanguagePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const XML_NS = 'http://www.w3.org/XML/1998/namespace';
  const SKIP = new Set(['script', 'style', 'template', 'noscript']);

  const html = document && dom.documentElement(document);
  if (!html || String(dom.tagName(html) || '').toLowerCase() !== 'html') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const doctype = helpers.getDoctypeInfo ? helpers.getDoctypeInfo() : { kind: 'none' };
  const isXmlDocument =
    String(document.contentType || '').toLowerCase() === 'application/xhtml+xml' ||
    String(document.contentType || '').toLowerCase() === 'application/xml';
  // Whether xml:lang alone is the language the methodology asks for.
  const xmlLangSuffices = isXmlDocument || doctype.kind === 'xhtml11';

  function languageOf(el) {
    const hasLang = dom.hasAttribute(el, 'lang');
    let xml = el.getAttributeNS ? el.getAttributeNS(XML_NS, 'lang') : null;
    if (xml == null) xml = dom.getAttribute(el, 'xml:lang');
    if (!hasLang && xml == null) return null;
    const lang = String(dom.getAttribute(el, 'lang') || '').trim();
    const xmlLang = String(xml || '').trim();
    if (lang) return { source: 'lang', value: lang };
    if (xmlLang) return { source: 'xml:lang', value: xmlLang };
    return { source: 'none', value: '' };
  }

  function occurrence(reasonCode, extra) {
    const texts = {
      xmlLangOnly: [
        'The page gives its language with xml:lang only, which this HTML version does not read.',
        'Add lang with the same value, for example <html lang="fr" xml:lang="fr">.'
      ],
      missingLanguage: [
        'The page gives no default language: no element has a lang or xml:lang attribute.',
        'Add a lang attribute to the <html> element, for example <html lang="fr">.'
      ],
      uncoveredText: [
        'Some text of the page has no language: neither <html> nor any of its parents has a lang or xml:lang attribute.',
        'Add a lang attribute to the <html> element, for example <html lang="fr">.'
      ]
    };
    return helpers.reportOccurrence(html, {
      summary: texts[reasonCode][0],
      hint: texts[reasonCode][1],
      i18n: {
        summaryKey:
          reasonCode === 'xmlLangOnly'
            ? 'pageLanguagePresent_summary_cantTell_xmlLangOnly'
            : 'pageLanguagePresent_summary_fail_' + reasonCode,
        hintKey:
          reasonCode === 'xmlLangOnly'
            ? 'pageLanguagePresent_hint_cantTell_xmlLangOnly'
            : 'pageLanguagePresent_hint_fail',
        params: {}
      },
      uncertainty:
        reasonCode === 'xmlLangOnly'
          ? {
              code: 'spec-only',
              needed:
                'Whether RGAA accepts xml:lang without lang for this HTML version and media type.',
              evidence: { doctype: doctype.kind }
            }
          : undefined,
      data: {
        details: { reasonCode, doctype: doctype.kind, ...(extra || {}) },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
  }

  function result(outcome, occurrences) {
    return {
      ruleId: rule.ruleId,
      outcome,
      severity: outcome === 'pass' ? 'minor' : rule.defaultSeverity || 'serious',
      occurrences: occurrences || []
    };
  }

  // First condition: the language is given on <html>.
  const own = languageOf(html);
  if (own && own.source === 'lang') return result('pass');
  if (own && own.source === 'xml:lang') {
    return xmlLangSuffices
      ? result('pass')
      : result('cantTell', [occurrence('xmlLangOnly', { location: 'html' })]);
  }

  // Second condition: the language is given on each text or on a parent.
  const root = dom.body(document) || html;
  const cache = new Map();
  function nearest(el) {
    const path = [];
    let found = null;
    for (let n = el; n && dom.nodeType(n) === 1; n = dom.parentElement(n)) {
      if (cache.has(n)) {
        found = cache.get(n);
        break;
      }
      path.push(n);
      const info = languageOf(n);
      if (info) {
        found = info;
        break;
      }
    }
    for (const n of path) cache.set(n, found);
    return found;
  }

  // Displayed text, whether or not it is exposed to assistive technologies:
  // aria-hidden text is still read on screen.
  function isRendered(el) {
    if (!helpers.isDomVisibleEligible) return true;
    const vis = helpers.isDomVisibleEligible(el, ctx, {
      visibilityMode: 'styleOnly',
      disableGeometry: true,
      ignoreOpacity: true
    });
    return !!(vis && vis.eligible);
  }

  let anyLanguage = !!(own && own.value);
  let xmlOnly = false;
  let uncovered = null;
  const walker = dom.createTreeWalker(document, root, 4);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!/\S/.test(t.data || '')) continue;
    const parent = dom.parentElement(t);
    if (!parent) continue;
    let skipped = false;
    for (let n = parent; n; n = dom.parentElement(n)) {
      if (SKIP.has(String(dom.localName(n) || '').toLowerCase())) {
        skipped = true;
        break;
      }
    }
    if (skipped) continue;
    const info = nearest(parent);
    if (info && info.value) {
      anyLanguage = true;
      if (info.source === 'xml:lang' && !xmlLangSuffices) xmlOnly = true;
      continue;
    }
    if (!uncovered && isRendered(parent)) uncovered = parent;
  }

  if (!anyLanguage && !uncovered) {
    // Look for a language anywhere, for the reason code only.
    const any = dom.querySelectorAll(document, '[lang]');
    for (const el of any) {
      if (String(dom.getAttribute(el, 'lang') || '').trim()) anyLanguage = true;
    }
  }

  if (uncovered) {
    const element = String(dom.localName(uncovered) || '').toLowerCase();
    return result('fail', [
      occurrence(anyLanguage ? 'uncoveredText' : 'missingLanguage', { element })
    ]);
  }
  if (!anyLanguage) return result('fail', [occurrence('missingLanguage')]);
  if (xmlOnly) return result('cantTell', [occurrence('xmlLangOnly', { location: 'text' })]);
  return result('pass');
}

module.exports = { id, meta, runInPage, applicability };
