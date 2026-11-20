/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-refresh-no-exceptions
 * @atomic true
 * @summary At the AAA level, a meta refresh must not use a positive delay, however long
 * @standard WCAG 2.2
 * @sc 2.2.4, 3.2.5
 * @applicability
 *   Applies to the first <meta http-equiv="refresh"> element, in document
 *   order, with a valid content attribute, per HTML's shared declarative
 *   refresh steps, a document only ever acts on its first valid meta
 *   refresh, so a later one (valid or not) is inert and out of scope.
 * @expectation
 *   Running the shared declarative refresh steps against that element's
 *   content value results in a delay of exactly 0. An immediate (delay=0)
 *   redirect still passes at AAA, same as the A-level rule. There is
 *   nothing for a user to be interrupted mid-read by when nothing is
 *   displayed first. Any positive delay fails, with none of the A-level
 *   rule's >20-hour exemption: at AAA, WCAG 2.2.4 (Interruptions) and
 *   3.2.5 (Change on Request) require that a *timed* automatic context
 *   change happen only at the user's request, regardless of how long the
 *   timer is.
 * @reason-codes
 *   - `META_REFRESH_PRESENT` (fail): the page's meta refresh reloads or
 *     redirects it after a positive delay, a timed change the user did not
 *     ask for.
 *     Basis: WCAG 2.2.4; WCAG 3.2.5; ACT bisz58; F40; F41; HTML meta refresh.
 * @implementation-notes
 * - Distinct, atomic decision from meta-refresh-timing-absent: that
 *   rule's >20-hour exemption for a positive delay is this rule's fail
 *   case (no exemption at AAA), but delay=0 passes in both rules.
 * - A <meta> nested inside <noscript> is excluded: it only ever takes
 *   effect when scripting is disabled, which is never the case for any
 *   context capable of running accessibility tooling in the first place
 *   (e.g. a <noscript><meta http-equiv="refresh" content="0; URL=/?nojs=1">
 *   </noscript> JS-disabled fallback).
 */

const id = 'meta-refresh-no-exceptions';

const meta = {
  title: 'Page must not use a timed meta refresh (AAA)',
  description:
    'Checks that <meta http-equiv="refresh"> does not set a positive delay, however long; an immediate redirect (delay 0) passes. This is the stricter AAA-level counterpart of the A-level check, which exempts delays over 20 hours.',
  i18n: {
    titleKey: 'metaRefreshNoExceptions_title',
    descriptionKey: 'metaRefreshNoExceptions_description'
  },
  helpUrl: null,
  tags: ['wcag2aaa', 'wcag224', 'wcag325', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.2.4', '3.2.5'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.2.4',
      title: 'Interruptions',
      conformanceLevel: 'AAA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.2.5',
      title: 'Change on Request',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '2.2.4': ['meta-refresh-no-exceptions'],
      '3.2.5': ['meta-refresh-no-exceptions']
    }
  }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const nodes = dom.get(document, 'querySelectorAll')
    ? dom.querySelectorAll(document, 'meta[http-equiv="refresh" i]')
    : [];

  const occurrences = [];
  // HTML's shared declarative refresh steps. Returns the delay in seconds, or
  // null when the value is not a valid refresh directive, in which case the
  // browser never refreshes and there is nothing to report. Rejects a leading
  // sign ("+72001"), a non-numeric time ("foo"), and a separator other than
  // "," or ";" ("0:1"). Only ASCII whitespace is skipped, so a leading
  // no-break space makes the value invalid. A time with no digits before its
  // dot (".5") is 0, and the digits and dots after the integer are ignored
  // ("5.5.5" is 5). The URL part is not parsed.
  function parseRefreshDelay(input) {
    const s = String(input == null ? '' : input);
    const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\f' || c === '\r';
    const isDigit = (c) => c >= '0' && c <= '9';
    let i = 0;
    while (i < s.length && isSpace(s[i])) i++;
    let digits = '';
    while (i < s.length && isDigit(s[i])) digits += s[i++];
    if (!digits && s[i] !== '.') return null;
    const time = digits ? parseInt(digits, 10) : 0;
    while (i < s.length && (isDigit(s[i]) || s[i] === '.')) i++;
    if (i >= s.length) return time;
    if (s[i] === ';' || s[i] === ',' || isSpace(s[i])) return time;
    return null;
  }

  // The URL a refresh directive goes to, '' when it reloads the page itself:
  // after the time and its separator, an optional "url=" and an optional
  // quote, as HTML's declarative refresh steps read it. Cut at 100
  // characters for a message.
  function parseRefreshTarget(input) {
    const s = String(input == null ? '' : input);
    const m =
      /^[\t\n\f\r ]*[0-9.]*[\t\n\f\r ]*[;,]?[\t\n\f\r ]*(?:url[\t\n\f\r ]*=[\t\n\f\r ]*)?(.*)$/is.exec(
        s
      );
    let url = m ? m[1].trim() : '';
    const q = url[0];
    if (q === '"' || q === "'") {
      const end = url.indexOf(q, 1);
      url = end === -1 ? url.slice(1) : url.slice(1, end);
    }
    url = url.trim();
    return url.length > 100 ? url.slice(0, 97) + '...' : url;
  }

  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (dom.get(el, 'closest') && dom.closest(el, 'noscript')) continue; // never applies with scripting enabled
    const raw = String(dom.getAttribute(el, 'content') || '');
    if (!raw) continue;
    const delay = parseRefreshDelay(raw);
    if (delay === null) continue;

    // Only the first valid meta refresh in document order is ever acted
    // on by a browser -- any later one is inert and stops being evaluated
    // entirely once a winner has been found.
    applicableCount += 1;

    if (delay === 0) break; // an immediate redirect is not a timed interruption

    // The delay, in hours too where it is long, and where it goes: a
    // delayed redirect passes here at a delay of 0, a reload never does. A
    // delay over 20 hours passes the Level A rule, so the summary says why
    // it fails here.
    const target = parseRefreshTarget(raw);
    const delayHours = delay >= 3600 ? String(Math.round((delay / 3600) * 10) / 10) : '';
    const overTwentyHours = delay > 72000;
    const hoursNote = delayHours ? ` (${delayHours} hours)` : '';
    const aaaNote = overTwentyHours
      ? ' At AAA any delay fails, even one over 20 hours that the Level A rule allows.'
      : '';

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: target
          ? `This page redirects to ${target} after ${delay} seconds${hoursNote}, without the user asking.${aaaNote}`
          : `This page reloads itself every ${delay} seconds${hoursNote}, without the user asking.${aaaNote}`,
        hint: target
          ? `Redirect at once (content="0; url=${target}", or a redirect from the server), or let the user follow a link.`
          : 'Remove the meta refresh, and redirect or refresh only when the user asks to.',
        i18n: {
          summaryKey: target
            ? 'metaRefreshNoExceptions_summary_fail_redirect'
            : 'metaRefreshNoExceptions_summary_fail',
          hintKey: target
            ? 'metaRefreshNoExceptions_hint_fail_redirect'
            : 'metaRefreshNoExceptions_hint_fail',
          params: { delay: String(delay), delayHours, overTwentyHours, target }
        },
        data: {
          details: { reasonCode: 'META_REFRESH_PRESENT', delay, ...(target ? { target } : {}) }
        }
      })
    );
    break;
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

module.exports = { id, meta, runInPage, applicability };
