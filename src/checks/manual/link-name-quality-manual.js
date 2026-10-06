/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-quality
 * @atomic true
 * @summary Link text should not be a generic, non-descriptive phrase
 * @standard WCAG 2.2
 * @sc 2.4.4
 * @applicability
 *   `a[href]`, `area[href]` and elements whose role attribute resolves to
 *   link (its first real role token, in any case) with a
 *   non-empty computed accessible name (programmatic first, then "name
 *   from content", same two-step resolution as `link-name-present`,
 *   same selector too). Links with no name at all are
 *   `link-name-present`'s concern, not this rule's.
 * @expectation
 *   The link's full accessible name, normalized (trimmed, case-folded,
 *   trailing punctuation stripped), is not an exact match for a known
 *   non-descriptive phrase ("click here", "read more", "more", "here",
 *   "details", "link", etc., WCAG technique F84's known failure pattern
 *   for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB",
 *   ...) with no adjacent context (an aria-describedby target, the
 *   enclosing list item/table cell/paragraph's own text, or (format
 *   names only) a table's first-row header) naming what it belongs to.
 * @reports
 *   - `normalizedName`: the link's accessible name as it was matched: in
 *     lowercase, with spacing collapsed and trailing punctuation removed.
 *     It is a generic phrase (`GENERIC_LINK_TEXT`) or a bare format name
 *     (`AMBIGUOUS_FORMAT_NAME`).
 * @implementation-notes
 * - Phrase lists exist for en, de, es, fr and ja. English is always
 *   checked; the list for the element's own language (nearest lang
 *   attribute, across shadow roots) is added on top. Matching every list
 *   everywhere would flag words that are generic in one language and a
 *   real name in another ("Suite", "Plus" on an English page).
 * - EXACT match only, on purpose, against small, well-established
 *   phrase lists, not a substring/contains check. "Read more about our
 *   privacy policy" does not match "read more"; only the bare phrase
 *   alone does. This keeps false positives near zero at the cost of
 *   not catching every possible non-descriptive phrasing (e.g. "click
 *   this", a legitimate but uncommon variant, is not in either list).
 * - Adjacent-context detection climbs through a bare wrapping list into
 *   an outer list item, so "Ulysses" heading a list of per-format
 *   download links still counts as that list's context. The table-header
 *   signal is format-name-only: a header cell can be present and still
 *   say nothing about what a generic "Download" link in the same row
 *   leads to, so the boilerplate-phrase list doesn't get that credit.
 * - Still `type: 'manual'` (cantTell-capped, never fail): finding no
 *   adjacent context is a strong signal, not proof that context doesn't
 *   exist elsewhere (a preceding heading several rows up, page-level
 *   framing) or that the surrounding text actually disambiguates.
 *   Flagging is for review, not a definitive violation.
 * - Reuses the same accessible-name computation as `link-name-present`
 *   (`getAccessibleNameInfo` then `getContentNameInfo` as fallback), so
 *   this benefits from the same "name from content" recursion fix
 *   (img alt / nested role="img" aria-label count toward the name).
 */

const id = 'link-name-quality';

const meta = {
  title: 'Link text should be descriptive, not generic',
  description:
    'Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more") or a bare file-format name (e.g. "HTML", "PDF") with no adjacent context naming what it leads to, for manual review of whether the purpose is clear. English phrases are always recognized, and German, Spanish, French or Japanese ones when the link is in that language.',
  i18n: {
    titleKey: 'linkNameQuality_title',
    descriptionKey: 'linkNameQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag244', 'navigation', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.4'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.4',
      title: 'Link Purpose (In Context)',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.4': ['link-text-descriptive-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const GENERIC_LINK_TEXT_EN = new Set([
    'click here',
    'here',
    'click',
    'more',
    'more info',
    'more information',
    'read more',
    'learn more',
    'continue reading',
    'continue',
    'details',
    'more details',
    'link',
    'this link',
    'go',
    'download',
    'view more',
    'see more',
    'info'
  ]);

  const GENERIC_LINK_TEXT = {
    en: GENERIC_LINK_TEXT_EN,
    de: new Set([
      'hier klicken',
      'klicken sie hier',
      'hier',
      'klicken',
      'mehr',
      'mehr info',
      'mehr infos',
      'mehr informationen',
      'weiterlesen',
      'mehr lesen',
      'mehr erfahren',
      'weiter',
      'details',
      'mehr details',
      'link',
      'dieser link',
      'los',
      'herunterladen',
      'mehr anzeigen',
      'info'
    ]),
    es: new Set([
      'haga clic aquí',
      'haz clic aquí',
      'clic aquí',
      'pulse aquí',
      'pincha aquí',
      'aquí',
      'clic',
      'más',
      'más info',
      'más información',
      'leer más',
      'saber más',
      'seguir leyendo',
      'continuar leyendo',
      'continuar',
      'detalles',
      'más detalles',
      'enlace',
      'este enlace',
      'ir',
      'descargar',
      'ver más',
      'info'
    ]),
    fr: new Set([
      'cliquez ici',
      'cliquer ici',
      'ici',
      'cliquez',
      'plus',
      "plus d'infos",
      "plus d'informations",
      'en savoir plus',
      'lire la suite',
      'la suite',
      'suite',
      'continuer',
      'détails',
      'plus de détails',
      'lien',
      'ce lien',
      'télécharger',
      'voir plus',
      'info'
    ]),
    ja: new Set([
      'こちら',
      'ここ',
      'こちらをクリック',
      'ここをクリック',
      'クリック',
      '詳しく',
      '詳しくは',
      '詳しくはこちら',
      '詳細',
      '詳細はこちら',
      '詳細を見る',
      'もっと見る',
      'もっと読む',
      'さらに詳しく',
      '続きを読む',
      '続き',
      'リンク',
      'このリンク',
      'ダウンロード',
      '情報'
    ])
  };

  const FORMAT_NAME_LINK_TEXT = new Set([
    'html',
    'pdf',
    'epub',
    'txt',
    'plain text',
    'doc',
    'docx',
    'xml',
    'zip',
    'mp3',
    'mp4',
    'csv',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'json',
    'rtf'
  ]);

  const CONTEXT_BLOCK_TAGS = new Set(['td', 'th', 'p', 'dd', 'blockquote', 'figcaption', 'dt']);

  // NFKC folds full-width letters and punctuation (！, ＞) into their ASCII
  // forms, and the curly apostrophe is folded so "plus d’infos" matches.
  // Trailing arrows ("Read more »", 「詳しくはこちら→」) are decoration, not
  // part of the phrase.
  function normalize(s) {
    return (s == null ? '' : String(s))
      .normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[\s.,;:!?。、>»›→]+$/g, '')
      .trim();
  }

  // Primary language subtag of the nearest lang attribute, crossing shadow
  // roots; '' when none is declared. Phrase lists are matched in English
  // plus this language, so a word that is generic in one language ("plus"
  // in French) is not flagged when it is a real name in another.
  function primaryLangOf(node) {
    let n = node;
    // Bounded as a safety net only: a walk up a real tree always ends.
    for (let steps = 0; n && steps < 100000; steps++) {
      if (dom.nodeType(n) === 1 && dom.get(n, 'getAttribute')) {
        const v = dom.getAttribute(n, 'lang');
        if (v != null) return v.trim().split('-')[0].toLowerCase();
      }
      n = dom.parentNode(n) || dom.host(n) || null;
    }
    return '';
  }

  function inPhraseList(byLang, normalized, lang) {
    if (byLang.en.has(normalized)) return true;
    return !!(lang && lang !== 'en' && byLang[lang] && byLang[lang].has(normalized));
  }

  function ownDirectText(el) {
    let out = '';
    const kids = dom.childNodes(el) || [];
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (dom.nodeType(n) === 3) out += dom.nodeValue(n) || '';
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  function isSubstantiveContext(text) {
    return !!text && text.length >= 3 && /\p{L}/u.test(text);
  }

  // Direct text of the nearest enclosing list item/table cell/paragraph,
  // climbing through a wrapping <ul>/<ol> into an outer <li> when the
  // immediate one carries none of its own (a heading li wrapping a
  // nested list of links, e.g. "Ulysses" above per-format download
  // links).
  function nearestBlockContextText(el) {
    let node = dom.parentElement(el);
    let liHops = 0;
    // Bounded as a safety net only: a walk up a real tree always ends.
    for (let steps = 0; node && steps < 100000; steps++) {
      const tag = (dom.tagName(node) || '').toLowerCase();
      if (tag === 'li') {
        const text = ownDirectText(node);
        if (text) return text;
        liHops += 1;
        if (liHops >= 4) return '';
        const list = dom.parentElement(node);
        node = list ? dom.parentElement(list) : null;
        continue;
      }
      if (CONTEXT_BLOCK_TAGS.has(tag)) return ownDirectText(node);
      return '';
    }
    return '';
  }

  function describedByContextText(el) {
    const describedBy = dom.get(el, 'getAttribute')
      ? dom.getAttribute(el, 'aria-describedby')
      : null;
    if (!describedBy || !describedBy.trim() || !helpers.getTextFromIdRefs) return '';
    try {
      const info = helpers.getTextFromIdRefs(describedBy, ctx, undefined, el);
      return info && info.text ? info.text.replace(/\s+/g, ' ').trim() : '';
    } catch {
      return '';
    }
  }

  // A table's first-row header text, when the link sits in a later row of
  // the same table -- naming the row's subject is exactly what turns a
  // bare format name ("HTML") into a link whose destination is clear.
  function firstRowHeaderText(el) {
    const cell = dom.get(el, 'closest') ? dom.closest(el, 'td, th') : null;
    if (!cell) return '';
    const table = dom.get(cell, 'closest') ? dom.closest(cell, 'table') : null;
    if (!table || !table.rows || !table.rows.length) return '';
    const headerRow = table.rows[0];
    const cellRow = dom.get(cell, 'closest') ? dom.closest(cell, 'tr') : null;
    if (!cellRow || headerRow === cellRow) return '';
    const ths = dom.get(headerRow, 'querySelectorAll') ? dom.querySelectorAll(headerRow, 'th') : [];
    if (!ths.length) return '';
    return Array.prototype.map
      .call(ths, (th) => dom.textContent(th) || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function hasAdequateContext(el, tier) {
    if (isSubstantiveContext(describedByContextText(el))) return true;
    if (isSubstantiveContext(nearestBlockContextText(el))) return true;
    if (tier === 'format' && isSubstantiveContext(firstRowHeaderText(el))) return true;
    return false;
  }

  const NATIVE_LINK_TAGS = ['a', 'area'];
  // A native link (<a>/<area> with href), or an element whose role attribute
  // resolves to link: the first token naming a real role wins, in any case,
  // so role="foo link" and role="LINK" count but role="button link" doesn't.
  function isLinkCandidate(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (NATIVE_LINK_TAGS.includes(tag) && dom.hasAttribute(el, 'href')) return true;
    return helpers.aria.getExplicitRole(el) === 'link';
  }

  const selector = 'a[href], area[href], [role~="link" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isLinkCandidate(el)) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '';

    let rawName = programmaticName;
    if (!rawName.trim() && helpers.getContentNameInfo) {
      const contentInfo = helpers.getContentNameInfo(el, ctx);
      rawName = contentInfo && contentInfo.present ? contentInfo.value : '';
    }

    const normalized = normalize(rawName);
    if (!normalized) continue; // no name at all: link-name-present's concern, not this rule's.

    applicableCount += 1;

    const isGeneric = inPhraseList(GENERIC_LINK_TEXT, normalized, primaryLangOf(el));
    const isFormatName = !isGeneric && FORMAT_NAME_LINK_TEXT.has(normalized);
    if (!isGeneric && !isFormatName) continue;

    const tier = isGeneric ? 'generic' : 'format';
    if (hasAdequateContext(el, tier)) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;

    const name = rawName.trim();
    const reportOpts = isGeneric
      ? {
          summary: `This link's accessible name ("${name}") is a generic, non-descriptive phrase.`,
          hint: 'Make the link text itself describe its destination/purpose (e.g. "Download the 2026 pricing guide" instead of "Download"), or confirm the surrounding context already makes the purpose clear.',
          i18n: {
            summaryKey: 'linkNameQuality_summary_cantTell',
            hintKey: 'linkNameQuality_hint_cantTell',
            params: { name }
          },
          data: {
            details: { reasonCode: 'GENERIC_LINK_TEXT', normalizedName: normalized },
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        }
      : {
          summary: `This link's accessible name ("${name}") names a file format/type but not the document it belongs to.`,
          hint: 'Name the document in the link text or in nearby text/a heading the link is associated with (e.g. "Download the annual report (HTML)" instead of a bare "HTML").',
          i18n: {
            summaryKey: 'linkNameQuality_summary_cantTell_formatName',
            hintKey: 'linkNameQuality_hint_cantTell_formatName',
            params: { name }
          },
          data: {
            details: { reasonCode: 'AMBIGUOUS_FORMAT_NAME', normalizedName: normalized },
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        };

    occurrences.push(helpers.reportOccurrence(el, reportOpts));
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
