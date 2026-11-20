/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check dialog-name-present
 * @atomic true
 * @summary Dialogs (role="dialog"/"alertdialog" or a native <dialog>) must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements included in the accessibility tree whose role is
 *   dialog or alertdialog: an element whose role attribute resolves to one
 *   of those roles (the first token that names a concrete ARIA role wins,
 *   so role="alertdialog dialog" is an alertdialog), and a native <dialog>
 *   whose role attribute is absent or names no concrete role (its implicit
 *   role is dialog). A closed <dialog> is hidden and so not in scope.
 *   A custom element whose ElementInternals give it one of those roles
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, or from title. Both
 *   roles are name-from-author-only, so the heading or body text inside the
 *   dialog is not accepted as its name unless aria-labelledby points at it.
 *   A missing name is reported at CANTTELL, not FAIL. WAI-ARIA requires it
 *   ("Authors MUST provide an accessible name for a dialog"), but a dialog is
 *   not itself a user interface component in WCAG's sense, "a single control
 *   for a distinct function": its controls are, and each is named by its own
 *   rule. So the missing name proves the WAI-ARIA violation, not a failure of
 *   SC 4.1.2. It can still be a WCAG failure where the dialog shows a visible
 *   title that is not tied to it (that relationship is then not
 *   programmatically determinable, SC 1.3.1); a person settles that.
 * @reason-codes
 *   - `name_missing` (cantTell): the dialog or alertdialog has no accessible
 *     name from aria-label, aria-labelledby or title. A WAI-ARIA violation;
 *     whether it also fails a WCAG criterion depends on what the page shows.
 *     Basis: WAI-ARIA 1.2 dialog role (MUST); WAI-ARIA 1.2 alertdialog role;
 *     accname 1.2; WCAG 4.1.2 (not settled); WCAG 1.3.1 (not settled).
 *   - `name_internals` (cantTell): the element is a custom element that may
 *     give itself a name through ElementInternals, which no script can read, so
 *     whether it has one could not be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 */

const id = 'dialog-name-present';

const meta = {
  title: 'Dialogs have an accessible name',
  description:
    'Checks that dialogs (elements with role="dialog" or role="alertdialog", and native <dialog> elements) expose a non-empty accessible name.',
  i18n: {
    titleKey: 'dialogNamePresent_title',
    descriptionKey: 'dialogNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'dialog'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['dialog-name-present'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getAttr(el, name) {
    try {
      if (!el || !dom.get(el, 'getAttribute')) return '';
      return normalizeWs(dom.getAttribute(el, name));
    } catch {
      return '';
    }
  }

  function resolveAriaLabelledbyText(document, el, maxRefs) {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) {
      // References a script set as elements (el.ariaLabelledByElements)
      // leave the attribute empty; the shared helper reads them.
      if (helpers.getAriaLabelledByInfo) {
        try {
          const info = helpers.getAriaLabelledByInfo(el, ctx, { maxRefs: maxRefs || 8 });
          return normalizeWs(info && info.value);
        } catch {}
      }
      return '';
    }
    // Resolve via the shared getTextFromIdRefs helper, computes each
    // referenced element's own ACCESSIBLE NAME (aria-label, then
    // aria-labelledby, then a value-like name, then content, then title),
    // not just its content text. This matters when aria-labelledby points
    // at an <iframe title="..."> (e.g. BBC News' cookie-consent dialog,
    // pointing at an `<iframe title="SP Consent Message">`), whose only
    // name source is its title attribute, an iframe's content is
    // opaque/cross-origin per HTML-AAM, so "name from content" is always
    // empty. Computing only name-from-content of the referenced node would
    // silently miss the title fallback and report no accessible name at
    // all, the same pattern every other *-name-present rule guards against.
    if (helpers.getTextFromIdRefs) {
      try {
        const r = helpers.getTextFromIdRefs(raw, ctx, { maxRefs: maxRefs || 8 }, el);
        return normalizeWs(r && r.text);
      } catch {}
    }
    return '';
  }

  // Naming rules apply only to elements included in the accessibility tree
  // (ACT c487ae and siblings), which excludes focusable aria-hidden content.
  // aria-hidden-focus (ACT 6cfa84) covers that markup instead.
  function isEligibleAcc(helpers, el, ctx) {
    const fn =
      helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : helpers && typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const occurrences = [];
  // Custom elements whose internals no script can read (internalsQuestion).
  const questions = [];
  let applicableCount = 0;

  // Filtered below by the resolved role.
  const selector = 'dialog,[role]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, { internalsRoles: true })
    : helpers.queryAll(selector);

  function evaluate(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // role="dialog"/"alertdialog" is name-from-author-only per WAI-ARIA: it
    // must NOT fall back to subtree content. A dialog's heading or body
    // text is not reliably exposed to assistive technologies as the
    // dialog's accessible name unless explicitly wired via aria-labelledby.
    return { ok: false, method: 'none' };
  }

  // The first heading in el with text, not inside a nested dialog:
  // { tag, text, id }, tag as <h2> or <div role="heading">; null when none.
  function headingIn(el) {
    const BOXES = ['dialog', 'alertdialog'];
    const roleOf = (n) => helpers.aria.getExplicitRole(n) || '';
    for (const h of dom.querySelectorAll(el, 'h1, h2, h3, h4, h5, h6, [role~="heading" i]')) {
      const tag = String(dom.tagName(h) || '').toLowerCase();
      const role = roleOf(h);
      if (role ? role !== 'heading' : !/^h[1-6]$/.test(tag)) continue;
      // Leave out a heading of a nested dialog or landmark.
      let nested = false;
      for (let n = dom.parentElement(h); n && n !== el; n = dom.parentElement(n)) {
        const r =
          roleOf(n) || (String(dom.tagName(n) || '').toLowerCase() === 'dialog' ? 'dialog' : '');
        if (BOXES.includes(r)) nested = true;
      }
      if (nested) continue;
      const all = String(dom.textContent(h) || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!/[\p{L}\p{N}]/u.test(all)) continue;
      const text = all.length > 40 ? `${all.slice(0, 39)}…` : all;
      const headingId = (dom.getAttribute(h, 'id') || '').trim();
      return {
        tag: /^h[1-6]$/.test(tag) ? `<${tag}>` : `<${tag} role="heading">`,
        text,
        id: headingId
      };
    }
    return null;
  }

  // The role the browser uses: the first token of the role attribute that
  // names a concrete ARIA role (in any case), else the element's implicit
  // role (dialog for a native <dialog>; the others are not in scope here).
  function resolveRole(el) {
    const explicit = helpers.aria.getAuthorRole(el);
    if (explicit) return explicit;
    return String(dom.tagName(el) || '').toLowerCase() === 'dialog' ? 'dialog' : '';
  }

  for (const el of nodes) {
    if (!el) continue;

    const role = resolveRole(el);
    if (role !== 'dialog' && role !== 'alertdialog') continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    applicableCount += 1;

    const res = evaluate(el);
    if (res.ok) continue;
    // A custom element may name itself through ElementInternals
    // (helpers.getInternalsNameInfo).
    const internalsName =
      typeof helpers.getInternalsNameInfo === 'function'
        ? helpers.getInternalsNameInfo(el, ctx)
        : null;
    if (internalsName && internalsName.status === 'named') continue;
    if (internalsName && internalsName.status === 'unknown') {
      questions.push(helpers.reportOccurrence(el, helpers.internalsQuestion(el, 'name')));
      continue;
    }

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    // Why it has none, where the page shows a cause the reader would not
    // see from the element alone (helpers.nameCause): the hint says so.
    const cause = helpers.nameCause
      ? helpers.nameCause(el, { content: false, skip: ['labelledbyHiddenText'] })
      : null;
    // Without a cause, the hint does not ask for an aria-labelledby the dialog has.
    const labelledby = !!(dom.getAttribute(el, 'aria-labelledby') || '').trim();
    // A heading in the dialog that is not tied to it: the hint names it.
    const heading = cause || labelledby ? null : headingIn(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This dialog has no accessible name.',
        hint: cause
          ? cause.hint
          : labelledby
            ? "Its aria-labelledby gives no name. Check that it lists the id of the dialog's heading and that the heading has text screen readers read, or name the dialog with aria-label."
            : heading && heading.id
              ? `Its heading ${heading.tag} "${heading.text}" is not tied to it. Add aria-labelledby="${heading.id}" to the dialog, so screen readers announce that heading as its name.`
              : heading
                ? `Its heading ${heading.tag} "${heading.text}" is not tied to it. Give the heading an id and point the dialog's aria-labelledby at it, so screen readers announce that heading as its name.`
                : 'Name it with aria-labelledby pointing at its heading, or with aria-label, so screen readers announce what the dialog is about.',
        i18n: {
          summaryKey: 'dialogNamePresent_summary_fail',
          hintKey: cause
            ? cause.hintKey
            : labelledby
              ? 'dialogNamePresent_hint_fail_labelledby'
              : heading && heading.id
                ? 'dialogNamePresent_hint_heading'
                : heading
                  ? 'dialogNamePresent_hint_headingNoId'
                  : 'dialogNamePresent_hint_fail',
          params: {
            role,
            ...(cause ? cause.params : {}),
            ...(heading ? { tag: heading.tag, text: heading.text, id: heading.id } : {})
          }
        },
        uncertainty: {
          code: 'spec-only',
          needed:
            'Whether the dialog shows a visible title or heading that is not tied to it with aria-labelledby.',
          evidence: { role, source: 'WAI-ARIA 1.2, dialog role (MUST)' }
        },
        data: {
          details: {
            reasonCode: 'name_missing',
            ...(cause ? { nameCause: cause.detail } : {}),
            ...(heading ? { heading: { text: heading.text, id: heading.id || null } } : {}),
            controlType: role,
            methodTried: res.method
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // Every finding is a question: a missing name proves the WAI-ARIA
  // violation, not a WCAG failure (see @expectation).
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      [],
      [...occurrences, ...questions],
      rule.defaultSeverity || 'minor'
    )
  };
}

module.exports = { id, meta, runInPage };
