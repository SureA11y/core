/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-refresh-no-url-timing
 * @atomic true
 * @summary A meta refresh that reloads the page must wait 20 hours or more
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose first valid
 *   <meta http-equiv="refresh"> reloads the page itself: its content has
 *   a delay and no URL, an empty URL, or the page's own address. HTML acts
 *   only on the first valid meta refresh of a document, so later ones are
 *   not read. A meta refresh that sends the visitor to another address is
 *   a redirect, left to meta-redirect-immediate (RGAA 13.1.2). A <meta>
 *   inside <noscript> is ignored, as it never applies with scripting on. A
 *   run narrowed by contextSelector or engineOptions.fragment is
 *   notApplicable.
 * @expectation
 *   The delay is 72000 seconds (20 hours) or more, the last condition of
 *   RGAA 13.1.1 (« La limite de temps entre deux rafraîchissements est de
 *   vingt heures, au moins »). A shorter delay, 0 included, fails: a meta
 *   refresh gives the visitor no way to stop, relaunch or lengthen it, and
 *   no warning, which are the other three conditions.
 * @implementation-notes
 * - The content value is parsed with HTML's shared declarative refresh
 *   steps. A value with no leading number is not a refresh and is skipped.
 * - meta-refresh-timing-absent (WCAG 2.2.1) exempts only delays above 20
 *   hours and treats refreshes and redirects alike. RGAA splits them:
 *   13.1.1 for refreshes, with the 20-hour limit included, and 13.1.2 for
 *   redirects, with no 20-hour exception.
 * - Refreshes started from object, embed, svg or canvas content, also
 *   listed by 13.1.1, are not detected.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'meta-refresh-no-url-timing';

const meta = {
  title: 'Meta refresh waits 20 hours or more',
  description:
    'Checks that a <meta http-equiv="refresh"> that reloads the page waits at least 20 hours.',
  i18n: {
    titleKey: 'metaRefreshNoUrlTiming_title',
    descriptionKey: 'metaRefreshNoUrlTiming_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
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

  const TWENTY_HOURS = 20 * 60 * 60;

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

  if (!first || !isOwnAddress(first.url)) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (first.delay >= TWENTY_HOURS) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const delay = String(first.delay);
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences: [
      helpers.reportOccurrence(first.el, {
        summary: `This page reloads itself every ${delay} seconds, less than 20 hours.`,
        hint: 'Remove the meta refresh, or update the content with a script the visitor can stop, relaunch or slow down.',
        i18n: {
          summaryKey: 'metaRefreshNoUrlTiming_summary_fail',
          hintKey: 'metaRefreshNoUrlTiming_hint_fail',
          params: { delay }
        },
        data: {
          details: { reasonCode: 'refreshUnder20Hours', delay: first.delay },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    ]
  };
}

module.exports = { id, meta, runInPage, applicability };
