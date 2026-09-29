/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-title-patterns
 * @atomic true
 * @summary Manual review: page titles that may not describe their page
 * @standard WCAG 2.2
 * @sc 2.4.2
 * @applicability
 *   Applies to a run over a whole document whose <title> resolves to
 *   non-empty text; a missing or empty title is page-title-present's
 *   failure, not a pattern to review. A run narrowed by contextSelector or
 *   by engineOptions.fragment is notApplicable, as is a title matching none
 *   of the patterns below.
 * @expectation
 *   The title carries none of the conservative low-descriptiveness signals:
 *   one of the generic titles home, homepage, welcome, untitled, page or
 *   document; fewer than eight characters; or a template shape pairing a
 *   generic token with a brand, such as "Home | Brand". When the
 *   crawl.pageTitles probe supplies at least ten pages, cross-page signals
 *   are used instead: one title repeated across distinct URLs, or a prefix
 *   or suffix of twelve characters or more shared across the set. Every
 *   signal is reported as cantTell: whether a title describes its page is a
 *   judgment, so the rule never fails on a pattern alone.
 */

const id = 'page-title-patterns';

const meta = {
  title: 'Page title patterns that may be insufficiently descriptive',
  description:
    'Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.',
  i18n: {
    titleKey: 'pageTitlePatterns_title',
    descriptionKey: 'pageTitlePatterns_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag242', 'titles', 'atomic', 'navigation', 'manual'],
  wcagSc: ['2.4.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.2',
      title: 'Page Titled',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.2': ['page-title-patterns'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;
  const probes =
    ctx && ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;

  const pageTitlesProbe =
    probes && probes['crawl.pageTitles'] && typeof probes['crawl.pageTitles'] === 'object'
      ? probes['crawl.pageTitles']
      : null;

  const occurrences = [];
  let applicableCount = 1;

  const titleEl = document.querySelector('head > title');
  const rawTitle = document.title || '';
  const titleText = rawTitle.replace(/\s+/g, ' ').trim();
  const titleLc = titleText.toLowerCase();
  // =========================
  // Cross-page pattern analysis (preferred) if crawl.pageTitles probe is provided
  // =========================
  if (pageTitlesProbe && Array.isArray(pageTitlesProbe.pages)) {
    const pages = pageTitlesProbe.pages.filter((p) => p && typeof p === 'object');

    // Require enough data to avoid noisy conclusions
    const MIN_PAGES = 10;
    const analyzable = pages
      .map((p) => ({
        url: p.url ? String(p.url) : null,
        title: typeof p.title === 'string' ? p.title.replace(/\s+/g, ' ').trim() : ''
      }))
      .filter((p) => p.url && p.title);

    if (analyzable.length >= MIN_PAGES) {
      // Build normalized title groups (case-insensitive)
      const groups = new Map(); // normTitle -> { title, urls: [] }
      for (const p of analyzable) {
        const norm = p.title.toLowerCase();
        if (!groups.has(norm)) groups.set(norm, { title: p.title, urls: [] });
        groups.get(norm).urls.push(p.url);
      }

      // Duplicate titles across distinct URLs is a strong "review" signal (not a guaranteed failure)
      const dupGroups = Array.from(groups.values()).filter((g) => g.urls.length >= 2);

      // Boilerplate-ish: detect a long common suffix/prefix across most titles.
      // Keep conservative: only flag if the common part is long and shared by many.
      const titles = analyzable.map((p) => p.title);
      function commonPrefix(a, b) {
        const n = Math.min(a.length, b.length);
        let i = 0;
        for (; i < n; i++) if (a[i] !== b[i]) break;
        return a.slice(0, i);
      }
      function commonSuffix(a, b) {
        const ra = a.split('').reverse().join('');
        const rb = b.split('').reverse().join('');
        return commonPrefix(ra, rb).split('').reverse().join('');
      }

      let sharedPrefix = titles[0] || '';
      let sharedSuffix = titles[0] || '';
      for (let i = 1; i < titles.length; i++) {
        sharedPrefix = commonPrefix(sharedPrefix, titles[i]);
        sharedSuffix = commonSuffix(sharedSuffix, titles[i]);
        if (sharedPrefix.length === 0 && sharedSuffix.length === 0) break;
      }

      const prefixLen = sharedPrefix.trim().length;
      const suffixLen = sharedSuffix.trim().length;

      const hasStrongTemplateSignal =
        (prefixLen >= 12 || suffixLen >= 12) &&
        (prefixLen >= 12 ? sharedPrefix.trim().length : 0) +
          (suffixLen >= 12 ? sharedSuffix.trim().length : 0) >=
          12;

      // If any cross-page signal exists, emit cantTell occurrence(s)
      if (dupGroups.length || hasStrongTemplateSignal) {
        const reasonCode = dupGroups.length
          ? 'duplicateTitlesAcrossPages'
          : 'templatedTitlesAcrossPages';

        // Deterministic example title for i18n params (lexicographic, case-insensitive)
        const exampleTitle = dupGroups.length
          ? dupGroups
              .map((g) =>
                String(g.title || '')
                  .replace(/\s+/g, ' ')
                  .trim()
              )
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))[0] || ''
          : '';

        const summaryKey = dupGroups.length
          ? 'pageTitlePatterns_summary_cantTell_duplicateAcrossPages'
          : 'pageTitlePatterns_summary_cantTell_templatedAcrossPages';

        const i18nParams = dupGroups.length
          ? {
              reasonCode,
              pagesAnalyzed: analyzable.length,
              duplicateGroups: dupGroups.length,
              exampleTitle
            }
          : {
              reasonCode,
              pagesAnalyzed: analyzable.length
            };

        const occBase = {
          selector: 'head > title',
          html: '',
          summary:
            'The set of page titles may not be descriptive enough to distinguish pages by topic or purpose.',
          hint: 'Ensure each page title is sufficiently descriptive and helps users distinguish pages (avoid identical or overly templated titles across many pages).',
          i18n: {
            summaryKey,
            hintKey: 'pageTitlePatterns_hint_cantTell',
            params: i18nParams
          },
          data: {
            details: {
              reasonCode,
              metrics: {
                pagesAnalyzed: analyzable.length,
                duplicateGroups: dupGroups.length,
                largestDuplicateGroupSize: dupGroups.length
                  ? Math.max(...dupGroups.map((g) => g.urls.length))
                  : 0,
                sharedPrefix: prefixLen >= 12 ? sharedPrefix.trim() : '',
                sharedSuffix: suffixLen >= 12 ? sharedSuffix.trim() : ''
              },
              refs: {
                exampleDuplicateTitles: dupGroups.slice(0, 3).map((g) => ({
                  title: g.title,
                  urls: g.urls.slice(0, 5)
                }))
              }
            },
            visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        };

        if (titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
          occurrences.push(helpers.reportOccurrence(titleEl, occBase));
        } else {
          // No node available: keep deterministic fallback snippet (no helper calls).
          occurrences.push({
            ...occBase,
            html:
              titleEl && titleEl.outerHTML
                ? String(titleEl.outerHTML).slice(0, 2000)
                : '<title>(unknown)</title>'
          });
        }

        // Cross-page analysis is authoritative when present; do not also run single-page heuristics.
        return {
          ruleId: rule.ruleId,
          outcome: 'cantTell',
          severity: rule.defaultSeverity || 'minor',
          occurrences
        };
      }

      // If we had enough pages and found no review signal, there is nothing
      // to flag for manual review.
      return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    // Not enough analyzable pages -> notApplicable for cross-page patterns, fall back to single-page logic.
  }

  // If there's no title (or empty), defer to the hard-fail rule.
  if (!titleEl || titleText.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const GENERIC_TITLES = {
    en: new Set(['home', 'homepage', 'welcome', 'untitled', 'page', 'document']),
    de: new Set(['startseite', 'willkommen', 'unbenannt', 'ohne titel', 'seite', 'dokument']),
    es: new Set([
      'inicio',
      'página de inicio',
      'bienvenido',
      'bienvenida',
      'sin título',
      'página',
      'documento'
    ]),
    fr: new Set(['accueil', "page d'accueil", 'bienvenue', 'sans titre', 'page', 'document']),
    ja: new Set(['ホーム', 'トップページ', 'トップ', 'ようこそ', '無題', 'ページ', 'ドキュメント'])
  };

  // The page-specific half of "Brand | Home" in languages other than
  // English. English keeps its word-boundary patterns below.
  const TEMPLATE_TOKENS = {
    de: ['startseite', 'willkommen'],
    es: ['inicio', 'página de inicio', 'bienvenido', 'bienvenida'],
    fr: ['accueil', "page d'accueil", 'bienvenue'],
    ja: ['ホーム', 'トップページ', 'トップ', 'ようこそ']
  };

  const htmlEl = document.documentElement;
  const pageLang =
    htmlEl && htmlEl.getAttribute && htmlEl.getAttribute('lang')
      ? htmlEl.getAttribute('lang').trim().split('-')[0].toLowerCase()
      : '';
  const titleNorm = titleLc.normalize('NFKC').replace(/[\u2018\u2019]/g, "'");

  // Chinese, Japanese and Korean characters each carry roughly a word, so
  // they count double: 「お問い合わせ」 is a full title in six characters.
  function effectiveLength(s) {
    let n = 0;
    for (const ch of s)
      n += /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/.test(ch) ? 2 : 1;
    return n;
  }

  // Conservative signals:
  // - very short title (likely non-descriptive)
  // - title is one of a small set of generic titles
  const isVeryShort = titleText.length > 0 && effectiveLength(titleText) < 8;
  const isGeneric =
    GENERIC_TITLES.en.has(titleNorm) ||
    !!(pageLang && GENERIC_TITLES[pageLang] && GENERIC_TITLES[pageLang].has(titleNorm));

  function isLocalTemplate(title) {
    const tokens = TEMPLATE_TOKENS[pageLang];
    if (!tokens) return false;
    const parts = title.split(/\s*(?:\||-|—|:)\s*/).filter(Boolean);
    if (parts.length < 2) return false;
    return tokens.includes(parts[0]) || tokens.includes(parts[parts.length - 1]);
  }

  // Template-like: "Brand | Home" or "Home - Brand" where the page-specific part is a generic token.
  const templateLike =
    /\b(home|homepage|welcome)\b\s*(\||-|—|:)\s*.+/i.test(titleText) ||
    /.+\s*(\||-|—|:)\s*\b(home|homepage|welcome)\b/i.test(titleText) ||
    isLocalTemplate(titleNorm);

  if (isGeneric || isVeryShort || templateLike) {
    const reasonCode = isGeneric
      ? 'genericTitle'
      : isVeryShort
        ? 'veryShortTitle'
        : 'templateLikeTitle';

    const summaryKey =
      reasonCode === 'genericTitle'
        ? 'pageTitlePatterns_summary_cantTell_generic'
        : reasonCode === 'veryShortTitle'
          ? 'pageTitlePatterns_summary_cantTell_veryShort'
          : 'pageTitlePatterns_summary_cantTell_templateLike';
    const occBase = {
      selector: 'head > title',
      html: '',
      summary:
        'The page title may not be descriptive enough to identify the page topic or purpose.',
      hint: 'Use a more specific title that identifies the page topic or purpose (for example, include the section name or task).',
      i18n: {
        summaryKey,
        hintKey: 'pageTitlePatterns_hint_cantTell',
        params: {}
      },
      data: {
        details: {
          reasonCode,
          titleText
        },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(titleEl, occBase));
    } else {
      occurrences.push({
        ...occBase,
        html:
          titleEl && titleEl.outerHTML
            ? String(titleEl.outerHTML).slice(0, 2000)
            : '<title>(unknown)</title>'
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    // Patterns are review signals: cantTell rather than fail.
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
