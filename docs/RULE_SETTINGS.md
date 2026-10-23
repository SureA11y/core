# Rule settings

Generated from the compiled engine's own catalog (`getChecksCatalog()`, each rule's `variantSettings`). Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

Some core rules can be run with other settings by a **variant**: a rule of a pack or profile that names the core rule in `from` and sets some of these in `config` ([`PACKS.md`](./PACKS.md), [`RULE_AUTHORING.md`](./RULE_AUTHORING.md#rule-variants)). That is how another standard's version of a requirement, or a choice WCAG leaves to the evaluator, runs on core's code: a fix to the core rule reaches every variant. A scan's caller can't change them: a result that names WCAG is decided at WCAG's values, the defaults below.

**2 rules offer 7 settings.** Semver covers them: a setting is not removed or renamed, and does not change meaning, before a major version. To ask for a new one, say which rule, what it should change and what in WCAG or the other standard it stands on.

```js
// A pack's variant: core's rule, at the other standard's settings.
module.exports = {
  id: 'acme-contrast-uniform',
  from: 'contrast-minimum',
  config: { largeTextRatio: 4.5 },
  meta: { /* its own title, description, i18n, tags */ }
};
```

## `contrast-minimum`

Text meets minimum color contrast (AA). [Rule reference](./RULE_CATALOG.md#contrast-minimum).

| Setting | Default | Takes | What it changes | Basis |
|---|---|---|---|---|
| `boldLargeMinPx` | `null` | a number above 0, or `null` | The size, in CSS pixels, from which bold text counts as large and needs only largeTextRatio. null is WCAG's 14pt (about 18.67px). | WCAG 1.4.3, "large scale" text |
| `largeTextRatio` | `3` | a number above 0 | The contrast ratio large text needs. | WCAG 1.4.3: 3:1 (1.4.6: 4.5:1) |
| `normalTextRatio` | `4.5` | a number above 0 | The contrast ratio other text needs. | WCAG 1.4.3: 4.5:1 (1.4.6: 7:1) |
| `logoText` | `"fail"` | `"fail"`, `"ask"`, `"exempt"` | Text that looks like part of a logo (an id or class naming a logo, or the site's brand, on the text, up to two levels above it or on its link; or the banner's first link to the home page, holding an image or the site's name) below its ratio: fail, with a hint that logo text is exempt; ask (cantTell, LOGO_TEXT_BELOW_THRESHOLD); or exempt (not reported). | WCAG 1.4.3 exception: "Text that is part of a logo or brand name has no contrast requirement" |
| `contrastSwitch` | `"fail"` | `"fail"`, `"ask"` | Text below its ratio on a page with a control that switches to higher contrast (its name holds "contrast", in any of five languages): fail, with a hint naming the switch; or ask (cantTell, CONTRAST_SWITCH_OFFERED). | WCAG technique G174, a control that switches to sufficient contrast |
| `semiBold` | `"normal"` | `"normal"`, `"ask"` | Text of weight 600 to 699, between the bold large-text size and 24px, that reaches largeTextRatio but not normalTextRatio: normal text, as for any weight under 700 (axe and Alfa count bold from 700); or ask (cantTell, SEMIBOLD_BELOW_THRESHOLD) whether it reads as bold. | WCAG 1.4.3 "large scale" text: WCAG says bold without a number |

## `valid-lang`

Element lang attribute must be syntactically valid. [Rule reference](./RULE_CATALOG.md#valid-lang).

| Setting | Default | Takes | What it changes | Basis |
|---|---|---|---|---|
| `codes` | `"registry"` | `"registry"`, `"iso639"` | The codes a primary language subtag is checked against: registry, the IANA Language Subtag Registry, which lists a three-letter code only for a language with no two-letter one; or iso639, any ISO 639 code, which also accepts the three-letter ISO 639-2 and 639-3 codes of languages that have a two-letter one (eng, fra, fre, ger) and the qaa to qtz range reserved for local use. | BCP 47 and ACT de46e4 (registry); standards that accept any ISO 639 code, such as RGAA 4.1.2, glossary "Code de langue" (iso639) |
