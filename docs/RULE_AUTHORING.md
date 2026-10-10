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

⚠️ **Why this is dangerous, not just annoying: the build does NOT fail.** `runInPage` is serialized via `fn.toString()` and re-evaluated as source text later, in the page context — `build-core.js` never parses that source for free variables, and `npm run build`/`npm test`'s own tests only verify serialization round-trips correctly, not that every identifier resolves. The break only surfaces when the rule actually *runs*: the reference throws a `ReferenceError` inside `runInPage`, the runner's own `try/catch` (`src/core/dom-runner.js`) catches it silently, and the rule's result becomes `{ outcome: 'cantTell', occurrences: [], error: '<name> is not defined' }` — a normal-looking result, not a crash. A rule broken this way can sit unnoticed indefinitely unless something specifically asserts its `outcome`/`error`, which is why every rule's fixture-coverage test (§11) matters: it's often the *only* thing that would catch this. Two things catch it now: the lint rule `safe-dom/self-contained` (`@surea11y/core/eslint-plugin`, on in core and in a pack's `npm run lint`) flags a name read in `runInPage` or `applicability` that the file defines outside it, and `@surea11y/core/testing` runs every scan through the in-page runner too, a pack's rules from `packScript`'s script, so such a rule fails its test with the variable named.

**If you add a module-scope `const`/helper function to a rule file, move it inside `runInPage` itself** (or route the value through `ctx.rule`/`ctx.helpers` if it must be engine-provided) — do not leave it at module scope and reference it from inside `runInPage`, even though nothing will complain until you actually run the rule and check its `error` field.

✅ Use `ctx.rule.*` instead:
- `ctx.rule.ruleId`
- `ctx.rule.defaultSeverity`
- `ctx.rule.defaultConfidence`
- `ctx.rule.type`

### 1.2 Read the DOM through `ctx.helpers.dom`

A page's markup can change what a DOM property returns. HTML declares `HTMLFormElement` and `Document` with `[LegacyOverrideBuiltIns]`: a form's named controls override the form's own properties, and named images, forms, embeds, objects and iframes override `document`'s. On `<form><input name="parentNode">`, `form.parentNode` is that input, so a loop that climbs with `n = n.parentNode` never ends; on `<img name="querySelectorAll">`, `document.querySelectorAll` is that image. jsdom doesn't implement this, so a rule's tests can't show it.

So rules read DOM properties and call DOM methods through `ctx.helpers.dom` (`src/core/safe-dom.js`), which looks each one up on the object's own prototype chain, where markup can't reach:

```js
function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  // el.parentNode            -> dom.parentNode(el)
  // el.getAttribute('role')  -> dom.getAttribute(el, 'role')
  // document.title           -> dom.get(document, 'title')
  // typeof el.closest        -> typeof dom.get(el, 'closest')
  // walker.nextSibling()     -> dom.call(walker, 'nextSibling')
}
```

- `dom.<name>(node)` reads a property and `dom.<name>(node, ...args)` calls a method, for the names in `SAFE_DOM_GETTERS` and `SAFE_DOM_METHODS` (`src/core/safe-dom.js`): the ones that exist only on DOM interfaces.
- `dom.get(node, name)` reads any property, a method included, without calling it; `dom.call(node, name, ...args)` calls any method. Use them for names that also exist on ordinary objects (`id`, `title`, `name`, `style`, `length`): no tool can tell `form.title` from `rule.title`, so for those it is up to the author.
- Anything that isn't a DOM object (a plain object, a test's stand-in) is read the ordinary way, so the accessors are safe on any value. Like the reads they replace, they throw on `null` and `undefined`.
- Writes stay as they are: the engine only writes to elements it created.
- A scan checks once, at its start, whether any element is named after something the engine reads. On a page where none is, the accessors are plain reads; only a page that could override them pays for the protected lookup.

`npm run lint` fails on a direct read of a DOM-only name in `src/core`, `src/checks` or a profile's rules, and `node scripts/codemods/use-safe-dom.js` rewrites one; a pack lints its rules with the same rules from `@surea11y/core/eslint-plugin` ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core)). The Chromium test `tests/engine-checks/named-property-override-chromium.test.js` scans pages where every name is overridden and checks the results don't change.

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

Two optional exports go alongside them when a rule needs them:

- `applicability(ctx)`, a predicate the engine calls before `runInPage` to decide whether
  the rule is in scope for this run at all. Fourteen rules use it today (see §11.2).
- `settings`, an object of the thresholds the rule reads from `ctx.config`, with their
  defaults, for its variants (see "Rule variants" in §4.2).

```js
module.exports = { id, meta, runInPage, applicability, settings };
```

A variant exports `id`, `from`, `config` and `meta` instead, and no code of its own
(§4.2). Nothing else. `npm run validate:rules` rejects any other export.

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

  helpUrl: null, // or URL string; with none, a rule mapped to no WCAG criterion links its RULE_CATALOG.md section

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
  ], // WCAG only: EN 301 549 clauses are derived at build time (WCAG_CONFORMANCE.md#en-301-549)

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

Add the key and its English text to `src/i18n/en.json` (a profile's rule:
`profiles/<name>/i18n/en.json`), then run `npm run i18n:sync` so every other
locale picks it up. `npm test` fails if you
forget. See [`I18N.md`](./I18N.md).

#### `meta.tags`
Tags are used for grouping/filtering. Typical tag families in this ruleset include:
- WCAG tagging: `wcag2a`, `wcag111`
- domain: `nontext`, `images`, plus element-specific tags
- nature: `atomic`, plus `automatic` or `manual`
- another standard's own requirement: that standard's rule tag (see below)

#### Rules for another standard's own requirements
A rule that checks something WCAG does not require, but another standard does (a doctype or presentational attributes, say), declares no WCAG mapping (`wcagSc: []`, `normativeMappings: []`) and carries that standard's rule tag. Coming from the standard's pack or profile with that tag makes it **opt-in**: it runs only under the standard's profile, a selection that includes the tag, or its own id, never in a default or WCAG run ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#opt-in-rules)). The tag is how a selection names it; a core rule in `src/checks/` that carries a tag of the same name is not opt-in, while a `customRules` rule that carries it is. That is what lets it report `fail`: its failures are failures of that standard, and only a scan targeting it sees them. Its module goes in that standard's pack ([`PACKS.md`](./PACKS.md)) or, for a standard built into core, its profile rather than in `src/checks/`: `profiles/<key>/rules/automatic/` or `profiles/<key>/rules/manual/`. The build compiles it into the engine like any other rule. Its test and scenario page go in the profile too, in `profiles/<key>/tests/rules/` and `profiles/<key>/tests/fixtures/`. Map it to the standard's requirements the usual way (a row in the profile's rule map). Rule tags come from each standard's `ruleTag` in the registry, `src/coverage/standards.js` (a profile's from its `index.js`). The sample profile core's tests run against, `tests/fixtures/profiles/sample/`, has two such rules.

#### Rule variants
When another standard's requirement is a core rule with different thresholds (contrast at 7:1, say, or bold text large from 18.5px rather than WCAG's 14pt), write it as a **variant**, not a copy. The core rule declares the thresholds it reads from `ctx.config` as `settings`, with WCAG's values as defaults:

```js
// src/checks/automatic/contrast-minimum.js
const settings = { boldLargeMinPx: null, largeTextRatio: 3, normalTextRatio: 4.5 };
module.exports = { id, meta, runInPage, settings };
```

The variant is data, in the standard's profile:

```js
// profiles/<key>/rules/automatic/sample-contrast-enhanced.js
module.exports = {
  id: 'sample-contrast-enhanced',
  from: 'contrast-minimum',
  config: { normalTextRatio: 7, largeTextRatio: 4.5 },
  meta: { /* its own title, description, i18n, tags... as any rule's */ }
};
```

The build runs the base rule's `runInPage` and `applicability` under the variant's id and meta, with its `config` in `ctx.config`. A rule's settings are never the caller's: the runner drops a caller's value for one (`engineOptions.rules[ruleId]`), so the base rule always runs at its defaults and the variant at its `config`, while the caller's other config, such as `excludeSelectors`, still applies. A message key of the base's that starts with the base's prefix (its `meta.i18n.titleKey` without `_title`, `contrastMinimum`) is read from the variant's prefix instead (`sampleContrastEnhanced`), so the variant's dictionary has the same keys under its own prefix; the rule validator checks they exist. A pack's variant may leave them out: each it doesn't define reads the base rule's text ([`PACKS.md`](./PACKS.md)). A fix to the base reaches every variant. The build refuses a variant whose base does not exist, is itself a variant, or declares no `settings`, and a setting the base does not declare or of another type. A base rule that caches verdicts depending on its settings keys those caches by them, as `contrast-minimum` does.

Add a setting to a core rule when a standard needs it, with a default that keeps the rule's behaviour; the settings a rule declares are for its variants, not for callers. Semver covers them, since a pack's variants build on them: removing or renaming one, or changing what it means, is a major (see [`API_STABILITY.md`](./API_STABILITY.md#extending-the-engine)).

#### `meta.coverage.facetsBySc`
This is the repo’s explicit **coverage model** for an SC.
Each atomic rule declares which “facet(s)” of an SC it covers.

Keep facet naming consistent across a family.

#### `meta.deprecated` / `meta.deprecation`
Optional — how to retire a rule ID without breaking downstream consumers. See [`API_STABILITY.md`](./API_STABILITY.md) for the full policy: a rule being superseded keeps running normally, while a rule whose findings were wrong or duplicated another rule's reports `notApplicable` from the release that deprecates it; either way the id keeps resolving until a major version removes it. Shape:

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

#### `meta.reasonCodes`

Optional. The reason codes the rule builds at runtime, passed through a variable or a helper instead of written as `reasonCode: 'CODE'`, when the rule's fixture can't reach them in jsdom. `scripts/generate-finding-ids.js` finds a rule's codes by reading `reasonCode: '...'` in its source and by running its fixture in jsdom; a code that is only reached in a browser, such as one `text-spacing-content-loss` reports after measuring the layout, is in neither, and would be missing from the inventory consumers rely on (`docs/API_STABILITY.md`).

```js
reasonCodes: ['TEXT_CLIPPED', 'TEXT_CLIPPED_MOVING', 'TEXT_CLIPPED_PARTLY', 'TEXT_OVERLAPS']
```

`npm run validate:rules` checks that each code is written in the rule's source as a string, outside this list, so a typo can't register a code the rule never reports. A rule whose codes are all `reasonCode: '...'` literals doesn't need it.

#### `meta.margin`

Optional. Declares that the rule measures a value against a threshold and reports how close the closest element came to it while still meeting it: the check result's `margin` (`docs/OUTPUT_SCHEMA.md`). Declare it when the rule measures something rendered, such as a contrast ratio, a size or an overflow, which can sit just inside the limit and move with a viewport, a font or a copy change. Don't declare it for a fixed value typed in the markup (`maximum-scale`, a refresh delay, inline spacing values): that never drifts, and the source already shows it.

```js
margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' }
```

- `measure`: what is measured, lowercase and hyphenated. Reuse an existing one when it is the same measurement (`contrast-ratio`, `overflow-px`, `target-size-px`), so a tool can compare it across rules.
- `unit`: `px` (reported to one decimal) or `ratio` (not rounded, since WCAG does not round contrast).
- `limit`: `min` when the value must reach the threshold, `max` when it must stay under it.

The rule then returns, beside its outcome, `marginCandidates`: one `{ el, value, threshold, context? }` per element that met the limit, with the threshold that element was judged against (it may differ per element, as large text's does), and optionally `measuredCount`, how many elements it compared. Return candidates whatever the outcome, `fail` included: the closest pass still matters on a page with other failures. The runner does the rest (`src/core/margin.js`): it keeps only candidates that really met the limit, picks the smallest headroom, gives a tie to the element first in document order, rounds, and builds the selector and structural path. A rule never builds `margin` itself; anything it puts there is dropped.

`npm run validate:rules` checks the declaration (a measure, a known unit and limit) and that the rule's source returns `marginCandidates`. A variant (see "Rule variants") has a meta of its own, so it declares `meta.margin` too when its base's code reports one.

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

**See [`RULE_HELPERS.md`](./RULE_HELPERS.md) for the full reference** (about 65 helpers
plus the `dom`, `contrast.*` and `aria.*` namespaces), with what each one does and when to reach for it
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

An ID reference (`for`, `aria-labelledby`, `aria-owns`, `headers`, `usemap` and the
rest) resolves in the referring element's own tree: the shadow root it is in, or the
document. So a reference inside a shadow root finds its target there, and one from a
shadow root to the page finds nothing, as in browsers. Look an ID up with
`helpers.getElementByIdInTree(el, id)`, and pass the element carrying the reference to
`resolveIdRefs`/`getTextFromIdRefs` (`RULE_HELPERS.md` §4); `npm run lint` flags
`dom.getElementById(document, …)` in a rule, and an IDREF helper called without the
element. A fragment link (`href="#main"`) is the exception: its target is looked up in
the document, which the rule says in an `eslint-disable` comment.

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

```js
return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
return { ruleId: rule.ruleId, ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity) };
```

The engine then settles what the rule returned (`src/core/dom-runner.js`, and
`normalizeRuleResult` in `scripts/build-core.js`). Core's rules never rely on this; a
custom or pack rule may. Each change is noted in the result's `error`, after any `error`
the rule set itself ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-check-result-checksresultsi)):

- A rule that throws, or returns something that is not a result object (a Promise
  included), is `cantTell` with no occurrences and the reason in `error`.
- A returned `type` is ignored: the type is the meta's. One that differs from it is noted.
- A returned `engineOptions` is replaced by the scan's, and a returned `wcagVersionScope`
  is dropped: the engine states both.
- A returned `policyOutcome` or `ruleSeverity` is not taken: the engine sets them, for a
  policy or a profile.
- Occurrences that are not objects (`null`, a string, a number, an array) are left out.
- A `fail` with no occurrence gets one on the document element, with reason code
  `FAIL_WITHOUT_OCCURRENCE`, so every reporter shows it as a failure.
- The outcome is made to agree with the occurrences' `occurrenceOutcome` tiers: any
  `fail`-tier occurrence makes it `fail`, and a `fail` whose occurrences are all
  `cantTell`-tier is `cantTell`
  ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#an-occurrence-occurrencesi)).
- An `uncertainty` whose `code` is outside the closed set is left out
  ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#uncertainty-codes)).
- An `outcome` outside `pass`, `fail`, `cantTell`, `notApplicable` is reported as
  `cantTell` ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#outcome-values)), and a `severity`
  outside `minor`, `moderate`, `serious`, `critical` is replaced by the rule's
  `defaultSeverity`
  ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#severity-and-confidence-values)).
- A manual rule's `fail` is reported as `cantTell`.

### 8.2 What `ctx` carries

`runInPage(ctx)` and `applicability(ctx)` receive the same object, built-in and custom rules alike, with one difference: a custom or pack rule (`engineOptions.customRules`, a pack's rules and overrides) runs after core's rules, and its `helpers`, `engineOptions` and `inputs.probes` are read-only. Setting, defining or deleting anything on them throws a `TypeError`, which makes that rule alone `cantTell` with the error; the other rules see nothing of it. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#customrules--runtime-registered-rules).

| Field | What it is |
|---|---|
| `document`, `window` | The page being scanned. |
| `root` | The roots the scan covers: the document, or what `contextSelector` resolved to. |
| `contextSelector` | The selector that scoped the run, if any. |
| `rule` | The rule's resolved definition: `ruleId`, `defaultSeverity`, `defaultConfidence`, `type`, `meta`... |
| `config` | `engineOptions.rules[ruleId]`, this rule's settings, if the caller gave any (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). |
| `standard` | The standard and version the run targets, `{ key, name, version }` (`{ key: 'en301549', name: 'EN 301 549', version: 'V4.1.1' }`), when a standard's profile selected the run; `null` otherwise (no profile, a WCAG profile, or rules chosen by tag or id). A rule whose behaviour differs between versions of its standard reads it here, and does what holds for every version when it is `null`. |
| `helpers` | The helpers documented in [`RULE_HELPERS.md`](./RULE_HELPERS.md). Read-only for a custom or pack rule. |
| `engineTag` | The engine's tag (`"a11ycore"`), the one every rule carries in `meta.tags`. |
| `engineOptions` | The scan's options as resolved. Read-only for a custom or pack rule. |
| `inputs.probes` | Evidence the host application supplied (`engineOptions.probes`). Read-only for a custom or pack rule. |

### 8.3 Outcome conventions used by these rules

Automatic:
- `notApplicable` if no applicable targets
- `pass` if applicable targets exist and no occurrences
- `fail` if occurrences exist
- `cantTell` if the only findings are ones it cannot decide without a guess (§8.4);
  `helpers.resolveTieredOutcome` combines the two tiers

Manual:
- `notApplicable` if no applicable targets
- `cantTell` if at least one target requires review
- `pass` if applicable targets exist, none requires review, and nothing about
  them needs a person to judge: `landmark-unique` passes when every same-role
  group of landmarks has distinct names. A rule whose question is a judgment on
  every target, such as `img-alt-quality`, has no such case and never passes.
  See `RULE_TAXONOMY.md` §1.1.

### 8.4 Decide from what the page states; a guess never fails

A rule decides from what the page states: its DOM, its computed styles, and the
boxes the browser measures. It does not decide from what it infers the page
does: that a box scrolls, that hidden text will be shown, that a box is a
carousel. Styles alone often can't tell such cases apart (`overflow: hidden`
is a menu a script scrolls as often as a teaser cut for good), and an inference
that is right on the pages a rule was written against is wrong on the next
common component. Three such inferences were false failures found in use
(#176, #177, #181).

- Where a rule can't decide without a guess, it says `cantTell` or leaves the
  element out. It never reports `fail` on a guess.
- Don't measure what a moment of the scan shows: which part of an element the
  scroll position shows, or what lies where a scrolled box's content is now. A
  person scrolls; measure what they would see once they have.
- A rule that reads the layout is run on the pattern set (§12) before it
  changes, against the version before it and, where they check the same, other
  engines. A new failure there has to be explained.

When a guess is the only way to an answer, say so in the rule's
`LIMITATIONS.md` entry, as the contrast rules do for text scrolled out of an
`overflow: hidden` box.

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
  id itself (e.g. `tab-name-present` → `tab-name-present-all-scenarios.html`). A
  profile's rule keeps it in the profile: `profiles/<name>/tests/fixtures/`.
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
  cases that already disagree, so that set can only shrink. A profile's rules have
  their record in the profile's own `scripts/data/fixture-markers.json`.

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
  The four of them about the page's structure (`page-has-heading-one`,
  `landmark-one-main`, `bypass-blocks-present`, `region`) are also `notApplicable` while
  `helpers.isModalDialogOpen()`: the rest of the page is inert then, so the scan saw a
  dialog, not the page.

- **Page-relational checks** (`landmark-unique`, the `landmark-no-duplicate-*` and
  `landmark-*-is-top-level` rules, `accesskeys`, `heading-order`,
  `identical-links-same-purpose`, `identical-iframes-same-purpose`): the rule compares
  elements with each other or with their ancestors, so a scoped scan sees only part of
  what it compares. A problem found inside the scope is real on any page and is still
  reported, but the rule returns `notApplicable` where it would `pass` unless
  `helpers.isWholeDocumentScope()`, since it cannot say the page is fine. A rule that
  can look past the scope, as `duplicate-id` does by collecting ids from the whole
  document, needs no such gate: its `pass` holds for the page.
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
`tests/fixtures/index.html` (the same listing as a browsable page). A profile's rules
get the same three files in the profile's `tests/fixtures/`, with paths relative to the
profile's folder. Commit all three
alongside the fixture and test changes. A rule shipped without its fixture is treated
the same as a rule shipped without tests — not done. `npm run fixtures:check` reports
a stale index without rewriting it, and CI fails on one.

## 12) Real-world patterns (required for rules that read the layout)

The scenario fixtures exercise each rule's branches, but none of them is a real
menu, dialog or carousel in the state a person meets it in. `tests/patterns/`
holds such components, each built accessibly, and the states each is scanned in
(scrolled, opened, between slides): see its `README.md`.
`tests/engine-checks/patterns-chromium.test.js` runs every rule on every state
in Chromium and fails on any `fail`. So a rule that fails one of them is wrong on
a common page.

- A change to a rule that reads the layout passes this test, and is also
  compared with the version before it on the patterns, `cantTell` included: a
  new `cantTell` there is a question asked of every such page.
- A false failure reported in use gets a pattern, or a state of one, that
  reproduces it, with the fix.
- A failure a finding explains, not yet fixed, is listed in `knownFailures` in
  `tests/patterns/index.js` with the finding's id, and removed with the fix.
