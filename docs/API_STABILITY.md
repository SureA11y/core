# API stability & versioning

`@surea11y/core` has real downstream consumers today: 5 first-party framework bindings (Playwright, Puppeteer, Selenium, WebdriverIO, Cypress) published to npm, plus a Jest/Vitest matcher (`@surea11y/test-matchers`, `toHaveNoA11yViolations()`) — all pinned to a `^1.1.0`-style semver range. Until now, "what counts as a breaking change" was implicit — discoverable only by reading source, not written down anywhere. This document makes that contract explicit.

## Stable fields (covered by semver)

Removing, renaming, or changing the type/meaning of any of these is a **major** version bump:

- Top-level result: `engine.tag`, `engine.version` (the package version that produced the result), `engine.schemaVersion`, `engine.locale` (the field and its `requested`/`resolved`/`reason` keys — the set of `reason` *values* is open and may gain entries in a minor), `engine.wcagVersion`, `engine.profile` (when present; the set of profile names may grow in a minor), `engine.optInRules` (when present; the set of tags may grow in a minor), `engine.environment` (`layout`, and in a browser `viewport`, `devicePixelRatio`, `colorScheme` and `fonts` when the page reports them; new fields may be added in a minor), `engine.outputDetail` (`'findings'` when `engineOptions.output.detail` asked for a compact result; absent otherwise), `url`, `contextMatch` (`null` without a `contextSelector`, otherwise `elementCount` and `unmatchedSelectors`), `checksResults` (an array), `rulesResults` (an array), `standards` (when present: `key` and `standard` per standard; `titleLang` and `note` when the standard has them), `overriddenBuiltinIds` (an array, empty when no `customRules` entry shadowed a built-in id — part of the extension contract, see below), `skippedCustomRules` (an array of `{ id, reason }`, empty when every `customRules` entry ran; the set of reasons is open).
- Each `checksResults[i]` / `rulesResults[i]` entry: `ruleId`, `outcome`, `rollupIds` (check results only), `outcomeNormalized`, `severity`, `confidence`, `type`, `title`, `description`, `meta` (including `meta.normativeMappings`, `meta.deprecated`/`.deprecation` — see below), `engineOptions`, `schemaVersion`, and `margin` when present (`measure`, `unit`, `limit`, `threshold`, `value`, `headroom`, `measuredCount`, `selector`, `structuralPath`; the sets of `measure` and `unit` values may grow in a minor, and `margin.context` is not covered). In a compact result (`engine.outputDetail: 'findings'`), a `pass` or `notApplicable` check result with no occurrences keeps only `ruleId`, `outcome` and `type`, and its `margin` or `error` when it has one; the reporters read such a result as the full one.
- Each occurrence (`occurrences[i]`): `selector`, `html`, `summary`, `hint`, `i18n`, `structuralPath`.
- The rule **catalog** (`getChecksCatalog()`/`getRulesCatalog()`, a separate surface from a scan result — see `RULE_AUTHORING.md`): `ruleId`, `title`, `description`, `tags`, `wcagSc`, `normativeMappings`, `defaultSeverity`, `defaultConfidence`, `type`, `deprecated`/`.deprecation`, `margin` (`{ measure, unit, limit }`, or `null` for a rule that reports none). Note `tags` lives here, not on a per-scan `checksResults[i].meta` — the two surfaces intentionally carry different subsets of a rule's metadata.

This list isn't a new, invented guarantee: it codifies what the 6 real consumers above (and `docs/OUTPUT_SCHEMA.md`'s own worked examples) already depend on today, either directly or as documented shape.

## Package entry points (covered by semver)

Since 1.4.0 the package declares an explicit `exports` map. These are the only importable paths, and removing or repointing one is a **major** bump:

| Specifier | Resolves to | Contents |
|---|---|---|
| `@surea11y/core` | `src/index.js` | the full engine surface (`runDomRulesInPage`, `runa11yCoreInPage`, catalog accessors, …) |
| `@surea11y/core/baseline` | `src/baseline.js` | `buildBaselineEntries()`, `matchBaseline()` |
| `@surea11y/core/report` | `src/report.js` | `renderHtmlReport()` |
| `@surea11y/core/sarif` | `src/sarif.js` | `renderSarifReport()` |
| `@surea11y/core/junit` | `src/junit.js` | `renderJunitReport()` |
| `@surea11y/core/earl` | `src/earl.js` | `renderEarlReport()` |
| `@surea11y/core/en301549` | `src/en301549.js` | `EN301549_VERSIONS`, `EN301549_CLAUSES`, `en301549ClausesForSc()` |
| `@surea11y/core/wcag` | `src/wcag.js` | `WCAG_VERSIONS`, `wcagCriteria()`, `wcagCriterion()`, `wcagTags()` |
| `@surea11y/core/browser` | `surea11y.browser.js` | the standalone browser bundle: a `<script>` gets the global `a11ycore`; a bundler's `import` (default or named) or `require()` gets the same object as the module's export: `runa11yCoreInPage`, `waitForPageReady`, `getMargins`, `registerMessages`, `ENGINE_TAG`, `SCHEMA_VERSION` |
| `@surea11y/core/i18n/<locale>` | `surea11y.i18n.<locale>.js` | a locale's messages for the browser bundle: loaded in a page after it, the file registers them; a binding reads it by path (`require.resolve`) to inject it. `require()`d in Node it exports `{ locale, messages }` and needs no bundle. A locale the build does not ship does not resolve. |

Anything **not** in that table — `src/core/*`, `src/checks/*`, `src/i18n/*`, `src/policy/*`, `profiles/*` (a profile's tables and rules, which the engine reads), and the generated `src/core.js` itself — is internal. Before 1.4.0 there was no `exports` map, so those paths were technically reachable via deep `require()`; they were never documented as public and are no longer resolvable. The `<script src="node_modules/@surea11y/core/surea11y.browser.js">` form documented in the README is a filesystem path, not module resolution, and is unaffected.

### TypeScript types

`@surea11y/core` ships `src/index.d.ts` (through the `types` condition of its export), which types the scan result and the main entry's functions. The types describe the stable shape above, so they follow the same rules: a field added to the result is added to them in a minor, and a change that would break code compiled against them is a major. Fields this document calls unstable (`data.details` apart from `reasonCode`, `uncertainty.evidence`, `perfStats`) are typed loosely, and sets documented as open (uncertainty codes, `engine.locale.reason`, profile names) accept any string besides the known ones, so a new value does not break compilation. It also types writing a custom rule: `CustomRule` and its `CustomRuleMeta`, whose fields are all optional, and `RuleContext`, the `ctx` a rule receives, whose `helpers` (`RuleHelpers`) are the helpers [`RULE_HELPERS.md`](./RULE_HELPERS.md) documents, and no others; a test keeps the two lists the same. The exports listed as internal are declared, loosely, only so importing them compiles. A test compiles real scan results against the types, so they cannot drift from what the engine returns. Every other entry point has its own declaration file too (`/sarif`, `/junit`, `/report`, `/earl`, `/baseline`, `/wcag`, `/en301549` and `/browser`), found through each export's `types` condition and, for TypeScript's older `node10` resolution, through `typesVersions`; they take the main entry's result types, and a test compiles a project using each of them under `node10`, `node16` and `bundler` resolution.

Declaring this map is what lets the engine's internal file layout change without a major bump. Note that `src/checks/*` is still *shipped* (the generated bundle `require()`s it at runtime) — shipped is not the same as public.

## Extension points

The `exports` map above says which **paths** are importable. It does not say which **symbols** behind them are supported, and that distinction matters here: `src/index.js` re-exports the generated core verbatim (adding only `flattenCrossFrameResult`), so every symbol the build emits reaches consumers whether or not it was meant for them. The classification lives in [`scripts/data/public-api.json`](../scripts/data/public-api.json) and is checked by `tests/public-api.test.js`, which fails when a new export appears unclassified — a leak has to be a decision, not an accident.

**Supported** — covered by semver, safe to build on:

| Export | For |
|---|---|
| `runa11yCoreInPage` | Scanning from another JS realm: the whole engine is inlined, so `fn.toString()` re-evaluated in a browser tab works. What all five browser bindings use. |
| `runDomRulesInPage` | Scanning in the same Node process, dispatching through real `require()`. What `@surea11y/test-matchers` uses. |
| `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder` | Cross-frame scanning without an automation driver. |
| `waitForPageReady(options)` | Waiting for a page to finish loading (load event, fonts, images, and optionally a quiet DOM) before a scan, with a timeout; it never rejects. See [`INTEGRATION.md`](./INTEGRATION.md#waiting-for-the-page-before-a-scan). |
| `getChecksCatalog()` / `getRulesCatalog()` | Reading the rule catalog; its stable fields are listed above. Given `engineOptions` with `customRules`, `getChecksCatalog`, `getCheckDefById` and `getChecksForRunOnly` list those rules too, as a scan with the same options runs them, and `getRulesCatalog` and `getCompositeRuleById` list them among the rules of the WCAG rollups of the criteria they map to (`checksIds`, `customChecksIds`). |
| `getMargins(result)` | Every margin in a scan result, as `[{ ruleId, ...margin }]` sorted by `ruleId`, for tools that show how close each measuring rule came to its threshold. See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-check-result-checksresultsi). |
| `getProfileWcagTarget(profile)` | The WCAG target a conformance profile comes to, `{ version, level }` (`{ version: '2.2', level: 'AA' }` for `'wcag22-aa'`), to select by `runOnly.wcag` instead of the profile's tags; `null` for a name that is no profile, or a profile that is no WCAG version and level. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#conformance-profiles). |
| `flattenCrossFrameResult(result)` | Every frame of a cross-frame result as a list, `[{ frame: { path, title, url }, result }]` (or `error` for a frame that did not answer), as the reporters read it. See [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#cross-frame-result-runa11ycoreacrossframes). |
| `getLocaleCoverage()` | How far each shipped translation covers English (`sourceLocale`, `totalKeys`, and per locale `locale`, `total`, `translated`, `missing`, `orphaned`, `percent`), from the dictionaries the package ships. See [`I18N.md`](./I18N.md#reading-coverage-from-the-package). |

**Exported but internal** — reachable today, not supported, and free to change or disappear in a minor: `CHECK_DEFS`, `TEST_DEFS`, `COMPOSITE_RULES`, `DEFAULT_POLICY`, `POLICY_CONTRACTS`, `ENGINE_TAG`, `SCHEMA_VERSION`, `resolvePolicy`, `getCheckDefById`, `getCompositeRuleById`, `getChecksForRunOnly`, `getTestsForRunOnly`, `__internal`.

They stay exported rather than being removed, because removing them is itself a breaking change and no consumer needs it yet; the honest fix for now is to say they are not part of the contract. Note the two constants have supported equivalents on every result — `engine.tag` and `engine.schemaVersion` — so read them from there rather than importing them; `engine.version` gives the package version the same way. Curating this list down to the supported set is a candidate for the next major.

### Extending the engine

Three things are meant to be extended, and all three go through `engineOptions` or a separate entry point rather than through the exported symbols above:

- **`engineOptions.customRules`** — the plugin mechanism: an array of rule descriptors registered for one call, never added to the static catalog and never persisted between calls. **The descriptor contract is covered by semver**: `id`, `meta`, `runInPage(ctx)` and the optional `applicability(ctx)` and `data`, along with the `ctx.helpers` a rule receives and the `{outcome, severity, occurrences}` it returns. That `runInPage`/`applicability` may be passed as a function *or* as a function-source string is part of the contract too, not a convenience: `engineOptions` crossing into another realm (a Playwright `page.evaluate`, say) cannot carry a live `Function`, so a binding has no other way to register one. A custom rule that shadows a built-in id replaces it for that scan and is reported back in `overriddenBuiltinIds`, so an accidental collision is visible rather than silent. A custom rule's WCAG mappings (`meta.wcagSc`, or WCAG entries in `meta.normativeMappings`) put it in the WCAG rollups of those criteria, marked as custom there, as part of the same contract; an override counts toward a rollup only where its own mapping says. A custom rule written against today's contract keeps working across minors; requiring a new field of it is a major. The full descriptor shape is in [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#customrules--runtime-registered-rules), the helpers in [`RULE_HELPERS.md`](./RULE_HELPERS.md), and the outcome rules a custom rule must obey in [`RULE_TAXONOMY.md`](./RULE_TAXONOMY.md).
- **`engineOptions.policyContract` / `engineOptions.policy`** — which outcomes and confidence values a scan may report, and whether a manual rule's would-be `fail` is coerced. The two option names, the built-in contract ids `'a11y'` and `'generic'`, and the inline-contract shape are supported; the `POLICY_CONTRACTS` export itself is not, since passing a string or an inline object is all a caller needs. See [`POLICY.md`](./POLICY.md).
- **Reporters** — `@surea11y/core/baseline`, `/report`, `/sarif`, `/junit` and `/earl` consume a result rather than hooking into the scan, which is why they are separate entry points. A consumer wanting a different output format reads the result shape above; nothing needs to be registered with the engine.

There is deliberately no hook for changing what a built-in rule decides. Overriding one means shipping a `customRules` entry that reuses its id, which the engine allows for a single call, warns about, and reports in `overriddenBuiltinIds` — so a scan that silently disagrees with the catalog is not possible.

## Explicitly unstable (not covered by semver)

- **What profiles build on: a rule's `settings` and `src/profile-kit.js`.** A rule's settings are the thresholds a built-in rule declares it reads from `ctx.config` (`contrast-minimum`'s `boldLargeMinPx`, `largeTextRatio`, `normalTextRatio`), for its variants ([`RULE_AUTHORING.md`](./RULE_AUTHORING.md#rule-variants)); a scan's `engineOptions.rules` cannot set them. `src/profile-kit.js` is the mapping a profile made with `npm run profile:new` uses, and is not exported. Both serve the profiles in this repository, which change with them, so they stay outside this contract until a profile can live outside it ([`profiles/README.md`](../profiles/README.md)).
- `perfStats` and `ruleTimings` — internal timing/debug counters, only present when `engineOptions.perfStats`/`.profileRules` is set. Shape not covered by this document.
- `occurrences[i].data.details` — rule-specific, non-normative extra context. Shape varies per rule and may change in a patch release; treat as best-effort, not a stable contract (this was already noted in `docs/OUTPUT_SCHEMA.md` before this document existed). **`data.details.reasonCode` is the exception** and is stable — see [Finding identity](#finding-identity) below.
- `ruleInterfaceVersion` / `ruleVersion` on a rule's meta — currently unused scaffolding (every rule defaults to the same two static strings; nothing meaningfully sets or consumes them today). Not part of this contract until they're actually wired up to mean something.

## Finding identity

A consumer needs to know whether a finding it is looking at is the same one it saw last week. Two things in this package answer that, and both compute it the same way — `computeBaselineKey(ruleId, reasonCode, html)` in `src/baseline.js`, with the frame's path added for a finding inside a frame of a cross-frame result:

- **Baselines.** `--write-baseline`/`--baseline` suppress known findings so a build only breaks on new ones.
- **SARIF.** `partialFingerprints['surea11y/violation/v2']`, the key's SHA-256 digest, for SARIF consumers that read it, and `partialFingerprints.primaryLocationLineHash`, its first 16 digits with a count, which is what GitHub Code Scanning matches alerts on. (Earlier releases wrote `surea11y/violation/v1`, the key itself; the line hash is unchanged.)

So the identity is `ruleId` + `reasonCode` + the occurrence `html`, the last with each tag's attributes put in name order and its class names sorted (frameworks reorder both), and two of those three are promises:

- **A rule id, once published, does not change.** Renaming or removing one is a major change. The supported path is to keep the id, mark it `deprecated` with `deprecation.replacedBy` naming the successor, and remove it only after the notice period.
- **A reason code, once a rule has shipped it, does not change.** This is a deliberate exception to the surrounding "`data.details` is unstable" rule: everything else under `data.details` is free-form, but `reasonCode` is load-bearing for identity, so it is pinned. Adding a new code to a rule is a minor change; changing or dropping an existing one is not, because every stored baseline entry and every open Code Scanning alert keyed on it stops matching.
- **A reason code retires only with the finding it named.** The promise is that a finding the engine still makes keeps its identity, not that a finding is made forever. When a correctness fix (a patch, see [below](#what-triggers-which-version-bump)) changes what a rule reports for an element, the finding the old code named no longer exists, and its code may go with it: a baseline entry or alert for it then closes, as it would for any fixed bug, rather than silently stopping to match a finding that is still there. Renaming a code for a finding that stays, or dropping one the rule still has a case for, is never allowed. A retirement is recorded, with its reason, in `CHANGELOG.md`, and under `retired` in `scripts/data/released-finding-ids.json` until the next release.

What the last release shipped is frozen in [`scripts/data/released-finding-ids.json`](../scripts/data/released-finding-ids.json), written by `npm run finding-ids:release -- <version>` as part of each release, and `tests/released-finding-ids.test.js` fails when a rule id or reason code from it is missing and not listed under `retired` with its reason. No commit rewrites that file between releases, so an identity cannot be dropped and the inventory regenerated in the same change without the test noticing. Each release freezes a new inventory and starts the `retired` list empty again, since what it held was not in that release; the changelog keeps the reasons.

Both are inventoried in [`scripts/data/finding-ids.json`](../scripts/data/finding-ids.json) for core's rules, and in each profile's own `scripts/data/finding-ids.json` for its rules, regenerated with `npm run finding-ids` and checked by `tests/finding-ids.test.js`, which fails when a published rule id or reason code disappears. A rule's reason codes are read from its source and from a run of its fixture; one that is only reached in a browser is listed by the rule in `meta.reasonCodes` (`RULE_AUTHORING.md` §4.2). The inventory is the record of what has been promised; the test is what stops the promise being broken by accident.

Note what identity does **not** include: `selector` and `structuralPath` deliberately stay out of the fingerprint, because both change when the surrounding page is edited, which would make every finding look new after an unrelated refactor. `html` is in, so editing the flagged element itself does read as a new finding — that is the intended trade-off, since the element's markup is the thing the finding is about.

The conditions a page was rendered under stay out too: `engine.environment`, and the `viewport` a layout-dependent finding carries in `data.details`. The same element with the same defect is the same finding at any viewport width, and needs the same fix. A width-dependent finding is one that exists at some widths and not others, not a different finding at each. Folding the width in would also give every finding a new identity the first time a baseline or alert history met a result that has one. A caller that scans at several widths keeps them apart where the analyses are kept: a baseline per width, a SARIF `category` per width (see [`SARIF.md`](./SARIF.md#scanning-at-several-viewport-widths)).

### A removal that predates this guard

`area-alt-decorative`, shipped in 1.7.0, was removed afterwards without the deprecation period described [below](#rule-id-deprecation-policy). It asked a human whether an `<area>` with an empty `alt` was decorative, a question with no legitimate "yes": `area-alt-present` now fails that case outright ([`DESIGN_CHALLENGES.md`](./DESIGN_CHALLENGES.md)). The removal was accepted as an exception rather than reverted, and is recorded in the 1.8.0 changelog. Anything holding its id — a `runOnly` list, a baseline entry — matches nothing from the release after 1.7.0; the empty-`alt` area it asked about is reported by `area-alt-present` instead.

### A rename that predates this

`role-img-alt-present` became `role-img-text-alternative-present` with no deprecation entry and no major bump, before any of the above was written down. Anything holding the old id — a baseline entry, a `runOnly` list — silently matched nothing. The rename is not reversible now: the old id has been absent across every 1.x release, so a deprecation entry today would announce the retirement of something no current version answers to. It is recorded here instead, because it is the reason this section exists. Its source file, fixture and test kept the old name for a while afterwards, which is what made the rename easy to miss; they carry the rule's own id now.

## What triggers which version bump

- **Patch**: a correctness fix that changes *which* outcome a rule produces for the same input, without changing the shape or mechanism. Example: the fragment-scan applicability fix (`engineOptions.fragment`, see `ENGINE_OPTIONS.md`) changed several rules from incorrectly `fail`ing on a scoped subtree to correctly `notApplicable` — that's a patch, not a major bump, because no stable field's *shape* changed, only a bug got fixed. Don't over-index on "any output change = major" — bug fixes are expected to change output.
  The same goes for a rule whose findings were wrong or duplicated another rule's: it is deprecated and stops reporting at once, keeping its id (see [Rule-ID deprecation policy](#rule-id-deprecation-policy)). So does correcting the WCAG criterion a rule is mapped to, when the mapping contradicts WCAG's own documents: composites change because the rule's evidence was filed under the wrong criterion, not because the rule changed.
- **Minor**: adding a new stable field, adding a new rule to the catalog, or marking an existing rule `deprecated` (see below).
- **Major**: removing or renaming a stable field, changing a stable field's type or meaning, or removing a rule ID, which can break a consumer however the rule was deprecated. Paired with an `engine.schemaVersion` bump specifically when the *shape* changes (as opposed to package-level major bumps for other reasons, e.g. dropping support for an old Node version).

`engine.schemaVersion` has been `"1.0.0"` since the engine's first release and has never needed a bump — nothing has changed a stable field's shape yet. Adding the `deprecated`/`deprecation` meta fields described below is purely additive (new optional fields, ignored safely by anything not looking for them), so it does **not** warrant a schema bump either — this is the policy's first real application. `engine.locale` is the second: a new field next to the existing ones, with no change to any field a consumer already reads. `engine.wcagVersion` and the optional per-result `wcagVersionScope` are the third, on the same reasoning — but note the *outcome* change that came with them (a rule mapped to the removed SC 4.1.1 now reports `cantTell` instead of `fail` under the default 2.2 target) is an outcome fix of the kind described above, not a shape change. `engine.environment` is another: it reports the conditions a run was rendered under, and changes nothing a consumer already reads.

## Release cadence

The version number is the contract — not a measure of how much has changed or how often. surea11y follows semver strictly, so what a bump *means* is fixed regardless of how frequently they happen:

- **Patch (`x.y.Z`)** — rule-correctness fixes and documentation updates. Released promptly, as needed, rather than held back; always safe to adopt within a major line.
- **Minor (`x.Y.0`)** — additive, backward-compatible work: new rules, new locales, new `engineOptions`, new output formats. Batched into periodic releases rather than shipped one change at a time.
- **Major (`X.0.0`)** — a breaking change to a stable field (see above). Rare by design; the entire point of the stable-fields list is to keep these infrequent and well-signposted.

Because every `1.x` release is backward-compatible, a consumer pinned to a `^1.y.0` range is never broken by an upgrade within the line — so a steady stream of patch/minor releases reflects active maintenance and prompt fixes, not instability. Frequency of releases is not a signal of churn; a change to a **major** version is.

Each release freezes the finding identities it ships: run `npm run finding-ids:release -- <version>` and commit `scripts/data/released-finding-ids.json` with the release (see [Finding identity](#finding-identity)). The version bump itself needs `npm run build` before the release commit: the built engine carries the version as `engine.version`, and `tests/engine-version.test.js` fails while it still holds the old one.

## Rule-ID deprecation policy

A rule can be marked deprecated in its own `meta`:

```js
const meta = {
  // ...
  deprecated: true,
  deprecation: {
    replacedBy: 'new-rule-id',   // or null if there's no direct replacement
    reason: 'Why this rule is being retired.',
    sinceVersion: '1.2.0'        // the package version this was first marked deprecated in
  }
};
```

`meta.deprecated: true` requires both `deprecation.reason` and `deprecation.sinceVersion` — `normalizeRuleMeta` (`src/core/rule-meta.js`) throws a clear build-time error otherwise, the same way it already validates `meta.i18n.titleKey`.

Deprecation covers two different situations, and they are handled differently, because they put different things at risk for a consumer.

**A rule being superseded keeps running normally.** When a rule's results are correct and a better rule takes its place, the deprecated rule keeps producing `pass`/`fail`/`cantTell`/`notApplicable` exactly as before. Deprecation is then a catalog-level signal (visible via `getChecksCatalog()`, and in `docs/RULE_CATALOG.md`) for integrators to plan a migration on their own schedule, **not** an automatic exclusion (there is no `engineOptions.excludeDeprecated` flag).

**A rule whose findings are wrong, or only repeat another rule's, stops reporting at once.** A false finding, or the same problem reported twice for the same element, is a bug, and a bug fix does not wait for a major version. The rule is deprecated with `replacedBy` naming the rule that covers the case (or `null`), and its `runInPage` is reduced to `notApplicable` on every page. Its reason codes retire with the findings they named, as for any correctness fix (see [Finding identity](#finding-identity)). This is a patch or a minor change:
- What a consumer stores keeps working. A baseline entry or Code Scanning alert for the retired finding closes, as it does when any bug is fixed, and a duplicate's other copy, from the rule that covers it, stays open.
- The rule id keeps resolving. A `runOnly` list, an `engineOptions.rules` entry or code that looks the result up by `ruleId` still finds it, now reporting `notApplicable`.

**Removing a rule id is a major change,** whichever way the rule was deprecated: it is the step that can break a consumer. A removed id makes a `runOnly` list that names it select nothing, without a warning, and code that looks the result up by id finds none. Removals are batched into the next major version and documented under `### Removed`.

The process:
1. Mark the rule `deprecated: true` with `deprecation.reason`/`.replacedBy`/`.sinceVersion` set, and say in `reason` which of the two situations applies. Document it under `CHANGELOG.md`'s `### Deprecated` section.
2. A superseded rule keeps running normally for at least one full minor version cycle after the deprecation, so integrators pinned to `^x.y.0` have a real chance to see it before it's gone. A rule whose findings were wrong or duplicated reports `notApplicable` from the release that deprecates it.
3. Remove the rule file entirely in a future **major** version, documented under `### Removed`.

`iframe-title-unique` was the first rule to use this mechanism, deprecated in 1.8.0 in favour of `identical-iframes-same-purpose` (see `DESIGN_CHALLENGES.md`). It reports `notApplicable` on every page, because the `fail` it used to report was not a WCAG violation. Its reason code, `IFRAME_TITLE_DUPLICATE`, is no longer emitted, so it retired with the finding it named, as the 1.8.0 changelog records (see [Finding identity](#finding-identity)). `label-title-only` followed in 1.10.0: every field it reported, `form-control-programmatic-label-quality` also reported, so it now reports `notApplicable` and `LABEL_TITLE_ONLY` retired with the duplicate.

## See also

- [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) — the full result shape this document's stability rules apply to.
- [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §4.1 — the full rule `meta` contract, including `deprecated`/`deprecation`.
- [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) — `engineOptions.fragment`, referenced above as a worked example of a patch-level behavior fix.
