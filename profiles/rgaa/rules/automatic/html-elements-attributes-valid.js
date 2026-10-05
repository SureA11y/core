/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check html-elements-attributes-valid
 * @atomic true
 * @summary HTML elements and attribute values must follow HTML's writing rules
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every HTML element in the scan scope, hidden or not: RGAA
 *   8.2.1 judges the generated source, which the W3C validator reads whole
 *   (helpers.queryAllSource). Elements in SVG or MathML are left out. The
 *   checks follow HTML5; a page whose doctype is neither HTML5 nor missing
 *   is asked about instead (see below).
 * @expectation
 *   « Les balises, attributs et valeurs d'attributs respectent les règles
 *   d'écriture » (RGAA 8.2.1). Each case below is an error of the W3C
 *   validator (Nu checker 26.9.27, the version the expected outcomes were
 *   checked against), and fails:
 *   - obsoleteElement: an element HTML makes obsolete (blink, marquee,
 *     center, font, big, tt, strike, acronym, applet, dir, frame, and so
 *     on);
 *   - unknownElement: an element HTML does not define whose name is not a
 *     valid custom element name (foo, font-face);
 *   - dirValue: dir other than ltr, rtl or auto (case aside), spaces
 *     included; auto on bdo;
 *   - idValue: an empty id, or one with whitespace;
 *   - langValue: a lang value that is not a well-formed BCP 47 language
 *     tag (en_US, en-US-US, fr-FR-!!, " en"). An empty lang is allowed;
 *     whether the language subtag is registered is left to
 *     html-lang-code-valid (8.4.1) and valid-lang (8.8.1);
 *   - xmlLangMismatch: xml:lang without lang, or with a different value
 *     (case aside);
 *   - scopeValue: a scope on th other than row, col, rowgroup or colgroup
 *     (case aside), spaces or empty value included;
 *   - scopeElement: scope on an element other than th or td (on td it is
 *     only a validator warning);
 *   - headersTarget / headersEmpty: a headers token that names no th of
 *     the same table (a td, a caption, an element outside the table or in
 *     a nested table), or an empty headers attribute;
 *   - optgroupLabel: an optgroup with no label attribute and no legend
 *     child;
 *   - inputImageAlt: input type=image with no alt, or an empty one;
 *   - autocompleteValue: an empty autocomplete, a token list that is not a
 *     valid autofill detail list, on or off on input type=hidden, or a form
 *     autocomplete other than on or off. Disabled fields are included;
 *   - autocompleteControl: a field name whose control group the input type
 *     does not accept (street-address on a text input, email on a number
 *     input);
 *   - autocompleteType: autocomplete on an input type that does not take
 *     it (checkbox, radio, file, submit, image, reset, button).
 * @implementation-notes
 * - The WCAG rules on these attributes (deprecated-elements-not-used,
 *   dir-attribute-valid, scope-attr-valid, table-headers-attr-valid,
 *   html-xml-lang-mismatch, autocomplete-valid, optgroup-label-present,
 *   input-image-alt-decorative) skip hidden content, trim values, exempt
 *   disabled fields or judge something else than validity. RGAA 8.2.1
 *   follows the validator, so this rule reports 8.2.1 in their place.
 * - Where the validator is stricter than the HTML standard, the rule does
 *   not report: on and off written in capitals, street-address on a search
 *   input, and extension or variant subtags that are well formed but not
 *   registered. It never reports what the validator accepts.
 * - RGAA 8.2.1 judges the source "selon le type de document spécifié".
 *   center, font and scope on td are valid HTML 4.01 Transitional, and an
 *   XHTML page uses xml:lang, so on a page whose doctype is neither HTML5
 *   nor missing the rule asks once (otherDoctype) instead of applying the
 *   HTML5 rules. A page with no doctype is checked as HTML5, as the
 *   validator does.
 * - Duplicate id values are duplicate-id's; nesting is html-nesting-valid's.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'html-elements-attributes-valid';

const meta = {
  title: 'HTML elements and attribute values are valid',
  description:
    'Checks, hidden content included, for obsolete or unknown elements and for invalid dir, id, lang, xml:lang, scope, headers, optgroup label, image button alt and autocomplete values, as the W3C validator reports them.',
  i18n: {
    titleKey: 'htmlElementsAttributesValid_title',
    descriptionKey: 'htmlElementsAttributesValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'autocompleteType',
    'headersEmpty',
    'otherDoctype',
    'scopeElement',
    'xmlLangMismatch'
  ]
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const query = (sel) =>
    (helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel)).filter(
      (el) => el && el.namespaceURI === HTML_NS
    );
  const tagOf = (el) => String(el.localName || '').toLowerCase();
  const attr = (el, name) => el.getAttribute(name);

  const OBSOLETE = new Set([
    'acronym',
    'applet',
    'basefont',
    'bgsound',
    'big',
    'blink',
    'center',
    'dir',
    'font',
    'frame',
    'frameset',
    'isindex',
    'keygen',
    'listing',
    'marquee',
    'menuitem',
    'multicol',
    'nextid',
    'nobr',
    'noembed',
    'noframes',
    'param',
    'plaintext',
    'spacer',
    'strike',
    'tt',
    'xmp'
  ]);
  const KNOWN = new Set(
    (
      'a abbr address area article aside audio b base bdi bdo blockquote body br button ' +
      'canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl ' +
      'dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header ' +
      'hgroup hr html i iframe img input ins kbd label legend li link main map mark menu ' +
      'meta meter nav noscript object ol optgroup option output p picture pre progress q rb ' +
      'rp rt rtc ruby s samp script search section select selectedcontent slot small source ' +
      'span strong style sub summary sup table tbody td template textarea tfoot th thead ' +
      'time title tr track u ul var video wbr'
    ).split(' ')
  );
  const RESERVED_CUSTOM = new Set([
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph'
  ]);

  // RFC 5646 well-formedness (not registry validity).
  const IRREGULAR =
    'en-gb-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|' +
    'i-pwn|i-tao|i-tay|i-tsu|sgn-be-fr|sgn-be-nl|sgn-ch-de';
  const LANGTAG = new RegExp(
    '^(?:(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})' +
      '(?:-[a-z]{4})?' +
      '(?:-(?:[a-z]{2}|[0-9]{3}))?' +
      '(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*' +
      '(?:-[0-9a-wyz](?:-[a-z0-9]{2,8})+)*' +
      '(?:-x(?:-[a-z0-9]{1,8})+)?' +
      '|x(?:-[a-z0-9]{1,8})+' +
      '|' +
      IRREGULAR +
      ')$',
    'i'
  );

  const FIELD_NAMES = new Set(
    (
      'name honorific-prefix given-name additional-name family-name honorific-suffix ' +
      'nickname username new-password current-password one-time-code organization-title ' +
      'organization street-address address-line1 address-line2 address-line3 ' +
      'address-level4 address-level3 address-level2 address-level1 country country-name ' +
      'postal-code cc-name cc-given-name cc-additional-name cc-family-name cc-number ' +
      'cc-exp cc-exp-month cc-exp-year cc-csc cc-type transaction-currency ' +
      'transaction-amount language bday bday-day bday-month bday-year sex tel ' +
      'tel-country-code tel-national tel-area-code tel-local tel-local-prefix tel-local-suffix ' +
      'tel-extension email impp url ' +
      'photo'
    ).split(' ')
  );
  const CONTACT_MODALITY = new Set(['home', 'work', 'mobile', 'fax', 'pager']);
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
  // Groups each input type accepts, where the validator checks the group.
  // text accepts every group but multiline; search, hidden, week, time,
  // datetime-local, range and color are not checked.
  const GROUPS_BY_INPUT_TYPE = {
    password: ['password'],
    email: ['email', 'username'],
    url: ['url'],
    tel: ['tel'],
    number: ['numeric'],
    month: ['month'],
    date: ['date']
  };
  const AUTOCOMPLETE_TYPES = new Set([
    'color',
    'date',
    'datetime-local',
    'email',
    'hidden',
    'month',
    'number',
    'password',
    'range',
    'search',
    'tel',
    'text',
    'time',
    'url',
    'week'
  ]);
  const NO_AUTOCOMPLETE_TYPES = new Set([
    'checkbox',
    'radio',
    'file',
    'submit',
    'image',
    'reset',
    'button'
  ]);

  // The field name of a well-formed autofill detail list, or null.
  function getFieldName(raw) {
    const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let i = 0;
    if (tokens[i] && tokens[i].startsWith('section-')) i += 1;
    if (tokens[i] === 'shipping' || tokens[i] === 'billing') i += 1;
    if (CONTACT_MODALITY.has(tokens[i])) {
      const next = tokens[i + 1] || '';
      const contact =
        next === 'email' || next === 'impp' || next === 'tel' || next.startsWith('tel-');
      if (!contact) return null;
      i += 1;
    }
    let end = tokens.length;
    if (tokens[end - 1] === 'webauthn') end -= 1;
    const rest = tokens.slice(i, end);
    if (rest.length !== 1) return null;
    return FIELD_NAMES.has(rest[0]) ? rest[0] : null;
  }

  const TEXTS = {
    obsoleteElement: [
      (p) => `The <${p.element}> element is obsolete in HTML.`,
      'Replace it with a current element, and use CSS for presentation.'
    ],
    unknownElement: [
      (p) =>
        `The <${p.element}> element is not defined by HTML and is not a valid custom element name.`,
      'Use an HTML element, or a custom element name with a hyphen that HTML does not reserve.'
    ],
    dirValue: [
      (p) => `The dir attribute value "${p.value}" is not valid on <${p.element}>.`,
      'Use ltr, rtl or auto, with no spaces (only ltr or rtl on <bdo>).'
    ],
    idValue: [
      (p) => `The id attribute value "${p.value}" is empty or contains whitespace.`,
      'Give the element an id with at least one character and no spaces.'
    ],
    langValue: [
      (p) => `The lang attribute value "${p.value}" is not a well-formed language tag.`,
      'Use a BCP 47 language tag, such as fr, en-GB or zh-Hant, with hyphens and no spaces.'
    ],
    xmlLangMismatch: [
      (p) =>
        `xml:lang="${p.xmlLang}" is not matched by a lang attribute with the same value on this <${p.element}>.`,
      'Give the element a lang attribute with the same value as xml:lang, or remove xml:lang.'
    ],
    scopeValue: [
      (p) => `The scope attribute value "${p.value}" is not valid on <th>.`,
      'Use row, col, rowgroup or colgroup, with no spaces.'
    ],
    scopeElement: [
      (p) => `The scope attribute is not allowed on <${p.element}>.`,
      'Put scope on the <th> header cell, or remove it.'
    ],
    headersTarget: [
      (p) =>
        `The headers attribute names "${p.target}", but no <th> of the same table has that id.`,
      'List the ids of the table’s own <th> header cells in headers.'
    ],
    headersEmpty: [
      () => 'This cell has an empty headers attribute.',
      'List the ids of the header cells, or remove the attribute.'
    ],
    optgroupLabel: [
      () => 'This <optgroup> has no label attribute.',
      'Give the <optgroup> a label attribute that names the group.'
    ],
    inputImageAlt: [
      () => 'This image button has no alt attribute, or an empty one.',
      'Give the <input type="image"> an alt attribute that says what the button does.'
    ],
    autocompleteValue: [
      (p) => `The autocomplete value "${p.value}" is not valid on <${p.element}>.`,
      'Use on or off, or one autofill field name with its optional prefixes (for example "shipping postal-code"). A form takes only on or off, and a hidden input takes neither.'
    ],
    autocompleteControl: [
      (p) =>
        `The autofill field name "${p.fieldName}" is not allowed on an input of type "${p.inputType}".`,
      'Use a field name that suits this type of input, or change the input type.'
    ],
    autocompleteType: [
      (p) => `The autocomplete attribute is not allowed on an input of type "${p.inputType}".`,
      'Remove the autocomplete attribute from this input.'
    ],
    otherDoctype: [
      () =>
        'The page declares a doctype other than HTML5, so HTML5 writing rules may not apply to it.',
      'Run the W3C validator on the generated source and check elements and attribute values against the declared doctype.'
    ]
  };

  const occurrences = [];
  function report(el, reasonCode, params, outcome) {
    const key = outcome === 'cantTell' ? 'cantTell' : 'fail';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: TEXTS[reasonCode][0](params || {}),
        hint: TEXTS[reasonCode][1],
        i18n: {
          summaryKey: `htmlElementsAttributesValid_summary_${key}_${reasonCode}`,
          hintKey: `htmlElementsAttributesValid_hint_${key}_${reasonCode}`,
          params: params || {}
        },
        uncertainty:
          outcome === 'cantTell'
            ? {
                code: 'out-of-scope',
                needed: 'Whether elements and attribute values are valid for the declared doctype.'
              }
            : undefined,
        data: {
          details: { reasonCode, ...(params || {}) },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  const all = query('*');
  if (!all.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const doctype = helpers.getDoctypeInfo ? helpers.getDoctypeInfo() : { kind: 'html5' };
  if (doctype.kind !== 'html5' && doctype.kind !== 'none') {
    report(document.documentElement, 'otherDoctype', {}, 'cantTell');
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  function nearestTable(el) {
    for (let n = el.parentNode; n && n.nodeType === 1; n = n.parentNode) {
      if (n.namespaceURI === HTML_NS && tagOf(n) === 'table') return n;
    }
    return null;
  }

  for (const el of all) {
    const tag = tagOf(el);

    if (OBSOLETE.has(tag)) {
      report(el, 'obsoleteElement', { element: tag });
    } else if (!KNOWN.has(tag)) {
      const custom = /^[a-z][^A-Z]*-[^A-Z]*$/.test(tag) && !RESERVED_CUSTOM.has(tag);
      if (!custom) report(el, 'unknownElement', { element: tag });
    }

    if (el.hasAttribute('dir')) {
      const value = attr(el, 'dir');
      const v = value.toLowerCase();
      const ok = tag === 'bdo' ? v === 'ltr' || v === 'rtl' : ['ltr', 'rtl', 'auto'].includes(v);
      if (!ok) report(el, 'dirValue', { value, element: tag });
    }

    if (el.hasAttribute('id')) {
      const value = attr(el, 'id');
      if (value === '' || /[\t\n\f\r ]/.test(value)) report(el, 'idValue', { value });
    }

    if (el.hasAttribute('lang')) {
      const value = attr(el, 'lang');
      if (value !== '' && !LANGTAG.test(value)) report(el, 'langValue', { value });
    }

    if (el.hasAttribute('xml:lang')) {
      const xmlLang = attr(el, 'xml:lang');
      const lang = el.hasAttribute('lang') ? attr(el, 'lang') : null;
      if (lang === null || lang.toLowerCase() !== xmlLang.toLowerCase()) {
        report(el, 'xmlLangMismatch', { xmlLang, lang: lang === null ? '' : lang, element: tag });
      }
    }

    if (el.hasAttribute('scope')) {
      const value = attr(el, 'scope');
      if (tag === 'th') {
        if (!['row', 'col', 'rowgroup', 'colgroup'].includes(value.toLowerCase())) {
          report(el, 'scopeValue', { value });
        }
      } else if (tag !== 'td') {
        report(el, 'scopeElement', { element: tag });
      }
    }

    if ((tag === 'td' || tag === 'th') && el.hasAttribute('headers')) {
      const tokens = attr(el, 'headers')
        .split(/[\t\n\f\r ]+/)
        .filter(Boolean);
      if (!tokens.length) {
        report(el, 'headersEmpty', {});
      } else {
        const table = nearestTable(el);
        const ths = table
          ? Array.from(table.querySelectorAll('th[id]')).filter((th) => nearestTable(th) === table)
          : [];
        const ids = new Set(ths.map((th) => th.getAttribute('id')));
        const missing = tokens.find((t) => !ids.has(t));
        if (missing !== undefined) report(el, 'headersTarget', { target: missing });
      }
    }

    if (tag === 'optgroup' && !el.hasAttribute('label')) {
      const legend = Array.from(el.querySelectorAll(':scope > *')).some(
        (c) => tagOf(c) === 'legend'
      );
      if (!legend) report(el, 'optgroupLabel', {});
    }

    const inputType =
      tag === 'input'
        ? String(attr(el, 'type') || 'text')
            .trim()
            .toLowerCase()
        : '';

    if (tag === 'input' && inputType === 'image') {
      if (!el.hasAttribute('alt') || attr(el, 'alt') === '') report(el, 'inputImageAlt', {});
    }

    if (el.hasAttribute('autocomplete')) {
      const value = attr(el, 'autocomplete');
      if (tag === 'form') {
        if (!['on', 'off'].includes(value.toLowerCase())) {
          report(el, 'autocompleteValue', { value, element: tag });
        }
      } else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
        if (tag === 'input' && NO_AUTOCOMPLETE_TYPES.has(inputType)) {
          report(el, 'autocompleteType', { inputType });
        } else if (tag === 'input' && !AUTOCOMPLETE_TYPES.has(inputType)) {
          // An unknown type is its own validator error; the autocomplete
          // value is not judged on it.
        } else {
          const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
          const onOff = tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off');
          if (!tokens.length || (onOff && inputType === 'hidden')) {
            report(el, 'autocompleteValue', { value, element: tag });
          } else if (!onOff) {
            const fieldName = getFieldName(value);
            if (!fieldName) {
              report(el, 'autocompleteValue', { value, element: tag });
            } else if (tag === 'input') {
              const group = FIELD_GROUP[fieldName] || 'text';
              let fits = true;
              if (inputType === 'text') fits = group !== 'multiline';
              else if (GROUPS_BY_INPUT_TYPE[inputType]) {
                fits = GROUPS_BY_INPUT_TYPE[inputType].includes(group);
              }
              if (!fits) report(el, 'autocompleteControl', { value, fieldName, inputType });
            }
          }
        }
      }
    }
  }

  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? 'fail' : 'pass',
    severity: occurrences.length ? rule.defaultSeverity || 'moderate' : 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
