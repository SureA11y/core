# Output schema reference

This is the exact shape of the object returned by `runDomRulesInPage(...)` / `runa11yCoreInPage(...)` (see [`INTEGRATION.md`](./INTEGRATION.md) for which one to call). Every example on this page is real output from the current engine (`schemaVersion: "1.0.0"`), not hand-written. `runa11yCoreAcrossFrames` returns a different, recursive shape wrapping this one — see [Cross-frame result](#cross-frame-result-runa11ycoreacrossframes) below.

- [Top-level result](#top-level-result)
- [Cross-frame result (`runa11yCoreAcrossFrames`)](#cross-frame-result-runa11ycoreacrossframes)
- [A check result (`checksResults[i]`)](#a-check-result-checksresultsi)
- [An occurrence (`occurrences[i]`)](#an-occurrence-occurrencesi)
- [A composite result (`rulesResults[i]`)](#a-composite-result-rulesresultsi)
- [Outcome values](#outcome-values)
- [Severity and confidence values](#severity-and-confidence-values)
- [Worked example](#worked-example)

## Top-level result

```ts
{
  engine: {
    tag: string,
    schemaVersion: string,
    locale: { requested: string, resolved: string, reason: string },
    wcagVersion: "2.0" | "2.1" | "2.2",
    profile?: string,      // "wcag22-aa", "en301549-v4.1.1", "en301549-v3.2.1", "section508", or a registered standard's own
    mappings?: string[],   // e.g. ["en301549"] or ["en301549:V3.2.1"]
    environment: {
      layout: boolean,
      viewport?: { width: number, height: number },  // CSS px
      devicePixelRatio?: number,
      colorScheme?: "light" | "dark",
      fonts?: "loaded" | "loading"
    }
  },
  url: string | null,
  title: string | null,
  timestamp: string | null,
  perfStats: object | null,
  contextSelector: string | string[] | null,
  contextMatch: { elementCount: number, unmatchedSelectors: string[] } | null,
  checksResults: CheckResult[],
  rulesResults: CompositeResult[],
  overriddenBuiltinIds: string[],
  skippedCustomRules: Array<{ id: string | null, reason: string }>
}
```

| Field | Meaning |
|---|---|
| `engine.tag` | The engine's own identity tag, currently `"a11ycore"`. Every rule (built-in or custom) carries it in `meta.tags` — rule `ruleId`s themselves are bare (no prefix). |
| `engine.version` | The `@surea11y/core` release that produced the result, such as `"1.10.0"`: what to quote in a bug report, and how to tell results from two releases apart. A result can change between releases without its shape changing, so this is not `schemaVersion`. The SARIF and EARL reporters use it as the tool version when you give none. |
| `engine.schemaVersion` | The result-schema version (`"1.0.0"`). Bump-worthy if this document's shape ever changes incompatibly — pin to it if you're parsing output programmatically. See [`API_STABILITY.md`](./API_STABILITY.md) for the full stable/unstable field list and version-bump policy. |
| `engine.locale` | Which dictionary the run actually used. `requested` is your `engineOptions.locale` after trimming (`"en"` if you passed nothing or a non-string); `resolved` is the locale whose dictionary was used; `reason` explains the pairing. Because locale fallback is graceful and per-string, asking for a language the build does not carry produces English text rather than an error — this field is how you find that out without reading the strings. Reported once per result: a run uses one dictionary throughout. |
| `engine.locale.reason` | `"ok"` — you got the dictionary you asked for, and it carries every key (a profile's messages in a language that profile does not offer show in English, by its choice, and do not count; see [`I18N.md`](./I18N.md)). `"primary-subtag"` — your code had a subtag with no dictionary of its own, so its base language was used: `"de-DE"` resolves to `"de"`. `"dictionary-not-loaded"` — the project ships that language, but this build does not carry it and none was supplied (the standalone browser bundle, without its locale side file). `"unknown-locale"` — the project has no such translation at all. `"partial-dictionary"` — the dictionary was used but is missing keys English has, so those strings fell back to English. Treat the set as open; later releases can add to it. |
| `engine.wcagVersion` | Which version of WCAG this run was conformance-tested against: your `engineOptions.wcagVersion`, or what your version-origin tags implied, or the default `"2.2"`. It affects one thing today — a rule mapped only to SC 4.1.1 Parsing cannot `fail` under a 2.2 target (see `checksResults[i].wcagVersionScope` below). Reported once per result: a run has one target throughout. |
| `engine.profile` | Present only when an `engineOptions.profile` selected this run's rules, and names the profile, lowercased. Absent when none was asked for, and also when one was asked for but did not apply (unknown name, or an include in `runOnly` or `engineOptions` chose the rules instead), so its presence is how you confirm a run really targeted that profile. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles). |
| `engine.profileExcludes` | Present only when the applied profile leaves rules out (`exclude` in its standard's registry entry): `{ rules, criteria }`, the rules it names and the WCAG criteria it waives. Their rules and WCAG rollups did not run. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles). |
| `engine.optInRules` | Present only when `engineOptions.optInRules` ran at least one opt-in rule that the rest of the selection would not have run. Lists their tags. Its presence means the result includes rules for requirements beyond the targeted standard, such as a national standard's, so a failure may not be a WCAG failure. Absent under a WCAG profile, where unlocking selects nothing, and when a standard's own profile ran its rules. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#running-every-rule-optinrules). |
| `engine.mappings` | Present only when the run names a standard besides WCAG in `meta.normativeMappings`, through `engineOptions.mappings` or a standard's profile. Lists them canonically, in table order: `"en301549"` for every version, `"en301549:V3.2.1"` for one. Absent means every result names WCAG only. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#other-standards-mappings). |
| `engine.environment` | The conditions the page was rendered under, read from the page when the scan starts, before any rule runs (some rules change the page while they measure it). Rules that measure the layout, such as `text-spacing-content-loss`, can give another outcome for the same markup at another viewport width or while web fonts are still loading, so this is what you need to reproduce a run. `layout` is whether the page had one: `false` in jsdom and other DOM emulators, and then it is the only field, since a viewport describes nothing that was measured. In a browser, `viewport` is `innerWidth`/`innerHeight` in CSS pixels, `devicePixelRatio` the page's (browser zoom shows here too), `colorScheme` what `prefers-color-scheme` matches, and `fonts` is `"loading"` while any of the page's font faces is still loading, `"loaded"` otherwise. It asks each face rather than reading `document.fonts.status`, which Chromium leaves at `"loading"` for a while after a style sheet adds a cascade layer, as `text-spacing-content-loss` does, though every face has loaded: a scan run straight after another would report fonts that were not loading. A field the page cannot report is left out. Reading these adds no nondeterminism: like the DOM, they are input, and the same page rendered the same way gives the same values. `"loading"` means layout rules measured text in fallback fonts; for results you can compare between runs, wait for `document.fonts.ready` before scanning. `images` is `"loading"` while any image is still loading, `"loaded"` otherwise: an image that arrives later can move what layout rules measured, so for comparable results scan after the page's `load` event. An image with `loading="lazy"` is left out, since it waits for the reader to scroll. `animationsSettled` is how many running animations and transitions the scan held still: for the scan, a finite one (a fade-in) is read at its end and one that repeats for ever (a marquee, a spinner) at its start, and each is put back exactly where it was afterwards, so a page scanned during a fade-in gets the same result as one scanned after it. The browser never paints the held state, since the scan is one synchronous task. Each frame's result in a [cross-frame result](#cross-frame-result-runa11ycoreacrossframes) carries its own, since a frame has its own viewport. |
| `url` | The `pageUrl` argument you passed in, or `document.location.href` if you passed `null`/omitted it (or passed something other than a string, which also logs a `console.warn`), or `null` if neither is available. |
| `title` | `document.title` at scan time, or `null`. |
| `timestamp` | **Not auto-generated.** Only set if you pass `engineOptions.timestamp` as a non-empty string — the engine has no built-in clock (deterministic-by-design). If you want a scan timestamp in the result, supply it yourself. |
| `perfStats` | `null` unless `engineOptions.perfStats: true`. Internal timing/counters — shape not covered by this document, treat as debug-only. |
| `contextSelector` | The (trimmed) `contextSelector` argument you passed — a string, an array of strings (multi-region scanning, see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)), or `null` if none/empty. |
| `contextMatch` | How the `contextSelector` resolved, or `null` when none was given. `elementCount` is how many distinct elements it matched, the roots of the scan. `unmatchedSelectors` lists each selector, as you gave it, that matched no element; a comma-separated string is one selector here, as it is one `querySelectorAll` call. **An `elementCount` of 0 means nothing was scanned**: the page has no such scope, every entry in `checksResults` and `rulesResults` is `notApplicable`, and the result says nothing about the page. Report it as a scope that wasn't found, not as a clean scan. A selector the browser can't parse never reaches a result: the scan throws with `code: 'INVALID_CONTEXT_SELECTOR'` (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#contextselector-2nd-runner-argument-not-an-engineoptions-field)). |
| `checksResults` | One entry per **atomic rule** that ran (every rule not filtered out by `runOnly` — see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). **Every loaded rule produces an entry, even ones that outcome `notApplicable`** — this is not a "violations only" list. |
| `rulesResults` | One entry per **composite (rollup) rule** that ran — see [Composite result](#a-composite-result-rulesresultsi) and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md). Normally one per WCAG Success Criterion; a run under the profile of a standard with rollups of its own also gets those (`meta.standard` set). Empty array if no composite matched the current `runOnly`/tag filter. |
| `overriddenBuiltinIds` | Rule ids where an `engineOptions.customRules` entry shared its `id` with a built-in rule, so the custom implementation replaced the built-in one for this scan (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). Always an array; empty when no collision occurred. Also logged via `console.warn` at scan time, since a same-named custom rule is as likely to be an accidental collision as a deliberate override. |
| `skippedCustomRules` | The `engineOptions.customRules` entries that were not run, each `{ id, reason }` (`id` is `null` when the entry had none): no id, a `runInPage` that is not a function or can't be rebuilt from its source, a `meta` that fails validation, an id another custom rule already has, or a composite rule's id; or a valid rule the run's selection does not select (under a profile or a WCAG target, a rule tagged `best-practice` or with no WCAG tag), whose `reason` says how to select it. Always an array; empty when every custom rule ran. Each is also logged with `console.warn`. A rule listed here is in no result, so a scan that leaves one out can be told apart from one where it passed. |

## Cross-frame result (`runa11yCoreAcrossFrames`)

`runa11yCoreAcrossFrames` (see [`INTEGRATION.md`](./INTEGRATION.md#cross-frame-scanning-including-cross-origin)) returns a different, recursive shape instead of a plain top-level result:

```ts
{
  topFrame: <the normal top-level result shape above>,
  frames: Array<
    | { url: string | null, selector: string | null, title: string | null, topFrame: <top-level result>, frames: [...same shape, recursively] }
    | { url: string | null, selector: string | null, title: string | null, error: string }
  >
}
```

- `topFrame` is exactly the [top-level result](#top-level-result) shape, for the frame the function was called in.
- `frames` has one entry per direct child `<iframe>`/`<frame>` in the scanned scope, except a frame the page doesn't show and a frame `excludeSelectors` excludes (it matches, or sits inside an element that does), which are left out with their whole document. Each entry names its frame element: `selector` is a CSS selector for the `<iframe>`/`<frame>` in the parent's document (its id when no other element has it, else its path by type, as in `html > body > main > iframe:nth-of-type(2)`), and `title` is the element's `title` attribute, or `null`, so frames loading the same document can be told apart. `url` is the document the frame shows, or, for a frame that hasn't navigated yet (still loading, or a server that never answers), its `src`. A reachable child (one that called `a11yCoreEnableFrameResponder()`) contributes its own complete `{ url, topFrame, frames }` — including *its own* nested `frames`, recursively, since a further-nested grandchild is only reachable through its immediate parent. An unreachable child (the common case for most third-party embeds — no cooperating responder, or it timed out) contributes `{ url, error }` instead, and does not abort the rest of the scan.
- This is a **tree, not a flat list** — a deliberate difference from the `@surea11y/playwright` binding's `.frames(true)`, which *can* flatten because Playwright's `page.frames()` already gives every frame regardless of nesting depth; a `postMessage` relay has no such global view, so nesting is expressed structurally instead.
- **The reporters take the tree as it is.** `renderHtmlReport`, `renderSarifReport`, `renderJunitReport`, `buildBaselineEntries`, `matchBaseline` and `renderEarlReport` report every frame of it: each frame that answered with its own findings, located in its own document, and each frame that did not as not scanned, so a gap in coverage doesn't read as a pass. A frame is named by its **path**, the `selector`s of the frame elements leading to it from the page, outermost first (`#checkout → iframe:nth-of-type(2)`). They throw a `TypeError` for anything that is neither a scan result nor a cross-frame result (an array, `null` or `undefined` from a scan that broke), rather than render it as a scan that found nothing.
- `flattenCrossFrameResult(result)`, from `@surea11y/core`, lists the frames as the reporters read them: `[{ frame: { path, title, url }, result }]`, or `error` in place of `result` for a frame that did not answer, the page first and each frame before the frames inside it. The page's `path` is `[]`. A plain scan result is one entry.

## A check result (`checksResults[i]`)

```ts
{
  ruleId: string,
  outcome: "pass" | "fail" | "cantTell" | "notApplicable",
  outcomeNormalized: "pass" | "fail" | "cantTell" | "inapplicable",
  severity: "minor" | "moderate" | "serious" | "critical",
  confidence: "high" | "medium" | "low",
  type: "automatic" | "manual",
  occurrences: Occurrence[],
  title: string,
  description: string,
  i18n: { titleKey: string, descriptionKey: string } | null,
  meta: {
    ruleId: string,
    ruleInterfaceVersion: string,
    ruleVersion: string,
    normative: boolean,
    atomic: boolean,
    category: "perceivable" | "operable" | "understandable" | "robust" | null,
    helpUrl: string,       // where to read how to fix it; "" when the rule names none
    tags: string[],        // the rule's tags, its own and the engine's
    normativeMappings: Array<{ standard: string, version: string, requirement: string, title: string, conformanceLevel?: string, wcagSc?: string[], url?: string, understandingUrl?: string }>,  // a WCAG 2.1/2.2 criterion links its Recommendation section (url) and Understanding document
    standard: string | null,
    applicability: string,
    expectation: string,
    references: string[],
    requirements: object | null,
    mappings: object | null
  },
  engineOptions: object,   // the resolved engineOptions this rule actually ran under
  schemaVersion: string,
  rollupIds: string[],     // the rulesResults entries that group this rule in this run; [] if none
  data?: object,           // page-level data a rule reports whatever its outcome; see below
  margin?: {               // the closest a measurement came to its threshold while meeting it; see below
    measure: string,       // "contrast-ratio" | "overflow-px" | "target-size-px" | ... (open set)
    unit: "px" | "ratio",  // open set
    limit: "min" | "max",
    threshold: number,
    value: number,
    headroom: number,      // >= 0
    measuredCount: number,
    selector?: string,
    shadowHostSelectors?: string[],  // as on an occurrence
    structuralPath?: number[],
    context?: object       // rule-specific; not a stable contract
  },
  wcagVersionScope?: {     // present only when the target WCAG version changed this outcome
    target: "2.0" | "2.1" | "2.2",
    removedSc: string[],
    coercedFrom: "fail"
  },
  error?: string           // present only if the rule threw — see below
}
```

Notes:

- **`outcome` vs `outcomeNormalized`**: identical except `notApplicable` becomes `"inapplicable"` in `outcomeNormalized`. Both are provided so you can match either your own vocabulary or the engine's internal one.
- **`type: "manual"` rules can never report `outcome: "fail"`.** If a manual rule's own logic would have said `fail`, the engine coerces it to `cantTell` and appends an explanatory note to `error` — this is enforced centrally (`policy.coerceManualFailToCantTell`, on by default under the `a11y` policy contract; see [`POLICY.md`](./POLICY.md)), not something each rule has to remember. `fail` is reserved for deterministic, `type: "automatic"` findings only.
- **`rollupIds`** lists the composites in `rulesResults` that group this rule in this run. An empty list means the rule's findings appear in no rollup, so a consumer that reads only `rulesResults` never sees them; `heading-order`, for instance, belongs to no WCAG rollup.
- **`meta.normativeMappings`** is how a check result ties back to a WCAG Success Criterion — `[]` for rules with no formal WCAG mapping (this engine calls them advisory `type: "manual"` rules). See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up. The list is not WCAG-only. When the scan asks for another standard (`engineOptions.mappings`, or a standard's profile), each WCAG criterion is followed by that standard's corresponding requirement, such as the EN 301 549 clause that restates it (`{ standard: "EN 301 549", version: "V3.2.1" | "V4.1.1", requirement: "9.1.1.1", title, wcagSc: ["1.1.1"] }`, one entry per version that includes the criterion, `wcagSc` naming the criteria it corresponds to), or the requirements of a standard mapped rule by rule that the rule checks (same shape, `wcagSc` empty for a requirement WCAG does not make, and any fields of that standard's own); and a rule may also cite WCAG's Understanding documents (`type: "Understanding"`). Filter on `standard` (and on the absence of `type`) before reading `requirement` as a Success Criterion. A composite's WCAG entry is always first. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md#en-301-549).
- **`wcagVersionScope`**: only present when the run's target WCAG version turned this rule's `fail` into a `cantTell` — today that means a rule mapped to SC 4.1.1 Parsing (`duplicate-id`) under the default 2.2 target, since 2.2 removed that criterion. `removedSc` lists the criteria that stopped existing, `target` is the version that removed them, and `coercedFrom` is the outcome the rule itself reported. The occurrences are the rule's own, unchanged — nothing was dropped, only the conformance verdict was. Absent on every other result, and **never** reported through `error`: nothing went wrong. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22).
- **`data`**: present only on a rule that reports something about the whole page, whatever its outcome. No core rule does today; a profile's rule may, such as one returning the page's own entry for a probe that compares pages (see `probes` in [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). Like `data.details` on an occurrence, it is not a stable contract.
- **`margin`**: present only on a rule that declares one in the catalog (`getChecksCatalog()[i].margin`, `{ measure, unit, limit }`), when at least one element met the rule's threshold. It names the element that came closest to the threshold while meeting it, so a pass at 4.52:1 against 4.5:1, or 0.4 px from cutting off text, can be told apart from a comfortable one. It sits beside the outcome and is not a finding: it never adds, removes or changes an occurrence, and baselines, SARIF, JUnit and EARL ignore it. It is reported on `fail` and `cantTell` results too when some elements passed. `limit` is `min` when the value must reach the threshold (contrast, size) and `max` when it must stay under it (overflow); `headroom` is how far inside, in `unit`, so `value - threshold` for `min` and `threshold - value` for `max`, never negative. `threshold` is the one that element was judged against, which can differ between elements (3:1 for large text). Pixels are given to one decimal: CSS pixels and thresholds such as half a 15px font are fractional, and a display rounds them for people. A ratio is not rounded, as WCAG does not round contrast. A tie goes to the element first in document order, so a page gives the same margin every time. `measure` and `unit` are open sets that may grow in a minor release; `context` is rule-specific and, like `data.details`, not a stable contract. `getMargins(result)` returns every margin in a result as `[{ ruleId, ...margin }]`, sorted by `ruleId`.
- **`error`**: present when the rule did not complete, or when the engine changed or ignored part of what the rule returned. A rule that threw (or returned something that is not a result) always surfaces as `outcome: "cantTell"` with `occurrences: []` and `error` set to the exception message, so `cantTell` with no occurrences and an `error` is how to tell a rule that did not complete; the engine never lets one broken rule crash the whole scan. Otherwise `error` holds the engine's notes, joined by ` | ` after any `error` the rule returned itself: the manual-fail coercion above, an `outcome` or `severity` outside its set, a `type` the rule returned that differs from its meta's, an `uncertainty.code` outside the closed set (the uncertainty is left out), and a `fail` downgraded to `cantTell` because the 200-step ancestor walk stopped short of every reported element, so the engine could not confirm they are exposed. Those results keep their occurrences: the rule completed.
- **`engineOptions`** on each result is the *resolved* options object (after locale/contrast defaults were applied), not literally what you passed in — useful for confirming what a given rule actually saw, especially the resolved `locale` and `contrast.mode`/`contrast.rootCanvasFallback`. It leaves out `messages`, the dictionaries the run translated with (a locale side file in the browser bundle, or your own strings): they are data, not a setting, and a copy on every result made a scan tens of megabytes. `engine.locale` says which dictionary was used. Two more options are echoed as the rules saw them, so the result stays plain data that `JSON.stringify` and `structuredClone` (`postMessage`) can carry: `probes` as the capped copy rules read, and `customRules` as `[{ id }]`, one entry per custom rule with an id, without its functions.

## An occurrence (`occurrences[i]`)

A `fail` always has at least one: a custom rule's `fail` that names no element gets one on the document element (`selector: "html"`, reason code `FAIL_WITHOUT_OCCURRENCE`). Normally present only when `outcome` is `fail` or `cantTell`: a `pass` result has `occurrences: []`, since this engine does not enumerate the elements it passed, only the ones it flagged. The contrast rules are the exception: their `pass` carries one occurrence describing the scan (how much text was eligible and computable), with an empty `selector`, so a pass over no text can be told apart from a pass over a page of it.

`notApplicable` is the one exception. A rule that had nothing to judge may attach a single occurrence saying why, and the contrast rules do exactly that when no text had a computable background — the difference between "checked, nothing to flag" and "could not check" is one this engine reports rather than hides. Such an occurrence describes the scan, not an element, so its `selector` is empty. Do not read `occurrences.length` as a violation count without checking `outcome` first.

```ts
{
  selector: string,
  html: string,
  structuralPath: number[] | null,
  shadowHostSelectors?: string[],
  summary: string,
  hint: string,
  i18n: { summaryKey: string, hintKey: string, params: object } | null,
  occurrenceOutcome?: "fail" | "cantTell",   // present when the rule graded its findings into tiers
  uncertainty?: {          // present only on a cantTell-tier occurrence
    code: "not-computable" | "runtime-dependent" | "spec-only"
        | "equivalence-unknown" | "judgement-required" | "out-of-scope",
    needed?: string,       // what would settle the question
    evidence?: object      // what the rule did establish, rule-specific
  },
  data?: {               // absent on manual-review's page-level finding
    visibilityFilter?: { eligible?: boolean, targetSet: string, accEligible: boolean | null, reasons: string[] },
    details?: object   // rule-specific, non-normative — see below
  }
}
```

| Field | Meaning |
|---|---|
| `selector` | A best-effort CSS selector built to resolve back to the flagged element (see `helpers.buildSelector` in `RULE_AUTHORING.md`). Not guaranteed unique in adversarial DOM shapes, but the engine actively verifies it resolves to the reported element before using it. The exception is a rule whose finding *is* an absent element: `page-title-present` reports `head > title` with an `html` of `<title>(missing)</title>`, neither of which is on the page. Both are constants, so the fingerprint they feed stays stable, but do not treat `selector` as resolvable or `html` as real markup without checking the rule reported something that exists. For an element in a shadow tree, `selector` resolves inside its shadow root, and `shadowHostSelectors` says how to get there. |
| `shadowHostSelectors` | Present only for an element inside a shadow tree: the selectors of the shadow hosts that lead to it, outermost first, each resolved in the tree that holds it, so `document.querySelector(s[0]).shadowRoot.querySelector(s[1])…shadowRoot.querySelector(selector)` finds the element. Two components with the same content give the same `selector` and differ here. Like `selector`, it is not part of a finding's identity. |
| `html` | An outer-HTML snippet of the flagged element, cut at 2,000 characters — useful to show the element, and for an element in a shadow tree read beside `shadowHostSelectors`. For `<html>`, `<head>` and `<body>`, which hold the whole page, it is the start tag alone (`<html class="x">`), so a page-level finding keeps its identity when other content changes. |
| `structuralPath` | The flagged element's sibling-index path from `documentElement` down to it (e.g. `[1, 0, 2]`) — `[]` if the element *is* `documentElement`, `null` if it couldn't be determined, which includes every element inside a shadow tree (use `shadowHostSelectors` and `selector` there). A more robust element-identity mechanism than `selector` alone: it survives DOM changes a selector string wouldn't (an id/class rename, for instance), at the cost of not being usable as an actual CSS selector. Computed from the element reference when the rule kept one, otherwise by re-resolving `selector` against the document (same caveat as `selector` itself: a non-unique selector could resolve to a different element than intended). |
| `summary` | Human-readable, already localized ("This button has no accessible name."). |
| `hint` | Human-readable remediation guidance, already localized. |
| `i18n` | The raw translation keys behind `summary`/`hint`, if you want to re-render them in a different locale yourself without re-running the scan. `null` if the occurrence didn't use key-based i18n. |
| `data.visibilityFilter` | Present on most occurrences: why the engine considered this element eligible (or not) under whichever eligibility model the rule used. `eligible` is that result (absent on the page-level findings of `bypass-blocks-present`, `html-lang-attr-present` and `page-title-present`); `targetSet` says which model produced it (`'dom'`: raw DOM/CSS visibility — most rules; `'acc'`: accessibility-tree eligibility). `accEligible` mirrors `eligible` only when `targetSet` is `'acc'`, otherwise `null` — don't read it as a second, independent signal. `reasons` is a list of machine-readable exclusion codes when `eligible: false`. |
| `data.details` | Rule-specific structured data (computed metrics, resolved references) — **non-normative**: useful for building richer UI or debugging, but never changes what `outcome`/`severity` mean. Shape varies per rule; treat as best-effort extra context, not a stable contract. The one exception is `data.details.reasonCode`, which **is** stable: it identifies *which* of a rule's findings this is, and together with `ruleId` and `html` forms the fingerprint baselines and SARIF are keyed on. A rule may gain a new reason code in a minor release; a shipped one does not change. See [`API_STABILITY.md`](./API_STABILITY.md#finding-identity). |
| `occurrenceOutcome` | Which tier this occurrence belongs to, on a rule that graded its findings into a confident `fail` tier and a needs-review `cantTell` tier. A rule reporting one tier only omits it, in which case the result's own `outcome` is the occurrence's tier. This is why a `fail` result can carry `cantTell`-tier occurrences: the aggregate outcome stays singular so CI can still gate on it, without discarding the findings that only warranted review. |
| `uncertainty` | Why this finding could not be decided — see [Uncertainty codes](#uncertainty-codes) below. |

### Uncertainty codes

A `cantTell` says the engine did not decide. `uncertainty` says **why**, from a closed vocabulary, so a consumer can branch on the reason rather than parse a summary string. It is present only on a `cantTell`-tier occurrence: a `fail`-tier one would be claiming the rule both decided and did not, so the engine drops it. An uncertainty whose `code` is not one of the codes below is left out too, and the rule's `error` names the code.

| `code` | Meaning | Typical shape |
|---|---|---|
| `not-computable` | The evidence the rule needed could not be read in this environment. | A cross-origin stylesheet, a background colour that resolves to no value, an `src` that will not resolve. |
| `runtime-dependent` | The markup cannot settle it because script decides at runtime. | An `aria-controls` naming an element the widget builds when it opens. |
| `spec-only` | A real specification violation, but the exposed name, role and value survive it, so no Success Criterion is established as failed. | An ARIA attribute whose absence the specification supplies a default for. |
| `equivalence-unknown` | Two things may or may not serve the same purpose, and neither the markup nor the content settles it. | Two frames sharing an accessible name but embedding different resources. |
| `judgement-required` | The question is inherently a human call. | Whether an undersized target is essential; every `type: "manual"` rule. |
| `out-of-scope` | The finding is real but falls outside the standard this run targets. | A rule mapped only to a criterion the target WCAG version removed. |

`needed` states, in one sentence, what would settle the question — the thing a reviewer has to go and check. `evidence` carries what the rule *did* establish, so the reviewer starts from the engine's work rather than repeating it; its shape is rule-specific and, like `data.details`, not a stable contract. The `code` is: new codes may be added in a minor release, but an existing one does not change meaning, so branch on the codes you know and treat an unrecognised one as "needs review" rather than an error.

Every automatic rule that can report `cantTell` carries this, and a test holds that line so a new one cannot arrive without it. The `out-of-scope` code is attached by the engine rather than by a rule, on the same occurrences that produce a result-level `wcagVersionScope`. Manual rules do not carry it: `judgement-required` is what `type: "manual"` already means, so repeating it per occurrence would say nothing the result does not.

## A composite result (`rulesResults[i]`)

Composites roll multiple atomic rules up to one WCAG Success Criterion (e.g. `wcag-1.1.1-non-text-content` rolls up 22 atomic rules). Under the profile of a standard with rollups of its own, there are also those, with the standard's wording as `title` and its name as `meta.standard`; they may be the only rollup some of its findings have, such as `heading-order`'s. Shape is the same envelope as a check result, with composite-specific `data.details`:

```ts
{
  ruleId: string,              // e.g. "wcag-1.1.1-non-text-content"
  outcome: "pass" | "fail" | "cantTell" | "notApplicable",
  severity, confidence, type, title, description, meta, engineOptions, schemaVersion,  // as on a check result, except that
                                // meta.normativeMappings names the criterion in a shorter form:
                                // { standard, requirement, level }
  occurrences: [],              // always empty — composites are rollups, not element-level findings
  data: {
    details: {
      reasonCode: string,       // e.g. "composite.rollup.fail.anyFail"
      standard?: string,        // a standard's own rollup only, with version and criterion
      version?: string,
      criterion?: string,
      checksIds: string[],      // every atomic ruleId this composite rolls up
      contributors: Array<{ testId: string, outcome: string, severity: string | null }>,
      metrics: { failCount, cantTellCount, notApplicableCount, passCount, missingCount }
    }
  }
}
```

Rollup precedence (deterministic, in this order): **any contributor `fail` → composite `fail`**; else **any `cantTell` (or a contributor rule that didn't run at all, `missingCount > 0`) → composite `cantTell`**; else **all contributors `notApplicable` → composite `notApplicable`**; else **`pass`**. See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for what this means for an overall conformance claim.

## Outcome values

| Outcome | Meaning | Can appear on `type: "manual"`? |
|---|---|---|
| `fail` | Deterministic, normative violation — the decision procedure guesses at nothing. | No (coerced to `cantTell`) |
| `pass` | The rule's applicable target(s) exist and none were flagged. | Yes |
| `cantTell` | Requires human judgment — either genuinely ambiguous, or a `manual` rule's advisory finding. | Yes |
| `notApplicable` | The rule found no elements it applies to on this page/scope. | Yes |

`fail` is intentionally the narrowest, highest-bar outcome in this engine: reserved for deterministic, normative violations; chasing rule coverage must never dilute this.

## Severity and confidence values

- `severity`: `minor` < `moderate` < `serious` < `critical` — the rule author's assessment of user impact, independent of `confidence`.
- `confidence`: `low` < `medium` < `high` — how certain the engine is that a `fail`/`cantTell` verdict is correct. Both are informational metadata for prioritization; neither changes `outcome`'s meaning.

A `fail` is not always `confidence: "high"`, and that is not a contradiction. The outcome describes the decision procedure — it resolved the question without guessing — while `confidence` describes the model that decision was made against. A handful of automatic rules decide deterministically against something that is itself an approximation (the curated WAI-ARIA role tables, the native-role mappings, an accessibility tree inferred from static markup) and report `medium`: `aria-required-children`, `aria-prohibited-children`, `aria-required-parent`, `aria-allowed-attr`, `form-control-programmatic-label-present`, `svg-image-text-alternative-present`, `video-poster-text-alternative-present` and `target-size-minimum`. `confidence` is on every result, so a consumer that wants only the most certain failures can gate on it directly; `policy.allowedConfidence` will not do it for you, since a disallowed value is replaced with the rule's own `defaultConfidence` rather than changing the outcome (see [`POLICY.md`](./POLICY.md)).

## Worked example

Scanning `<img src="logo.png">` (no `alt`) and `<button></button>` (no accessible name), scoped to just those two rules via `runOnly: { includeRuleIds: [...] }` (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) — this is **not** a bare array):

```js
const result = runDomRulesInPage(
  'https://example.test/',
  null,
  {},
  { includeRuleIds: ['img-alt-present', 'button-name-present'] }
);
```

```json
{
  "engine": {
    "tag": "a11ycore",
    "schemaVersion": "1.0.0",
    "locale": { "requested": "en", "resolved": "en", "reason": "ok" }
  },
  "url": "https://example.test/",
  "title": "Example",
  "timestamp": null,
  "perfStats": null,
  "contextSelector": null,
  "contextMatch": null,
  "checksResults": [
    {
      "ruleId": "button-name-present",
      "outcome": "fail",
      "severity": "serious",
      "confidence": "high",
      "type": "automatic",
      "occurrences": [
        {
          "selector": "html > body > button",
          "html": "<button></button>",
          "structuralPath": [1, 1],
          "summary": "This button has no accessible name.",
          "hint": "Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.",
          "data": {
            "visibilityFilter": { "eligible": true, "reasons": [], "targetSet": "acc", "accEligible": true },
            "details": { "reasonCode": "name_missing" }
          }
        }
      ]
    },
    {
      "ruleId": "img-alt-present",
      "outcome": "fail",
      "severity": "serious",
      "confidence": "high",
      "type": "automatic",
      "occurrences": [
        {
          "selector": "html > body > img",
          "html": "<img src=\"logo.png\">",
          "structuralPath": [1, 0],
          "summary": "Missing alt attribute on <img>.",
          "hint": "Add an alt attribute (use alt=\"\" only for decorative images)."
        }
      ]
    }
  ],
  "rulesResults": [],
  "overriddenBuiltinIds": [],
  "skippedCustomRules": []
}
```

(Trimmed for readability — the real result also includes `title`/`description`/`i18n`/`meta`/`engineOptions`/`schemaVersion` on every entry, per the full shape above. `rulesResults` is empty here because `runOnly.includeRuleIds` scoped the scan to two atomic rules and no composite's own ID was included.)
