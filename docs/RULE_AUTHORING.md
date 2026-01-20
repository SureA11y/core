# RULE_AUTHORING.md — a11yCore DOM Rule Authoring (Canonical, repo-derived)

This guide is derived from the **actual rule modules, helpers, build pipeline, and tests** in this codebase.
Follow it literally when adding or modifying rules.

> Key principle: **Atomic + deterministic + standards-traceable**.
> One rule = one normative decision.

---

## 1) Where rules run (critical mental model)

Rules are bundled into the generated core and executed inside the **page/DOM context**.

- `runInPage(ctx)` is **serialized** and evaluated later from its source text. fileciteturn6file9
- Therefore it must be **self-contained** (no outer-scope references). fileciteturn6file9

### 1.1 Forbidden inside `runInPage`
❌ Don’t reference anything defined outside the function body, including:
- `id`
- `meta`
- imported modules
- closure variables

This is a known footgun (“meta is not defined” incident). fileciteturn6file16

✅ Use `ctx.rule.*` instead:
- `ctx.rule.ruleId`
- `ctx.rule.defaultSeverity`
- `ctx.rule.defaultConfidence`
- `ctx.rule.type`

---

## 2) Rule module contract (exact)

Each rule file is a CommonJS module exporting exactly:

```js
'use strict';

const id = 'a11ycore-some-rule-id';

const meta = { /* see Meta Contract */ };

function runInPage(ctx) { /* see Runtime Contract */ }

module.exports = { id, meta, runInPage };
```

No other exports.

---

## 3) Rule ID conventions (repo reality)

IDs are kebab-case and namespaced under `a11ycore-`.

Common pattern used in this ruleset:
```
a11ycore-<target>-<topic>-<intent>
```

Examples observed:
- `a11ycore-img-alt-present`
- `a11ycore-img-alt-quality`
- `a11ycore-img-alt-decorative`
- `a11ycore-canvas-text-alternative-present`
- `a11ycore-video-poster-text-alternative-present`

**Manual vs automatic is NOT encoded in the id** in this repo; it is encoded by `meta.type`.

---

## 4) Meta Contract (all keys used by current rules)

Every rule defines a `meta` object. In the rule set you uploaded, the union of meta keys is:

### 4.1 Required top-level keys

```js
const meta = {
  title: '…',
  description: '…',

  i18n: {
    titleKey: '…',
    descriptionKey: '…'
  },

  helpUrl: null, // or URL string

  tags: [ '…' ],
  wcagSc: [ '1.1.1' ],

  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],

  // optional (relevant for manual rules)
  informativeReferences: [
    {
      standard: '…',
      version: '…',
      requirement: '…',
      title: '…',
      conformanceLevel: '…'
    }
  ],

  defaultSeverity: 'minor' | 'moderate' | 'serious' | 'critical',
  category: 'perceivable' | 'operable' | 'understandable' | 'robust',
  type: 'automatic' | 'manual',
  defaultConfidence: 'high' | 'medium' | 'low',

  coverage: {
    facetsBySc: {
      '1.1.1': ['facet-a', 'facet-b']
    }
  }
};
```

### 4.2 Notes on specific meta keys

#### `meta.i18n`
This repo uses **key-based i18n**:
- `titleKey`, `descriptionKey` are dictionary keys.
- `title` and `description` remain as **English fallbacks**.

The build/runtime resolves i18n by:
1) looking up the requested locale dictionary,
2) falling back to `en` if missing,
3) falling back to the literal `title`/`description` strings if still missing. fileciteturn6file16

#### `meta.tags`
Tags are used for grouping/filtering. Typical tag families in this ruleset include:
- WCAG tagging: `wcag2a`, `wcag111`
- domain: `nontext`, `images`, plus element-specific tags
- nature: `atomic`, plus `automatic` or `manual`

#### `meta.coverage.facetsBySc`
This is the repo’s explicit **coverage model** for an SC.
Each atomic rule declares which “facet(s)” of an SC it covers.

Keep facet naming consistent across a family.

---

## 5) i18n in occurrences (repo reality)

Occurrences also support i18n via keys + params.

### 5.1 Occurrence i18n shape

Every occurrence may include:

```js
i18n: {
  summaryKey: '…',
  hintKey: '…',
  params: { /* string substitutions */ }
}
```

At normalization time, the engine:
- ensures `summary`, `hint`, and `html` are strings,
- ensures `i18n` is either a normalized object or `null`,
- resolves `summary` and `hint` using i18n keys (with locale → `en` fallback → literal fallback). fileciteturn6file16

### 5.2 Param interpolation

Translation strings use `{{paramName}}` placeholders.
`params` is shallow-copied and passed into interpolation. fileciteturn6file16

---

## 6) Helpers contract used by rules (ctx.helpers)

Rules use helpers returned by `createDomHelpers()`.

Helpers observed in this repo include: fileciteturn6file8
- `queryAll`, `queryAllDeep`, `queryAllSmart`
- `getOuterHtmlSnippet`
- `buildSimpleSelector`, `buildSelector`
- `isAccTreeEligible`, `getEligibilityInfo`
- `resolveIdRefs`, `getTextFromIdRefs`
- `getAccessibleNameInfo`, `getAccessibleDescriptionInfo`
- `getTextAlternativeInfo`
- `getRoleInfo`, `getFocusableInfo`

### 6.1 Shadow DOM scanning

Rules that need to work with open Shadow DOM should prefer:

```js
const nodes = helpers.queryAllSmart
  ? helpers.queryAllSmart('img')
  : helpers.queryAll('img');
```

Shadow traversal is opt-in via engine option:
```js
engineOptions: { includeShadowDom: true }
``` fileciteturn6file16

### 6.2 Reporting note for Shadow DOM

Selectors do not pierce shadow boundaries, so a `selector` may not uniquely locate nodes in Shadow DOM.
Therefore: **always include `html` in occurrences**. fileciteturn6file9

---

## 7) Eligibility logging (required in this ruleset)

This repo requires rules to attach an eligibility/visibility trace in each occurrence:

```js
data: {
  visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
}
```

This is consistent across your uploaded rule family.

---

## 8) `runInPage(ctx)` runtime contract (repo reality)

### 8.1 Expected return shape

The rule must return:
- `ruleId` (must be `rule.ruleId`)
- `outcome`: `"pass" | "fail" | "cantTell" | "notApplicable"`
- `severity`: string
- `occurrences`: array

Examples: fileciteturn6file9

### 8.2 Outcome conventions used by these rules

Automatic:
- `notApplicable` if no applicable targets
- `pass` if applicable targets exist and no occurrences
- `fail` if occurrences exist

Manual:
- `notApplicable` if no applicable targets
- `cantTell` if at least one target requires review

---

## 9) Occurrence object shape (repo reality)

Typical pattern:

```js
occurrences.push({
  selector,
  html,
  summary: '…',
  hint: '…',
  i18n: { summaryKey: '…', hintKey: '…', params: { element: 'img' } },
  data: { visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] } }
});
```

Observed properties:
- `selector` (or sometimes `selectorStr`)
- `html`
- `summary`
- `hint`
- `i18n` (`summaryKey`, `hintKey`, `params`)
- `data` (includes `visibilityFilter`)

---

## 10) Structured doc comment block

Keep the structured header comment (`@rule`, `@atomic`, `@summary`, `@standard`, `@sc`, `@applicability`, `@expectation`).
