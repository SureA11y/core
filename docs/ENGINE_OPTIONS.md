# Engine options reference

Every runner (`runDomRulesInPage`, `runa11yCoreInPage`) takes the same four arguments: `(pageUrl, contextSelector, engineOptions, runOnly)`. This page documents `engineOptions` and `runOnly` in full — the real, current surface, verified against `src/core/dom-runner.js` and `scripts/build-core.js`, not the historical `docs/README.md`.

## Selecting which rules run

There are **two independent ways** to select rules — the 4th argument (`runOnly`), or `engineOptions.rules`/`.tags`/`.tests`/`.includeMode`. If `runOnly` contains any filter, it wins outright; otherwise the engine falls back to `engineOptions`. Don't mix them expecting both to apply — pick one.

### Via `runOnly` (4th argument)

```js
runDomRulesInPage(url, null, {}, {
  includeRuleIds: ['img-alt-present', 'button-name-present'],
  excludeRuleIds: ['region'],
  tags: ['wcag412'],
  excludeTags: ['best-practice'],
  includeMode: 'and'   // 'and' (default) | 'or' — see below
});
```

> ⚠️ **`runOnly` must be this object shape, not a bare array.** `runOnly: ['img-alt-present']` (a plain array) is **silently ignored**; the engine runs every rule instead. This is the single most common integration mistake — see [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md).

| Field | Type | Meaning |
|---|---|---|
| `includeRuleIds` | `string[]` | Only run these rule IDs (plus, for a composite ID, its child atomic rules). |
| `excludeRuleIds` | `string[]` | Never run these, applied *after* include. |
| `includeTestIds` / `excludeTestIds` | `string[]` | Same matching as above — kept as a separate field because rules are internally called "tests" (the atomic executable unit); functionally identical to `includeRuleIds`/`excludeRuleIds` today. |
| `tags` | `string[]` | Only run rules carrying at least one of these tags (e.g. `wcag412`, `wcag2aa`, `best-practice`). |
| `excludeTags` | `string[]` | Never run rules carrying any of these tags, applied after include. |
| `includeMode` | `'and'` \| `'or'` | When **both** an ID include and a tag include are given: `'and'` (default) requires a rule to satisfy both; `'or'` runs a rule if it satisfies either. Irrelevant if you only use one dimension. |

Rule IDs are bare (no engine prefix), e.g. `'img-alt-present'`. For backward compatibility, matching also accepts a legacy `a11ycore-`-prefixed form of the same id (`'a11ycore-img-alt-present'`).

A **legacy tag-filter shape** is also accepted as the whole `runOnly` value: `{ type: 'tag', values: ['wcag2a', 'wcag2aa'] }` — equivalent to `{ tags: ['wcag2a', 'wcag2aa'] }`.

### Filtering by WCAG version (2.1 vs 2.2)

Every rule and composite carries exactly one WCAG-version-origin level tag: `wcag2a`/`wcag2aa`/`wcag2aaa` for a Success Criterion that's WCAG 2.0 baseline, `wcag21a`/`wcag21aa`/`wcag21aaa` for one newly introduced in WCAG 2.1 (e.g. `1.3.5` Identify Input Purpose), `wcag22a`/`wcag22aa`/`wcag22aaa` for one newly introduced in WCAG 2.2 (e.g. `2.5.8` Target Size Minimum). A rule gets **only** the tag for its SC's actual origin version — a 2.1-introduced SC is never also tagged `wcag2aa`, since it doesn't exist under a WCAG 2.0 conformance target. See `src/coverage/wcag-version-map.js` for the exact, canonical per-version SC list.

Since versions are cumulative (2.1 = 2.0 + new; 2.2 = 2.0 + 2.1 + new), select a WCAG-version conformance target by combining tag sets — the engine's OR-matching on `tags` (any one match includes the rule) does the rest:

```js
// WCAG 2.0 AA only (excludes every 2.1/2.2-introduced SC, even at level AA):
{ tags: ['wcag2a', 'wcag2aa'] }

// WCAG 2.1 AA conformance (2.0 baseline + everything 2.1 added, both at A and AA):
{ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }

// WCAG 2.2 AA conformance (2.0 baseline + 2.1 additions + 2.2 additions):
{ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'] }

// Just the SCs 2.2 introduced, nothing else:
{ tags: ['wcag22a', 'wcag22aa', 'wcag22aaa'] }
```

### Via `engineOptions` (no `runOnly`)

Same filtering, expressed as comma-separated strings (or arrays) nested in `engineOptions`:

```js
runDomRulesInPage(url, null, {
  rules: { include: 'img-alt-present, button-name-present', exclude: 'region' },
  tags: { include: 'wcag412', exclude: 'best-practice' },
  includeMode: 'and'
}, null);
```

`rules.include`/`.exclude`, `tags.include`/`.exclude`, `tests.include`/`.exclude` (alias of `rules`), and top-level `includeMode` mirror the `runOnly` fields above exactly. Comma-separated strings are trimmed, de-duplicated, and empty tokens dropped automatically.

## `engineOptions` — the rest

```js
const engineOptions = {
  locale: 'en',                    // default 'en'; falls back to 'en' per-string if a key is missing in the requested locale
  includeHiddenElements: false,    // default false — set true to evaluate hidden/collapsed subtrees too
  includeShadowDom: true,          // default true — opt OUT with `false` to skip open shadow roots
  fragment: false,                 // default false — set true when the scan target isn't a real page (see below)
  excludeSelectors: ['#cookie-banner', '.third-party-widget'],  // array or comma-separated string
  timestamp: '2026-07-20T12:00:00Z',  // optional — engine has no built-in clock, see OUTPUT_SCHEMA.md
  perfStats: false,                // default false — internal timing counters, debug-only shape
  profileRules: false,             // default false — per-rule timing breakdown inside perfStats

  contrast: {
    mode: 'strictConformance',     // 'strictConformance' (default) | 'auditorAssist'
    rootCanvasFallback: '#ffffff'  // background assumed when the true root background isn't computable
  },
  visibilityMode: 'styleOnly',     // 'styleOnly' (default) | 'styleAndGeometry' — see below; scoped to the contrast rules only

  policyContract: 'a11y',          // 'a11y' (default) | 'generic' | inline contract object — see POLICY.md
  policy: {                        // optional overrides on top of policyContract
    coerceManualFailToCantTell: true
  },

  output: {
    includeSelector: true,         // set false to suppress auto-filled selectors (narrow effect — see note)
    includeHtml: true
  },

  rules: {
    'some-rule-id': {
      excludeSelectors: ['.some-noisy-widget']  // narrows candidates for THIS rule only — see note
    }
  },

  probes: { /* optional host-supplied evidence, see note */ },

  customRules: [ /* runtime-registered rules, see "Custom rules" below */ ],

  // Only read by runa11yCoreAcrossFrames -- see INTEGRATION.md's "Cross-frame
  // scanning" section. Ignored by runDomRulesInPage/runa11yCoreInPage.
  pingWaitTime: 500,               // ms to wait for a child frame to answer a ping before treating it as unreachable
  frameWaitTime: 60000             // ms to wait for a child frame's full scan result before timing out
};
```

| Option | Meaning |
|---|---|
| `locale` | Any string; resolution is per-string with graceful fallback (requested locale → `en` → the rule's literal English fallback text), so a partially-translated locale never produces missing text. Because that fallback is silent in the strings themselves, the result reports what actually happened in `engine.locale` — check it if you need to know whether you got the language you asked for. See [`I18N.md`](./I18N.md) for current locale coverage. |
| `includeHiddenElements` | Default `false`: helper queries exclude elements hidden by structural/CSS mechanisms such as `display:none`, `[hidden]`, closed `<details>`, and hidden rendering-only host elements (with descendants excluded too). Set `true` to include those hidden/collapsed subtrees in evaluation (legacy/static-markup behavior). |
| `includeShadowDom` | Default `true`: rules using `helpers.queryAllSmart` traverse into open shadow roots. Set `false` to scan only the light DOM. Closed shadow roots are never reachable either way (no DOM API exposes them). |
| `fragment` | Default `false`. A handful of rules check for the presence of a property that exists once per real page — `page-title-present`, `html-lang-attr-present`, `html-xml-lang-mismatch`, `aria-hidden-body`, `css-orientation-lock`, `meta-refresh-no-exceptions`, `meta-refresh-timing-absent`, `meta-viewport-zoom-enabled`, `meta-viewport-large`, `page-title-patterns`, `region`, `bypass-blocks-present`, `landmark-one-main`, `page-has-heading-one` — and correctly report `notApplicable` for these once `contextSelector` has scoped a run narrower than the whole document (`document.documentElement` no longer among the resolved roots), since a scoped subtree was never expected to carry its own `<title>`/`<html lang>`/etc. Set `fragment: true` for the case that scoping alone can't detect: a scan target that's the *whole* given document but was never meant to represent a real page at all (e.g. a raw component snippet parsed on its own) — this forces the same `notApplicable` gating even when unscoped. See `RULE_AUTHORING.md` §11.2 ("Whole-document checks") for the underlying rule-authoring convention, and `helpers.isWholeDocumentScope()` (`src/core/dom-helpers.js`) for the mechanism these 14 rules gate on via their `applicability(ctx)` export. |
| `excludeSelectors` | Elements matching any of these selectors (and their descendants) are skipped entirely, for **every** rule — useful for cookie banners, third-party embeds, or known-noisy widgets you don't control. To exclude something from just one specific rule instead, use `rules[ruleId].excludeSelectors` below. |
| `timestamp` | Passed straight through to the result's top-level `timestamp` field; the engine does not generate one itself (deterministic-by-design). |
| `contrast.mode` | `strictConformance` (default): contrast rules stay silent (`notApplicable`/skip) whenever the true rendered background isn't confidently computable, to protect against false `fail`s. `auditorAssist`: trades some of that safety margin for more findings, intended for a human auditor who will double-check flagged cases, not for unattended CI gating. |
| `contrast.rootCanvasFallback` | The assumed page background color when it's not computable at all — only matters in `auditorAssist` mode. |
| `visibilityMode` | Controls how strict the three contrast rules (`contrast-minimum`, `contrast-enhanced`, `contrast-computable`) are about deciding a text node is actually eligible to check. **Not read by any other rule.** `'styleOnly'` (default): eligibility is CSS-only — `display`, `visibility`, `opacity`, ancestor-hiding, etc. `'styleAndGeometry'`: adds real layout checks (`getClientRects()`/`getBoundingClientRect()`) on top of that — text with no client rects, or zero width/height, is excluded too. Reach for `'styleAndGeometry'` when running under a real browser/Playwright-Puppeteer (`runa11yCoreInPage`) and you want contrast findings to reflect actual rendered layout rather than just computed style; under plain jsdom (`runDomRulesInPage`) there's no real layout engine, so `'styleAndGeometry'` mostly just adds `getBoundingClientRect()` zero-size checks, not true clipping/overflow detection — see [`LIMITATIONS.md`](./LIMITATIONS.md). |
| `policyContract` / `policy` | See [`POLICY.md`](./POLICY.md) — controls which outcomes/confidence values are allowed and whether manual rules' would-be `fail`s get coerced to `cantTell`. |
| `output.includeSelector` / `.includeHtml` | Only affects the small number of rules (currently 4 of 125) that rely on the engine's automatic selector/HTML fill-in rather than building their own — most rules set `selector`/`html` themselves inside `runInPage` and are unaffected by this option. Not a reliable way to strip selectors/HTML from all output. |
| `rules[ruleId]` | Passed through to that rule as `ctx.config`, and — for `excludeSelectors` specifically — read by the engine itself before the rule ever runs. See "Rule-scoped `excludeSelectors`" below. Any other key is passthrough only: **no shipped rule currently reads `ctx.config`** for anything besides `excludeSelectors`. |
| `probes` | An optional, JSON-safe evidence object your host application can supply (depth- and size-capped by the engine before rules see it, via `ctx.inputs.probes`) — for future rules that might accept externally-supplied signals (e.g. real layout measurements a static DOM scan can't compute itself). Not consumed by any current rule. |
| `perfStats` / `profileRules` | Debug-only. `perfStats: true` returns internal counters on the result's `perfStats` field; `profileRules: true` additionally adds a per-rule timing breakdown. Shape is not part of the stable output contract — don't build on it. |
| `pingWaitTime` / `frameWaitTime` | Only read by `runa11yCoreAcrossFrames` (see [`INTEGRATION.md`](./INTEGRATION.md#cross-frame-scanning-including-cross-origin)) — how long to wait for a child frame to answer a ping (default `500`ms) and a full run request (default `60000`ms) before treating it as unreachable. Ignored by `runDomRulesInPage`/`runa11yCoreInPage`. |

### Rule-scoped `excludeSelectors`

The top-level `excludeSelectors` applies to *every* rule — there's no way to exclude an element from just one rule while still running every other rule against it. `rules[ruleId].excludeSelectors` fills that gap: it narrows candidates for **that one rule only**, on top of (never instead of) the global list.

```js
const engineOptions = {
  excludeSelectors: ['#cookie-banner'],   // applies to every rule, as always
  rules: {
    'aria-required-children': {
      excludeSelectors: ['mat-select', 'mat-stepper', 'mat-horizontal-stepper', 'mat-vertical-stepper']
    },
    'aria-allowed-attr': {
      excludeSelectors: ['mat-progress-spinner']
    }
  }
};
```

Why you'd want this: Angular Material's `<mat-select>` builds its internal ARIA structure in a way that trips a false positive on `aria-required-children` specifically, even though the component is otherwise fine. With only the global `excludeSelectors`, the only way to silence that false positive is `excludeSelectors: ['mat-select']` — which also hides `mat-select` from *every other rule*, including `color-contrast` and `aria-allowed-attr`, silently dropping real coverage those checks never had a problem with. The example above keeps `mat-select` fully visible to every rule except the one that misfires on it.

Effective exclusions for a given rule are the **union** of the global list and that rule's own list — an element matching either is dropped from that rule's candidates. A rule whose only would-be-failing elements are all excluded this way reports `outcome: 'pass'` or `'notApplicable'` (matching that rule's own no-candidates convention), with `occurrences: []` — never `outcome: 'fail'` with an empty `occurrences` array, since that exact shape is reserved elsewhere in the schema to mean "this rule threw" (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)).

Accepts the same forms as the global option: an array (`['mat-select', 'mat-stepper']`) or a comma-separated string (`'mat-select, mat-stepper'`).

> If you're using a binding package (`@surea11y/binding-base` and its Playwright/Puppeteer wrappers), check that binding's own README for whether its `.exclude()` builder method has a rule-scoped form yet — this is an `engineOptions` shape documented here at the engine level; not every binding has picked it up.

## Recipes — composing options for real scenarios

The reference above documents each option in isolation. These combine several at once, for scenarios you're likely to actually hit.

**CI gate: WCAG 2.2 AA only, ignore a third-party widget you don't control**

```js
runDomRulesInPage(url, null, {
  excludeSelectors: ['#cookie-banner', '.intercom-launcher'],
  tags: { include: 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22a,wcag22aa' }
}, null);
```

**Human auditor doing a deep contrast pass in a real browser** — trade some false-positive protection for more findings, and check real layout (not just computed style) since a real page is being driven. Shown with Puppeteer's `page.evaluate` (accepts multiple args); if you're on Playwright, wrap the four positional args into a single object first — see [`INTEGRATION.md`](./INTEGRATION.md):

```js
const result = await page.evaluate(runa11yCoreInPage, url, null, {
  contrast: { mode: 'auditorAssist' },
  visibilityMode: 'styleAndGeometry'
}, null);
```

**Scoped re-scan of one region after a UI change, skipping shadow DOM** — useful in a component-level test where you only care about the widget you just changed:

```js
runDomRulesInPage(url, '#checkout-form', {
  includeShadowDom: false
}, { includeRuleIds: ['form-control-programmatic-label-present', 'button-name-present'] });
```

**Reproducible output for snapshot testing** — pin a `timestamp` so two runs of the same HTML produce byte-identical JSON, and request the debug timing breakdown:

```js
runDomRulesInPage(url, null, {
  timestamp: '2026-01-01T00:00:00Z',
  perfStats: true,
  profileRules: true
}, null);
```

**A custom, org-specific rule alongside the built-ins**, only for this one call:

```js
runDomRulesInPage(url, null, {
  customRules: [{
    id: 'org-no-inline-onclick',
    meta: { title: 'No inline onclick handlers', defaultSeverity: 'moderate' },
    runInPage(ctx) {
      const els = ctx.helpers.queryAll('[onclick]');
      const occurrences = els.map((el) => ({
        selector: ctx.helpers.buildSelector(el),
        html: el.outerHTML,
        summary: 'Inline onclick handler found.',
        hint: 'Move event handling into an external script.'
      }));
      return { ruleId: ctx.rule.ruleId, outcome: occurrences.length ? 'fail' : 'pass', severity: 'moderate', occurrences };
    }
  }]
}, null);
```

See the option-by-option table above for anything not shown here, and the `customRules` section immediately below for the full descriptor contract.

## `customRules` — runtime-registered rules

Every shipped rule is baked into `src/core.js` at build time. `engineOptions.customRules` is the runtime escape hatch: an array of rule descriptors registered for that one call only — nothing is added to the static catalog (`getRulesCatalog()`/`getChecksCatalog()`), and nothing persists between calls. This is deliberate, not a limitation to work around: surea11y already takes fresh `engineOptions` per call with no mutable global config (unlike some other engines, which need a `configure()`/`reset()` step against a shared runtime), and custom rules follow that same per-call model.

Calling the library directly is one way in; the CLI also exposes this via `--custom-rules <path>` (a local file, loaded once per scan) — see [the CLI docs](https://github.com/SureA11y/cli/blob/main/docs/CLI.md#custom-rules).

A descriptor has the *same shape as an internal rule module's own export* — if you already know how to write a rule file for this engine, you already know this API:

```js
{
  id: 'my-org-custom-rule',          // required
  meta: { title, description, tags, defaultSeverity, defaultConfidence, /* same fields as a rule module's meta */ },
  runInPage(ctx) { /* same ctx shape and same return contract as any built-in rule */ },
  applicability(ctx) { return true; }, // optional, same contract as a built-in rule's applicability
  data: { /* optional, JSON-serializable */ }
}
```

- `runInPage`/`applicability` may be a **real function** or a **function-source string** (i.e. `fn.toString()`). Pass a real function when `engineOptions` never leaves the current JS realm (plain Node/jsdom use). Pass a string when it does — e.g. a Playwright `page.evaluate(runa11yCoreInPage, { engineOptions })` call, where `engineOptions` crosses a JSON/structured-clone boundary that cannot carry a live `Function` reference but can carry a string. The engine reconstructs a string via `new Function`, the same mechanism `scripts/build-core.js` already uses to embed every built-in rule's source into the in-page runner.
- `meta` gets identical defaulting/validation to a build-time rule (via the same `normalizeRuleMeta` used for the other 125 rules) — omit anything you don't need; `severity` defaults to `moderate`, `confidence` to `medium`, `type` to `automatic`, etc.
- A custom rule whose `id` collides with a built-in one **overrides it for that scan**, rather than running both. Since a same-named custom rule is just as likely to be an accidental collision as a deliberate override, every collision is surfaced two ways: a `console.warn` naming the id(s), and a top-level `overriddenBuiltinIds` array on the result (empty when there's no collision) — see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md).
- An invalid descriptor (missing/non-string `id`, or a `runInPage` that isn't a function and isn't a reconstructable source string) is silently skipped — the rest of the scan, including every built-in rule, still runs normally. This isn't a validation gap to fix: a custom rule is arbitrary caller-supplied code, so "fail this one entry closed, don't abort the scan" is the safer default, mirroring how a *built-in* rule that throws is contained to a `cantTell` for that rule rather than crashing the run.
- Results appear in `checksResults` exactly like any other rule's, including automatic `selector`/`html`/`structuralPath` fill-in for `fail`/`cantTell` occurrences that only attach `{ __node }` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)).

## `contextSelector` (2nd runner argument, not an `engineOptions` field)

A CSS selector (or array of selectors) scoping the scan to one or more subtrees, resolved via `document.querySelectorAll` (all matches, not just the first), falling back to `document.documentElement`/`document.body` if nothing matches. Pass `null` to scan the whole document.

- **A single string** may itself be a comma-separated selector list (ordinary CSS union semantics) — `'#a, #b'` scans both `#a` and `#b`.
- **An array of strings** scans the union of every selector's matches — `['#a', '.card']` behaves the same as `'#a, .card'`; the array form exists for callers building the list programmatically.
- Overlapping/nested regions are deduped automatically — an element reachable from more than one matched root is only ever reported once, not once per region.
- This changed from single-match (`querySelector`) to all-matches (`querySelectorAll`) semantics for the plain-string form too (2026-07-22) — a selector matching several elements previously scanned only the first, silently dropping the rest. If you relied on that first-match-only behavior, pin to a selector that only ever matches one element (e.g. an `#id`).
