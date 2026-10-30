/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-quality
 * @atomic true
 * @summary Link text should not be a generic, non-descriptive phrase
 * @standard WCAG 2.2
 * @sc 2.4.4, 2.4.9
 * @applicability
 *   `a[href]`, `area[href]` and elements whose role attribute resolves to
 *   link (its first real role token, in any case) with a
 *   non-empty computed accessible name (aria-labelledby, aria-label, the
 *   content, then title, as accname orders them; same selector as
 *   `link-name-present`). Links with no name at all are
 *   `link-name-present`'s concern, not this rule's.
 *   A custom element whose ElementInternals give it the link role
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   The link's full accessible name, normalized (trimmed, case-folded,
 *   trailing punctuation stripped), is not an exact match for a known
 *   non-descriptive phrase ("click here", "read more", "more", "here",
 *   "details", "link", etc., WCAG technique F84's known failure pattern
 *   for SC 2.4.4) or a bare file-format/type name ("HTML", "PDF", "EPUB",
 *   ...) with no adjacent context (an aria-describedby target, the
 *   enclosing list item/table cell/paragraph's text outside links, that
 *   of its inline elements included, or (format names only) a table's
 *   first-row header) naming what it belongs to.
 * @reports
 *   - `normalizedName`: the link's accessible name as it was matched: in
 *     lowercase, with spacing collapsed and trailing punctuation removed.
 *     It is a generic phrase (`GENERIC_LINK_TEXT`) or a bare format name
 *     (`AMBIGUOUS_FORMAT_NAME`).
 * @reason-codes
 *   - `GENERIC_LINK_TEXT` (cantTell): the link's whole name is a generic
 *     phrase such as "read more" or "click here", with no adjacent context
 *     found that says where it leads.
 *     It leans fail when another flagged link with the same name goes
 *     elsewhere under the same nearest heading, with no other text, table or
 *     named container around them.
 *     Basis: WCAG 2.4.4 (not settled); WCAG 2.4.9; F84; G91; G53; ACT
 *     5effbb; ACT aizyf1.
 *   - `AMBIGUOUS_FORMAT_NAME` (cantTell): the link's whole name is a bare
 *     file format such as "PDF", with no adjacent context found that names
 *     the document.
 *     It leans pass when another link in the same list item, paragraph or
 *     cell has a descriptive name, and fail as GENERIC_LINK_TEXT does.
 *     Basis: WCAG 2.4.4 (not settled); WCAG 2.4.9 (not settled); G91; G53;
 *     ACT 5effbb; ACT aizyf1.
 * @implementation-notes
 * - Phrase lists exist for en, de, es, fr and ja. English is always
 *   checked; the list for the element's own language (nearest lang
 *   attribute, across shadow roots) is added on top. Matching every list
 *   everywhere would flag words that are generic in one language and a
 *   real name in another ("Suite", "Plus" on an English page), so every
 *   list applies only where no language is declared at all.
 * - EXACT match only, on purpose, against small, well-established
 *   phrase lists, not a substring/contains check. "Read more about our
 *   privacy policy" does not match "read more"; only the bare phrase
 *   alone does. This keeps false positives near zero at the cost of
 *   not catching every possible non-descriptive phrasing (e.g. "click
 *   this", a legitimate but uncommon variant, is not in either list).
 * - The context of a list item, cell or paragraph is its text outside
 *   links, with the text of its inline elements exposed to assistive
 *   technology (<strong>, <em>, <span>...): "<li><strong>Ulysses</strong>
 *   <a>Read more</a></li>" has "Ulysses" as context. Block descendants (a
 *   nested list) are left out, and so is another link's text: it names that
 *   link's destination, and a row of bare "PDF" and "HTML" links would
 *   otherwise give each other context.
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
 * - The name is computed in accname order (`getNameFromContentInfo`):
 *   aria-labelledby, aria-label, then the content, counting each
 *   descendant's own name (img alt, nested role="img" aria-label) and
 *   ::before/::after text, and the title attribute only when the content
 *   is empty. A title is a tooltip,
 *   not the name, of a link that has content: `<a title="Read more">Annual
 *   report</a>` is named "Annual report" and is not flagged, while
 *   `<a title="Annual report">Read more</a>` is named "Read more" and is.
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
  tags: ['wcag2a', 'wcag2aaa', 'wcag244', 'wcag249', 'navigation', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.4', '2.4.9'],
  // 2.4.9 as well, as ACT rule aizyf1 maps it: a link flagged here has a
  // generic name and no context that makes it clear, so its purpose cannot be
  // told from the link alone either. A link its context clears is not flagged,
  // which leaves 2.4.9, stricter, to be checked by other means.
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.4',
      title: 'Link Purpose (In Context)',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.9',
      title: 'Link Purpose (Link Only)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '2.4.4': ['link-text-descriptive-evidence'],
      '2.4.9': ['link-text-descriptive-evidence']
    }
  }
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
      'info',
      "plus d'info",
      'découvrir',
      'en découvrir plus',
      'découvrir plus',
      'pour en savoir plus',
      'savoir plus',
      'en lire plus',
      'lire',
      "lire l'article",
      'continuer la lecture',
      'voir',
      'voir tout',
      'tout voir',
      'voir le détail',
      'voir les détails',
      'consulter',
      'accéder',
      'accédez'
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

  // Trims the characters in `chars` from the end of s by stepping back over
  // them: a regex like /[.,]+$/ retries the run from every position in it,
  // which takes seconds on a long value.
  function trimEndOf(s, chars) {
    let end = s.length;
    while (end > 0 && chars.includes(s[end - 1])) end--;
    return s.slice(0, end);
  }

  // NFKC folds full-width letters and punctuation (！, ＞) into their ASCII
  // forms, and the curly apostrophe is folded so "plus d’infos" matches.
  // Trailing arrows ("Read more »", 「詳しくはこちら→」) are decoration, not
  // part of the phrase. White space is collapsed first, so the only white
  // space left to trim is a plain space.
  function normalize(s) {
    const folded = (s == null ? '' : String(s))
      .normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return trimEndOf(folded, ' .,;:!?。、>»›→').trim();
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
    // With no language declared the link may be in any of them, so every
    // list applies.
    if (!lang) return Object.keys(byLang).some((k) => byLang[k].has(normalized));
    return !!(
      lang !== 'en' &&
      Object.prototype.hasOwnProperty.call(byLang, lang) &&
      byLang[lang].has(normalized)
    );
  }

  // Phrasing elements whose text belongs to the sentence, list item or cell
  // they sit in: "<li><strong>Ulysses</strong> <a>Read more</a></li>" has
  // "Ulysses" as its context. Block descendants (a nested list, a table)
  // hold their own items and are not read, so a list item heading a nested
  // list of links is credited only with its own text.
  const INLINE_CONTEXT_TAGS = new Set([
    'abbr',
    'b',
    'bdi',
    'bdo',
    'big',
    'cite',
    'code',
    'data',
    'del',
    'dfn',
    'em',
    'font',
    'i',
    'ins',
    'kbd',
    'label',
    'mark',
    'nobr',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'sup',
    'time',
    'tt',
    'u',
    'var'
  ]);

  function isAccEligible(el) {
    const r = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  // The text of `el` that sits outside any link: its own text nodes and
  // those of its inline descendants exposed to assistive technology. Another
  // link's text is left out on purpose: it names that link's destination,
  // and counting it would let a row of bare "PDF" and "HTML" links, or of
  // "Read more" links, give each other context. Links met on the way are
  // collected in `links` when it is given.
  function contextTextOutsideLinks(el, links) {
    let out = '';
    // Bounded as a safety net only: a context block holds a few nodes.
    let budget = 5000;
    (function walk(node) {
      const kids = dom.childNodes(node) || [];
      for (let i = 0; i < kids.length && budget > 0; i++) {
        budget -= 1;
        const n = kids[i];
        const type = dom.nodeType(n);
        if (type === 3) {
          out += dom.nodeValue(n) || '';
          continue;
        }
        if (type !== 1 || !dom.get(n, 'getAttribute')) continue;
        if (isLinkCandidate(n)) {
          if (links) links.push(n);
          continue;
        }
        const tag = String(dom.localName(n) || '').toLowerCase();
        if (!INLINE_CONTEXT_TAGS.has(tag) || !isAccEligible(n)) continue;
        out += ' ';
        walk(n);
        out += ' ';
      }
    })(el);
    return out.replace(/\s+/g, ' ').trim();
  }

  function isSubstantiveContext(text) {
    return !!text && text.length >= 3 && /\p{L}/u.test(text);
  }

  // The nearest enclosing list item/table cell/paragraph and its text
  // outside links, climbing through a wrapping <ul>/<ol> into an outer <li>
  // when the immediate one carries none of its own (a heading li wrapping a
  // nested list of links, e.g. "Ulysses" above per-format download links).
  // `block` is the first such element met, `text` the first text found.
  function nearestBlockContext(el) {
    let node = dom.parentElement(el);
    let liHops = 0;
    let block = null;
    // Bounded as a safety net only: a walk up a real tree always ends.
    for (let steps = 0; node && steps < 100000; steps++) {
      const tag = (dom.tagName(node) || '').toLowerCase();
      if (tag === 'li') {
        if (!block) block = node;
        const text = contextTextOutsideLinks(node);
        if (text) return { block, text };
        liHops += 1;
        if (liHops >= 4) return { block, text: '' };
        const list = dom.parentElement(node);
        node = list ? dom.parentElement(list) : null;
        continue;
      }
      if (CONTEXT_BLOCK_TAGS.has(tag))
        return { block: block || node, text: contextTextOutsideLinks(node) };
      return { block, text: '' };
    }
    return { block, text: '' };
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
    if (isSubstantiveContext(nearestBlockContext(el).text)) return true;
    if (tier === 'format' && isSubstantiveContext(firstRowHeaderText(el))) return true;
    return false;
  }

  // The URL a link leads to, '' when it has none to compare (a role="link"
  // element without href). `.href` on an SVG <a> is not a string.
  function resolvedHref(el) {
    try {
      const h = dom.get(el, 'href');
      if (typeof h === 'string' && h) return h;
      const raw = dom.getAttribute(el, 'href') || dom.getAttribute(el, 'xlink:href') || '';
      return raw ? new URL(raw, dom.baseURI(dom.ownerDocument(el))).href : '';
    } catch {
      return '';
    }
  }

  let headingList = null;
  function exposedHeadings() {
    if (headingList) return headingList;
    const found = helpers.queryAll('h1, h2, h3, h4, h5, h6, [role~="heading" i]') || [];
    headingList = Array.prototype.filter.call(found, (h) => {
      const role = helpers.aria.getAuthorRole(h);
      const isHeading = role ? role === 'heading' : /^h[1-6]$/.test(String(dom.localName(h)));
      return isHeading && isAccEligible(h);
    });
    return headingList;
  }

  // The last heading before the link in document order (or the heading it
  // sits in), which H80 lets serve as the link's context; null when none.
  function nearestPrecedingHeading(el) {
    let last = null;
    for (const h of exposedHeadings()) {
      // 4: the link follows the heading or is inside it.
      if (h === el || !(dom.compareDocumentPosition(h, el) & 4)) break;
      last = h;
    }
    return last;
  }

  // Context the rule doesn't look for but a person may read: a table row's
  // other cells, a name on an enclosing element, a sentence in the link's
  // own parent.
  function hasOtherPossibleContext(el) {
    // Document order across shadow trees is not defined.
    if (dom.getRootNode(el) !== dom.ownerDocument(el)) return true;
    if (dom.closest(el, 'td, th')) return true;
    if (isSubstantiveContext(contextTextOutsideLinks(dom.parentElement(el) || el))) return true;
    for (let n = dom.parentElement(el), steps = 0; n && steps < 100000; steps++) {
      const tag = String(dom.localName(n) || '').toLowerCase();
      if (tag === 'body' || tag === 'html') break;
      if (dom.hasAttribute(n, 'aria-label') || dom.hasAttribute(n, 'aria-labelledby')) return true;
      const role = helpers.aria.getAuthorRole(n);
      if (role === 'cell' || role === 'gridcell' || role === 'row') return true;
      n = dom.parentElement(n);
    }
    return false;
  }

  // A format name whose list item, paragraph or cell holds another link
  // with a descriptive name ("<li><a>Annual report</a> (<a>PDF</a>)</li>"):
  // that link names the document this one gives a format of.
  function descriptiveSiblingLink(el) {
    const { block } = nearestBlockContext(el);
    if (!block) return null;
    const links = [];
    contextTextOutsideLinks(block, links);
    for (const other of links) {
      if (other === el || !isAccEligible(other)) continue;
      const info = helpers.getNameFromContentInfo(other, ctx);
      const n = normalize(info && typeof info.value === 'string' ? info.value : '');
      if (!isSubstantiveContext(n)) continue;
      if (inPhraseList(GENERIC_LINK_TEXT, n, primaryLangOf(other))) continue;
      if (FORMAT_NAME_LINK_TEXT.has(n)) continue;
      return n;
    }
    return null;
  }

  // Leans for the flagged links. A format name leans pass when a link
  // beside it names the document. A link leans fail when another flagged
  // link with the same name and reason goes elsewhere under the same
  // nearest heading (or no heading), and nothing else near it could tell
  // them apart: neither the text around them nor the heading can say which
  // is which (F84; G53).
  function addLeans(list) {
    const groups = new Map();
    for (const f of list) {
      f.href = resolvedHref(f.el);
      if (!f.href || hasOtherPossibleContext(f.el)) continue;
      f.heading = nearestPrecedingHeading(f.el);
      const key = f.tier + '\u0000' + f.normalized;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    for (const f of list) {
      if (f.tier === 'format') {
        const sibling = descriptiveSiblingLink(f.el);
        if (sibling) {
          f.occurrence.lean = {
            toward: 'pass',
            why: 'Another link in the same list item, paragraph or cell names the document this format belongs to.',
            signals: [{ signal: 'descriptive-link-in-context', value: sibling }],
            caution: 'Check that the other link names this same document.',
            i18n: {
              whyKey: 'linkNameQuality_lean_why_formatBesideName',
              cautionKey: 'linkNameQuality_lean_caution_formatBesideName'
            }
          };
          continue;
        }
      }
      if (!f.href || f.heading === undefined) continue;
      const peers = (groups.get(f.tier + '\u0000' + f.normalized) || []).filter(
        (g) => g.heading === f.heading
      );
      const hrefs = new Set(peers.map((g) => g.href));
      if (hrefs.size < 2) continue;
      f.occurrence.lean = {
        toward: 'fail',
        why: 'Other links with the same text go to different places, and no text or heading near them tells them apart.',
        signals: [
          { signal: 'same-name-different-href-count', value: hrefs.size },
          {
            signal: 'nearest-heading',
            value: f.heading
              ? String(dom.textContent(f.heading) || '')
                  .replace(/\s+/g, ' ')
                  .trim()
              : null
          }
        ],
        caution:
          "The page's layout, such as a card with an image or a heading the link is not placed after, may still make each link clear.",
        i18n: {
          whyKey: 'linkNameQuality_lean_why_repeated',
          cautionKey: 'linkNameQuality_lean_caution_repeated'
        }
      };
    }
  }

  const NATIVE_LINK_TAGS = ['a', 'area'];
  // A native link (<a>/<area> with href), or an element whose role attribute
  // resolves to link: the first token naming a real role wins, in any case,
  // so role="foo link" and role="LINK" count but role="button link" doesn't.
  function isLinkCandidate(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (NATIVE_LINK_TAGS.includes(tag) && dom.hasAttribute(el, 'href')) return true;
    // A custom element's internals may make it a link.
    return helpers.aria.getAuthorRole(el) === 'link';
  }

  const selector = 'a[href], area[href], [role~="link" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, { internalsRoles: true })
    : helpers.queryAll(selector);

  const occurrences = [];
  const flagged = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isLinkCandidate(el)) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    // The content names a link ahead of its title (accname 1.2), so
    // `<a title="Read more">Annual report</a>` is "Annual report".
    const nameInfo = helpers.getNameFromContentInfo(el, ctx);
    const rawName = nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '';

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
          summary: `This link's name ("${name}") is a generic phrase that doesn't say where it leads.`,
          hint: 'Make the link text say where it leads or what it does, such as "Download the 2026 pricing guide" rather than "Download", or check that the text around it already makes that clear.',
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
          summary: `This link's name ("${name}") gives a file format but not which document it is.`,
          hint: 'Name the document in the link text, or in text or a heading tied to the link, such as "Download the annual report (HTML)" rather than a bare "HTML".',
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

    const occurrence = helpers.reportOccurrence(el, reportOpts);
    occurrences.push(occurrence);
    flagged.push({ el, occurrence, tier, normalized });
  }

  // A lean is advice: a failure reading it costs the leans, not the findings.
  try {
    addLeans(flagged);
  } catch {
    for (const f of flagged) delete f.occurrence.lean;
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
