/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check skip-link
 * @atomic true
 * @summary A "skip" link must resolve to a real, usable target
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to <a href="#fragment"> elements that are skip links by one of
 *   two signs:
 *   - the accessible name follows a common skip-link wording in one of the
 *     shipped locales: "skip" or "jump to" (English); "aller au contenu",
 *     "passer au contenu", "accéder au contenu", "accès direct", "évitement"
 *     (French); "springen", "überspringen", "direkt zum", "zum Inhalt"
 *     (German); "saltar", "ir al contenido" (Spanish); "スキップ", "本文へ"
 *     (Japanese). "jump to" sits beside "skip" because real skip links use
 *     both conventions (e.g. a "Jump to section" link);
 *   - or it is the first link in the document, and it comes before the
 *     `main` element (or `[role="main"]`): the usual place of a skip link
 *     whatever its wording.
 *   Other same-page anchor links are not skip links and are left alone.
 * @expectation
 *   The link's fragment resolves to a real element in the document
 *   (via a matching id, or a legacy <a name="...">), and that target is
 *   currently usable (not hidden from the accessibility tree; and, when
 *   browser geometry is available, not zero-area/no-rects). A skip link
 *   whose target is missing or effectively unusable does not provide a
 *   reliable bypass destination.
 * @reports
 *   - `href`: the link's `href`.
 *   - `unusableReasonCode` (a target that is not usable): why it is not:
 *     `ACC_TREE_INELIGIBLE` when it is hidden from the accessibility tree,
 *     `NO_CLIENT_RECTS` when it is not rendered, `ZERO_AREA_TARGET` when it
 *     has no area.
 *   - `targetSelector` (a target that is not usable): a selector for the
 *     target.
 *   - `geometryCheckEnabled` (a target that is not usable): whether the
 *     target's geometry could be measured, which needs a browser.
 *   - `viewport.width`, `viewport.height` (a target whose geometry was
 *     measured): the viewport the page was laid out in, in CSS pixels. A
 *     target hidden at one width can be usable at another.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Keyed mainly on the wording, matching the same deliberate-leniency
 *   reasoning documented in bypass-blocks-present's implementation notes.
 *   The one positional sign is narrow on purpose: only the page's very
 *   first link, and only when a main landmark follows it, so an ordinary
 *   in-page link (a "Menu" toggle after other links, a table of contents)
 *   is not taken for a skip link.
 */

const id = 'skip-link';

const meta = {
  title: 'Skip link must have a resolvable, usable target',
  description:
    'Checks that a "skip to ..." link\'s href fragment resolves to a real, currently usable element in the document.',
  i18n: {
    titleKey: 'skipLink_title',
    descriptionKey: 'skipLink_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'navigation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getAccessibleNameText(el) {
    const al = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-label'));
    if (al) return al;
    const alb = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = dom.getElementById(document, refId);
          if (ref) {
            const t = normalizeWs(dom.textContent(ref));
            if (t) parts.push(t);
          }
        } catch {}
      }
      const joined = normalizeWs(parts.join(' '));
      if (joined) return joined;
    }
    return normalizeWs(dom.textContent(el));
  }

  function hasReliableGeometrySupport() {
    const probe = dom.documentElement(document) || dom.body(document) || null;
    if (!probe || !dom.get(probe, 'getClientRects') || !dom.get(probe, 'getBoundingClientRect'))
      return false;
    try {
      const rects = dom.getClientRects(probe);
      const rectCount = rects ? rects.length : 0;
      const r = dom.getBoundingClientRect(probe);
      const w = r && Number.isFinite(r.width) ? r.width : 0;
      const h = r && Number.isFinite(r.height) ? r.height : 0;
      return rectCount > 0 && (w > 0 || h > 0);
    } catch {
      return false;
    }
  }

  function toEligibility(info) {
    return {
      eligible: !!(info && info.eligible),
      reasons: info && Array.isArray(info.reasons) ? info.reasons.slice(0) : []
    };
  }

  const geometrySupported = hasReliableGeometrySupport();
  const view = dom.defaultView(document) || null;

  // Skip-link wording in the shipped locales, one list for every rule that
  // looks for a skip link (helpers.hasSkipLinkWording, docs/RULE_HELPERS.md).
  const hasSkipWording = (name) => helpers.hasSkipLinkWording(name);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href]')
    : helpers.queryAll('a[href]');

  // The page's first link, when it comes before the main landmark, is where a
  // skip link sits whatever its wording.
  let positionalSkipLink = null;
  try {
    const main = dom.querySelector(document, 'main, [role="main"]');
    const first = nodes.length ? nodes[0] : null;
    if (
      main &&
      first &&
      typeof dom.get(first, 'compareDocumentPosition') === 'function' &&
      dom.compareDocumentPosition(first, main) & 4 // Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      positionalSkipLink = first;
    }
  } catch {
    positionalSkipLink = null;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const href = String(dom.getAttribute(el, 'href') || '').trim();
    if (href.length < 2 || href.charAt(0) !== '#') continue;

    const name = getAccessibleNameText(el);
    if (el !== positionalSkipLink && !hasSkipWording(name)) continue;

    applicableCount += 1;

    let fragment = href.slice(1);
    try {
      fragment = decodeURIComponent(fragment);
    } catch {}
    fragment = fragment.trim();

    let target = null;
    if (fragment) {
      try {
        target = dom.getElementById(document, fragment);
      } catch {
        target = null;
      }
      if (!target) {
        // A legacy <a name>, compared as an attribute rather than built into a
        // selector, which a backslash or quote in the name would break.
        try {
          target =
            Array.from(dom.querySelectorAll(document, 'a[name]')).find(
              (a) => dom.getAttribute(a, 'name') === fragment
            ) || null;
        } catch {
          target = null;
        }
      }
    }

    if (target) {
      const accEligibility = toEligibility(
        helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(target, ctx, { targetSet: 'acc' })
          : helpers.isAccTreeEligible
            ? helpers.isAccTreeEligible(target, ctx)
            : { eligible: true, reasons: [] }
      );

      let geometryEligibility = null;
      let geometryReasonCode = null;
      if (geometrySupported && helpers.isDomVisibleEligible) {
        geometryEligibility = toEligibility(
          helpers.isDomVisibleEligible(target, ctx, {
            visibilityMode: 'styleAndGeometry',
            ignoreOpacity: true
          })
        );
        if (
          !geometryEligibility.eligible &&
          geometryEligibility.reasons.includes('noClientRects')
        ) {
          geometryReasonCode = 'NO_CLIENT_RECTS';
        } else if (
          !geometryEligibility.eligible &&
          geometryEligibility.reasons.includes('zeroArea')
        ) {
          geometryReasonCode = 'ZERO_AREA_TARGET';
        }
      }

      const unusableByAcc = !accEligibility.eligible;
      const unusableByGeometry = !!geometryReasonCode;
      if (!unusableByAcc && !unusableByGeometry) continue;

      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This skip link points to a target that exists but is not currently usable.',
          hint: 'Point this skip link to a target that is exposed and usable as a navigation destination.',
          i18n: {
            summaryKey: 'skipLink_summary_unusableTarget_cantTell',
            hintKey: 'skipLink_hint_unusableTarget_cantTell',
            params: { href }
          },
          data: {
            details: {
              reasonCode: 'SKIP_LINK_TARGET_UNUSABLE',
              href,
              unusableReasonCode: unusableByAcc ? 'ACC_TREE_INELIGIBLE' : geometryReasonCode,
              targetSelector: helpers.buildSelector ? helpers.buildSelector(target) : null,
              geometryCheckEnabled: geometrySupported,
              // A target hidden at one breakpoint may be shown at another.
              ...(geometrySupported && view
                ? { viewport: { width: view.innerWidth, height: view.innerHeight } }
                : {})
            },
            visibilityFilter: {
              targetSet: 'acc',
              accEligible: accEligibility.eligible,
              reasons: accEligibility.reasons
            },
            targetGeometry: geometryEligibility
              ? { eligible: geometryEligibility.eligible, reasons: geometryEligibility.reasons }
              : { eligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: "This skip link's target does not exist.",
        hint: "Point the skip link's href at an id that exists in the document, or add the missing target element.",
        i18n: {
          summaryKey: 'skipLink_summary_cantTell',
          hintKey: 'skipLink_hint_cantTell',
          params: { href }
        },
        data: {
          details: { reasonCode: 'SKIP_LINK_TARGET_MISSING', href }
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
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
