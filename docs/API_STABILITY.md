# API stability & versioning

`@surea11y/core` has real downstream consumers today: 5 first-party framework bindings (Playwright, Puppeteer, Selenium, WebdriverIO, Cypress) published to npm, plus a Jest/Vitest matcher (`@surea11y/test-matchers`, `toHaveNoA11yViolations()`) — all pinned to a `^1.1.0`-style semver range. Until now, "what counts as a breaking change" was implicit — discoverable only by reading source, not written down anywhere. This document makes that contract explicit.

## Stable fields (covered by semver)

Removing, renaming, or changing the type/meaning of any of these is a **major** version bump:

- Top-level result: `engine.tag`, `engine.schemaVersion`, `engine.locale` (the field and its `requested`/`resolved`/`reason` keys — the set of `reason` *values* is open and may gain entries in a minor), `engine.wcagVersion`, `url`, `checksResults` (an array), `rulesResults` (an array), `overriddenBuiltinIds` (an array, empty when no `customRules` entry shadowed a built-in id — part of the extension contract, see below).
- Each `checksResults[i]` / `rulesResults[i]` entry: `ruleId`, `outcome`, `outcomeNormalized`, `severity`, `confidence`, `type`, `title`, `description`, `meta` (including `meta.normativeMappings`, `meta.deprecated`/`.deprecation` — see below), `engineOptions`, `schemaVersion`.
- Each occurrence (`occurrences[i]`): `selector`, `html`, `summary`, `hint`, `i18n`, `structuralPath`.
- The rule **catalog** (`getChecksCatalog()`/`getRulesCatalog()`, a separate surface from a scan result — see `RULE_AUTHORING.md`): `ruleId`, `title`, `description`, `tags`, `wcagSc`, `normativeMappings`, `defaultSeverity`, `defaultConfidence`, `type`, `deprecated`/`.deprecation`. Note `tags` lives here, not on a per-scan `checksResults[i].meta` — the two surfaces intentionally carry different subsets of a rule's metadata.

This list isn't a new, invented guarantee: it codifies what the 6 real consumers above (and `docs/OUTPUT_SCHEMA.md`'s own worked examples) already depend on today, either directly or as documented shape.

## Package entry points (covered by semver)

Since 1.4.0 the package declares an explicit `exports` map. These are the only importable paths, and removing or repointing one is a **major** bump:

| Specifier | Resolves to | Contents |
|---|---|---|
| `@surea11y/core` | `src/index.js` | the full engine surface (`runDomRulesInPage`, `runa11yCoreInPage`, catalog accessors, …) |
| `@surea11y/core/baseline` | `src/baseline.js` | `buildBaselineEntries()`, `matchBaseline()` |
| `@surea11y/core/report` | `src/report.js` | `renderHtmlReport()` |
| `@surea11y/core/sarif` | `src/sarif.js` | `renderSarifReport()` |
| `@surea11y/core/earl` | `src/earl.js` | `renderEarlReport()` |
| `@surea11y/core/browser` | `surea11y.browser.js` | the standalone browser bundle, for bundlers that resolve it as a module |

Anything **not** in that table — `src/core/*`, `src/checks/*`, `src/i18n/*`, `src/policy/*`, and the generated `src/core.js` itself — is internal. Before 1.4.0 there was no `exports` map, so those paths were technically reachable via deep `require()`; they were never documented as public and are no longer resolvable. The `<script src="node_modules/@surea11y/core/surea11y.browser.js">` form documented in the README is a filesystem path, not module resolution, and is unaffected.

Declaring this map is what lets the engine's internal file layout change without a major bump. Note that `src/checks/*` is still *shipped* (the generated bundle `require()`s it at runtime) — shipped is not the same as public.

## Extension points

The `exports` map above says which **paths** are importable. It does not say which **symbols** behind them are supported, and that distinction matters here: `src/index.js` re-exports the generated core verbatim, so every symbol the build emits reaches consumers whether or not it was meant for them. The classification lives in [`scripts/data/public-api.json`](../scripts/data/public-api.json) and is checked by `tests/public-api.test.js`, which fails when a new export appears unclassified — a leak has to be a decision, not an accident.

**Supported** — covered by semver, safe to build on:

| Export | For |
|---|---|
| `runa11yCoreInPage` | Scanning from another JS realm: the whole engine is inlined, so `fn.toString()` re-evaluated in a browser tab works. What all five browser bindings use. |
| `runDomRulesInPage` | Scanning in the same Node process, dispatching through real `require()`. What `@surea11y/test-matchers` uses. |
| `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder` | Cross-frame scanning without an automation driver. |
| `getChecksCatalog()` / `getRulesCatalog()` | Reading the rule catalog; its stable fields are listed above. |

**Exported but internal** — reachable today, not supported, and free to change or disappear in a minor: `CHECK_DEFS`, `TEST_DEFS`, `COMPOSITE_RULES`, `DEFAULT_POLICY`, `POLICY_CONTRACTS`, `ENGINE_TAG`, `SCHEMA_VERSION`, `resolvePolicy`, `getCheckDefById`, `getCompositeRuleById`, `getChecksForRunOnly`, `getTestsForRunOnly`, `__internal`.

They stay exported rather than being removed, because removing them is itself a breaking change and no consumer needs it yet; the honest fix for now is to say they are not part of the contract. Note the two constants have supported equivalents on every result — `engine.tag` and `engine.schemaVersion` — so read them from there rather than importing them. Curating this list down to the supported set is a candidate for the next major.

### Extending the engine

Three things are meant to be extended, and all three go through `engineOptions` or a separate entry point rather than through the exported symbols above:

- **`engineOptions.customRules`** — the plugin mechanism: an array of rule descriptors registered for one call, never added to the static catalog and never persisted between calls. **The descriptor contract is covered by semver**: `id`, `meta`, `runInPage(ctx)` and the optional `applicability(ctx)` and `data`, along with the `ctx.helpers` a rule receives and the `{outcome, severity, occurrences}` it returns. That `runInPage`/`applicability` may be passed as a function *or* as a function-source string is part of the contract too, not a convenience: `engineOptions` crossing into another realm (a Playwright `page.evaluate`, say) cannot carry a live `Function`, so a binding has no other way to register one. A custom rule that shadows a built-in id replaces it for that scan and is reported back in `overriddenBuiltinIds`, so an accidental collision is visible rather than silent. A custom rule written against today's contract keeps working across minors; requiring a new field of it is a major. The full descriptor shape is in [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#customrules--runtime-registered-rules), the helpers in [`RULE_HELPERS.md`](./RULE_HELPERS.md), and the outcome rules a custom rule must obey in [`RULE_TAXONOMY.md`](./RULE_TAXONOMY.md).
- **`engineOptions.policyContract` / `engineOptions.policy`** — which outcomes and confidence values a scan may report, and whether a manual rule's would-be `fail` is coerced. The two option names, the built-in contract ids `'a11y'` and `'generic'`, and the inline-contract shape are supported; the `POLICY_CONTRACTS` export itself is not, since passing a string or an inline object is all a caller needs. See [`POLICY.md`](./POLICY.md).
- **Reporters** — `@surea11y/core/baseline`, `/report`, `/sarif` and `/earl` consume a result rather than hooking into the scan, which is why they are separate entry points. A consumer wanting a different output format reads the result shape above; nothing needs to be registered with the engine.

There is deliberately no hook for changing what a built-in rule decides. Overriding one means shipping a `customRules` entry that reuses its id, which the engine allows for a single call, warns about, and reports in `overriddenBuiltinIds` — so a scan that silently disagrees with the catalog is not possible.

## Explicitly unstable (not covered by semver)

- `perfStats` and `ruleTimings` — internal timing/debug counters, only present when `engineOptions.perfStats`/`.profileRules` is set. Shape not covered by this document.
- `occurrences[i].data.details` — rule-specific, non-normative extra context. Shape varies per rule and may change in a patch release; treat as best-effort, not a stable contract (this was already noted in `docs/OUTPUT_SCHEMA.md` before this document existed). **`data.details.reasonCode` is the exception** and is stable — see [Finding identity](#finding-identity) below.
- `ruleInterfaceVersion` / `ruleVersion` on a rule's meta — currently unused scaffolding (every rule defaults to the same two static strings; nothing meaningfully sets or consumes them today). Not part of this contract until they're actually wired up to mean something.

## Finding identity

A consumer needs to know whether a finding it is looking at is the same one it saw last week. Two things in this package answer that, and both compute it the same way — `computeBaselineKey(ruleId, reasonCode, html)` in `src/baseline.js`:

- **Baselines.** `--write-baseline`/`--baseline` suppress known findings so a build only breaks on new ones.
- **SARIF.** `partialFingerprints['surea11y/violation/v1']`, which GitHub Code Scanning uses to decide whether an alert is the same alert or a new one.

So the identity is `ruleId` + `reasonCode` + the occurrence `html`, and two of those three are promises:

- **A rule id, once published, does not change.** Renaming or removing one is a major change. The supported path is to keep the id, mark it `deprecated` with `deprecation.replacedBy` naming the successor, and remove it only after the notice period.
- **A reason code, once a rule has shipped it, does not change.** This is a deliberate exception to the surrounding "`data.details` is unstable" rule: everything else under `data.details` is free-form, but `reasonCode` is load-bearing for identity, so it is pinned. Adding a new code to a rule is a minor change; changing or dropping an existing one is not, because every stored baseline entry and every open Code Scanning alert keyed on it stops matching.

Both are inventoried in [`scripts/data/finding-ids.json`](../scripts/data/finding-ids.json), regenerated with `npm run finding-ids` and checked by `tests/finding-ids.test.js`, which fails when a published rule id or reason code disappears. The inventory is the record of what has been promised; the test is what stops the promise being broken by accident.

Note what identity does **not** include: `selector` and `structuralPath` deliberately stay out of the fingerprint, because both change when the surrounding page is edited, which would make every finding look new after an unrelated refactor. `html` is in, so editing the flagged element itself does read as a new finding — that is the intended trade-off, since the element's markup is the thing the finding is about.

### A rename that predates this

`role-img-alt-present` became `role-img-text-alternative-present` with no deprecation entry and no major bump, before any of the above was written down. Anything holding the old id — a baseline entry, a `runOnly` list — silently matched nothing. The rename is not reversible now: the old id has been absent across every 1.x release, so a deprecation entry today would announce the retirement of something no current version answers to. It is recorded here instead, because it is the reason this section exists. Its source file, fixture and test kept the old name for a while afterwards, which is what made the rename easy to miss; they carry the rule's own id now.

## What triggers which version bump

- **Patch**: a correctness fix that changes *which* outcome a rule produces for the same input, without changing the shape or mechanism. Example: the fragment-scan applicability fix (`engineOptions.fragment`, see `ENGINE_OPTIONS.md`) changed several rules from incorrectly `fail`ing on a scoped subtree to correctly `notApplicable` — that's a patch, not a major bump, because no stable field's *shape* changed, only a bug got fixed. Don't over-index on "any output change = major" — bug fixes are expected to change output.
- **Minor**: adding a new stable field, adding a new rule to the catalog, or marking an existing rule `deprecated` (see below).
- **Major**: removing or renaming a stable field, changing a stable field's type or meaning, or removing a rule ID once its deprecation notice period has passed. Paired with an `engine.schemaVersion` bump specifically when the *shape* changes (as opposed to package-level major bumps for other reasons, e.g. dropping support for an old Node version).

`engine.schemaVersion` has been `"1.0.0"` since the engine's first release and has never needed a bump — nothing has changed a stable field's shape yet. Adding the `deprecated`/`deprecation` meta fields described below is purely additive (new optional fields, ignored safely by anything not looking for them), so it does **not** warrant a schema bump either — this is the policy's first real application. `engine.locale` is the second: a new field next to the existing ones, with no change to any field a consumer already reads. `engine.wcagVersion` and the optional per-result `wcagVersionScope` are the third, on the same reasoning — but note the *outcome* change that came with them (a rule mapped to the removed SC 4.1.1 now reports `cantTell` instead of `fail` under the default 2.2 target) is an outcome fix of the kind described above, not a shape change.

## Release cadence

The version number is the contract — not a measure of how much has changed or how often. surea11y follows semver strictly, so what a bump *means* is fixed regardless of how frequently they happen:

- **Patch (`x.y.Z`)** — rule-correctness fixes and documentation updates. Released promptly, as needed, rather than held back; always safe to adopt within a major line.
- **Minor (`x.Y.0`)** — additive, backward-compatible work: new rules, new locales, new `engineOptions`, new output formats. Batched into periodic releases rather than shipped one change at a time.
- **Major (`X.0.0`)** — a breaking change to a stable field (see above). Rare by design; the entire point of the stable-fields list is to keep these infrequent and well-signposted.

Because every `1.x` release is backward-compatible, a consumer pinned to a `^1.y.0` range is never broken by an upgrade within the line — so a steady stream of patch/minor releases reflects active maintenance and prompt fixes, not instability. Frequency of releases is not a signal of churn; a change to a **major** version is.

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

**A deprecated rule keeps running and producing results completely normally** — `pass`/`fail`/`cantTell`/`notApplicable` exactly as before. Deprecation is a catalog-level signal (visible via `getChecksCatalog()`, and in `docs/RULE_CATALOG.md`) for integrators to plan a migration on their own schedule, **not** an automatic exclusion (there is no `engineOptions.excludeDeprecated` flag). Silently dropping a rule's results the moment it's deprecated would be exactly the kind of surprise this document exists to prevent.

The process:
1. Mark the rule `deprecated: true` with `deprecation.reason`/`.replacedBy`/`.sinceVersion` set. Document it under `CHANGELOG.md`'s `### Deprecated` section (a standard Keep-a-Changelog category that's been in this project's changelog template since the beginning but never actually used until now).
2. Leave it running normally for at least one full minor version cycle after the deprecation, so integrators pinned to `^x.y.0` have a real chance to see it before it's gone.
3. Remove the rule file entirely in a future **major** version, documented under `### Removed`.

`iframe-title-unique` was the first rule to use this mechanism, deprecated in 1.8.0 in favour of `identical-iframes-same-purpose` (see `DESIGN_CHALLENGES.md`). It also reports `notApplicable` on every page, because the `fail` it used to report was not a WCAG violation and waiting for 2.0.0 to stop reporting one was not acceptable. That is a property of the retired check, not of deprecation: a deprecated rule whose results are still correct keeps producing them, as described above. Its reason code stays in `scripts/data/finding-ids.json` until the file is removed, since the inventory records what was shipped, not what is still produced; `generate-finding-ids.js` carries a deprecated rule's committed codes forward for that reason.

## See also

- [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) — the full result shape this document's stability rules apply to.
- [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §4.1 — the full rule `meta` contract, including `deprecated`/`deprecation`.
- [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) — `engineOptions.fragment`, referenced above as a worked example of a patch-level behavior fix.
