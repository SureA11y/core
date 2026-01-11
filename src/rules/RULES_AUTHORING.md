# DOM Rules: Authoring Guide

This directory contains **atomic accessibility rules** that are bundled into `src/a11yCore-core.js` and executed against HTML/DOM.

The goal is to keep each rule:
- **Atomic**: one testable requirement per rule (one normative decision).
- **Standards-traceable**: every rule declares which standards it maps to.
- **Engine-compatible**: rules must follow the exact contract described below.

---

## Rule lifecycle (how rules run)

1. Each rule module exports:
   - `id` (string, unique)
   - `meta` (object, used as the public rule definition)
   - `runInPage(ctx)` (function executed by the engine)

2. The build step (e.g. `node build-a11yCore-core.js`) reads rule modules and produces a bundled file (`src/a11yCore-core.js`).

3. At runtime, the engine executes rules against a DOM root and returns a normalized result for each rule.

⚠️ **Important:** `runInPage(ctx)` is serialized and executed from source in the bundled core. This has direct consequences for how you write `runInPage` (see **“No outer-scope variables”** below).

---

## File layout and naming

Recommended conventions:
- File name: `kebab-case.js` matching the rule `id`
  - Example: `img-alt-empty.js` exports `id = "img-alt-empty"`
- One rule per file.

---

## Required exports

### `id` (required)
Unique rule identifier within the ruleset.

```js
const id = "img-alt-empty";
```

### `meta` (required)
Used for rule catalog, reporting, tags, and default severity/confidence.

Minimum recommended fields:
- `title`
- `description`
- `tags` (include `"a11yCore"` is appended automatically)
- `wcagSc` (array of SC ids, e.g. `["1.1.1"]`)
- `defaultSeverity` (e.g. `"minor" | "moderate" | "serious" | "critical"`)
- `category` (e.g. `"perceivable" | "operable" | "understandable" | "robust"`)
- `type` (`"automatic"` or `"manual"`)
- `defaultConfidence` (`"low" | "medium" | "high"`)

```js
const meta = {
  title: "Empty alt text requires verification",
  description: "Flags <img> elements with empty alt text for manual verification.",
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "images", "atomic", "manual"],
  wcagSc: ["1.1.1"],
  defaultSeverity: "moderate",
  category: "perceivable",
  type: "manual",
  defaultConfidence: "medium",
};
```

### `runInPage(ctx)` (required)
This function is executed in the page/DOM context.

**Signature:**
```js
function runInPage(ctx) { ... }
```

**Context fields you can rely on:**
- `ctx.document`
- `ctx.root` (optional root node; prefer `(root || document)`)
- `ctx.helpers` (engine-provided helpers such as `queryAll`, `getOuterHtmlSnippet`, `buildSimpleSelector`)
- `ctx.rule` (the normalized rule definition including `ruleId`, `defaultSeverity`, `type`, `defaultConfidence`, etc.)

---

## Critical engine constraint: no outer-scope variables in `runInPage`

Because the engine serializes `runInPage` to a string and executes it later, it **must not reference variables defined outside the function**.

✅ OK:
- local variables defined inside `runInPage`
- `ctx.rule.defaultSeverity`, `ctx.rule.ruleId`, etc.
- `ctx.helpers.*`
- DOM APIs

❌ Not OK:
- referencing `meta` inside `runInPage`
- referencing `id` inside `runInPage`
- importing modules and using them inside `runInPage`
- using closure variables

### The “meta is not defined” incident (what happened)
We wrote a rule like this:

```js
return { outcome: "fail", severity: meta.defaultSeverity, ... };
```

When executed, `meta` did not exist in the isolated function runtime, causing:
- runtime error: `meta is not defined`
- engine normalization fallback: `outcome: "cantTell"`, `occurrences: []`

### Correct pattern
Always read severity (and similar values) from `ctx.rule`:

```js
return {
  ruleId: rule.ruleId,
  outcome: "fail",
  severity: rule.defaultSeverity || "minor",
  occurrences,
};
```

Add this note near every `runInPage` to prevent regressions:

```js
/**
 * NOTE: runInPage() is serialized/executed from source by a11yCore-core.
 * Do not reference outer-scope variables like `meta` or `id`.
 */
```

---
## Shadow DOM support

By default, rules scan **light DOM only**. Shadow DOM scanning is **opt-in** for performance and to avoid surprising behavior changes.

### How to enable Shadow DOM scanning
Pass this engine option when running:

```js
engineOptions: { includeShadowDom: true }
```

Only **open shadow roots** are traversable (`element.shadowRoot`). Closed shadow roots cannot be inspected by JavaScript by design.

### How to write rules that work with Shadow DOM
Prefer `helpers.queryAllSmart()` if available, with a safe fallback:

```js
const nodes = helpers.queryAllSmart
  ? helpers.queryAllSmart('img')
  : helpers.queryAll('img');
```

- When `includeShadowDom: false` (default), `queryAllSmart()` behaves like a normal light DOM query.
- When `includeShadowDom: true`, `queryAllSmart()` traverses open shadow roots.

### Reporting notes
CSS selectors do not pierce shadow boundaries, so `selector` values may not uniquely locate nodes inside Shadow DOM from the outside.
Always include an `html` snippet for remediation context.

## Expected return shape

A rule must return an object with:

- `ruleId` (string) — always `rule.ruleId`
- `outcome` — one of:
  - `"pass"`
  - `"fail"`
  - `"cantTell"` (manual verification needed or rule execution cannot determine)
  - `"notApplicable"`
- `severity` — string severity (use `rule.defaultSeverity` for failures/cantTell)
- `occurrences` — array (possibly empty)

Optional but supported:
- `confidence` — if you want to override, otherwise engine uses default
- `type` — if you want to override, otherwise engine uses default
- `error` — engine will attach on exceptions

Example (FAIL):
```js
return {
  ruleId: rule.ruleId,
  outcome: "fail",
  severity: rule.defaultSeverity || "minor",
  occurrences,
};
```

Example (PASS):
```js
return { ruleId: rule.ruleId, outcome: "pass", severity: "minor", occurrences: [] };
```

Example (NOT_APPLICABLE):
```js
return { ruleId: rule.ruleId, outcome: "notApplicable", severity: "minor", occurrences: [] };
```

---

## Occurrence object shape

Occurrences should be stable and consistent across rules:

Recommended fields:
- `selector` — CSS-ish selector or unique-ish locator
- `html` — snippet for the matched element
- `summary` — short human-readable issue summary
- `hint` — remediation guidance (short)

```js
occurrences.push({
  selector: buildSimpleSelector(el, "img"),
  html: getOuterHtmlSnippet(el),
  summary: "Image is missing an alt attribute.",
  hint: "Add an alt attribute (use alt=\"\" only if decorative).",
});
```

---

## Standards traceability comments (extractable documentation)

At the top of each rule file, include a structured comment block.

Recommended keys:
- `@rule` (must match `id`)
- `@atomic true`
- `@summary`
- `@standard` / `@sc` / `@ref`
- `@applicability`
- `@expectation`
- `@implementation-notes`

Example:
```js
/**
 * @rule img-alt-empty
 * @atomic true
 * @summary Empty alt text must only be used for decorative images (manual verification needed).
 *
 * @standard WCAG 2.2
 * @sc 1.1.1 Non-text Content
 *
 * @standard EN 301 549 (Web)
 * @ref 9.1.1.1 Non-text Content (WCAG alignment)
 *
 * @standard RGAA (Images)
 * @ref Critère 1.1
 *
 * @applicability
 * - Applies to: <img> exposed to assistive tech and with an alt attribute.
 *
 * @expectation
 * - CANT_TELL when alt is empty or whitespace-only.
 * - PASS otherwise.
 */
```

These blocks are designed so a future doc generator can parse and produce a rule catalog.

---

## Atomicity guidelines (when to split rules)

Split rules when a single file would require **different evidence types** or **different outcomes**.

Typical splits:
- **presence vs correctness**
  - e.g. `img-alt-attr-present` (automatic) vs `img-alt-empty` (manual)
- **syntactic check vs semantic judgment**
- **different target elements**
- **different applicability conditions**

Rule of thumb:
> If you need to explain “this might be ok depending on context”, it probably belongs in a separate **manual** rule.

---

## Testing expectations

Every new rule should have tests covering:
- a clear **PASS** case
- a clear **FAIL** case (if applicable)
- a **CANT_TELL** case (if the rule is manual)
- a **NOT_APPLICABLE** case (if appropriate)

Use existing helpers:
- `tests/helpers/runa11yCoreOnHtml.js`
- `tests/helpers/assertRule.js`

---
## Testing

Every new rule MUST come with automated tests.

### Where tests live
Add tests under:
- `tests/<rule-id>.test.js` (preferred: one file per rule or per rule family)

Use existing helpers:
- `tests/helpers/runa11yCoreOnHtml.js`
- `tests/helpers/assertRule.js`

### What to test for each rule
At minimum, include:
- **PASS** case (rule applies and finds nothing)
- **FAIL** case (for automatic rules that can conclusively fail)
- **CANT_TELL** case (for manual rules; should include at least one occurrence)
- **NOT_APPLICABLE** case (only if the rule explicitly has a non-applicable branch, e.g. no matching elements, excluded elements)

### What to assert (minimum assertions)
- The rule outcome is correct: `pass | fail | cantTell | notApplicable`
- The occurrence count matches expectations (e.g., `minOccurrences: 1` for fail/cantTell)
- The first occurrence includes stable fields:
    - `selector`
    - `html`
    - `summary`
    - `hint`

### Add a global “rule contract” test (prevents engine-only runtime errors)
Because `runInPage()` is serialized and executed from source in the bundled core, runtime errors can occur even when the module loads fine.
Add a global test that ensures **no rule throws** on a minimal page:

Create: `tests/rule-contract.test.js`

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

test('rules: no runtime errors on a minimal page', () => {
    const html = `<!doctype html><html><body></body></html>`;
    const result = runa11yCoreOnHtml(html);

    for (const r of result.rules) {
        assert.ok(!r.error, `Rule ${r.ruleId} threw: ${r.error}`);
    }
});
```

## Build requirements

After adding/changing rules, **rebuild** the bundle before running tests:

```bash
node build-a11yCore-core.js
node --test
```

Recommended: add this to package scripts so tests always rebuild:

```json
{
  "scripts": {
    "pretest": "node build-a11yCore-core.js",
    "test": "node --test"
  }
}
```

---

## Common pitfalls checklist

Before committing a new rule:
- [ ] `id` is unique
- [ ] `meta` contains standards tags and defaults
- [ ] `runInPage` does **not** reference outer-scope variables (`meta`, `id`, imports)
- [ ] outcomes are only: `pass | fail | cantTell | notApplicable`
- [ ] occurrences include `selector`, `html`, `summary`, `hint`
- [ ] tests cover pass/fail/cantTell/notApplicable as relevant
- [ ] you rebuilt `src/a11yCore-core.js` and tests pass
