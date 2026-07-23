# RULE_AUTHORING.md — a11yCore DOM Rule Authoring (Canonical, repo-derived)

This guide is derived from the **actual rule modules, helpers, build pipeline, and tests** in this codebase.
Follow it literally when adding or modifying rules.

> Key principle: **Atomic + deterministic + standards-traceable**.
> One rule = one normative decision.

---

## 1) Where rules run (critical mental model)

Rules are bundled into the generated core and executed inside the **page/DOM context**.

- `runInPage(ctx)` is **serialized** and evaluated later from its source text.
- Therefore it must be **self-contained** (no outer-scope references).

### 1.1 Forbidden inside `runInPage`
❌ Don’t reference anything defined outside the function body, including:
- `id`
- `meta`
- imported modules
- closure variables

This is a known, **recurring** footgun (“meta is not defined” incident).

⚠️ **Why this is dangerous, not just annoying: the build does NOT fail.** `runInPage` is serialized via `fn.toString()` and re-evaluated as source text later, in the page context — `build-core.js` never parses that source for free variables, and `npm run build`/`npm test`'s own tests only verify serialization round-trips correctly, not that every identifier resolves. The break only surfaces when the rule actually *runs*: the reference throws a `ReferenceError` inside `runInPage`, the runner's own `try/catch` (`src/core/dom-runner.js`) catches it silently, and the rule's result becomes `{ outcome: 'cantTell', occurrences: [], error: '<name> is not defined' }` — a normal-looking result, not a crash. A rule broken this way can sit unnoticed indefinitely unless something specifically asserts its `outcome`/`error`, which is why every rule's fixture-coverage test (§11) matters: it's often the *only* thing that would catch this.

**If you add a module-scope `const`/helper function to a rule file, move it inside `runInPage` itself** (or route the value through `ctx.rule`/`ctx.helpers` if it must be engine-provided) — do not leave it at module scope and reference it from inside `runInPage`, even though nothing will complain until you actually run the rule and check its `error` field.

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
3) falling back to the literal `title`/`description` strings if still missing.

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
- resolves `summary` and `hint` using i18n keys (with locale → `en` fallback → literal fallback).

### 5.2 Param interpolation

Translation strings use `{{paramName}}` placeholders.
`params` is shallow-copied and passed into interpolation.

---

## 6) Helpers contract used by rules (ctx.helpers)

Rules use helpers returned by `createDomHelpers()`.

Helpers observed in this repo include:
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
```

### 6.2 Reporting note for Shadow DOM

Selectors do not pierce shadow boundaries, so a `selector` may not uniquely locate nodes in Shadow DOM.
Therefore: **always include `html` in occurrences**.

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

Examples:

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

---

## 11) Scenario fixture + fixture-coverage test (required for every rule)

Every rule — automatic or manual, no exceptions — needs a standalone, loadable HTML
scenario page in addition to its inline unit tests. This is not optional polish: the
project's test fixtures are meant to be usable directly by external tooling (loaded and
exercised as real pages), not just embedded as strings inside `.test.js` files.

### 11.1 The fixture file

- Path: `tests/fixtures/<rule-slug>-all-scenarios.html`, where `<rule-slug>` is the rule
  id with the `a11ycore-` prefix stripped (e.g. `a11ycore-tab-name-present` →
  `tab-name-present-all-scenarios.html`).
- Structure: a real HTML page (`<!doctype html>`, `<title>`, minimal inline `<style>`)
  containing numbered scenario blocks, each:
  ```html
  <div class="case" id="case_NN">
    <div class="case-title">NN — PASS: role=tab, visible text content</div>
    <div role="tab" tabindex="0" id="<slug>_case_NN">Apple</div>
  </div>
  ```
  - The `.case-title` text MUST start with `NN — MARKER:` where `MARKER` is one of
    `PASS`, `FAIL`, `CANTTELL`, or `NEUTRAL`/`INELIGIBLE` (the fixture-index generator,
    §11.3, parses this to count scenarios per outcome — see
    `scripts/generate-fixture-index.js`'s `parseFixtureCases`).
  - The actual test target gets its own stable id of the form `<slug>_case_NN` (short,
    memorable abbreviation of the rule name — see existing fixtures for precedent, e.g.
    `tab_case_01`, `binctl_case_01`).
  - Group related cases under `<h2>` sections (e.g. "A. Named (eligible)", "B. Unnamed
    (eligible, FAIL)", "C. Ineligible (excluded from accessibility tree, skipped)").
- Cover every branch the rule's own logic distinguishes: pass, fail (each distinct
  `reasonCode`), notApplicable/skipped, and — for manual rules — cantTell.

### 11.2 Known, acceptable exceptions to "one fixture, many cases"

A few rule shapes genuinely cannot express every branch as a single static page. When
you hit one of these, still create the fixture (covering whatever branches ARE
expressible statically) and add an explicit `<p class="note">` in the fixture, plus a
comment in the `.test.js` fixture-coverage test, stating which branch is NOT covered and
why:

- **Whole-document checks** (e.g. `aria-hidden-body`, `page-title-present`,
  `meta-viewport-zoom-enabled`, `bypass-blocks-present`): the property being checked
  exists once per page (one `<body>`, one `<title>`, one viewport meta), so only one
  outcome is demonstrable per fixture file. Pick the most illustrative FAIL case; note
  that PASS/other branches are covered by the rule's inline unit tests instead of
  minting near-duplicate fixture files.
- **Runtime-mutation-only branches** (e.g. `iframe-focusable-content`'s FAIL branch,
  which requires mutating `iframe.contentDocument` after parse — jsdom does not
  populate `srcdoc` synchronously): cover every branch that IS expressible statically;
  leave the rest to the existing programmatic test.
- **Rules with no branching logic at all** (e.g. `manual-review`, which always returns
  `cantTell` regardless of page content): a single trivial case is fine, purely for
  index completeness — say so in the fixture's note.

Do not force a false "PASS" demonstration or fabricate a scenario that doesn't actually
exercise the code path it claims to.

### 11.3 The fixture-coverage test

Add one test to the rule's existing `tests/engine-checks/**/<rule>.test.js` (do not
create a separate file):

```js
const fs = require('node:fs');
const path = require('node:path');

test(`${RULE_ID}: fixture coverage (tests/fixtures/<rule-slug>-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', '<rule-slug>-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: N, maxOccurrences: N });
  // assert the exact expected-fail ids (and, if useful, expected-no-occurrence ids)
});
```

The file MUST declare `const RULE_ID = 'a11ycore-...'` near the top (the fixture-index
generator discovers a rule's test file and fixture by scanning for that constant —
tests using only inline string literals won't be picked up; see
`tests/engine-checks/manual-review.test.js` for the fix applied when this was missed).

### 11.4 Keeping the index current

After adding or changing any fixture, regenerate the index:

```
npm run fixtures:index
```

This writes `tests/fixtures/INDEX.md` (human-readable) and `tests/fixtures/index.json`
(machine-readable — every rule, its fixture path, and parsed pass/fail/cantTell case
counts, for external tooling to enumerate and load fixtures directly). Commit both
alongside the fixture and test changes. A rule shipped without its fixture is treated
the same as a rule shipped without tests — not done.
