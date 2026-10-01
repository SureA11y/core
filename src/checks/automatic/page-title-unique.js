/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-title-unique
 * @atomic true
 * @summary A page title must not be shared with another page of the site
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose <title> has text. A page
 *   with no title, or an empty one, is page-title-present's (RGAA 8.5.1)
 *   and notApplicable here.
 * @expectation
 *   RGAA 8.6.1 asks that the title be relevant, and the glossary entry
 *   « Titre de page » defines a relevant title as one that identifies the
 *   page « de manière claire, concise et unique ». The title is compared,
 *   with case and spacing ignored, with the other pages of the site given
 *   in the `crawl.pageTitles` probe (`{ pages: [{ url, title }] }`):
 *   - another page, at another path, with the same title fails
 *     (TITLE_DUPLICATE);
 *   - another page whose URL differs from this one only by its query
 *     string, with the same title, is asked about, since it may be this
 *     same page (TITLE_DUPLICATE_SAME_PATH);
 *   - with no other page to compare, the title is asked about
 *     (TITLE_SINGLE_PAGE).
 *   It passes when no other page shares the title.
 * @implementation-notes
 * - The result carries the page's own record as `data.page`: { url, title },
 *   the shape of a crawl.pageTitles entry, so a crawler can scan each page
 *   once and pass the records back.
 * - URLs are compared without their fragment, and a trailing slash on the
 *   path is ignored. The page's own URL is left out of the comparison.
 * - page-title-patterns (WCAG 2.4.2) asks about generic and templated titles,
 *   and about duplicates across the probe as a whole; this rule judges this
 *   page's title against the others.
 * - Opt-in (tag `rgaa`): WCAG 2.4.2 does not ask for unique titles.
 */

const id = 'page-title-unique';

const meta = {
  title: 'Page titles are unique across the site',
  description:
    'Compares the page title with the titles of the site’s other pages, given as the crawl.pageTitles probe, and fails one shared with another page, since RGAA 8.6.1 asks for a title that identifies the page uniquely.',
  i18n: {
    titleKey: 'pageTitleUnique_title',
    descriptionKey: 'pageTitleUnique_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'document', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  function norm(t) {
    return String(t == null ? '' : t)
      .replace(/\s+/g, ' ')
      .trim();
  }
  // { key: origin + path without a trailing slash, full: key + query }
  function urlParts(u) {
    try {
      const url = new URL(String(u), document.baseURI);
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const key = url.origin + path;
      return { key, full: key + url.search };
    } catch {
      const s = String(u || '').replace(/#.*$/, '');
      return { key: s.replace(/\?.*$/, ''), full: s };
    }
  }

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  let titleEl = null;
  for (const t of Array.from(document.getElementsByTagName('title'))) {
    if (!t.namespaceURI || t.namespaceURI === HTML_NS) {
      titleEl = t;
      break;
    }
  }
  const title = norm(document.title);
  const here = urlParts(document.URL);
  const page = { url: here.full, title };

  if (!titleEl || !title) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { page }
    };
  }

  const probes =
    ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;
  const probe =
    probes && probes['crawl.pageTitles'] && typeof probes['crawl.pageTitles'] === 'object'
      ? probes['crawl.pageTitles']
      : null;
  const others = (probe && Array.isArray(probe.pages) ? probe.pages : [])
    .filter((p) => p && typeof p === 'object' && p.url && typeof p.title === 'string')
    .map((p) => ({ url: String(p.url), title: norm(p.title), parts: urlParts(p.url) }))
    .filter((p) => p.title && p.parts.full !== here.full);

  const same = others.filter((p) => p.title.toLowerCase() === title.toLowerCase());
  const otherPath = same.filter((p) => p.parts.key !== here.key);
  const samePath = same.filter((p) => p.parts.key === here.key);

  const selector =
    titleEl.parentElement && titleEl.parentElement.localName === 'head'
      ? 'head > title'
      : undefined;
  function report(reasonCode, key, summary, hint, pages, uncertainty) {
    const params = { title, pages: pages.map((p) => p.url).join(', ') };
    return helpers.reportOccurrence(titleEl, {
      ...(selector ? { selector } : {}),
      summary,
      hint,
      i18n: {
        summaryKey: `pageTitleUnique_summary_${key}`,
        hintKey: `pageTitleUnique_hint_${key}`,
        params
      },
      ...(uncertainty ? { uncertainty } : {}),
      data: { details: { reasonCode, title, pages: pages.map((p) => p.url) } }
    });
  }

  const fails = [];
  const questions = [];
  const GLOSSARY = '« de manière claire, concise et unique »';
  if (otherPath.length) {
    fails.push(
      report(
        'TITLE_DUPLICATE',
        'fail_duplicate',
        `Other pages of the site have the same title, "${title}": ${otherPath.map((p) => p.url).join(', ')}. RGAA asks that a page title identify the page ${GLOSSARY}.`,
        'Give each page a title of its own that says what this page holds, for instance the page’s subject followed by the site’s name (RGAA 8.6.1).',
        otherPath
      )
    );
  } else if (samePath.length) {
    questions.push(
      report(
        'TITLE_DUPLICATE_SAME_PATH',
        'cantTell_samePath',
        `A page whose address differs from this one only by its query string has the same title, "${title}": ${samePath.map((p) => p.url).join(', ')}.`,
        `Check whether these addresses show different pages. If they do, give each its own title: RGAA asks that a page title identify the page ${GLOSSARY} (RGAA 8.6.1).`,
        samePath,
        {
          code: 'equivalence-unknown',
          needed: 'Whether the addresses show the same page or different ones.',
          evidence: { reasonCode: 'TITLE_DUPLICATE_SAME_PATH' }
        }
      )
    );
  } else if (!others.length) {
    questions.push(
      report(
        'TITLE_SINGLE_PAGE',
        'cantTell_singlePage',
        `Only this page was available, so whether its title, "${title}", is unique across the site could not be checked.`,
        `Scan several pages of the site and pass their titles as the crawl.pageTitles probe, or check that no other page has this title: RGAA asks that a page title identify the page ${GLOSSARY} (RGAA 8.6.1).`,
        [],
        {
          code: 'out-of-scope',
          needed: 'Whether another page of the site has the same title.',
          evidence: { reasonCode: 'TITLE_SINGLE_PAGE' }
        }
      )
    );
  }

  if (!fails.length && !questions.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'pass',
      severity: 'minor',
      occurrences: [],
      data: { page }
    };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate'),
    data: { page }
  };
}

module.exports = { id, meta, runInPage, applicability };
