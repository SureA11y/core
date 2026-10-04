/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-context-review
 * @atomic true
 * @summary A generic link whose only context is one RGAA does not list is flagged for review
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (a[href], area[href], role="link") whose whole
 *   accessible name is a known generic phrase ("en savoir plus", "click
 *   here", ...) or a bare file format ("PDF"), the same lists
 *   link-name-quality uses, and whose only nearby context is one that RGAA's
 *   glossary entry "Contexte du lien" does not list: the text an
 *   aria-describedby points to, or the text of an enclosing <dd>, <dt>,
 *   <blockquote> or <figcaption>. A link with context from its paragraph,
 *   list item or table cell (or, for a format name, the table's header
 *   row), or with no context at all, is left to link-name-quality. A page
 *   with no such link is notApplicable.
 * @expectation
 *   RGAA 6.1.1 to 6.1.4 accept a link whose name alone, or together with
 *   its context, gives its function and destination. The glossary lists six
 *   contexts: the sentence, the <p>, the <li> (or a parent <li>), the
 *   preceding heading, the associated <th> and the <td>. WCAG technique
 *   ARIA1 accepts aria-describedby for 2.4.4, so link-name-quality accepts
 *   it and stays silent. Each such link is flagged for a person to check
 *   whether one of RGAA's six contexts makes it explicit.
 * @implementation-notes
 * - Manual (cantTell): the sentence around the link, or a preceding
 *   heading, may still make it explicit, and whether it does is a
 *   judgement. The link's own <dd> or <blockquote> text can be its
 *   sentence.
 * - The phrase and format lists, the language choice and the name
 *   computation are copied from link-name-quality, so that the two rules
 *   judge the same links.
 * - Opt-in (tag `rgaa`): it asks only where RGAA's list of contexts is
 *   narrower than WCAG's.
 */

const id = 'link-context-review';

const meta = {
  title: "Generic links whose only context is outside RGAA's list are reviewed",
  description:
    'Flags links named by a generic phrase or a bare file format whose only context is an aria-describedby text or a <dd>, <dt>, <blockquote> or <figcaption>, which RGAA\'s glossary entry "Contexte du lien" does not list, for a person to check RGAA 6.1.',
  i18n: {
    titleKey: 'linkContextReview_title',
    descriptionKey: 'linkContextReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'navigation', 'quality', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: ['CONTAINER_CONTEXT_ONLY', 'DESCRIBEDBY_CONTEXT_ONLY']
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const GENERIC_LINK_TEXT = {
    en: new Set([
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
    ]),
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

  // Blocks whose text link-name-quality counts as context. RGAA's glossary
  // "Contexte du lien" lists the <p>, the <li> and the table cells; the
  // other four are not in its list.
  const RGAA_CONTEXT_TAGS = new Set(['p', 'td', 'th']);
  const OTHER_CONTEXT_TAGS = new Set(['dd', 'dt', 'blockquote', 'figcaption']);

  function normalize(s) {
    return (s == null ? '' : String(s))
      .normalize('NFKC')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[\s.,;:!?。、>»›→]+$/g, '')
      .trim();
  }

  function primaryLangOf(node) {
    let n = node;
    while (n) {
      if (n.nodeType === 1 && n.getAttribute) {
        const v = n.getAttribute('lang');
        if (v != null) return v.trim().split('-')[0].toLowerCase();
      }
      n = n.parentNode || n.host || null;
    }
    return '';
  }

  function isGenericPhrase(normalized, lang) {
    if (GENERIC_LINK_TEXT.en.has(normalized)) return true;
    return !!(
      lang &&
      lang !== 'en' &&
      GENERIC_LINK_TEXT[lang] &&
      GENERIC_LINK_TEXT[lang].has(normalized)
    );
  }

  function ownDirectText(el) {
    let out = '';
    const kids = el.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.nodeType === 3) out += n.nodeValue || '';
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  function isSubstantive(text) {
    return !!text && text.length >= 3 && /\p{L}/u.test(text);
  }

  // The block link-name-quality reads context from, with its tag: the
  // nearest list item (climbing through a bare nested list), paragraph,
  // table cell, <dd>, <dt>, <blockquote> or <figcaption> directly around
  // the link.
  function nearestBlockContext(el) {
    let node = el.parentElement;
    let liHops = 0;
    while (node) {
      const tag = (node.tagName || '').toLowerCase();
      if (tag === 'li') {
        const text = ownDirectText(node);
        if (text) return { tag, text };
        liHops += 1;
        if (liHops >= 4) return { tag: '', text: '' };
        const list = node.parentElement;
        node = list ? list.parentElement : null;
        continue;
      }
      if (RGAA_CONTEXT_TAGS.has(tag) || OTHER_CONTEXT_TAGS.has(tag)) {
        return { tag, text: ownDirectText(node) };
      }
      return { tag: '', text: '' };
    }
    return { tag: '', text: '' };
  }

  function describedByText(el) {
    const describedBy = el.getAttribute ? el.getAttribute('aria-describedby') : null;
    if (!describedBy || !describedBy.trim() || !helpers.getTextFromIdRefs) return '';
    try {
      const info = helpers.getTextFromIdRefs(describedBy, ctx);
      return info && info.text ? info.text.replace(/\s+/g, ' ').trim() : '';
    } catch {
      return '';
    }
  }

  function firstRowHeaderText(el) {
    const cell = el.closest ? el.closest('td, th') : null;
    if (!cell) return '';
    const table = cell.closest ? cell.closest('table') : null;
    if (!table || !table.rows || !table.rows.length) return '';
    const headerRow = table.rows[0];
    const cellRow = cell.closest ? cell.closest('tr') : null;
    if (!cellRow || headerRow === cellRow) return '';
    const ths = headerRow.querySelectorAll ? headerRow.querySelectorAll('th') : [];
    if (!ths.length) return '';
    return Array.prototype.map
      .call(ths, (th) => th.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const selector = 'a[href], area[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    let rawName = nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '';
    if (!rawName.trim() && helpers.getContentNameInfo) {
      const contentInfo = helpers.getContentNameInfo(el, ctx);
      rawName = contentInfo && contentInfo.present ? contentInfo.value : '';
    }
    const normalized = normalize(rawName);
    if (!normalized) continue;

    const isGeneric = isGenericPhrase(normalized, primaryLangOf(el));
    const isFormatName = !isGeneric && FORMAT_NAME_LINK_TEXT.has(normalized);
    if (!isGeneric && !isFormatName) continue;

    // Context RGAA lists: the link is not this rule's concern.
    const block = nearestBlockContext(el);
    const blockIsSubstantive = isSubstantive(block.text);
    if (
      (blockIsSubstantive && (RGAA_CONTEXT_TAGS.has(block.tag) || block.tag === 'li')) ||
      (isFormatName && isSubstantive(firstRowHeaderText(el)))
    ) {
      continue;
    }

    // Context only WCAG accepts. With none at all, link-name-quality asks.
    const described = describedByText(el);
    let reasonCode = '';
    if (isSubstantive(described)) reasonCode = 'DESCRIBEDBY_CONTEXT_ONLY';
    else if (blockIsSubstantive && OTHER_CONTEXT_TAGS.has(block.tag)) {
      reasonCode = 'CONTAINER_CONTEXT_ONLY';
    }
    if (!reasonCode) continue;

    const name = rawName.replace(/\s+/g, ' ').trim();
    const byDescription = reasonCode === 'DESCRIBEDBY_CONTEXT_ONLY';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: byDescription
          ? 'This link has a generic name, and its only context is the text its aria-describedby points to, which RGAA does not count as link context.'
          : 'This link has a generic name, and its only context is the text of the element around it, which RGAA does not count as link context.',
        hint: 'Check whether the sentence, paragraph, list item, table cell or preceding heading makes the link explicit. Otherwise, put its destination in the link text.',
        i18n: {
          summaryKey: byDescription
            ? 'linkContextReview_summary_cantTell_describedBy'
            : 'linkContextReview_summary_cantTell_container',
          hintKey: 'linkContextReview_hint_cantTell',
          params: { name, element: block.tag || '' }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether one of the contexts RGAA lists (sentence, paragraph, list item, preceding heading, table cells) makes the link explicit.',
          evidence: { name, context: byDescription ? described : block.text }
        },
        data: {
          details: {
            reasonCode,
            normalizedName: normalized,
            context: byDescription ? described : block.text,
            ...(byDescription ? {} : { container: block.tag })
          }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
