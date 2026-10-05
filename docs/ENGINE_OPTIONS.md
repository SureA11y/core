# Engine options reference

Every runner (`runDomRulesInPage`, `runa11yCoreInPage`) takes the same four arguments: `(pageUrl, contextSelector, engineOptions, runOnly)`. This page documents `engineOptions` and `runOnly` in full, verified against `src/core/dom-runner.js` and `scripts/build-core.js`.

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

A bare array or string works as shorthand, the way axe-core takes it: `runOnly: ['img-alt-present', 'button-name-present']` runs those rules (a composite id brings in its rules), and `runOnly: ['wcag2a', 'wcag2aa']` is the same as `{ tags: ['wcag2a', 'wcag2aa'] }`. An array can't mix rule ids and tags, and every value has to name a rule (built-in, composite or one of `engineOptions.customRules`) or a tag: anything else throws, so a typo can't quietly run every rule or none. Use the object form to combine ids and tags or to exclude. Before 1.10.0 a bare array was ignored and every rule ran.

| Field | Type | Meaning |
|---|---|---|
| `includeRuleIds` | `string[]` | Only run these rule IDs (plus, for a composite ID, its child atomic rules). |
| `excludeRuleIds` | `string[]` | Never run these, applied *after* include. |
| `includeTestIds` / `excludeTestIds` | `string[]` | Same matching as above — kept as a separate field because rules are internally called "tests" (the atomic executable unit); functionally identical to `includeRuleIds`/`excludeRuleIds` today. |
| `tags` | `string[]` | Only run rules carrying at least one of these tags (e.g. `wcag412`, `wcag2aa`, `best-practice`). |
| `excludeTags` | `string[]` | Never run rules carrying any of these tags, applied after include. |
| `includeMode` | `'and'` \| `'or'` | When **both** an ID include and a tag include are given: `'and'` (default) requires a rule to satisfy both; `'or'` runs a rule if it satisfies either. Irrelevant if you only use one dimension. |

Each of these accepts either an array or a comma-separated string, matching the `engineOptions` form below — `includeRuleIds: 'img-alt-present, button-name-present'` and `includeRuleIds: ['img-alt-present', 'button-name-present']` are equivalent.

Names are checked, here and in `engineOptions.rules`/`.tags` below. An include list (`includeRuleIds`, `tags`, the legacy `values`, `rules.include`, `tags.include`) in which no value names a rule or a tag throws, with `code: 'INVALID_RUN_ONLY'` and a message naming the field and the values, since it would select nothing and a run of no rules reads as a clean pass. A value that names nothing beside ones that do, or in an exclude list, is ignored with a `console.warn`. Before 1.10.0 every such value was ignored silently. `includeTestIds`/`excludeTestIds` are not checked.

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

**One SC goes the other way.** WCAG 2.2 removed SC 4.1.1 Parsing — the only criterion ever dropped rather than added. A rule mapped to it carries its 2.0-origin tag (`wcag2a`) like any other baseline rule, plus `wcag22-removed`, and the version tag sets above therefore include it under a 2.2 target, where it does not belong.

You do not have to do anything about that. The engine resolves a **target WCAG version** for every run and, when that target is 2.2, a `wcag22-removed` rule cannot report `fail`: it still runs, still reports every occurrence it found, but its outcome is coerced to `cantTell` and the result carries a `wcagVersionScope` field saying why (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#a-check-result-checksresultsi)). Nothing is silently dropped, and a 2.2 run is not gated by a criterion 2.2 does not contain.

The target version is resolved in this order:

1. `engineOptions.wcagVersion` — `'2.0'`, `'2.1'` or `'2.2'`, if you set it.
2. The version-origin tags in your own filter: a set topping out at `wcag21a`/`wcag21aa` reads as a 2.1 target, one containing any `wcag22*` tag as 2.2, one with only `wcag2*` tags as 2.0. Only those nine tags count — an SC tag (`wcag411`) or `best-practice` says nothing about a version.
3. Otherwise `'2.2'`, this engine's default target.

```js
// Nothing to declare: a plain run already targets 2.2, so a duplicate id
// comes back cantTell rather than fail.
runDomRulesInPage(url, null, {}, null);

// Conformance-testing against 2.1, where SC 4.1.1 still exists:
runDomRulesInPage(url, null, { wcagVersion: '2.1' }, null);

// Same thing, implied by the tag set — no extra option needed:
runDomRulesInPage(url, null, {}, { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
```

The resolved target is reported back on every result as `engine.wcagVersion`, so you can confirm which one a run actually used.

If you would rather not see the rule at all under 2.2, exclude it outright — the tag is still there for exactly that:

```js
// WCAG 2.2 AA conformance, with the removed criterion left out entirely:
{
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
  excludeTags: ['wcag22-removed']
}
```

`duplicate-id` is the only rule carrying that tag today. Left in, it still reports something real — a duplicate id breaks `<label for>`, fragment links and `getElementById` whatever the standard says — it just is not a 2.2 conformance failure.

### Conformance profiles

`engineOptions.profile` names a conformance target instead of spelling out its tag set:

| Profile | Runs the rules tagged | WCAG target | Why |
|---|---|---|---|
| `wcag22-aa` | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa` | 2.2 | WCAG 2.2 Level A and AA |
| `en301549-v4.1.1` | same as `wcag22-aa` | 2.2 | EN 301 549 V4.1.1 chapter 9 restates WCAG 2.2 A and AA |
| `en301549-v3.2.1` | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` | 2.1 | EN 301 549 V3.2.1 chapter 9 restates WCAG 2.1 A and AA, including 4.1.1 Parsing |
| `section508` | `wcag2a`, `wcag2aa` | 2.0 | The Revised 508 Standards incorporate WCAG 2.0 A and AA |

```js
runDomRulesInPage(url, null, { profile: 'en301549-v3.2.1' }, null);
```

A standard registered as a profile under `profiles/` brings its own profiles to this list ([`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md#adding-another-standard)).

The WCAG target follows from the tags the same way it does for a hand-written set (see [Filtering by WCAG version](#filtering-by-wcag-version-21-vs-22)), so under `en301549-v3.2.1` a duplicate id can still `fail`, and under `en301549-v4.1.1` it cannot. Names are matched case-insensitively. A run that used a profile reports it back as `engine.profile`.

Precedence: anything that *includes* rules selects them instead of the profile — a `runOnly` with `tags`, `includeRuleIds` or `includeTestIds`, or an `include` in `engineOptions.rules`/`.tags`/`.tests`. Excludes still apply on top of the profile, whether they come from `runOnly` (`excludeTags`, `excludeRuleIds`, `excludeTestIds`, so a binding's `disableTags()` narrows the profile rather than replacing it) or, when there is no `runOnly` filter, from `engineOptions` (`tags.exclude`, `rules.exclude`, `tests.exclude`), and an explicit `engineOptions.wcagVersion` still wins over the version the profile implies. A profile that does not take effect — an unknown name, or one overridden as above — is not an error: the run proceeds as if none was given, logs a `console.warn` saying why, and carries no `engine.profile`.

A standard's profile may also leave rules out, when its standard waives a WCAG criterion or replaces a WCAG check with its own (`exclude` in the registry, [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md#adding-another-standard)): those rules and their WCAG rollups do not run, the rule catalog leaves them out too, and `engine.profileExcludes` names what was left out. No built-in profile excludes anything today.

A profile only chooses which rules run. It says nothing about whether passing them meets the standard it is named after: most Success Criteria need human judgement no automated rule covers (see [`WCAG_CONFORMANCE.md`](./WCAG_CONFORMANCE.md#what-this-engine-cannot-tell-you)).

An EN 301 549 profile also switches on the EN 301 549 clauses of the version it targets, as if `mappings: ['en301549:V4.1.1']` (or `V3.2.1`) had been passed; see the next section. Any standard's profile switches on its own version the same way. A profile with `mappedRules` also runs, whatever their tags, the rules its standard is mapped to: the ones with no WCAG mapping, such as `heading-order` and `skip-link`, have no WCAG tag to be selected by.

### Opt-in rules

Some rules check a standard's own requirements, ones WCAG does not make: a national standard may require a doctype, or forbid presentational attributes such as `bgcolor`. A `fail` from such a rule is a failure of that standard, not of WCAG, so these rules are **off by default**. Each carries its standard's rule tag and runs only when the selection asks for it:

- through the standard's profile, which lists the tag,
- by that tag (`tags: { include: '<tag>' }`, alone or with others), or
- by its id (`rules: { include: '<rule id>' }`, or `runOnly.includeRuleIds`),
- by the id of one of its standard's own rollups that groups it (`rules: { include: '<rollup id>' }` runs that rollup's rules, opt-in or not), or
- by unlocking it with `engineOptions.optInRules`, below.

Nothing else selects one: not a default run, not a WCAG tag set, not a WCAG or EN 301 549 profile, not a WCAG rollup id. A standard's own rollups carry the same tag and follow the same rule. Excludes apply to them as to any rule. This holds for a rule added through `customRules` that carries the tag too. The tags come from `ruleTag` in `src/coverage/standards.js`, one per registered standard that has rules of its own; core's built-in standards have none.

The tag selects the opt-in rules and nothing more. `tags: { include: '<tag>' }` alone runs that standard's own rules, not the WCAG and best-practice rules it is also mapped to, so it answers "what does the standard require beyond WCAG" and is not an audit against it. Its own rollups report `cantTell` for any requirement whose rules did not run (`missingChild`). For an audit, use the standard's profile.

#### Running every rule (`optInRules`)

To run every rule the engine has, whatever standard it belongs to, leave out the profile and unlock the opt-in rules:

```js
runDomRulesInPage(url, null, { optInRules: 'all' }, null);
```

`'all'` unlocks every standard's opt-in rules; a list of tags (`['<tag>']`, or `'<tag>'`) unlocks only those. It lifts the gate and nothing else: the rest of the selection still decides which rules run. So with no filter and no profile, as above, the run covers every rule and every standard's rollups; under `profile: 'wcag22-aa'` it still runs the WCAG rules only, since opt-in rules carry no WCAG tag, and under a standard's own profile it changes nothing for that standard's rules. Excludes apply as usual. A tag that is not an opt-in tag is ignored with a `console.warn`.

This is for seeing everything the engine can report, during development or when exploring a site. It is not a conformance target: such a run fails a page for things WCAG allows and only another standard forbids. The result says so: `engine.optInRules` lists the tags whose rules ran, and the HTML report, SARIF and JUnit show it next to the profile. It adds no other standard's numbers to results; pass `mappings` for that, for example `{ optInRules: 'all', mappings: ['<key>'] }` to see a standard's requirements each rule checks.

### Other standards (`mappings`)

Every result's `meta.normativeMappings` names the WCAG Success Criteria it tests. `engineOptions.mappings` adds the requirement of another standard that corresponds to each one. By default it adds none: a clause of a standard you do not audit against is noise in every SARIF tag, JUnit property and report.

| Value | Adds |
|---|---|
| `'en301549'` | The EN 301 549 chapter 9 clause for each criterion, in every version that has it (V3.2.1 and V4.1.1) |
| `'en301549:V3.2.1'`, `'en301549:V4.1.1'` | The same, for that version only |

```js
runDomRulesInPage(url, null, { mappings: ['en301549:V3.2.1'] }, null);
```

A standard registered as a profile adds its own key (and `<key>:<version>`), with the requirements it maps each rule to.

It takes an array or a comma-separated string, names and versions matched case-insensitively. What it adds to comes from the profile too: under `profile: 'en301549-v4.1.1'` the V4.1.1 clauses are there without asking, and `mappings` can add more. A name or version the engine has no table for is ignored with a `console.warn`. A run that carries any other standard reports which in `engine.mappings`, canonically spelled (`["en301549:V3.2.1"]`, or `["en301549"]` for every version).

It changes only what a result names, never which rules run or their outcomes. The rule catalog follows the same option: `getChecksCatalog(engineOptions)`, `getCheckDefById(ruleId, engineOptions)`, `getChecksForRunOnly(runOnly, engineOptions)`, `getRulesCatalog(engineOptions)` and `getCompositeRuleById(id, engineOptions)` name the standards a scan with those options would, a profile included when it would apply, so a catalog entry and a result always agree. With no options they name WCAG only; pass every standard's key in `mappings` for all of them. The published tables (`@surea11y/core/en301549`) are not filtered. A rule added through `customRules` keeps exactly the mappings it declares, whatever this option says.

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
  locale: 'en',                    // default 'en'; de-DE falls back to de, then to en per string
  wcagVersion: '2.2',              // default '2.2' — the conformance target, see "Filtering by WCAG version" above
  profile: 'en301549-v4.1.1',      // optional — a named conformance target, see "Conformance profiles" above
  mappings: ['en301549'],          // optional — standards besides WCAG to name on each result, see "Other standards" above
  optInRules: 'all',               // optional — also run rules other standards add beyond WCAG, see "Running every rule" above
  messages: { de: { /* key: text */ } },  // optional caller-supplied dictionaries; win over built-in ones
  includeHiddenElements: false,    // default false — set true to evaluate hidden/collapsed subtrees too
  includeShadowDom: true,          // default true — opt OUT with `false` to skip open shadow roots
  fragment: false,                 // default false — set true when the scan target isn't a real page (see below)
  excludeSelectors: ['#cookie-banner', '.third-party-widget'],  // array or comma-separated string
  timestamp: '2026-07-20T12:00:00Z',  // optional — engine has no built-in clock, see OUTPUT_SCHEMA.md
  perfStats: false,                // default false — internal timing counters, debug-only shape
  profileRules: false,             // default false — per-rule timings; needs perfStats, and makes output non-deterministic

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
| `locale` | Any string. A code with a subtag falls back to its base language first, so `de-DE` uses `de`; failing that, English. Individual strings then fall back the same way (chosen locale → `en` → the rule's literal English text), so a partly-translated locale never produces missing text. All of that is silent in the strings themselves, so the result reports what actually happened in `engine.locale` — check it if you need to know whether you got the language you asked for. See [`I18N.md`](./I18N.md). |
| `wcagVersion` | `'2.0'`, `'2.1'` or `'2.2'` — which version of WCAG the run is conformance-testing against. Defaults to whatever your version-origin tags imply, and to `'2.2'` when they imply nothing. The only thing it currently changes is SC 4.1.1 Parsing, removed in 2.2: under a 2.2 target a rule tagged `wcag22-removed` still runs and still reports its occurrences, but cannot `fail` — see ["Filtering by WCAG version"](#filtering-by-wcag-version-21-vs-22) above. Any other value is ignored and the default applies. |
| `profile` | Optional named conformance target: `'wcag22-aa'`, `'en301549-v4.1.1'`, `'en301549-v3.2.1'`, `'section508'`, or a registered standard's own. Selects rules by the matching tag set when nothing else includes any, and the WCAG target follows from those tags. Reported back as `engine.profile` when it took effect; otherwise ignored with a console warning. See ["Conformance profiles"](#conformance-profiles) above. |
| `mappings` | Optional standards besides WCAG whose requirements `meta.normativeMappings` names: `'en301549'`, `'en301549:V3.2.1'`, `'en301549:V4.1.1'`, or a registered standard's key, as an array or comma-separated string. Default none, so results name WCAG only; an EN 301 549 profile adds its own version. Reported back as `engine.mappings` when any applies. See ["Other standards"](#other-standards-mappings) above. |
| `optInRules` | Optional: `'all'`, or a list of opt-in rule tags, as an array or comma-separated string. Unlocks those rules outside their standard's profile; the rest of the selection still decides what runs. Reported back as `engine.optInRules` when it ran a rule the selection would not have run otherwise; unknown tags are ignored with a console warning. See ["Running every rule"](#running-every-rule-optinrules) above. |
| `messages` | Optional `{ [locale]: { key: text } }`. Checked before the engine's own tables, so it can override individual strings or supply a language the build does not carry. Keys you omit fall back normally, so a partial override is fine. This is how the standalone browser bundle receives a locale side file, and it is the only way to get a dictionary into a page context, since the in-page runner is serialized and cannot read files. It is not echoed back on each result's `engineOptions`, unlike the other options; `engine.locale` reports the dictionary used. See [`I18N.md`](./I18N.md). |
| `includeHiddenElements` | Default `false`: helper queries exclude elements hidden by structural/CSS mechanisms such as `display:none`, `[hidden]`, closed `<details>`, and hidden rendering-only host elements (with descendants excluded too). Set `true` to include those hidden/collapsed subtrees in evaluation (legacy/static-markup behavior). |
| `includeShadowDom` | Default `true`: rules using `helpers.queryAllSmart` traverse into open shadow roots. Set `false` to scan only the light DOM. Closed shadow roots are never reachable either way (no DOM API exposes them). |
| `fragment` | Default `false`. A handful of rules check for the presence of a property that exists once per real page — `page-title-present`, `html-lang-attr-present`, `html-xml-lang-mismatch`, `aria-hidden-body`, `css-orientation-lock`, `meta-refresh-no-exceptions`, `meta-refresh-timing-absent`, `meta-viewport-zoom-enabled`, `meta-viewport-large`, `page-title-patterns`, `region`, `bypass-blocks-present`, `landmark-one-main`, `page-has-heading-one` — and correctly report `notApplicable` for these once `contextSelector` has scoped a run narrower than the whole document (`document.documentElement` no longer among the resolved roots), since a scoped subtree was never expected to carry its own `<title>`/`<html lang>`/etc. Set `fragment: true` for the case that scoping alone can't detect: a scan target that's the *whole* given document but was never meant to represent a real page at all (e.g. a raw component snippet parsed on its own) — this forces the same `notApplicable` gating even when unscoped. See `RULE_AUTHORING.md` §11.2 ("Whole-document checks") for the underlying rule-authoring convention, and `helpers.isWholeDocumentScope()` (`src/core/dom-helpers.js`) for the mechanism these 14 rules gate on via their `applicability(ctx)` export. |
| `excludeSelectors` | Elements matching any of these selectors (and their descendants) are skipped entirely, for **every** rule — useful for cookie banners, third-party embeds, or known-noisy widgets you don't control. To exclude something from just one specific rule instead, use `rules[ruleId].excludeSelectors` below. |
| `timestamp` | Passed straight through to the result's top-level `timestamp` field; the engine does not generate one itself (deterministic-by-design). |
| `contrast.mode` | `strictConformance` (default): contrast rules stay silent (`notApplicable`/skip) whenever the true rendered background isn't confidently computable, to protect against false `fail`s. `auditorAssist`: trades some of that safety margin for more findings, intended for a human auditor who will double-check flagged cases, not for unattended CI gating. |
| `contrast.rootCanvasFallback` | The assumed page background color when it's not computable at all — only matters in `auditorAssist` mode. |
| `visibilityMode` | Controls how strict the three contrast rules (`contrast-minimum`, `contrast-enhanced`, `contrast-computable`) are about deciding a text node is actually eligible to check. **Not read by any other rule.** `'styleOnly'` (default): eligibility is CSS-only — `display`, `visibility`, `opacity`, ancestor-hiding, etc. `'styleAndGeometry'`: adds real layout checks (`getClientRects()`/`getBoundingClientRect()`) on top of that — text with no client rects, or zero width/height, is excluded too. Reach for `'styleAndGeometry'` when running under a real browser/Playwright-Puppeteer (`runa11yCoreInPage`) and you want contrast findings to reflect actual rendered layout rather than just computed style; under plain jsdom (`runDomRulesInPage`) there's no real layout engine, so `'styleAndGeometry'` mostly just adds `getBoundingClientRect()` zero-size checks, not true clipping/overflow detection — see [`LIMITATIONS.md`](./LIMITATIONS.md). |
| `policyContract` / `policy` | See [`POLICY.md`](./POLICY.md) — controls which outcomes/confidence values are allowed and whether manual rules' would-be `fail`s get coerced to `cantTell`. |
| `output.includeSelector` / `.includeHtml` | Suppresses the engine's automatic `selector`/`html` fill-in. Since every rule was migrated to report its element rather than build occurrences by hand (1.5.0), that fill-in is the path almost all of them take: setting `includeSelector: false` strips selectors from nearly every rule, and `includeHtml: false` HTML snippets. The remainder still assemble those fields themselves inside `runInPage` and are unaffected — among them `contrast-minimum`/`contrast-enhanced` (whose findings are text runs, not elements), `page-title-present` and `identical-links-same-purpose`. So this narrows output substantially but is still not a guarantee of *no* selectors or HTML anywhere in the result. |
| `rules[ruleId]` | Passed through to that rule as `ctx.config`, and — for `excludeSelectors` specifically — read by the engine itself before the rule ever runs. See "Rule-scoped `excludeSelectors`" below. Any other key is passthrough only: **no shipped rule takes anything else from it.** A rule's declared settings, such as `contrast-minimum`'s thresholds, are its standard's, so a caller's value for one is dropped: a result naming WCAG 1.4.3 is always decided at 4.5:1. A standard with other thresholds has its own rule, a variant ([`RULE_AUTHORING.md`](./RULE_AUTHORING.md#rule-variants)). |
| `probes` | An optional, JSON-safe evidence object your host application supplies, for what a scan of one page cannot see, such as the site's other pages. The engine caps it before rules read it (`ctx.inputs.probes`): six levels deep, 200 items per array, 50 keys per object, 2,000 characters per string. `crawl.pageTitles` (`{ pages: [{ url, title }] }`) is read by `page-title-patterns`, to look for generic and templated titles across a site. A profile's rules may read probes of their own, which its documentation describes. |
| `perfStats` / `profileRules` | Debug-only. `perfStats: true` returns internal counters on the result's `perfStats` field; `profileRules: true` **additionally** adds a per-rule timing breakdown there. `profileRules` on its own does nothing — `perfStats` is what creates the object the breakdown lives in. Shape is not part of the stable output contract — don't build on it. Note also that `profileRules` is the one option that makes output non-deterministic: counters are stable across identical runs, wall-clock timings are not. Leave it off if you diff results between runs. |
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

Why you'd want this: Angular Material's `<mat-select>` builds its internal ARIA structure in a way that trips a false positive on `aria-required-children` specifically, even though the component is otherwise fine. With only the global `excludeSelectors`, the only way to silence that false positive is `excludeSelectors: ['mat-select']` — which also hides `mat-select` from *every other rule*, including `contrast-minimum` and `aria-allowed-attr`, silently dropping real coverage those checks never had a problem with. The example above keeps `mat-select` fully visible to every rule except the one that misfires on it.

Effective exclusions for a given rule are the **union** of the global list and that rule's own list — an element matching either is dropped from that rule's candidates. A rule whose only would-be-failing elements are all excluded this way reports `outcome: 'pass'` or `'notApplicable'` (matching that rule's own no-candidates convention), with `occurrences: []` — never `outcome: 'fail'` with an empty `occurrences` array, since a built-in rule's `fail` always names what failed. (A rule that throws is a different case: it reports `cantTell` with `error` set, see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md).)

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

- `runInPage`/`applicability` may be a **real function** or a **function-source string** (i.e. `fn.toString()`). Pass a real function when `engineOptions` never leaves the current JS realm (plain Node/jsdom use). Pass a string when it does — e.g. a Playwright `page.evaluate(runa11yCoreInPage, { engineOptions })` call, where `engineOptions` crosses a JSON/structured-clone boundary that cannot carry a live `Function` reference but can carry a string. The engine reconstructs a string via `new Function`, the same mechanism `scripts/build-core.js` already uses to embed every built-in rule's source into the in-page runner. Any function's source works: an arrow function, a `function` declaration, or a method written in shorthand as in the example above (`runInPage(ctx) {…}`, `async` too), whose `toString()` is not an expression on its own. Reconstruction needs `eval` to be allowed, so a page whose Content Security Policy forbids `'unsafe-eval'` skips a rule given as a string; pass a real function there.
- `meta` gets identical defaulting/validation to a build-time rule (via the same `normalizeRuleMeta` used for every built-in rule) — omit anything you don't need; `severity` defaults to `moderate`, `confidence` to `medium`, `type` to `automatic`, etc.
- A custom rule whose `id` collides with a built-in one **overrides it for that scan**, rather than running both. Since a same-named custom rule is just as likely to be an accidental collision as a deliberate override, every collision is surfaced two ways: a `console.warn` naming the id(s), and a top-level `overriddenBuiltinIds` array on the result (empty when there's no collision) — see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md).
- A custom rule can report a margin as a built-in rule does: declare `meta.margin` (`{ measure, unit, limit }`) and return `marginCandidates` (see `RULE_AUTHORING.md`, `meta.margin`). A malformed `meta.margin` is ignored, so that rule reports no margin; the scan carries on.
- An invalid descriptor (missing/non-string `id`, a `runInPage` that isn't a function and isn't a reconstructable source string, or a `meta` that fails validation, such as `deprecated: true` without `deprecation`) is skipped with a `console.warn` naming the rule and the reason — the rest of the scan, including every built-in rule, still runs normally. This isn't a validation gap to fix: a custom rule is arbitrary caller-supplied code, so "fail this one entry closed, don't abort the scan" is the safer default, mirroring how a *built-in* rule that throws is contained to a `cantTell` for that rule rather than crashing the run.
- Results appear in `checksResults` exactly like any other rule's, including automatic `selector`/`html`/`structuralPath` fill-in for `fail`/`cantTell` occurrences that only attach `{ __node }` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)).

## `contextSelector` (2nd runner argument, not an `engineOptions` field)

A CSS selector (or array of selectors) scoping the scan to one or more subtrees, resolved via `document.querySelectorAll` (all matches, not just the first). Pass `null` to scan the whole document.

- **A selector that matches nothing scans nothing.** Every rule reports `notApplicable`, the page-level rules included, and the result's `contextMatch` says so: `{ elementCount: 0, unmatchedSelectors: ['#mian'] }` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#top-level-result)). The run also logs a `console.warn`. A scope the page doesn't have is not widened to the whole page: a result for content you never asked about, a whole-page `pass` among it, would read as a result for the part you did. In an array, a selector that matches nothing is listed in `unmatchedSelectors` while the others are scanned as usual, so content that is only sometimes on the page, such as a cookie banner, can sit in the list. Before 1.10.0 a scope that matched nothing fell back to the whole document, without a word in the result.
- **A selector the browser can't parse throws**, alone or in an array, before any rule runs: `contextSelector: "#main[" is not a valid CSS selector.` The error carries `code: 'INVALID_CONTEXT_SELECTOR'` and `selector`, the selector that failed. Unlike a selector that matches nothing, it is always a mistake in the call. `runa11yCoreAcrossFrames` rejects with the same error. An error crossing `page.evaluate` (Playwright, Puppeteer) keeps only its message, which is why the message names the option and the selector. Before 1.10.0 an invalid selector was skipped, so on its own it scanned the whole document.

- **A single string** may itself be a comma-separated selector list (ordinary CSS union semantics) — `'#a, #b'` scans both `#a` and `#b`.
- **An array of strings** scans the union of every selector's matches — `['#a', '.card']` behaves the same as `'#a, .card'`; the array form exists for callers building the list programmatically.
- **Shadow DOM.** With `includeShadowDom` (the default), a scope includes the shadow roots inside it, and a scope that is itself a shadow host includes its own shadow root. The selector is matched against the document, so it can't select an element *inside* a shadow root; scope to its host instead.
- Overlapping/nested regions are deduped automatically — an element reachable from more than one matched root is only ever reported once, not once per region.
- **What a scoped result means.** Most rules judge each element on its own, and judge the elements in scope exactly as in a whole-page scan. Two kinds of rule depend on the page around them. Whole-page rules (`page-title-present`, `landmark-one-main` and the rest listed under `fragment` above) report `notApplicable`. Rules that compare elements across the page (`landmark-unique`, `landmark-no-duplicate-banner`, `-contentinfo` and `-main`, `landmark-banner-is-top-level`, `-complementary-`, `-contentinfo-` and `-main-is-top-level`, `accesskeys`, `heading-order`, `identical-links-same-purpose`, `identical-iframes-same-purpose`) still report what they find inside the scope, since two landmarks there sharing a name share it on any page, but report `notApplicable` instead of `pass`: the scan saw only part of the page, so it cannot say the page is fine. `duplicate-id` and `duplicate-id-aria` compare each element in scope with the whole document, since its duplicate can sit outside the scope, and report an element in scope whose id appears anywhere else. Their `pass` means no element in the scope shares its id with another element on the page; a duplicate pair entirely outside the scope is not reported, as with every rule, so it does not say the whole page is free of duplicates. `target-size-minimum` judges the targets in scope against neighbours anywhere in the document, since the spacing exception depends on what the page puts next to a target. `text-spacing-content-loss` judges the text in scope, and checks whether it comes to overlap text anywhere on the page.
- This changed from single-match (`querySelector`) to all-matches (`querySelectorAll`) semantics for the plain-string form too (2026-07-22) — a selector matching several elements previously scanned only the first, silently dropping the rest. If you relied on that first-match-only behavior, pin to a selector that only ever matches one element (e.g. an `#id`).
