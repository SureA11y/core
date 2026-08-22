# API stability & versioning

`@surea11y/core` has real downstream consumers today: 5 first-party framework bindings (Playwright, Puppeteer, Selenium, WebdriverIO, Cypress) published to npm, plus a Jest/Vitest matcher (`@surea11y/test-matchers`, `toHaveNoA11yViolations()`) — all pinned to a `^1.1.0`-style semver range. Until now, "what counts as a breaking change" was implicit — discoverable only by reading source, not written down anywhere. This document makes that contract explicit.

## Stable fields (covered by semver)

Removing, renaming, or changing the type/meaning of any of these is a **major** version bump:

- Top-level result: `engine.tag`, `engine.schemaVersion`, `engine.locale` (the field and its `requested`/`resolved`/`reason` keys — the set of `reason` *values* is open and may gain entries in a minor), `url`, `checksResults` (an array), `rulesResults` (an array).
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
| `@surea11y/core/browser` | `surea11y.browser.js` | the standalone browser bundle, for bundlers that resolve it as a module |

Anything **not** in that table — `src/core/*`, `src/checks/*`, `src/i18n/*`, `src/policy/*`, and the generated `src/core.js` itself — is internal. Before 1.4.0 there was no `exports` map, so those paths were technically reachable via deep `require()`; they were never documented as public and are no longer resolvable. The `<script src="node_modules/@surea11y/core/surea11y.browser.js">` form documented in the README is a filesystem path, not module resolution, and is unaffected.

Declaring this map is what lets the engine's internal file layout change without a major bump. Note that `src/checks/*` is still *shipped* (the generated bundle `require()`s it at runtime) — shipped is not the same as public.

## Explicitly unstable (not covered by semver)

- `perfStats` and `ruleTimings` — internal timing/debug counters, only present when `engineOptions.perfStats`/`.profileRules` is set. Shape not covered by this document.
- `occurrences[i].data.details` — rule-specific, non-normative extra context. Shape varies per rule and may change in a patch release; treat as best-effort, not a stable contract (this was already noted in `docs/OUTPUT_SCHEMA.md` before this document existed).
- `ruleInterfaceVersion` / `ruleVersion` on a rule's meta — currently unused scaffolding (every rule defaults to the same two static strings; nothing meaningfully sets or consumes them today). Not part of this contract until they're actually wired up to mean something.

## What triggers which version bump

- **Patch**: a correctness fix that changes *which* outcome a rule produces for the same input, without changing the shape or mechanism. Example: the fragment-scan applicability fix (`engineOptions.fragment`, see `ENGINE_OPTIONS.md`) changed several rules from incorrectly `fail`ing on a scoped subtree to correctly `notApplicable` — that's a patch, not a major bump, because no stable field's *shape* changed, only a bug got fixed. Don't over-index on "any output change = major" — bug fixes are expected to change output.
- **Minor**: adding a new stable field, adding a new rule to the catalog, or marking an existing rule `deprecated` (see below).
- **Major**: removing or renaming a stable field, changing a stable field's type or meaning, or removing a rule ID once its deprecation notice period has passed. Paired with an `engine.schemaVersion` bump specifically when the *shape* changes (as opposed to package-level major bumps for other reasons, e.g. dropping support for an old Node version).

`engine.schemaVersion` has been `"1.0.0"` since the engine's first release and has never needed a bump — nothing has changed a stable field's shape yet. Adding the `deprecated`/`deprecation` meta fields described below is purely additive (new optional fields, ignored safely by anything not looking for them), so it does **not** warrant a schema bump either — this is the policy's first real application. `engine.locale` is the second: a new field next to the existing ones, with no change to any field a consumer already reads.

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

No rule has been deprecated yet as of this document's introduction — this is the mechanism, ready for the first real case.

## See also

- [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) — the full result shape this document's stability rules apply to.
- [`RULE_AUTHORING.md`](./RULE_AUTHORING.md) §4.1 — the full rule `meta` contract, including `deprecated`/`deprecation`.
- [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) — `engineOptions.fragment`, referenced above as a worked example of a patch-level behavior fix.
