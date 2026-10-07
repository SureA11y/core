/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check html-lang-code-valid
 * @atomic true
 * @summary The code of the page's default language must be a valid ISO 639 code
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose <html> element has a
 *   non-empty lang or xml:lang attribute: RGAA 8.4.1 covers only pages
 *   « ayant une langue par défaut ». Each of the two attributes is judged
 *   when present. A page with neither is notApplicable here; the missing
 *   language is page-language-present's matter (8.3.1). A run narrowed by
 *   contextSelector or engineOptions.fragment is notApplicable.
 * @expectation
 *   The language code, which the RGAA glossary "Code de langue" defines as
 *   the part before the first hyphen, is two or three letters and is an
 *   ISO 639-1, ISO 639-2 or later ISO 639 code (8.4.1 step 2, « conforme à
 *   la norme ISO 639-1 ou ISO 639-2 et suivantes »). What follows the
 *   hyphen is left to the author: lang="fr-FR-!!" passes here, and its
 *   malformed region is a markup validity question. Whether the code names
 *   the page's main language (« pertinent ») is for a person.
 * @implementation-notes
 * - The IANA language subtag registry (helpers.isRegisteredLanguageSubtag)
 *   lists ISO 639-1 codes, and ISO 639-2, 639-3 and 639-5 codes that have
 *   no two-letter equivalent. RGAA also accepts the three-letter ISO 639-2
 *   codes of languages that do have one (eng, fra, fre, deu, ger…), which
 *   the registry leaves out, so the rule adds them, and the qaa to qtz
 *   range that ISO 639-2 reserves for local use.
 * - html-lang-attr-present (WCAG 3.1.1) judges lang on <html> against the
 *   registry alone, so it fails lang="fra", and it ignores xml:lang.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'html-lang-code-valid';

const meta = {
  title: 'Default language code is valid',
  description:
    'Checks that the language code of lang and xml:lang on <html> is a valid ISO 639 code.',
  i18n: {
    titleKey: 'htmlLangCodeValid_title',
    descriptionKey: 'htmlLangCodeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const XML_NS = 'http://www.w3.org/XML/1998/namespace';

  // Three-letter ISO 639-2 codes (terminology and bibliographic) of the
  // languages that have an ISO 639-1 code, which the IANA registry omits.
  const ISO_639_2_WITH_639_1 = new Set(
    (
      'aar abk afr aka alb amh ara arg arm asm ava ave aym aze bak bam baq bel ben bih bis bod ' +
      'bos bre bul bur cat ces cha che chi chu chv cor cos cre cym cze dan deu div dut dzo ell ' +
      'eng epo est eus ewe fao fas fij fin fra fre fry ful geo ger gla gle glg glv gre grn guj ' +
      'hat hau hbs heb her hin hmo hrv hun hye ibo ice ido iii iku ile ina ind ipk isl ita jav ' +
      'jpn kal kan kas kat kau kaz khm kik kin kir kom kon kor kua kur lao lat lav lim lin lit ' +
      'ltz lub lug mac mah mal mao mar may mkd mlg mlt mon mri msa mya nau nav nbl nde ndo nep ' +
      'nld nno nob nor nya oci oji ori orm oss pan per pli pol por pus que roh ron rum run rus ' +
      'sag san sin slk slo slv sme smo sna snd som sot spa sqi srd srp ssw sun swa swe tah tam ' +
      'tat tel tgk tgl tha tib tir ton tsn tso tuk tur twi uig ukr urd uzb ven vie vol wel wln ' +
      'wol xho yid yor zha zho zul'
    ).split(' ')
  );

  function isIsoLanguageCode(code) {
    const c = String(code || '').toLowerCase();
    if (!/^[a-z]{2,3}$/.test(c)) return false;
    if (/^q[a-t][a-z]$/.test(c)) return true;
    if (ISO_639_2_WITH_639_1.has(c)) return true;
    return helpers.isRegisteredLanguageSubtag ? helpers.isRegisteredLanguageSubtag(c) : true;
  }

  const html = document && dom.documentElement(document);
  if (!html || String(dom.tagName(html) || '').toLowerCase() !== 'html') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const xmlLang =
    html.getAttributeNS && html.getAttributeNS(XML_NS, 'lang') != null
      ? html.getAttributeNS(XML_NS, 'lang')
      : dom.getAttribute(html, 'xml:lang');
  const declared = [
    ['lang', dom.getAttribute(html, 'lang')],
    ['xml:lang', xmlLang]
  ]
    .map(([attribute, value]) => [attribute, String(value == null ? '' : value).trim()])
    .filter(([, value]) => value);

  if (!declared.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const [attribute, value] of declared) {
    const code = value.split('-')[0];
    if (isIsoLanguageCode(code)) continue;
    occurrences.push(
      helpers.reportOccurrence(html, {
        summary: `The page's default language is given as ${attribute}="${value}", and "${code}" is not an ISO 639 language code.`,
        hint: 'Start the value with the two- or three-letter ISO 639 code of the page\'s main language, for example "fr" or "fr-FR".',
        i18n: {
          summaryKey: 'htmlLangCodeValid_summary_fail',
          hintKey: 'htmlLangCodeValid_hint_fail',
          params: { attribute, value, code }
        },
        data: {
          details: { reasonCode: 'invalidLanguageCode', attribute, value, code },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
