/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-redirect-immediate
 * @atomic true
 * @summary A meta redirect must be immediate, unless it leaves an obsolete address
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose first valid
 *   <meta http-equiv="refresh"> sends the visitor to another address: its
 *   content has a delay and a URL that does not resolve to the page
 *   itself. HTML acts only on the first valid meta refresh of a document.
 *   A meta refresh that reloads the page is left to
 *   meta-refresh-no-url-timing (RGAA 13.1.1). A <meta> inside <noscript>
 *   is ignored. A run narrowed by contextSelector or engineOptions.fragment
 *   is notApplicable.
 * @expectation
 *   A delay of 0 passes: the redirect is immediate (RGAA 13.1.2). Any
 *   other delay, however long, is asked about (cantTell) and never failed:
 *   13.1.2 has no 20-hour exception, but a redirect from an obsolete
 *   address to the new version of the page is essential, and then the
 *   criterion is not applicable (13.1, particular cases). Only a person can
 *   tell which case this is.
 * @implementation-notes
 * - The content value is parsed with HTML's shared declarative refresh
 *   steps, including the optional url= prefix and quotes.
 * - meta-refresh-timing-absent (WCAG 2.2.1) passes a redirect delayed more
 *   than 20 hours and fails any shorter one, the obsolete-address case
 *   included. Neither verdict holds under RGAA 13.1.2.
 * - Redirects made by script are 13.1.3's matter and are not detected.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'meta-redirect-immediate';

const meta = {
  title: 'Meta redirects are immediate',
  description:
    'Checks whether a <meta http-equiv="refresh"> that sends the visitor to another address waits before doing so.',
  i18n: {
    titleKey: 'metaRedirectImmediate_title',
    descriptionKey: 'metaRedirectImmediate_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // HTML's shared declarative refresh steps. Returns { delay, url } for a
  // valid value, where url is '' when the value names no address, or null
  // when the browser would ignore the value.
  function parseRefresh(input) {
    const s = String(input == null ? '' : input);
    const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\f' || c === '\r';
    let i = 0;
    while (i < s.length && isSpace(s[i])) i++;
    let digits = '';
    while (i < s.length && s[i] >= '0' && s[i] <= '9') digits += s[i++];
    if (!digits) return null;
    while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) i++;
    const delay = parseInt(digits, 10);
    if (i < s.length && !(s[i] === ';' || s[i] === ',' || isSpace(s[i]))) return null;
    while (i < s.length && isSpace(s[i])) i++;
    if (s[i] === ';' || s[i] === ',') i++;
    while (i < s.length && isSpace(s[i])) i++;
    let rest = s.slice(i);
    const prefix = /^url[ \t\n\f\r]*=[ \t\n\f\r]*/i.exec(rest);
    if (prefix) rest = rest.slice(prefix[0].length);
    const quote = rest[0] === '"' || rest[0] === "'" ? rest[0] : '';
    if (quote) {
      rest = rest.slice(1);
      const end = rest.indexOf(quote);
      if (end >= 0) rest = rest.slice(0, end);
    }
    return { delay, url: rest.trim() };
  }

  // A URL that resolves to the page's own address reloads it.
  function isOwnAddress(url) {
    if (!url) return true;
    try {
      return new URL(url, document.baseURI).href === new URL(document.URL).href;
    } catch {
      return false;
    }
  }

  const nodes = document.querySelectorAll
    ? document.querySelectorAll('meta[http-equiv="refresh" i]')
    : [];

  let first = null;
  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.closest && el.closest('noscript')) continue;
    const parsed = parseRefresh(el.getAttribute('content'));
    if (!parsed) continue;
    first = { el, delay: parsed.delay, url: parsed.url };
    break;
  }

  if (!first || isOwnAddress(first.url)) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (first.delay === 0) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const delay = String(first.delay);
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences: [
      helpers.reportOccurrence(first.el, {
        summary: `This page sends the visitor to another address after ${delay} seconds.`,
        hint: 'Check whether it leaves an obsolete address for the new version of the page. If not, make the redirect immediate (content="0; url=…").',
        i18n: {
          summaryKey: 'metaRedirectImmediate_summary_cantTell',
          hintKey: 'metaRedirectImmediate_hint_cantTell',
          params: { delay }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the redirect leaves an obsolete address for the new version of the page.',
          evidence: { delay: first.delay, url: first.url }
        },
        data: {
          details: { reasonCode: 'delayedRedirect', delay: first.delay, url: first.url },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    ]
  };
}

module.exports = { id, meta, runInPage, applicability };
