/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check autocomplete-valid
 * @atomic true
 * @summary A non-empty autocomplete attribute must follow the WHATWG autofill grammar
 * @standard WCAG 2.2
 * @sc 1.3.5
 * @applicability
 *   Applies to form controls (input, select, textarea) with a non-empty
 *   autocomplete attribute.
 * @expectation
 *   The value is "on"/"off" alone, or a well-formed autofill detail
 *   token list: an optional "section-*" token, then an optional
 *   "shipping"/"billing" token, then an optional contact-modality token
 *   (home/work/mobile/fax/pager/impp), then exactly one recognized
 *   field-name token (name, email, street-address, cc-number, tel, ...),
 *   optionally followed by "webauthn". A malformed value means the field
 *   is not reliably identified for assistive technology that relies on
 *   autocomplete to describe the expected input purpose.
 * @implementation-notes
 * - Implements the structural shape of the WHATWG autofill grammar
 *   (section/mode/contact-modality prefixes + one field-name token, in
 *   order) with the full fixed field-name vocabulary from the HTML
 *   Standard, rather than validating every field-specific constraint
 *   (e.g. which contact-modality tokens are legal for which field
 *   names), matches this engine's established "scoped"
 *   precedent (see aria-helpers.js) for keeping high-confidence fail
 *   without reimplementing the entire spec.
 */

const id = 'autocomplete-valid';

const meta = {
  title: 'autocomplete attribute must be a valid autofill value',
  description:
    'Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.',
  i18n: {
    titleKey: 'autocompleteValid_title',
    descriptionKey: 'autocompleteValid_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag135', 'forms', 'atomic', 'automatic'],
  wcagSc: ['1.3.5'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.5',
      title: 'Identify Input Purpose',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.5': ['autocomplete-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const FIELD_NAMES = new Set([
    'name',
    'honorific-prefix',
    'given-name',
    'additional-name',
    'family-name',
    'honorific-suffix',
    'nickname',
    'username',
    'new-password',
    'current-password',
    'one-time-code',
    'organization-title',
    'organization',
    'street-address',
    'address-line1',
    'address-line2',
    'address-line3',
    'address-level4',
    'address-level3',
    'address-level2',
    'address-level1',
    'country',
    'country-name',
    'postal-code',
    'cc-name',
    'cc-given-name',
    'cc-additional-name',
    'cc-family-name',
    'cc-number',
    'cc-exp',
    'cc-exp-month',
    'cc-exp-year',
    'cc-csc',
    'cc-type',
    'transaction-currency',
    'transaction-amount',
    'language',
    'bday',
    'bday-day',
    'bday-month',
    'bday-year',
    'sex',
    'tel',
    'tel-country-code',
    'tel-national',
    'tel-area-code',
    'tel-local',
    'tel-extension',
    'email',
    'impp',
    'url',
    'photo'
  ]);
  const CONTACT_MODALITY = new Set(['home', 'work', 'mobile', 'fax', 'pager', 'impp']);

  function isValidAutocomplete(raw) {
    const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    if (tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')) return true;

    let i = 0;
    if (tokens[i] && tokens[i].startsWith('section-') && tokens[i].length > 'section-'.length)
      i += 1;
    if (tokens[i] === 'shipping' || tokens[i] === 'billing') i += 1;
    // A contact modality token is only allowed when the field that follows is
    // a contact field, so "work photo" is invalid while "work email" is not.
    if (CONTACT_MODALITY.has(tokens[i])) {
      const next = tokens[i + 1];
      const isContactField =
        next === 'email' || next === 'impp' || next === 'tel' || (next || '').startsWith('tel-');
      if (!isContactField) return false;
      i += 1;
    }

    let end = tokens.length;
    if (tokens[end - 1] === 'webauthn') end -= 1;

    const remaining = tokens.slice(i, end);
    if (remaining.length !== 1) return false;
    return FIELD_NAMES.has(remaining[0]);
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('input, select, textarea')
    : helpers.queryAll('input, select, textarea');

  const occurrences = [];
  let applicableCount = 0;

  // ACT 73f2c2 exempts controls where the attribute cannot describe an input
  // purpose: the on/off toggle, disabled controls, input types with a fixed
  // value, and controls that take no input.
  const FIXED_VALUE_TYPES = new Set([
    'button',
    'checkbox',
    'file',
    'image',
    'radio',
    'reset',
    'submit'
  ]);

  function isExempt(el) {
    const tag = String(el.tagName || '').toLowerCase();
    if (tag === 'input') {
      const type = String(el.getAttribute('type') || 'text').toLowerCase();
      if (FIXED_VALUE_TYPES.has(type)) return true;
    }
    if (el.hasAttribute && el.hasAttribute('disabled')) return true;
    if (String(el.getAttribute('aria-disabled') || '').toLowerCase() === 'true') return true;
    return false;
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('autocomplete') || '').trim();
    if (!raw) continue;

    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')) continue;
    if (isExempt(el)) continue;

    applicableCount += 1;

    if (isValidAutocomplete(raw)) continue;

    const tag = el.tagName.toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This autocomplete attribute value is not a valid autofill value.',
        hint: 'Use "on"/"off", or a valid autofill token list (e.g. "shipping street-address", "cc-number").',
        i18n: {
          summaryKey: 'autocompleteValid_summary_fail',
          hintKey: 'autocompleteValid_hint_fail',
          params: { element: tag, value: raw }
        },
        data: {
          details: { reasonCode: 'AUTOCOMPLETE_VALUE_INVALID', element: tag, value: raw }
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
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
