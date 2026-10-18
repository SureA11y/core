# Rule settings

Generated from the compiled engine's own catalog (`getChecksCatalog()`, each rule's `variantSettings`). Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

Some core rules can be run with other settings by a **variant**: a rule of a pack or profile that names the core rule in `from` and sets some of these in `config` ([`PACKS.md`](./PACKS.md), [`RULE_AUTHORING.md`](./RULE_AUTHORING.md#rule-variants)). That is how another standard's version of a requirement, or a choice WCAG leaves to the evaluator, runs on core's code: a fix to the core rule reaches every variant. A scan's caller can't change them: a result that names WCAG is decided at WCAG's values, the defaults below.

**1 rule offers 3 settings.** Semver covers them: a setting is not removed or renamed, and does not change meaning, before a major version. To ask for a new one, say which rule, what it should change and what in WCAG or the other standard it stands on.

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
