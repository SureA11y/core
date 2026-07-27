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
  engine: { tag: string, schemaVersion: string },
  url: string | null,
  title: string | null,
  timestamp: string | null,
  perfStats: object | null,
  contextSelector: string | string[] | null,
  checksResults: CheckResult[],
  rulesResults: CompositeResult[],
  overriddenBuiltinIds: string[]
}
```

| Field | Meaning |
|---|---|
| `engine.tag` | The engine's own identity tag, currently `"a11ycore"`. Every rule (built-in or custom) carries it in `meta.tags` — rule `ruleId`s themselves are bare (no prefix). |
| `engine.schemaVersion` | The result-schema version (`"1.0.0"`). Bump-worthy if this document's shape ever changes incompatibly — pin to it if you're parsing output programmatically. |
| `url` | The `pageUrl` argument you passed in, or `document.location.href` if you passed `null`/omitted it, or `null` if neither is available. |
| `title` | `document.title` at scan time, or `null`. |
| `timestamp` | **Not auto-generated.** Only set if you pass `engineOptions.timestamp` as a non-empty string — the engine has no built-in clock (deterministic-by-design). If you want a scan timestamp in the result, supply it yourself. |
| `perfStats` | `null` unless `engineOptions.perfStats: true`. Internal timing/counters — shape not covered by this document, treat as debug-only. |
| `contextSelector` | The (trimmed) `contextSelector` argument you passed — a string, an array of strings (multi-region scanning, see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)), or `null` if none/empty. |
| `checksResults` | One entry per **atomic rule** that ran (every rule not filtered out by `runOnly` — see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). **Every loaded rule produces an entry, even ones that outcome `notApplicable`** — this is not a "violations only" list. |
| `rulesResults` | One entry per **composite (WCAG-SC rollup) rule** that ran — see [Composite result](#a-composite-result-rulesresultsi) and [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md). Empty array if no composite matched the current `runOnly`/tag filter. |
| `overriddenBuiltinIds` | Rule ids where an `engineOptions.customRules` entry shared its `id` with a built-in rule, so the custom implementation replaced the built-in one for this scan (see [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)). Always an array; empty when no collision occurred. Also logged via `console.warn` at scan time, since a same-named custom rule is as likely to be an accidental collision as a deliberate override. |

## Cross-frame result (`runa11yCoreAcrossFrames`)

`runa11yCoreAcrossFrames` (see [`INTEGRATION.md`](./INTEGRATION.md#cross-frame-scanning-including-cross-origin)) returns a different, recursive shape instead of a plain top-level result:

```ts
{
  topFrame: <the normal top-level result shape above>,
  frames: Array<
    | { url: string | null, topFrame: <top-level result>, frames: [...same shape, recursively] }
    | { url: string | null, error: string }
  >
}
```

- `topFrame` is exactly the [top-level result](#top-level-result) shape, for the frame the function was called in.
- `frames` has one entry per direct child `<iframe>`/`<frame>` in the scanned scope. A reachable child (one that called `a11yCoreEnableFrameResponder()`) contributes its own complete `{ url, topFrame, frames }` — including *its own* nested `frames`, recursively, since a further-nested grandchild is only reachable through its immediate parent. An unreachable child (the common case for most third-party embeds — no cooperating responder, or it timed out) contributes `{ url, error }` instead, and does not abort the rest of the scan.
- This is a **tree, not a flat list** — a deliberate difference from the `surea11y-playwright` binding's `.frames(true)`, which *can* flatten because Playwright's `page.frames()` already gives every frame regardless of nesting depth; a `postMessage` relay has no such global view, so nesting is expressed structurally instead.

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
    normativeMappings: Array<{ standard: string, version: string, requirement: string, title: string, conformanceLevel: string }>,
    standard: string | null,
    applicability: string,
    expectation: string,
    references: string[],
    requirements: object | null,
    mappings: object | null
  },
  engineOptions: object,   // the resolved engineOptions this rule actually ran under
  schemaVersion: string,
  error?: string           // present only if the rule threw — see below
}
```

Notes:

- **`outcome` vs `outcomeNormalized`**: identical except `notApplicable` becomes `"inapplicable"` in `outcomeNormalized`. Both are provided so you can match either your own vocabulary or the engine's internal one.
- **`type: "manual"` rules can never report `outcome: "fail"`.** If a manual rule's own logic would have said `fail`, the engine coerces it to `cantTell` and appends an explanatory note to `error` — this is enforced centrally (`policy.coerceManualFailToCantTell`, on by default under the `a11y` policy contract; see [`POLICY.md`](./POLICY.md)), not something each rule has to remember. `fail` is reserved for deterministic, high-confidence, `type: "automatic"` findings only.
- **`meta.normativeMappings`** is how a check result ties back to a WCAG Success Criterion — `[]` for rules with no formal WCAG mapping (other engines call these "Best Practices"; this engine calls them advisory `type: "manual"` rules). See [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md) for how these roll up.
- **`error`**: only present if the rule implementation threw an uncaught exception, or if the manual-fail coercion above fired. A thrown rule always surfaces as `outcome: "cantTell"` with `occurrences: []` and `error` set to the exception message — the engine never lets one broken rule crash the whole scan.
- **`engineOptions`** on each result is the *resolved* options object (after locale/contrast defaults were applied), not literally what you passed in — useful for confirming what a given rule actually saw, especially the resolved `locale` and `contrast.mode`/`contrast.rootCanvasFallback`.

## An occurrence (`occurrences[i]`)

Only present when `outcome` is `fail` or `cantTell` (a `pass`/`notApplicable` result has `occurrences: []` — this engine does not enumerate the elements it passed, only the ones it flagged; see the note in `docs/RULE_AUTHORING.md` on why "silence" from a `pass` rule is not the same as an enumerated list of passing elements).

```ts
{
  selector: string,
  html: string,
  structuralPath: number[] | null,
  summary: string,
  hint: string,
  i18n: { summaryKey: string, hintKey: string, params: object } | null,
  data: {
    visibilityFilter?: { targetSet: string, accEligible: boolean | null, reasons: string[] },
    details?: object   // rule-specific, non-normative — see below
  }
}
```

| Field | Meaning |
|---|---|
| `selector` | A best-effort CSS selector built to resolve back to the flagged element (see `helpers.buildSelector` in `RULE_AUTHORING.md`). Not guaranteed unique in adversarial DOM shapes, but the engine actively verifies it resolves to the reported element before using it. |
| `html` | An outer-HTML snippet of the flagged element — use this as your primary "which element" signal when `includeShadowDom: true` (selectors don't pierce shadow boundaries). |
| `structuralPath` | The flagged element's sibling-index path from `documentElement` down to it (e.g. `[1, 0, 2]`) — `[]` if the element *is* `documentElement`, `null` if it couldn't be determined. A more robust element-identity mechanism than `selector` alone: it survives DOM changes a selector string wouldn't (an id/class rename, for instance), at the cost of not being usable as an actual CSS selector. Computed from the element reference when the rule kept one, otherwise by re-resolving `selector` against the document (same caveat as `selector` itself: a non-unique selector could resolve to a different element than intended). |
| `summary` | Human-readable, already localized ("This button has no accessible name."). |
| `hint` | Human-readable remediation guidance, already localized. |
| `i18n` | The raw translation keys behind `summary`/`hint`, if you want to re-render them in a different locale yourself without re-running the scan. `null` if the occurrence didn't use key-based i18n. |
| `data.visibilityFilter` | Present on most occurrences: why the engine considered this element eligible for accessibility-tree evaluation (or not). `reasons` is a list of machine-readable exclusion codes when `accEligible: false`. |
| `data.details` | Rule-specific structured data (e.g. `reasonCode`, computed metrics, resolved references) — **non-normative**: useful for building richer UI or debugging, but never changes what `outcome`/`severity` mean. Shape varies per rule; treat as best-effort extra context, not a stable contract. |

## A composite result (`rulesResults[i]`)

Composites roll multiple atomic rules up to one WCAG Success Criterion (e.g. `wcag-1.1.1-non-text-content` rolls up 22 atomic rules). Shape is the same envelope as a check result, with composite-specific `data.details`:

```ts
{
  ruleId: string,              // e.g. "wcag-1.1.1-non-text-content"
  outcome: "pass" | "fail" | "cantTell" | "notApplicable",
  severity, confidence, type, title, description, meta, engineOptions, schemaVersion,  // same as a check result
  occurrences: [],              // always empty — composites are rollups, not element-level findings
  data: {
    details: {
      reasonCode: string,       // e.g. "composite.rollup.fail.anyFail"
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
| `fail` | Deterministic, high-confidence, normative violation — no heuristics, no guessing. | No (coerced to `cantTell`) |
| `pass` | The rule's applicable target(s) exist and none were flagged. | Yes |
| `cantTell` | Requires human judgment — either genuinely ambiguous, or a `manual` rule's advisory finding. | Yes |
| `notApplicable` | The rule found no elements it applies to on this page/scope. | Yes |

`fail` is intentionally the narrowest, highest-bar outcome in this engine: reserved for deterministic, normative violations; chasing rule coverage must never dilute this.

## Severity and confidence values

- `severity`: `minor` < `moderate` < `serious` < `critical` — the rule author's assessment of user impact, independent of `confidence`.
- `confidence`: `low` < `medium` < `high` — how certain the engine is that a `fail`/`cantTell` verdict is correct. Both are informational metadata for prioritization; neither changes `outcome`'s meaning.

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
  "engine": { "tag": "a11ycore", "schemaVersion": "1.0.0" },
  "url": "https://example.test/",
  "title": "Example",
  "timestamp": null,
  "perfStats": null,
  "contextSelector": null,
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
          "structuralPath": [1, 0],
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
          "structuralPath": [1, 1],
          "summary": "Missing alt attribute on <img>.",
          "hint": "Add an alt attribute (use alt=\"\" only for decorative images)."
        }
      ]
    }
  ],
  "rulesResults": [],
  "overriddenBuiltinIds": []
}
```

(Trimmed for readability — the real result also includes `title`/`description`/`i18n`/`meta`/`engineOptions`/`schemaVersion` on every entry, per the full shape above. `rulesResults` is empty here because `runOnly.includeRuleIds` scoped the scan to two atomic rules and no composite's own ID was included.)
