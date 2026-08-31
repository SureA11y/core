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

const id = 'some-rule-id';

const meta = { /* see Meta Contract */ };

function runInPage(ctx) { /* see Runtime Contract */ }

module.exports = { id, meta, runInPage };
```

One optional fourth export: `applicability(ctx)`, a predicate the engine calls before
`runInPage` to decide whether the rule is in scope for this run at all. Fourteen rules
use it today (see §11.2). Export it alongside the other three when you need it:

```js
module.exports = { id, meta, runInPage, applicability };
```

Nothing else. `npm run validate:rules` enforces exactly this set, and rejects a fifth
export.

---

## 3) Rule ID conventions (repo reality)

IDs are kebab-case, bare (no engine prefix).

Common pattern used in this ruleset:
```
<target>-<topic>-<intent>
```

Examples observed:
- `img-alt-present`
- `img-alt-quality`
- `img-alt-decorative`
- `canvas-text-alternative-present`
- `video-poster-text-alternative-present`

**Manual vs automatic is NOT encoded in the id** in this repo; it is encoded by `meta.type`.

---

## 4) Meta Contract (all keys used by current rules)

Every rule defines a `meta` object. Across the shipped ruleset, the union of meta keys is:

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

Add the key and its English text to `src/i18n/en.json`, then run
`npm run i18n:sync` so every other locale picks it up. `npm test` fails if you
forget. See [`I18N.md`](./I18N.md).

#### `meta.tags`
Tags are used for grouping/filtering. Typical tag families in this ruleset include:
- WCAG tagging: `wcag2a`, `wcag111`
- domain: `nontext`, `images`, plus element-specific tags
- nature: `atomic`, plus `automatic` or `manual`

#### `meta.coverage.facetsBySc`
This is the repo’s explicit **coverage model** for an SC.
Each atomic rule declares which “facet(s)” of an SC it covers.

Keep facet naming consistent across a family.

#### `meta.deprecated` / `meta.deprecation`
Optional — how to retire a rule ID without breaking downstream consumers. See [`API_STABILITY.md`](./API_STABILITY.md) for the full policy (a deprecated rule keeps running normally; this is a catalog-level migration signal, not an automatic exclusion). Shape:

```js
const meta = {
  // ...
  deprecated: true,
  deprecation: {
    replacedBy: 'new-rule-id', // or null
    reason: 'Why this rule is being retired.',
    sinceVersion: '1.2.0'
  }
};
```

`deprecated: true` without both `deprecation.reason` and `.sinceVersion` throws at build time (`normalizeRuleMeta`, `src/core/rule-meta.js`).

---

## 4.3 Reporting an occurrence

Build occurrences with `helpers.reportOccurrence(element, { summary, hint, i18n, data })`
rather than assembling the object by hand:

```js
occurrences.push(helpers.reportOccurrence(el, { summary: '…', hint: '…' }));
```

It attaches the element for the engine to finalize, which is how `selector`,
`html` and `structuralPath` get filled in centrally instead of in each rule.

**This is a performance contract, not just a convenience.** Every occurrence
gets a `structuralPath`. Given the element, the engine computes it directly.
Given only a hand-built occurrence, it re-finds the element with
`document.querySelector(selector)` — one DOM query per occurrence. That is
fine for a rule reporting a single document-level finding, and quadratic for
one reporting many: `region` hand-built its occurrences and took four minutes
on a thousand-element page, against under a second afterwards.

`perfStats.counters['structuralPath.selectorFallback']` counts how often the
engine had to re-find an element, so a slow rule can be spotted without
guessing. `tests/structural-path-fallback.test.js` fails if that count starts
growing with page size.

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

**A param carries a value, never prose.** Element names, roles, attribute names,
selectors, ids, counts and ratios are values: they read the same in every
language, because the author will search their own source for them. An English
word or sentence is not, and passing one means it stays English in every locale
— with nothing to reveal it, since the key is present everywhere and coverage
reports look complete.

When a message varies by case, give each case its own key rather than
interpolating the differing text:

```js
// wrong: the sentence lives in the rule, so no locale can reach it
i18n: { hintKey: 'myRule_hint_fail', params: { advice: 'Replace it with role="list".' } }

// right: one key per case, each translatable on its own
i18n: { hintKey: 'myRule_hint_fail_directory', params: { role } }
```

`tests/i18n/i18n-translatable-strings.test.js` fails any dictionary value with
no translatable text of its own, which catches the `"{{advice}}"` shape above.
It cannot catch a param carrying prose into an otherwise-normal sentence, so
that one is on you.

---

## 6) Helpers contract used by rules (ctx.helpers)

Rules use helpers returned by `createDomHelpers()`. The most load-bearing ones —
`queryAllSmart` (query with shadow/hidden/exclude handling built in),
`getAccessibleNameInfo`/`getAccessibleDescriptionInfo`/`getTextAlternativeInfo` (naming),
`isAccTreeEligible`/`getEligibilityInfo` (visibility), `getRoleInfo`/`getFocusableInfo`
(role/focus) — cover most rules.

**See [`RULE_HELPERS.md`](./RULE_HELPERS.md) for the full reference** (~35 helpers plus
the `contrast.*`/`aria.*` namespaces), with what each one does and when to reach for it
instead of reimplementing the logic in a new rule.

### 6.1 Shadow DOM scanning

Rules that need to work with open Shadow DOM should prefer:

```js
const nodes = helpers.queryAllSmart
  ? helpers.queryAllSmart('img')
  : helpers.queryAll('img');
```

Shadow traversal is on by default. It is the caller who opts out:
```js
engineOptions: { includeShadowDom: false }   // light DOM only
```
So write the rule assuming open shadow roots are in scope; `queryAllSmart` honours the
caller's choice for you. Closed roots are unreachable either way.

### 6.2 Reporting note for Shadow DOM

Selectors do not pierce shadow boundaries, so a `selector` may not uniquely locate a node
inside a shadow root — which is why `html` matters as the "which element" signal there.
You get both for free by reporting the element through `helpers.reportOccurrence` (§4.3);
there is nothing extra to do for shadow DOM specifically.

---

## 7) Eligibility logging (required in this ruleset)

This repo requires rules to attach an eligibility/visibility trace in each occurrence:

```js
data: {
  visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
}
```

Pass the `eligInfo` you already computed for the element; the fallback object above is
for the case where a rule has none to give.

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

## 9) Occurrence object shape

Report the element and let the engine finish the object (§4.3):

```js
occurrences.push(
  helpers.reportOccurrence(el, {
    summary: '…',
    hint: '…',
    i18n: { summaryKey: '…', hintKey: '…', params: { element: 'img' } },
    data: { visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] } }
  })
);
```

What a rule supplies:
- `summary`
- `hint`
- `i18n` (`summaryKey`, `hintKey`, `params`)
- `data` (includes `visibilityFilter`)

What the engine fills in from the reported element:
- `selector`
- `html`
- `structuralPath`

Setting `selector`/`html` yourself still works and still wins — a handful of rules whose
finding is not a single element (the contrast rules report text runs) do exactly that. It
is the exception, not the pattern to copy.

---

## 10) Structured doc comment block

Keep the structured header comment (`@check`, `@atomic`, `@summary`, `@standard`, `@sc`,
`@applicability`, `@expectation`). The id goes on `@check` — `@rule` is not a tag this
repo uses. `docs/RULE_TEMPLATE.js` has the full block to copy.

`@applicability` and `@expectation` are consumer-facing: `scripts/generate-rule-catalog.js`
reads them straight from the source and publishes them per rule in
[`RULE_CATALOG.md`](./RULE_CATALOG.md#rule-reference). Write them for someone deciding
whether a result applies to their page, and rerun `npm run docs:rule-catalog` after editing them.

---

## 11) Scenario fixture + fixture-coverage test (required for every rule)

Every rule — automatic or manual, no exceptions — needs a standalone, loadable HTML
scenario page in addition to its inline unit tests. This is not optional polish: the
project's test fixtures are meant to be usable directly by external tooling (loaded and
exercised as real pages), not just embedded as strings inside `.test.js` files.

### 11.1 The fixture file

- Path: `tests/fixtures/<rule-slug>-all-scenarios.html`, where `<rule-slug>` is the rule
  id itself (e.g. `tab-name-present` → `tab-name-present-all-scenarios.html`).
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
- A whole-document rule (`page-title-present`, `meta-refresh-timing-absent`, `region`)
  can only demonstrate one outcome per page. Its fixture declares a single bare
  `.case-title` with no `.case` wrapper, and the page itself is the case; the marker is
  compared against the rule-level outcome, so `PASS` and `NEUTRAL` are distinguished
  there. Cover the remaining branches with inline tests rather than near-identical
  fixture files.
- One fixture shared by several rules that expect different things of the same case
  (`tests/fixtures/contrast-all-scenarios.html` serves `contrast-minimum`,
  `contrast-enhanced` and `contrast-computable`) carries a per-rule marker as a
  `data-outcome-<rule-id>` attribute on the `.case`, which overrides the shared
  `.case-title` for that rule. Use an attribute rather than more text when the rules
  under test evaluate text: a `.case-title` added to a contrast case is one more text
  node to check. A marker word the parser does not recognise (`MIXED`, `UNSTATED`)
  asserts nothing, for a case whose outcome the fixture does not state.
- `npm run fixtures:markers:check` replays every fixture and fails when a marker no
  longer matches what the rule reports; `scripts/data/fixture-markers.json` records the
  cases that already disagree, so that set can only shrink.

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

  This category isn't just a fixture-authoring convention — it now backs a real
  behavioral contract. These 14 rules (`page-title-present`, `html-lang-attr-present`,
  `html-xml-lang-mismatch`, `aria-hidden-body`, `css-orientation-lock`,
  `meta-refresh-no-exceptions`, `meta-refresh-timing-absent`, `meta-viewport-zoom-enabled`,
  `meta-viewport-large`, `page-title-patterns`, `region`, `bypass-blocks-present`,
  `landmark-one-main`, `page-has-heading-one`) each export an `applicability(ctx)`
  gating on `helpers.isWholeDocumentScope()` (`src/core/dom-helpers.js`) — `notApplicable`
  when `contextSelector` scoped the run narrower than the whole document, or when
  `engineOptions.fragment: true` was set (see `ENGINE_OPTIONS.md`). A scoped subtree
  or a bare component fragment was never expected to carry its own `<title>`/`<html lang>`/
  page-wide landmark structure, so flagging its absence there is a false positive, not a
  real finding. If you add a new rule to this category, add the same `applicability`
  export rather than letting it silently evaluate document-wide facts regardless of scope.
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

The file MUST declare `const RULE_ID = '...'` near the top (the fixture-index
generator discovers a rule's test file and fixture by scanning for that constant —
tests using only inline string literals won't be picked up; see
`tests/engine-checks/manual-review.test.js` for the fix applied when this was missed).

### 11.4 Keeping the index current

After adding or changing any fixture, regenerate the index:

```
npm run fixtures:index
```

This writes `tests/fixtures/INDEX.md` (human-readable), `tests/fixtures/index.json`
(machine-readable — every rule, its fixture path, and parsed pass/fail/cantTell case
counts, for external tooling to enumerate and load fixtures directly) and
`tests/fixtures/index.html` (the same listing as a browsable page). Commit all three
alongside the fixture and test changes. A rule shipped without its fixture is treated
the same as a rule shipped without tests — not done. `npm run fixtures:check` reports
a stale index without rewriting it, and CI fails on one.
