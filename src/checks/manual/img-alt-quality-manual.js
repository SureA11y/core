/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <img> elements whose alt attribute is present and non-empty.
 *   The element must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role. An <img> with no alt at all is
 *   img-alt-present's failure, and one with alt="" is img-alt-decorative's
 *   review.
 * @expectation
 *   Human review is required to confirm that the provided text alternative
 *   is accurate and appropriate. Alt text that looks like something other
 *   than a description gets its own summary and hint: a file name (or alt
 *   equal to the image's own file name), a web address, a placeholder or
 *   generic word such as "image" or "TBD", an opening that says it is an
 *   image ("image of", "photo of"), or alt longer than 150 characters. Every
 *   finding is still `cantTell`: each of these can be right in context.
 * @reports
 *   - `altSignal`: what made the alt text look suspicious, on those findings
 *     only: `file-name`, `url`, `placeholder`, `redundant-prefix` or
 *     `too-long`. Absent on a finding with ordinary alt text. When several
 *     apply, the first in that order is reported.
 *   - `length`: the alt text's length in characters, on `too-long` only.
 *   - `limit`: the length above which alt counts as too long (150), on
 *     `too-long` only.
 * @implementation-notes
 * - The signals are not reason codes. Before them, every finding of this
 *   rule had the same identity (`ruleId + reasonCode + html`) with no
 *   reason code; giving the suspicious ones a code would have changed the
 *   identity of findings that still exist, which API_STABILITY.md rules
 *   out. They change the message and `data.details` only.
 * - Word lists exist for en, de, es, fr and ja. English is always checked;
 *   the list for the image's own language (nearest lang attribute, across
 *   shadow roots) is added on top, as link-name-quality does.
 * - Exact matches for placeholders ("Logo" is flagged, "Company logo" is
 *   not), prefixes followed by more text for the "image of" case. Alt equal to the image's file name without its
 *   extension only counts when it looks like a file name (no spaces, and an
 *   underscore, two digits in a row or two hyphens), so `alt="Search"` on
 *   `search.svg` is ordinary alt text.
 * - 150 characters is a common guideline, not a WCAG limit: alt is read in
 *   one go and can't be navigated, so a longer one usually belongs in a
 *   long description.
 */

const id = 'img-alt-quality';

const meta = {
  title: '<img> alt text must be appropriate (manual review)',
  description:
    'Flags <img> elements with non-empty alt text for human review of appropriateness, and says when the alt looks like a file name, a web address, a placeholder, an "image of" opening or is very long.',
  i18n: {
    titleKey: 'img_altQuality_title',
    descriptionKey: 'img_altQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'manual', 'atomic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['text-alternative-quality']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Cap occurrences to keep manual “quality” checks fast on large pages.
  // Deterministic: we keep DOM order, just stop collecting after N.
  const MAX_OCCURRENCES = 50;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && safeRoot.querySelectorAll
              ? Array.from(safeRoot.querySelectorAll(sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function isRolePresentationExcluded(el) {
    const role = (() => {
      try {
        return String(el.getAttribute('role') || '')
          .trim()
          .toLowerCase();
      } catch {
        return '';
      }
    })();
    if (role !== 'presentation' && role !== 'none') return false;

    // Exclude only when NOT focusable (mirrors img-alt-present policy)
    let focusable;
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(el, ctx);
        } catch {
          return null;
        }
      })();
      focusable = !!(fi && fi.focusable);
    } else {
      const tabindex = el.getAttribute('tabindex');
      focusable =
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()));
    }
    return !focusable;
  }

  // Placeholder and generic words, matched against the whole alt text.
  const PLACEHOLDER_WORDS = {
    en: [
      'image',
      'img',
      'picture',
      'pic',
      'photo',
      'photograph',
      'graphic',
      'icon',
      'logo',
      'banner',
      'alt',
      'alt text',
      'alternative text',
      'image description',
      'description',
      'placeholder',
      'image placeholder',
      'tbd',
      'todo',
      'untitled',
      'spacer',
      'blank',
      'null',
      'undefined',
      'test'
    ],
    de: [
      'bild',
      'foto',
      'grafik',
      'abbildung',
      'symbol',
      'logo',
      'platzhalter',
      'bildbeschreibung',
      'alternativtext',
      'ohne titel',
      'unbenannt'
    ],
    es: [
      'imagen',
      'foto',
      'fotografía',
      'gráfico',
      'icono',
      'ícono',
      'logo',
      'logotipo',
      'marcador de posición',
      'descripción de la imagen',
      'texto alternativo',
      'sin título'
    ],
    fr: [
      'image',
      'photo',
      'photographie',
      'illustration',
      'graphique',
      'icône',
      'logo',
      'espace réservé',
      "description de l'image",
      'texte alternatif',
      'sans titre'
    ],
    ja: [
      '画像',
      '写真',
      'イメージ',
      '図',
      'アイコン',
      'ロゴ',
      '代替テキスト',
      '画像の説明',
      '無題',
      'ダミー'
    ]
  };

  // Openings that say the image is an image, followed by what it shows.
  const REDUNDANT_PREFIXES = {
    en: [
      'image of ',
      'an image of ',
      'picture of ',
      'a picture of ',
      'photo of ',
      'a photo of ',
      'photograph of ',
      'a photograph of ',
      'graphic of ',
      'image: ',
      'picture: ',
      'photo: '
    ],
    de: ['bild von ', 'ein bild von ', 'foto von ', 'ein foto von ', 'bild: ', 'foto: '],
    es: [
      'imagen de ',
      'una imagen de ',
      'foto de ',
      'una foto de ',
      'fotografía de ',
      'imagen: ',
      'foto: '
    ],
    fr: [
      'image de ',
      "image d'",
      'une image de ',
      "une image d'",
      'photo de ',
      "photo d'",
      'une photo de ',
      "une photo d'",
      'image : ',
      'photo : ',
      'image: ',
      'photo: '
    ],
    ja: ['画像:', '写真:']
  };
  // Japanese says it at the end: 「富士山の写真」.
  const REDUNDANT_SUFFIXES_JA = ['の画像', 'の写真', 'のイメージ'];

  const MAX_ALT_LENGTH = 150;
  const IMAGE_FILE_RE =
    /^\S(?:.*\S)?\.(?:apng|avif|bmp|gif|heic|heif|ico|jfif|jpe?g|png|svg|tiff?|webp)$/i;
  // Names cameras, phones and screenshot tools give files.
  const GENERATED_NAME_RE =
    /^(?:img|image|dsc[nf]?|pxl|mvimg|gopr|photo|screenshot)[ _-]?\d{3,}[\d _-]*$/i;
  const URL_RE = /^(?:https?:\/\/|www\.)\S+$/i;

  // NFKC folds full-width forms (：, Ａ) and the curly apostrophe is folded,
  // as in link-name-quality; trailing punctuation is not part of the word.
  function normalizeAlt(s) {
    return String(s || '')
      .normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function stripTrailingPunctuation(s) {
    return s.replace(/[\s.,;:!?。、]+$/g, '').trim();
  }

  // Primary language subtag of the nearest lang attribute, crossing shadow
  // roots; '' when none is declared.
  function primaryLangOf(node) {
    let n = node;
    while (n) {
      if (n.nodeType === 1 && n.getAttribute) {
        const v = n.getAttribute('lang');
        if (v != null) return v.trim().split('-')[0].toLowerCase();
      }
      n = n.parentNode || n.host || null;
    }
    return '';
  }

  function listsFor(byLang, lang) {
    const out = byLang.en.slice();
    if (lang && lang !== 'en' && byLang[lang]) out.push(...byLang[lang]);
    return out;
  }

  function srcFileName(el) {
    let src;
    try {
      src = String(el.getAttribute('src') || '');
    } catch {
      return '';
    }
    const path = src.split(/[?#]/)[0];
    let name = path.slice(path.lastIndexOf('/') + 1);
    try {
      name = decodeURIComponent(name);
    } catch {}
    return normalizeAlt(name);
  }

  // What makes this alt look like something other than a description, or
  // null for ordinary alt text.
  function altSignalOf(el, rawAlt) {
    const alt = normalizeAlt(rawAlt);
    const word = stripTrailingPunctuation(alt);

    if (IMAGE_FILE_RE.test(alt) || GENERATED_NAME_RE.test(word)) return { altSignal: 'file-name' };
    const fileName = srcFileName(el);
    const stem = fileName.replace(/\.[a-z0-9]+$/, '');
    if (
      fileName &&
      (alt === fileName || (stem && word === stem && !/\s/.test(word) && /_|\d\d|-.*-/.test(word)))
    ) {
      return { altSignal: 'file-name' };
    }

    if (URL_RE.test(alt)) return { altSignal: 'url' };

    const lang = primaryLangOf(el);
    if (!/[\p{L}\p{N}]/u.test(alt) || listsFor(PLACEHOLDER_WORDS, lang).includes(word)) {
      return { altSignal: 'placeholder' };
    }

    const prefixed = listsFor(REDUNDANT_PREFIXES, lang).some(
      (p) => alt.length > p.length && alt.startsWith(p)
    );
    const suffixed =
      lang === 'ja' &&
      REDUNDANT_SUFFIXES_JA.some((x) => word.length > x.length && word.endsWith(x));
    if (prefixed || suffixed) return { altSignal: 'redundant-prefix' };

    const length = Array.from(String(rawAlt).trim()).length;
    if (length > MAX_ALT_LENGTH) {
      return { altSignal: 'too-long', length, limit: MAX_ALT_LENGTH };
    }
    return null;
  }

  // Message keys per signal; ordinary alt keeps the rule's original ones.
  const SIGNAL_KEYS = {
    'file-name': 'FileName',
    url: 'Url',
    placeholder: 'Placeholder',
    'redundant-prefix': 'RedundantPrefix',
    'too-long': 'TooLong'
  };
  const SIGNAL_TEXT = {
    'file-name': [
      'The alt text of this <img> looks like a file name.',
      'A file name tells someone who can’t see the image nothing about it (WCAG failure F30). Replace it with text that serves the image’s purpose in context. Keep it only if the file name is itself what the image shows, such as a screenshot of a file list.'
    ],
    url: [
      'The alt text of this <img> is a web address.',
      'An address does not say what the image shows or does. Replace it with text that serves the image’s purpose in context. Keep it only if the address is itself what the image shows, such as an image of a printed web address.'
    ],
    placeholder: [
      'The alt text of this <img> is a placeholder or a generic word.',
      'Words such as “image”, “logo” or “TBD” don’t say what the image shows or does (WCAG failure F30). Write text that serves its purpose in context, or use alt="" if the image is decorative. The word is fine only if it is all the image conveys, such as an image of that word.'
    ],
    'redundant-prefix': [
      'The alt text of this <img> starts by saying it is an image.',
      'Screen readers already announce an image, so an opening such as “image of” or “photo of” is said twice. Remove it, unless the kind of image matters, such as a photograph shown beside a painting of the same scene.'
    ],
    'too-long': [
      'The alt text of this <img> is {{length}} characters long.',
      'Alt text is read in one go and can’t be navigated. If the image needs a long description, such as a chart or a diagram, keep the alt short and give the details in text on the page or in a linked description. A long alt is fine when the image holds that much text itself, such as a short quotation.'
    ]
  };

  const selector = 'img[alt]:not([alt=""])';
  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart(selector) : queryAll(selector)) || []);
    } catch {
      return queryAll(selector);
    }
  })();

  if (!els.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          truncated: false
        }
      }
    };
  }

  const occurrences = [];
  let applicableCount = 0; // total applicable elements
  let collectedCount = 0; // how many occurrences we actually reported

  for (const el of els) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    // Rule-specific applicability: non-empty alt
    const alt = (() => {
      try {
        return String(el.getAttribute('alt') || '').trim();
      } catch {
        return '';
      }
    })();
    if (!alt) continue;

    applicableCount += 1;

    // IMPORTANT: stop doing expensive occurrence building after we hit the cap
    if (collectedCount >= MAX_OCCURRENCES) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const signal = (() => {
      try {
        return altSignalOf(el, el.getAttribute('alt'));
      } catch {
        return null;
      }
    })();
    const keySuffix = signal ? SIGNAL_KEYS[signal.altSignal] : '';
    const text = signal ? SIGNAL_TEXT[signal.altSignal] : null;
    const params = { element: 'img' };
    if (signal && signal.length) params.length = signal.length;
    const baseOccurrence = {
      summary: text
        ? text[0].replace('{{length}}', String(params.length || ''))
        : 'Review alt text on <img> for accuracy and appropriateness.',
      hint: text
        ? text[1]
        : 'Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).',
      i18n: {
        summaryKey: 'img_altQuality_summary_cantTell' + keySuffix,
        hintKey: 'img_altQuality_hint_cantTell' + keySuffix,
        params
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: signal
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }

    collectedCount += 1;
  }

  if (applicableCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          truncated: false
        }
      }
    };
  }

  const truncated = applicableCount > collectedCount;

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: 'minor',
    occurrences,
    data: {
      details: {
        applicableCount,
        reportedCount: collectedCount,
        maxOccurrences: MAX_OCCURRENCES,
        truncated
      }
    }
  };
}

module.exports = { id, meta, runInPage };
