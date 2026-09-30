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
 *   autocomplete attribute. Disabled controls (the disabled attribute,
 *   including a control disabled by a disabled fieldset ancestor, or
 *   aria-disabled="true") and input types with a fixed value are exempt,
 *   as in ACT 73f2c2.
 * @expectation
 *   The value is "on"/"off" alone, or a well-formed autofill detail
 *   token list: an optional "section-*" token, then an optional
 *   "shipping"/"billing" token, then an optional contact-modality token
 *   (home/work/mobile/fax/pager/impp), then exactly one recognized
 *   field-name token (name, email, street-address, cc-number, tel, ...),
 *   optionally followed by "webauthn". The field name must also suit the
 *   control: the HTML Standard gives each field name a control group, and
 *   each group is allowed only on some input types (street-address only on
 *   textarea or select; email only on text, search or email inputs; and so
 *   on). A malformed or unsuitable value means the field is not reliably
 *   identified for assistive technology that relies on autocomplete to
 *   describe the expected input purpose.
 * @implementation-notes
 * - Implements the structural shape of the WHATWG autofill grammar
 *   (section/mode/contact-modality prefixes + one field-name token, in
 *   order) with the fixed field-name vocabulary from the HTML Standard,
 *   rather than validating every field-specific constraint (e.g. which
 *   contact-modality tokens are legal for which field names), matches
 *   this engine's established "scoped" precedent (see aria-helpers.js)
 *   for keeping high-confidence fail without reimplementing the entire
 *   spec.
 * - Control groups: textarea, select and input type=hidden accept every
 *   group. input types text and search (and a missing or unknown type)
 *   accept every group except Multiline (street-address). password, email,
 *   url, tel, number, month and date inputs accept only their own group
 *   (email also accepts username). Other input types (time, week,
 *   datetime-local, range, color) are not checked for the group, as the
 *   W3C validator does not check them either. A mismatch is reported with
 *   reasonCode AUTOCOMPLETE_FIELD_CONTROL_MISMATCH.
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

  // Control group of each field name that is not in the Text group (HTML
  // Standard, autofill field table).
  const FIELD_GROUP = {
    username: 'username',
    'new-password': 'password',
    'current-password': 'password',
    'one-time-code': 'password',
    'street-address': 'multiline',
    'cc-exp': 'month',
    'cc-exp-month': 'numeric',
    'cc-exp-year': 'numeric',
    'transaction-amount': 'numeric',
    bday: 'date',
    'bday-day': 'numeric',
    'bday-month': 'numeric',
    'bday-year': 'numeric',
    url: 'url',
    photo: 'url',
    impp: 'url',
    tel: 'tel',
    email: 'email'
  };
  // Groups accepted by input types other than text and search. text and
  // search accept every group except multiline.
  const GROUPS_BY_INPUT_TYPE = {
    password: ['password'],
    email: ['email', 'username'],
    url: ['url'],
    tel: ['tel'],
    number: ['numeric'],
    month: ['month'],
    date: ['date']
  };
  const KNOWN_INPUT_TYPES = new Set([
    'hidden',
    'text',
    'search',
    'tel',
    'url',
    'email',
    'password',
    'date',
    'month',
    'week',
    'time',
    'datetime-local',
    'number',
    'range',
    'color',
    'checkbox',
    'radio',
    'file',
    'submit',
    'image',
    'reset',
    'button'
  ]);

  // Returns the field-name token of a well-formed value, or null.
  function getFieldName(raw) {
    const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;

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
      if (!isContactField) return null;
      i += 1;
    }

    let end = tokens.length;
    if (tokens[end - 1] === 'webauthn') end -= 1;

    const remaining = tokens.slice(i, end);
    if (remaining.length !== 1) return null;
    return FIELD_NAMES.has(remaining[0]) ? remaining[0] : null;
  }

  // True when the field name's control group is allowed on this control.
  function fieldSuitsControl(el, fieldName) {
    const tag = String(el.tagName || '').toLowerCase();
    if (tag !== 'input') return true;
    let type = String(el.getAttribute('type') || 'text')
      .trim()
      .toLowerCase();
    if (!KNOWN_INPUT_TYPES.has(type)) type = 'text';
    if (type === 'hidden') return true;
    const group = FIELD_GROUP[fieldName] || 'text';
    if (type === 'text' || type === 'search') return group !== 'multiline';
    const allowed = GROUPS_BY_INPUT_TYPE[type];
    if (!allowed) return true;
    return allowed.includes(group);
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
    // A control inside a disabled fieldset (outside its first legend) is
    // disabled too.
    try {
      if (el.matches && el.matches(':disabled')) return true;
    } catch {
      /* selector unsupported */
    }
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

    const fieldName = getFieldName(raw);
    const tag = el.tagName.toLowerCase();

    if (!fieldName) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This autocomplete attribute value is not a valid autofill value.',
          hint: 'Use "on"/"off", or a valid autofill token list (e.g. "shipping postal-code", "cc-number").',
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
      continue;
    }

    if (fieldSuitsControl(el, fieldName)) continue;

    const inputType = String(el.getAttribute('type') || 'text')
      .trim()
      .toLowerCase();
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `The autofill field name "${fieldName}" is not allowed on an input of type "${inputType}".`,
        hint: 'Use a field name that suits this type of control, or change the control (street-address needs a textarea; email needs a text, search or email input; bday-day needs a text, search or number input).',
        i18n: {
          summaryKey: 'autocompleteValid_summary_mismatch',
          hintKey: 'autocompleteValid_hint_mismatch',
          params: { element: tag, value: raw, fieldName, inputType }
        },
        data: {
          details: {
            reasonCode: 'AUTOCOMPLETE_FIELD_CONTROL_MISMATCH',
            element: tag,
            value: raw,
            fieldName,
            inputType
          }
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
