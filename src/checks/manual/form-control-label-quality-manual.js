/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-control-label-quality
 * @atomic true
 * @summary A form field's visible label text should describe that field, not repeat another one
 * @standard WCAG 2.2
 * @sc 2.4.6
 * @applicability
 *   Visible form fields — native `input` (excluding hidden and the
 *   button-like types), `select`, `textarea`, or an element with one of
 *   the ARIA widget roles ACT cc0f0a lists (checkbox, combobox, listbox,
 *   menuitemcheckbox, menuitemradio, radio, searchbox, slider,
 *   spinbutton, switch, textbox) — that carry a visible programmatic
 *   label: a `<label>` association, or the elements `aria-labelledby`
 *   points at. A field named only by `aria-label`/`title` has no visible
 *   label to judge and is out of scope here (its labelling mechanism is
 *   `form-control-programmatic-label-quality`'s concern, its presence
 *   `form-control-programmatic-label-present`'s).
 * @expectation
 *   The visible label text (a) is not a placeholder left in the markup
 *   ("label", "field", "enter text", ...), (b) is not shared with another
 *   field that no visible context tells apart — the same "Name" twice,
 *   with nothing visible on screen saying which is shipping and which is
 *   billing — and (c) is the whole of the field's programmatic label, not
 *   the visible fragment of a label whose descriptive part is hidden.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail). Whether a
 *   label describes its field is a reading judgment: ACT cc0f0a fails
 *   `<label>Menu<input type="text" name="fname"></label>` on the meaning
 *   of the word alone, which no markup-level check can reach. What is
 *   deterministic is a placeholder string, a label repeated with no
 *   visible differentiator, and a label split between visible and hidden
 *   parts — the three shapes this rule reports.
 * - Only PROGRAMMATIC labels count, per ACT: a `<label>` or the targets
 *   of `aria-labelledby`. `aria-label` is invisible text, so it can carry
 *   no visual context and is not what a sighted user reads.
 * - Visibility is ACT's, not the accessibility tree's: a label positioned
 *   off screen or clipped is programmatically fine and visually absent,
 *   which is exactly what makes ACT's failed example 4 (`<h2>` at
 *   `top: -9999px`) a failure rather than a pass. Hence
 *   `isDomVisibleEligible` for rendering plus the shared visibility
 *   hints for the off-screen/clipped/transparent patterns.
 * - The context a duplicate label is judged against is the visible
 *   context nearest the field: its `<fieldset>`'s visible `<legend>`, or
 *   failing that the nearest visible heading before it. A row of a table
 *   or a list item contributes its own text too, which is what keeps a
 *   repeated "Quantity" field in a product table — differentiated by the
 *   product name in the same row — from being reported.
 * - Two fields conflict only when their label text AND their context are
 *   both identical. Same label under two different visible headings is
 *   ACT's passed example 5 and is not reported.
 * - A label split across visible and hidden parts is reported on its own:
 *   `aria-labelledby="submit search"` where "Search" is `display: none`
 *   and only the "Go" button renders leaves a sighted user reading a
 *   different label than a screen reader announces. ACT's failed example
 *   5 is exactly that. The hidden part may well be a deliberate
 *   AT-only addition, which is why this is a review signal rather than a
 *   defect.
 */

const id = 'form-control-label-quality';

const meta = {
  title: 'Form field labels should be descriptive and distinguishable',
  description:
    'Flags a visible form-field label that is a placeholder ("Label", "Field"), or that repeats another field\'s label with no visible context — heading, legend, or row — telling the two apart.',
  i18n: {
    titleKey: 'formControlLabelQuality_title',
    descriptionKey: 'formControlLabelQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag246', 'forms', 'labels', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.6'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.6',
      title: 'Headings and Labels',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.6': ['form-control-label-descriptive-evidence'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const PLACEHOLDER_LABEL_TEXT = new Set([
    'label',
    'field',
    'form field',
    'input',
    'input field',
    'text',
    'text field',
    'enter text',
    'type here',
    'value',
    'placeholder',
    'untitled',
    'tbd',
    'todo',
    'to do',
    'n/a',
    'test',
    'example',
    'default'
  ]);

  const FIELD_SELECTOR = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"])',
    'select',
    'textarea',
    '[role="checkbox"]',
    '[role="combobox"]',
    '[role="listbox"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    '[role="radio"]',
    '[role="searchbox"]',
    '[role="slider"]',
    '[role="spinbutton"]',
    '[role="switch"]',
    '[role="textbox"]'
  ].join(', ');

  const ROW_SELECTOR = 'tr, [role="row"], li, [role="listitem"]';
  const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, [role="heading"]';

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(s) {
    return normalizeWs(s)
      .toLowerCase()
      .replace(/[.,;:!?*]+$/g, '')
      .trim();
  }

  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;
  const getVisibilityHintsInfo =
    helpers && typeof helpers.getVisibilityHintsInfo === 'function'
      ? helpers.getVisibilityHintsInfo
      : null;

  const HIDING_HINTS = ['offscreen', 'clipped', 'opacityZero', 'zeroSize'];

  // ACT's "visible": rendered, and not hidden by one of the visually-hidden
  // CSS patterns. A label the user cannot read provides no visual context,
  // however well it is wired up programmatically.
  function isVisible(el) {
    if (!el) return false;
    if (isDomVisibleEligible) {
      try {
        const vis = isDomVisibleEligible(el, ctx, {
          visibilityMode: 'styleOnly',
          disableGeometry: true
        });
        if (vis && vis.eligible === false) return false;
      } catch {
        // treat as rendered
      }
    }
    if (getVisibilityHintsInfo) {
      try {
        const info = getVisibilityHintsInfo(el, ctx);
        const hints = (info && info.hints) || [];
        for (const hint of HIDING_HINTS) {
          if (hints.indexOf(hint) !== -1) return false;
        }
      } catch {
        // treat as visible
      }
    }
    return true;
  }

  function resolveIdRefs(el, attr) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute(attr));
    if (!raw) return [];
    const out = [];
    for (const refId of raw.split(/\s+/).filter(Boolean)) {
      try {
        const ref = document.getElementById(refId);
        if (ref) out.push(ref);
      } catch {
        // ignore an unusable reference
      }
    }
    return out;
  }

  function getNativeLabels(el) {
    const labels = [];
    try {
      if (el.labels && el.labels.length) {
        for (const label of el.labels) labels.push(label);
        return labels;
      }
    } catch {
      // fall through to the manual lookup
    }
    const idVal = normalizeWs(el.getAttribute && el.getAttribute('id'));
    if (idVal) {
      try {
        for (const label of document.querySelectorAll('label[for]')) {
          if (normalizeWs(label.getAttribute('for')) === idVal) labels.push(label);
        }
      } catch {
        // ignore
      }
    }
    try {
      const wrapping = el.closest ? el.closest('label') : null;
      if (wrapping && labels.indexOf(wrapping) === -1) labels.push(wrapping);
    } catch {
      // ignore
    }
    return labels;
  }

  // The programmatic labels of a field, per ACT: aria-labelledby targets when
  // present, otherwise the <label> elements associated with it. aria-label is
  // deliberately absent — see the header comment.
  function getVisibleLabelText(el) {
    const referenced = resolveIdRefs(el, 'aria-labelledby');
    const labels = referenced.length ? referenced : getNativeLabels(el);
    const parts = [];
    let hiddenParts = 0;
    for (const label of labels) {
      const text = normalizeWs(label.textContent);
      if (!text) continue;
      if (isVisible(label)) parts.push(text);
      else hiddenParts += 1;
    }
    return { text: normalizeWs(parts.join(' ')), hiddenParts };
  }

  const headings = (() => {
    try {
      return Array.prototype.slice.call(document.querySelectorAll(HEADING_SELECTOR));
    } catch {
      return [];
    }
  })();

  function precedes(a, b) {
    try {
      // DOCUMENT_POSITION_PRECEDING (2) on b relative to a.
      return !!(b.compareDocumentPosition(a) & 2);
    } catch {
      return false;
    }
  }

  function nearestVisibleHeadingText(el) {
    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i];
      if (!precedes(heading, el)) continue;
      if (!isVisible(heading)) continue;
      const text = normalizeWs(heading.textContent);
      if (text) return text;
    }
    return '';
  }

  function fieldsetLegendText(el) {
    let fieldset = null;
    try {
      fieldset = el.closest ? el.closest('fieldset') : null;
    } catch {
      fieldset = null;
    }
    while (fieldset) {
      let legend = null;
      try {
        legend = fieldset.querySelector('legend');
      } catch {
        legend = null;
      }
      if (legend && isVisible(legend)) {
        const text = normalizeWs(legend.textContent);
        if (text) return text;
      }
      try {
        fieldset = fieldset.parentElement ? fieldset.parentElement.closest('fieldset') : null;
      } catch {
        fieldset = null;
      }
    }
    return '';
  }

  // A table row or list item carries its own context — the product name a
  // repeated "Quantity" field belongs to — so it takes part in the key.
  function rowContextText(el, labelText) {
    let row = null;
    try {
      row = el.closest ? el.closest(ROW_SELECTOR) : null;
    } catch {
      row = null;
    }
    if (!row || !isVisible(row)) return '';
    const text = normalizeWs(row.textContent);
    if (!text) return '';
    return normalizeWs(text.split(labelText).join(' '));
  }

  function contextKey(el, labelText) {
    const group = fieldsetLegendText(el) || nearestVisibleHeadingText(el);
    return `${normalize(group)}##${normalize(rowContextText(el, labelText))}`;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(FIELD_SELECTOR)
    : helpers.queryAll(FIELD_SELECTOR);

  const fields = [];
  for (const el of nodes) {
    if (!el || el.nodeType !== 1) continue;
    if (!isVisible(el)) continue;

    const label = getVisibleLabelText(el);
    const labelText = label.text;
    if (!labelText) continue; // no visible label to judge — a different rule's concern

    fields.push({
      el,
      labelText,
      normalized: normalize(labelText),
      hiddenParts: label.hiddenParts
    });
  }

  if (!fields.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Group by label text plus the visible context that would tell two
  // same-named fields apart.
  const byKey = new Map();
  for (const field of fields) {
    field.key = `${field.normalized}||${contextKey(field.el, field.labelText)}`;
    const bucket = byKey.get(field.key);
    if (bucket) bucket.push(field);
    else byKey.set(field.key, [field]);
  }

  const occurrences = [];

  for (const field of fields) {
    const isPlaceholder = PLACEHOLDER_LABEL_TEXT.has(field.normalized);
    const shared = byKey.get(field.key) || [];
    const isDuplicate = shared.length > 1;
    const isPartiallyHidden = field.hiddenParts > 0;

    if (!isPlaceholder && !isDuplicate && !isPartiallyHidden) continue;

    const reasonCode = isPlaceholder
      ? 'PLACEHOLDER_LABEL_TEXT'
      : isDuplicate
        ? 'DUPLICATE_LABEL_TEXT'
        : 'PARTIALLY_HIDDEN_LABEL';

    const eligInfo = helpers.getEligibilityInfo
      ? (() => {
          try {
            return helpers.getEligibilityInfo(field.el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    const summaryByReason = {
      PLACEHOLDER_LABEL_TEXT: `This field's visible label ("${field.labelText}") is a placeholder rather than a description of what the field is for.`,
      DUPLICATE_LABEL_TEXT: `This field's visible label ("${field.labelText}") is shared with ${shared.length - 1} other field(s), with no visible heading, legend or row text telling them apart.`,
      PARTIALLY_HIDDEN_LABEL: `This field's label is split: "${field.labelText}" is what renders, while ${field.hiddenParts} other part(s) of the label are hidden from sight.`
    };
    const hintByReason = {
      PLACEHOLDER_LABEL_TEXT:
        'Replace the label with one naming the information the field collects.',
      DUPLICATE_LABEL_TEXT:
        'Give each field a label of its own, or put the distinguishing context on screen — a visible heading or a fieldset legend above each group.',
      PARTIALLY_HIDDEN_LABEL:
        'Confirm the visible part alone identifies the field, or make the rest of the label visible.'
    };
    const SUMMARY_KEY_BY_REASON = {
      PLACEHOLDER_LABEL_TEXT: 'formControlLabelQuality_summary_cantTell_placeholder',
      DUPLICATE_LABEL_TEXT: 'formControlLabelQuality_summary_cantTell_duplicate',
      PARTIALLY_HIDDEN_LABEL: 'formControlLabelQuality_summary_cantTell_partiallyHidden'
    };
    const HINT_KEY_BY_REASON = {
      PLACEHOLDER_LABEL_TEXT: 'formControlLabelQuality_hint_cantTell_placeholder',
      DUPLICATE_LABEL_TEXT: 'formControlLabelQuality_hint_cantTell_duplicate',
      PARTIALLY_HIDDEN_LABEL: 'formControlLabelQuality_hint_cantTell_partiallyHidden'
    };

    occurrences.push(
      helpers.reportOccurrence(field.el, {
        summary: summaryByReason[reasonCode],
        hint: hintByReason[reasonCode],
        i18n: {
          summaryKey: SUMMARY_KEY_BY_REASON[reasonCode],
          hintKey: HINT_KEY_BY_REASON[reasonCode],
          params: {
            label: field.labelText,
            count: String(shared.length - 1),
            hiddenCount: String(field.hiddenParts)
          }
        },
        data: {
          details: {
            reasonCode,
            label: field.labelText,
            sharedWith: isDuplicate ? shared.length - 1 : 0,
            hiddenLabelParts: field.hiddenParts
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
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
