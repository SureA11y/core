/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check binary-control-name-present
 * @atomic true
 * @summary Checkboxes, radios and switches must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose role attribute resolves to checkbox, radio
 *   or switch (the first token naming a known role, matched
 *   case-insensitively, so role="foo switch" and role="SWITCH" count) that
 *   are included in the accessibility tree. A native
 *   <input type="checkbox">/<input type="radio"> is in scope only when it
 *   carries one of those roles explicitly; without a role attribute it
 *   belongs to form-control-programmatic-label-present.
 *   A custom element whose ElementInternals give it one of those roles
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   in scope too: that is its default role, and no other rule checks it.
 * @expectation
 *   The control has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, or from title. A native
 *   checkbox or radio additionally accepts an associated <label>, the
 *   labels API, a wrapping <label>, or label[for], with at most four labels
 *   read for determinism, and any other element accepts its own subtree
 *   text, those roles being name-from-content.
 * @reason-codes
 *   - `name_missing` (fail): the checkbox, radio or switch has no accessible
 *     name from aria-label, aria-labelledby, title, a label or its content.
 *     Basis: WCAG 4.1.2; F68; accname 1.2; ACT e086e5.
 *   - `name_internals` (cantTell): the element is a custom element that may
 *     give itself a name through ElementInternals, which no script can read, so
 *     whether it has one could not be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 */

const id = 'binary-control-name-present';

const meta = {
  title: 'Binary controls have an accessible name',
  description:
    'Checks that checkbox, radio, and switch controls expose a non-empty accessible name.',
  i18n: {
    titleKey: 'binaryControlNamePresent_title',
    descriptionKey: 'binaryControlNamePresent_description'
  },
  helpUrl: null,
  tags: [
    'wcag2a',
    'wcag412',
    'forms',
    'atomic',
    'automatic',
    'name',
    'checkbox',
    'radio',
    'switch'
  ],
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
  coverage: {
    facetsBySc: { '4.1.2': ['checkbox-name-present', 'radio-name-present', 'switch-name-present'] }
  }
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

  function getConservativeSubtreeText(document, container, skipNode) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link / "<button><img alt='...'></button>"
    // icon-button pattern).
    if (helpers.getContentNameInfo) {
      // skipNode: the control a <label> is read for, whose own value is not
      // part of its label (accname 2C applies to other controls only).
      const info = helpers.getContentNameInfo(container, ctx, skipNode ? { skipNode } : undefined);
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  // The name the control's associated <label>s give it, in document order,
  // each read as accname reads a label (helpers.getAssociatedLabelsNameInfo).
  function getNativeLabelText(el) {
    if (!helpers || typeof helpers.getAssociatedLabelsNameInfo !== 'function') return '';
    try {
      const info = helpers.getAssociatedLabelsNameInfo(el, ctx);
      return normalizeWs(info && info.value);
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
    // Delegates to the shared getTextFromIdRefs helper instead of computing
    // name-from-content of the referenced element, see dialog-name-
    // present.js's identical fix for the full rationale (an <iframe>
    // aria-labelledby target's only name source is its title attribute,
    // which name-from-content alone can never see).
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

  // Native checkbox/radio without an explicit role belongs to
  // form-control-programmatic-label-present.
  // Token match, case-insensitive; the resolved-role filter below drops
  // fallback lists whose first known token is some other role.
  const selector = '[role~="checkbox" i], [role~="radio" i], [role~="switch" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, { internalsRoles: true })
    : helpers.queryAll(selector);

  function evaluate(el, controlType) {
    // Programmatic mechanisms
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Native input label association (for input[type=checkbox|radio])
    if (controlType === 'checkbox' || controlType === 'radio') {
      const lab = getNativeLabelText(el);
      if (lab) return { ok: true, method: 'label' };
    }

    // ARIA roles (checkbox/radio/switch) can use content as name
    if (
      controlType === 'switch' ||
      controlType === 'aria-checkbox' ||
      controlType === 'aria-radio'
    ) {
      const t = getConservativeSubtreeText(document, el);
      if (t) return { ok: true, method: 'content' };
    }

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    // Determine control type
    const tag = (dom.tagName(el) || '').toLowerCase();
    const type = getAttr(el, 'type').toLowerCase();
    // The role attribute is a fallback list: the first token naming a known
    // role wins (role="foo switch" is a switch, role="link switch" a link).
    const role = helpers.aria.getAuthorRole(el);
    if (role !== 'checkbox' && role !== 'radio' && role !== 'switch') continue;

    let controlType;
    if (tag === 'input' && type === 'checkbox') controlType = 'checkbox';
    else if (tag === 'input' && type === 'radio') controlType = 'radio';
    else if (role === 'checkbox') controlType = 'aria-checkbox';
    else if (role === 'radio') controlType = 'aria-radio';
    else if (role === 'switch') controlType = 'switch';
    else continue;

    applicableCount += 1;

    const res = evaluate(el, controlType);
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

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This control has no accessible name.',
        hint: 'Name the control with a <label>, aria-label or aria-labelledby, so screen reader users know what it is for.',
        i18n: {
          summaryKey: 'binaryControlNamePresent_summary_fail',
          hintKey: 'binaryControlNamePresent_hint_fail',
          params: { controlType }
        },
        data: {
          details: {
            reasonCode: 'name_missing',
            controlType,
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
  // Tiered only when there is a question, so a plain failure reads as before.
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
    };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
