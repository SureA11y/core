# Stress test of `main` — findings (2026-10)

Stress test of `main` at `63af298` (package version 1.9.0 plus the unreleased 1.10.0 changes). It looks for regressions, gaps between the docs and what the code does, and problems for anyone who extends or consumes the engine: custom rules and profiles, bindings, the browser extension, the CLI and surea11y-lab.

**How it was run.** About 2,000 scans:
- under jsdom (`runDomRulesInPage`);
- in Chromium through Playwright, with both `page.evaluate(runa11yCoreInPage)` and the standalone `surea11y.browser.js`;
- against an `npm pack` tarball installed in a separate project.

No source file was changed. Each finding gives a minimal repro and the code location. **[V]** marks findings re-checked independently while writing this document. The rest were reproduced once by the probe that found them.

Categories: **bug**, **false positive / false negative** (rule accuracy), **contract** (output or extension contract broken), **doc** (docs and code disagree), **ergonomics**, **perf**, **feature** (missing capability).

---

## 1. Priorities

Ordered by how much damage each does to trust in CI results or to integrators.

| # | Finding | Area | Category |
|---|---|---|---|
| P1 | [Text over a background that isn't an ancestor is falsely failed with `high` confidence (hero images, overlays, `::before`)](#r-1) **[V]** | rules | false positive |
| P2 | [`oklch()` / `lab()` / `color()` / `color-mix()` backgrounds are treated as transparent (Tailwind v4)](#r-2) **[V]** | rules | false positive/negative |
| P3 | [Page-level findings get a new baseline/SARIF fingerprint whenever *any* content changes](#o-1) **[V]** | outputs | bug |
| P4 | [Formatters take a cross-frame result, an array or garbage and output a clean pass](#o-3) **[V]** | outputs | bug |
| P5 | [Shadow-DOM occurrences: the selector and `structuralPath` resolve to the wrong element](#o-4) | outputs | bug |
| P6 | [Scoping to a shadow host skips that host's own shadow root](#s-1) **[V]** | options | bug |
| P7 | [A custom rule written with method shorthand (as in the docs' own example) is silently dropped once stringified](#c-2) **[V]** | custom rules | bug / doc |
| P8 | [A bad `meta.deprecated` / `meta.i18n` in a custom rule aborts the whole scan](#c-1) **[V]** | custom rules | bug |
| P9 | [The margin tie-break is O(n²): contrast-minimum on 40k paragraphs went from 2.4–2.7 s to 16 s](#r-4) **[V]** | rules | perf (regression) |
| P10 | [Results with function custom rules or rich `probes` can't be cloned or serialised](#s-2) | options | bug |
| P11 | [`policyContract: 'constructor'` (or any inherited property name) crashes the scan](#s-3) **[V]** | options | bug |
| P12 | [A typo in an object-form `runOnly` or in `engineOptions.rules.include` silently runs 0 rules](#s-4) **[V]** | options | ergonomics |
| P13 | [Ancestor opacity counted twice because a cache is filled in the wrong order](#r-3) | rules | false positive |
| P14 | [No `helpUrl` / SC URLs / engine version in results, SARIF or the report](#o-5) | outputs | feature |

---

## 2. Custom rules and extensibility

What a third party meets when adding rules (`engineOptions.customRules`) or a standard/profile (`profiles/`, `profile-kit`).

<a id="c-1"></a>**C-1. A bad `meta` field aborts the scan instead of skipping the rule** — bug, doc **[V]**
- `customRules: [{ id: 'z', meta: { deprecated: true }, runInPage: f }]`, or `meta: { i18n: {} }`, makes `runDomRulesInPage` throw `Rule z: meta.deprecated:true requires …`.
- ENGINE_OPTIONS.md promises that an invalid descriptor is skipped and the scan carries on.
- The cause is that `normalizeRuleMeta` is not wrapped in a try/catch for custom rules (`src/core/dom-runner.js:840`, `src/core/rule-meta.js:110,149,155`).

<a id="c-2"></a>**C-2. Stringified methods are silently dropped** — bug, doc **[V]**
- `({ runInPage(ctx) {…} }).runInPage.toString()` produces `runInPage(ctx){…}`, which `new Function('return (' + src + ')')` cannot parse. Class methods and `async` methods fail the same way.
- The rule is skipped with no warning. `runOnly: ['z']` is still accepted, so the scan runs **0 rules** and exits cleanly.
- The ENGINE_OPTIONS.md custom-rule recipe (~line 327) uses method shorthand, and BINDING_AUTHORS_GUIDE.md tells Playwright users to pass `fn.toString()`. Following both docs therefore loses the rule.
- Fix: also try `function ` + src when the plain parse fails, and warn on any reconstruction failure.
- Code: `dom-runner.js:821,835-837`.

<a id="c-3"></a>**C-3. Invalid descriptors vanish without a trace** — ergonomics
- These are all dropped with no `console.warn` and no field on the result:
  - a missing `id`;
  - a `runInPage` with a syntax error, or `runInPage: "42"`;
  - a body-only source string;
  - `customRules` passed as an object instead of an array.
- Bare-array `runOnly` validation looks only at the raw `r.id`, so a typo becomes a green run that checked nothing.
- Suggestion: a `skippedCustomRules: [{ id, reason }]` field next to `overriddenBuiltinIds`.

<a id="c-4"></a>**C-4. A rule that returns `undefined` / `null` / a string is missing from `checksResults`** — bug **[V]**
- A rule that throws becomes `cantTell` with an `error`, but one that returns nothing usable disappears entirely (`dom-runner.js:1204`).

**C-5. Async rules become `cantTell` with an empty `error`** — bug / feature
- An `async` `runInPage` returns a Promise, which is coerced to `cantTell` with `error: ''`.
- An async `applicability` that resolves to `false` counts as applicable, because a Promise is truthy.
- Nothing documents that rules must be synchronous. Either document it and report "runInPage returned a Promise", or support async rules.

**C-6. Unknown outcomes are coerced with no explanation** — ergonomics
- `'failed'`, and `'inapplicable'` (the spelling `outcomeNormalized` itself uses), become `cantTell` with `error: ''` (`scripts/build-core.js:1391`).

**C-7. `severity`, `confidence` and `type` are not validated** — contract
- `defaultSeverity: 'blocker'` or a returned `severity: 'blocker'` reaches the result as is, outside the `Severity` union in `index.d.ts`.
- `defaultConfidence: 'certain'` also passes through.
- `type: 'Manual'` becomes `automatic` without a word, so the manual-fail coercion is lost.

**C-8. Whatever a rule returns is copied onto the result unchecked** — contract
- A rule can return `wcagVersionScope`, `engineOptions` or any other key and so spoof engine-owned fields (`build-core.js:1382`).
- A circular occurrence works in-page but then fails `page.evaluate` with a JSON error that doesn't name the rule.

**C-9. The result-shape contract isn't enforced for custom rules** — contract
- `pass` and `notApplicable` keep the occurrences the rule returned.
- `fail` with `[]` stays `fail`. ENGINE_OPTIONS.md says that shape is "reserved" for a rule that threw.
- `occurrences` that isn't an array becomes `[]` and the outcome stays `fail`.
- Non-object occurrences become `{}`.
- A non-element `__node` gets `selector: "html"`, which points at the wrong element.
- Code: `build-core.js:1440-1470`.

**C-10. Duplicate custom ids: the last one wins silently** (`dom-runner.js:851`).

**C-11. A custom id equal to a composite id isn't detected**
- `id: 'wcag-1.1.1-non-text-content'` appears in both `checksResults` and `rulesResults`.
- `overriddenBuiltinIds` is `[]` and no warning is logged, because only `CHECK_DEFS` is checked (`dom-runner.js:847`).

**C-12. The docs' custom-rule example ignores `excludeSelectors` and hidden content** — doc
- The example uses `ctx.helpers.queryAll`, which ignores both the global and the rule-scoped `excludeSelectors`, and reports `[hidden]` elements.
- The engine doesn't filter occurrences afterwards. The example should use `queryAllSmart`, and RULE_HELPERS.md should say which helpers apply exclusions.

**C-13. Custom rules can't join WCAG composites by mapping, and custom composites can't be added** — feature
- A custom rule mapped to WCAG 1.1.1 that fails leaves composite 1.1.1 at `cantTell` with `rollupIds: []`.
- An override of `img-alt-present` that declares no mapping still rolls into 1.1.1 by its id.

**C-14. Under a profile, a custom rule without WCAG tags never runs** — doc
- Worse, an override of a built-in that doesn't repeat the built-in's tags *removes* that built-in under a profile. Composite 1.1.1 then drops to `cantTell`, and the only signal is the override warning.

**C-15. Catalog APIs ignore `customRules`** — feature, doc
- `getChecksCatalog(eo)`, `getCheckDefById('z', eo)` and `getChecksForRunOnly(['z'], eo)` don't see custom rules.
- This contradicts ENGINE_OPTIONS.md:164 ("a catalog entry and a result always agree").
- A UI such as surea11y-lab can't list a custom rule's metadata before scanning.

**C-16. A custom rule's `helpUrl` and custom tags are lost in every output** — feature
- `normalizeRuleResult` doesn't copy them.
- SARIF `driver.rules` has no `helpUri` and drops non-WCAG tags (`src/sarif.js:90`).

**C-17. EARL leaves out `isPartOf` unless a WCAG mapping carries `conformanceLevel`**, which the types mark as optional (`src/earl.js:60`).

**C-18. Shorthand `runOnly` doesn't trim**
- `id: ' z '` runs as `z`, but `runOnly: ['z']` throws (`build-core.js:1163` vs `dom-runner.js:834`).

**C-19. `index.d.ts` gives custom-rule authors nothing**
- `ctx` and the return value are `unknown`.
- `meta` is required in the type but optional at runtime (`src/index.d.ts:76-83`).
- RULE_HELPERS.md leaves out `helpers.aria.getRequiredAttrImplicitValue`, `landmarkCandidateSelector` and `ctx.engineTag`.

**C-20. Profiles can only be added by forking core** — feature
- `profile-kit` isn't exported (`ERR_PACKAGE_PATH_NOT_EXPORTED`).
- The files `profile:new` generates require `../../src/...` and `../../../tests/helpers/...`, despite the README saying "as a profile outside this repository would".
- An unknown `engineOptions.profile` only warns and then runs all rules.
- A runtime `customProfiles` (or `customStandards`) option, or an exported `profile-kit`, would let a binding ship a national standard without forking.

**C-21. `profile:new` accepts the key `section508`**, which collides with the built-in profile name (`scripts/profile-new.js:36`, `RESERVED_KEYS`).

**C-22. The key `acme-std` fails core's own boundary test**
- `tests/profile-new.test.js` hard-codes `profiles/acme-std`, so a scaffold under that name trips `profile-boundary.test.js`.
- The README claims the scaffold passes the boundary check.

**Suspected:**
- An invalid `applicability` string silently becomes "always applicable".
- An invalid `uncertainty.code` is dropped silently.

**Held up:**
- Function and string sources: arrow, minified and named declarations, in jsdom, the in-page runner and the bundle.
- A closure variable surfaces as `cantTell` with `error: "OUTER is not defined"`.
- Thrown errors are contained.
- Overrides warn and fill `overriddenBuiltinIds`.
- `ctx.config`, `ctx.inputs.probes` (sanitised) and `ctx.rule.data`.
- `__node` fill-in.
- Tags and excludes on custom rules.
- Manual coercion, the `wcag22-removed` coercion, and `meta.margin` with `marginCandidates`.
- i18n through `meta.i18n` plus `messages`.
- 200k occurrences in about 0.7 s.
- Deterministic output.
- SARIF, JUnit, baseline and the HTML report all include custom rules.
- The `profile:new` scaffold builds and its tests pass.

---

## 3. Options, selection and scoping

<a id="s-1"></a>**S-1. `contextSelector` pointing at a shadow host skips that host's own shadow root** — bug **[V]**
- Setup: `<div id=host>`, whose open shadow root holds `<img><button></button>`.
- Scope `'#host'`: both rules are `notApplicable`. Scope `'main'`: both are `fail`.
- Cause: `collectShadowRoots` walks `scope.querySelectorAll('*')`, which never returns the scope element itself (`src/core/dom-helpers.js:1216,1245`).
- ENGINE_OPTIONS.md should also say that `contextSelector` can't select *into* a shadow root.

<a id="s-2"></a>**S-2. Some non-JSON option values make the result impossible to serialise or clone** — bug
- Every `checksResults[i].engineOptions` and `rulesResults[i].engineOptions` is a raw shallow copy of the caller's options. Only `messages` is stripped (`dom-runner.js:1276-1294`).
- **`probes`:** rules see a capped copy, but the echo carries the raw object.
  - A circular, BigInt or throwing-getter probe makes `JSON.stringify(result)` throw.
  - A deep probe overflows `structuredClone`.
  - A 25 MB `crawl.pageTitles` probe, copied about 168 times, causes `RangeError: Invalid string length`.
- **`customRules` with real functions** (the documented Node usage): `structuredClone(result)` throws, so `postMessage` to an extension or a worker fails, and the rule source is repeated in every entry.
- Fix: echo the sanitised probes, and either a `{ id }` summary of `customRules` or nothing.

<a id="s-3"></a>**S-3. `policyContract: 'constructor' | '__proto__' | 'toString'` crashes the scan** — bug **[V]**
- The scan throws `TypeError: Cannot read properties of undefined (reading 'slice')`.
- The lookup has no own-property check (`src/policy/resolvePolicy.js:8`).
- An unknown name such as `'nope'` falls back without a warning.

<a id="s-4"></a>**S-4. `runOnly` validation is inconsistent** — ergonomics **[V]**
- **Bare arrays and strings** throw on a typo, but the error has no `code`, unlike `INVALID_CONTEXT_SELECTOR`.
- **The object form fails silently.** `{ tags: ['nonsense'] }`, `{ includeRuleIds: ['nope'] }`, `{ type: 'tag', values: ['nonsense'] }` and `engineOptions.rules.include: 'typo'` all **run 0 rules** with no warning, so a CI gate passes.
- **Other silent cases:**
  - `runOnly: 42` or `true` runs every rule.
  - `[]` and `''` also run every rule, against the doc's "a typo can't quietly run every rule or none".
  - `['IMG-ALT-PRESENT']` throws, although tags match case-insensitively.
- Code: `scripts/build-core.js:1149-1183,822`.

**S-5. An invalid `excludeSelectors` is silently ignored, while an invalid `contextSelector` throws**
- This holds for the global list and for the rule-scoped one (`dom-helpers.js:1093`).

**S-6. Values of the wrong type are ignored without a warning**
- **Falls back silently:**
  - `contextSelector: 5 | {} | [5]` scans the whole document with `contextMatch: null`, the "widening" the 1.10.0 notes say no longer happens.
  - `engineOptions.tags: ['wcag2a']` (not `{ include }`) runs every rule.
  - `wcagVersion: 2.1` (a number) gives 2.2.
  - `profile: 5` gives no warning.
  - `timestamp: new Date()` comes back as `null`.
- **Messages:**
  - The `optInRules` warning reads "use "all" or one of: " followed by an empty list.
  - `pageUrl: {}` is copied into `result.url`.

**S-7. `duplicate-id` under a scope returns `pass` on a page that has duplicates** — bug/doc **[V]**
- `runDomRulesInPage(u, '#a', { wcagVersion: '2.1' }, ['duplicate-id'])` with duplicates inside `#b` gives `pass`.
- ENGINE_OPTIONS.md:378 says its `pass` "holds for the page"; it should be `notApplicable`, or count the whole document.
- `deprecated-elements-not-used` and `server-side-image-map-absent` also `pass` on an empty scope.

**S-8. The three contrast rules attach a page-level occurrence to `pass`**
- That happened 2,517 times across the fixtures. OUTPUT_SCHEMA.md:153 says a pass has `occurrences: []`.

**S-9. The docs disagree on what a rule that threw looks like**
- ENGINE_OPTIONS.md:274 says `fail` with empty occurrences.
- OUTPUT_SCHEMA.md:148 and the runtime say `cantTell` with `error`.

**S-10. POLICY.md:43's inline-contract example is wrong**
- `allowedConfidence: ['high', 'medium']` doesn't turn low-confidence results into `cantTell`; the confidence falls back to the rule's default, which can still be `low`.

**S-11. `includeHiddenElements: true` changes nothing for the common rules**
- Rules apply their own accessibility-tree visibility after `queryAllSmart` (`dom-helpers.js:1298`). Either document that narrower meaning or make the option do what it says.

**S-12. `index.d.ts` gaps**
- `policyContract`, `policy` and `output` aren't declared on `EngineOptions`, and the index signature lets a typo such as `polcyContract` compile.
- `label-in-name` emits a stray `occurrence.outcome` (line ~534), probably meant to be `occurrenceOutcome`.
- Thrown error codes aren't typed.

**S-13. Smaller doc slips**
- I18N.md's example shows 848 keys and `es` at 99.8%; the real figures are 863 and 100%.
- `runOnly: ['wcag412']` produces no `rulesResults` (composites are selected only by level tags). OUTPUT_SCHEMA.md does cover this.

**jsdom vs Chromium:**
- The layout rules (`target-size-minimum`, `text-spacing-content-loss`, `scrollable-region-focusable`) are `notApplicable` under jsdom, as documented.
- `contrast-*` on a page with no background is `notApplicable` under jsdom and `pass` in Chromium. This is consistent with strict mode, but LIMITATIONS.md should say so explicitly.

**Held up** (about 1,500 option combinations):
- Every `runOnly` form, plus profiles, `wcagVersion` inference and coercion, and `mappings`.
- `contextSelector` (strings, lists, arrays, invalid → throw with `code`, unmatched).
- Global and rule-scoped excludes, `includeShadowDom`, `fragment`, and locale fallback.
- No English leaks in de/es/fr/ja.
- `output.*`, `timestamp`, `perfStats`.
- Invariants: outcomes always in the allowed set, a built-in `fail` always has occurrences, results deterministic, and `tsc --strict` compiles a consumer.

---

## 4. Outputs and integration (bindings, extension, CLI, lab)

<a id="o-1"></a>**O-1. Page-level findings change fingerprint whenever any content changes** — bug **[V]**
- `html-lang-attr-present` uses the whole `<html>` outerHTML, cut at 2,000 characters, as its `html`.
- Baseline and SARIF identity is `ruleId + reasonCode + html`. Adding an unrelated `<p>` gives `newCount: 1, staleCount: 1`, and GitHub code scanning would close the alert and open it again.
- The body-level `cantTell` findings (bypass-blocks, landmark-one-main, page-has-heading-one) carry body snippets of about 2 KB too.
- Fix: page-level rules should report the start tag only, e.g. `<html>`.
- Code: `src/checks/automatic/language-page-present.js:87,117`, `src/core/dom-helpers.js:1950`.

**O-2. Attribute order breaks baseline identity**
- `<img src class>` vs `<img class src>`, or a class list in another order, counts as new plus stale (`src/baseline.js:28`).
- Frameworks reorder attributes freely. Normalise (sort attributes and classes) before hashing, or at least document it in BASELINE.md.

<a id="o-3"></a>**O-3. Formatters take a cross-frame result, an array or garbage and output a clean pass** — bug **[V]**
- `renderJunitReport({ topFrame, frames })` gives `tests="0" failures="0"`.
- The same holds for `renderHtmlReport`, `renderSarifReport`, `buildBaselineEntries`, `matchBaseline` and `getMargins` given `[r1, r2]`, `'x'` or `5`.
- EARL handles arrays but not frame trees.
- A CI gate therefore passes on a page full of violations when a binding hands over the `runa11yCoreAcrossFrames` output.
- Fix: flatten `{ topFrame, frames }` (labelling each frame's URL), and throw a `TypeError` on anything that isn't a result.

<a id="o-4"></a>**O-4. Occurrences in shadow DOM can't be located** — bug/doc
- A link inside a shadow root gets `selector: "a"` and `structuralPath: []`. `document.querySelector("a")` returns a *different*, light-DOM link.
- Two hosts with identical shadow content produce identical occurrences, because nothing records the chain of hosts.
- OUTPUT_SCHEMA.md says `[]` means `documentElement` and that the selector "actively verifies it resolves to the reported element".
- Proposal: `selector` as an array per shadow boundary (axe-core's convention) or a `shadowHostPath`, and a `structuralPath` that crosses roots (`dom-helpers.js:4880`).

<a id="o-5"></a>**O-5. Results don't carry enough for UIs** — feature
- `helpUrl` is `""` for 133 of 134 rules, and check results have no `helpUrl` at all.
- 114 of 120 `normativeMappings` have no `url`, and `/wcag` gives titles only.
- SARIF rules have no `helpUri` or `help` (`src/sarif.js:89-100`).
- No package version anywhere: `engine.tag` is `"a11ycore"`, SARIF `driver.version` defaults to `"0.0.0"` (`sarif.js:216`), and EARL leaves the assertor release out.
- Suggestions:
  - add `engine.version`;
  - generate a `helpUrl` per rule (the docs site);
  - generate the W3C Understanding URL for every SC mapping.

**O-6. SARIF can be invalid**
- An occurrence with no `summary` yields `message: {}` or `{ text: "" }`. SARIF 2.1.0 requires `text`, so GitHub rejects the file (`sarif.js:105-108`).
- The artifact URI isn't percent-encoded and can climb out of the repo (`"../../../x y/a b.html"`, `sarif.js:36-47`).
- The fingerprint holds raw `\u0000` separators and up to about 2 KB of HTML; a huge page gives 3.9 MB of SARIF. Hash the fingerprint.

**O-7. A custom rule given as a string is silently dropped under a strict CSP**
- Setup: the bundle loaded by a page whose policy is `script-src 'self'` with no `unsafe-eval`.
- The rule disappears because `new Function` is refused (`dom-runner.js:821`). The function form and Playwright's `evaluate` work.
- This affects extensions (MV3) and bookmarklets. It should be documented and warned about.

**O-8. The `/browser` subpath is an empty module for bundlers**
- `import b from '@surea11y/core/browser'` gives `{}`; only the `window.a11ycore` side effect works.
- API_STABILITY.md says the subpath is meant for bundlers.

**O-9. The `./i18n/*` export can't be used from Node and isn't documented**
- `require('@surea11y/core/i18n/de')` throws "load surea11y.browser.js first".
- The export is missing from API_STABILITY's table of entry points.

**O-10. Subpaths have no types**
- Under `tsc --strict` (nodenext), `/report`, `/sarif`, `/junit`, `/earl` and `/baseline` give TS7016. This is acknowledged in API_STABILITY.md, but it hurts every TypeScript binding.

**O-11. The HTML report isn't deterministic**
- `<title>` and the header use `new Date()` (`src/report.js:645`) and ignore `result.timestamp`, although REPORT.md calls the function pure.

**O-12. Payload size**
- An empty page produces a 204 KB result: 147 KB of checks and 57 KB of rollups, mostly meta, titles and rollup `data` repeated in every entry.
- A 5k-element page produces 2.2 MB, and four tiny frames produce 820 KB.
- For the extension and for postMessage, consider an `output.compact` mode that keeps meta in a single catalog keyed by rule id.

**O-13. Cross-frame entries don't identify the iframe**
- A frame that never responds is reported as `url: "about:blank"`, not its `src`.
- Entries carry no index, title or selector of the `<iframe>` element.

**O-14. `src/explain/` isn't shipped and is incomplete**
- It isn't in `files` or `exports`.
- It refers to `docs/ai-assisted-explanations.design.md`, which doesn't exist.
- It groups `notApplicable` notes too.
- Its budget follows rule order, not severity.
- `coarse-signature.js:24` cuts `a[href="#top"]` down to `a[href="`.

**O-15. Smaller items**
- The "Reporters" list in API_STABILITY.md omits `/junit`.
- `waitForPageReady` silently turns a negative, `NaN` or `Infinity` `timeoutMs` into 5000.
- EARL merges every result without a URL into a single `about:blank` subject.

**Suspected:**
- Truncating at 2,000 UTF-16 units can split a surrogate pair.
- SARIF relative paths are likely wrong for `file:///C:/…` on Windows.
- `getChecksCatalog({ profile: 'bogus' })` returns the full catalog.

**Held up:**
- Every subpath except `i18n/*` resolves through CJS and ESM from the packed tarball.
- Light-DOM selectors resolve uniquely, even with odd ids.
- **HTML report escaping holds**: no XSS payload in alt, title, aria-label, id, the report title or a tampered ruleId ran a script.
- JUnit always parses and strips control characters.
- SARIF has its essentials.
- Baselines count repeats correctly and never baseline `cantTell`.
- The bundle and its i18n side files translate correctly.
- Cross-frame scanning of same-origin, srcdoc and nested frames works.
- `waitForPageReady` behaves as documented.

---

## 5. Rules — contrast, layout and visual

<a id="r-1"></a>**R-1. contrast-minimum / -enhanced: background found from DOM ancestors only** — false positive, **high impact** **[V]**
- Overlap isn't considered (`computeEffectiveBackground`, `src/core/contrast-helpers.js:1232-1300`), and LIMITATIONS.md doesn't mention it.
- Each of these fails with `confidence: high`, `#ddd` "on #fff" at 1.36:1:
  - text absolutely positioned over a black sibling `<div>`;
  - text over an `<img>` hero;
  - text with a `::before` background and `z-index: -1` behind it;
  - text pulled with `margin-top: -50px` over a dark block.
- The real ratio is about 15:1.
- This is the standard hero/card pattern.
- Fix: in a real browser, check `elementsFromPoint` at the text's rects. When an element that isn't an ancestor is painted under the text, report `cantTell` (or compute against it) rather than `fail`.

<a id="r-2"></a>**R-2. Modern colour syntax as a background is treated as transparent** — false positive and false negative, **high impact** **[V]**
- Chromium serialises `oklch()`, `lab()`, `color(display-p3 …)` and `color-mix()` as written. `parseCssColorToRgba` returns `null`, and that background layer is skipped (`contrast-helpers.js:765-932,1284`).
- `background: oklch(0.2 0 0)` with `#ddd` text gives a high-confidence fail at 1.36.
- White text on the same background is dropped as "same colour as the background" and never checked.
- As a foreground colour these syntaxes give only a `contrast-computable` `cantTell`.
- All of Tailwind v4's palette is oklch.
- Fix: convert oklch, oklab, lab, lch and `color()` to sRGB (the maths is small). Failing that, treat an unparsable background as a blocker (`cantTell`) and never as transparent.

<a id="r-3"></a>**R-3. Ancestor opacity counted twice, because a cache is filled in the wrong order** — false positive
- Setup: `html { background: #000 }` + `<div style="opacity:.5"><p style="background:#fff;color:#000">`.
- The engine fails it at 2.63; the real pixels give 5.32, a pass.
- Cause: the same-colour check (`contrast-helpers.js:561`, which calls `:507`) caches the naive foreground before `resolveGroupOpacityColors` stores its override, and `computeEffectiveForeground` reads that cache first (`:1176` before `:1179`).
- link-in-text-block is affected too.

<a id="r-4"></a>**R-4. The margin tie-break is O(n²)** — perf, **regression from the margin feature (`6fc8d33`)** **[V]**
- `resolveMargin` calls `compareDocumentPosition` on every tie (`src/core/margin.js:52-63`). In Blink each call is O(n) over siblings, and on a page where many text runs share a colour every candidate ties.
- Measured in Chromium with `perfStats.ruleTimings['contrast-minimum']`, two runs each. The page is N `<p style="color:#000">` (all passing, all tied), either as siblings or each wrapped in its own `<div>`:

| Page | Before margins (`2750774`) | HEAD (`63af298`) | HEAD with the tie-break disabled |
|---|---|---|---|
| 5k siblings | 359 / 321 ms | 468 / 315 ms | 410 / 322 ms |
| 10k siblings | 793 / 579 ms | 1,065 / 921 ms | 836 / 662 ms |
| 20k siblings | 1,648 / 1,376 ms | 3,358 / 3,003 ms | 1,136 / 1,164 ms |
| 40k siblings | 2,683 / 2,410 ms | **15,981 / 16,008 ms** | 2,698 / 2,529 ms |
| 5k wrapped | 618 / 428 ms | 517 / 522 ms | 528 / 369 ms |
| 10k wrapped | 1,022 / 1,137 ms | 1,160 / 976 ms | 900 / 797 ms |
| 20k wrapped | 2,156 / 1,647 ms | 3,456 / 3,119 ms | 2,074 / 1,819 ms |
| 40k wrapped | 4,480 / 3,259 ms | **20,494 / 20,071 ms** | 3,812 / 3,512 ms |

**What it means in practice.** Below about 10k text runs the cost is small. On long pages (documentation sites, long tables, infinite-scroll feeds) contrast-minimum becomes about 6× slower: 40k paragraphs take about 16 s instead of about 2.5 s. contrast-enhanced has the same pattern, and so does any rule that reports a margin over many tied candidates.

**Cause.**
- When two candidates are equally close to the threshold, `resolveMargin` (`src/core/margin.js:52-63`) calls `best.el.compareDocumentPosition(c.el)` to keep the one earlier in the page.
- On a page where most text shares a colour, nearly every candidate ties, so the loop makes one such call per candidate.
- In Blink each call can walk the siblings between the two elements, and the current best is always the first element, so the distance grows with every candidate. The total work is therefore quadratic in the number of candidates.
- Disabling only the tie-break (patched into a copy of the built browser bundle; nothing in `src` changed) brings HEAD back to pre-margin timings, so the tie-break is the whole cost.

**Proposed fix** (not applied):
- **The contract to keep.** A tie goes to the element first in document order, whatever order the rule pushed candidates in. This is stated in OUTPUT_SCHEMA.md and RULE_AUTHORING.md, and tested in `tests/core/margin.test.js` ("a tie goes to the element first in document order", which pushes `c, a, b`). So "keep the first candidate pushed" alone is only correct when the rule pushes in document order.
- **Settle ties once, at the end.**
  - While looping, keep only the list of candidates tied at the smallest headroom (resetting it when a strictly smaller headroom appears), with no `compareDocumentPosition` in the loop.
  - At the end, check whether the tied list is already in document order by comparing each element with the *next* one. Neighbours are close in the tree, so each call is cheap. If it is in order, the first tie is the answer.
  - Only when it is not in order (several scan roots, shadow trees, a custom rule pushing out of order) fall back to finding the earliest among the tied candidates.
  - All the contrast, target-size, text-spacing and link-in-text-block rules collect candidates in page order, so in practice they always take the fast path.
- **Same answer as today.** On in-order ties the current loop also ends with the first tie. The fallback keeps today's rules for a tie with no element, the same element twice, and disconnected trees.
- **Regression test.** A test with about 20k tied candidates and a time budget, and a test that pushes ties out of document order (the existing `c, a, b` case already covers this).

**R-5. Margins disappear, and `measuredCount` is undercounted, after 50 failures**
- Both contrast rules `break` at 50 occurrences (`contrast-minimum.js:553`, `contrast-enhanced.js:530`), and that also stops collecting margin candidates.
- So the margin depends on document order: 60 failures followed by one 4.61:1 paragraph give no margin at all.

**R-6. link-in-text-block: false fail when the visible cue is on a child**
- `<a style="text-decoration:none;color:#222"><strong>link</strong></a>` fails with `COLOR_ONLY_DIFFERENTIATION`. So do `<em>` and an underlined `<span>` inside the link. Only the link's own style is read (`link-in-text-block.js:513-545`).
- False negatives:
  - a link wrapped in a `<span>` is `notApplicable` (`:455`);
  - `text-decoration-color: transparent` and a transparent `border-bottom` pass.

**R-7. SVG `<text>` is judged by `color` rather than `fill`**
- That gives a false fail with `fill="#000"` and `color: #eee`, and a false pass the other way round.

**R-8. contrast-minimum reports text nobody sees**
- It fails text in each of these cases:
  - a non-selected `<option>` of a closed `<select>`;
  - `left: -9999px`;
  - `height: 0; overflow: hidden`;
  - `font-size: 0`;
  - `color: transparent` (1.00);
  - `rgba(0,0,0,.02)`.
- Some of these clear only under `visibilityMode: 'styleAndGeometry'`, which should be the default in a real browser.

**R-9. css-orientation-lock and css-focus-indicator-suppressed don't walk nested at-rules** — false negative
- Only top-level `@media` is scanned (`css-orientation-lock.js:316`).
- An orientation lock still passes when it sits inside:
  - `@layer`;
  - `@supports`;
  - a nested `@media`;
  - `@container`;
  - CSS nesting;
  - `<style media="(orientation:portrait)">`.
- `a { &:focus { outline: none } }` is not caught.

**R-10. text-spacing-content-loss skips text that is already partly clipped**
- A fixed-height excerpt or `-webkit-line-clamp` gives `notApplicable` (`text-spacing-content-loss.js:443`).
- Its margin is measured against half the line height (about 8.5 px), while `TEXT_CLIPPED_PARTLY` fires above 2 px (`:574`). The headroom reported is therefore about 6× too large.

**R-11. target-size-minimum uses the bounding box**
- Targets clipped to 10×10, or two-thirds covered by another element, pass.
- A rotated 20×20 target reports 28.3.
- A link with `display: contents` is `notApplicable`.
- A 23.98 px target's message reads "24×30 … under 24×24", because of display rounding.

**R-12. `contrast.mode: 'auditorAssist'` ignores `color-scheme: dark`**
- It assumes a white canvas: `#bbb` text is failed at 1.92, where the real ratio is about 9.6.

**R-13. meta-viewport-zoom-enabled and meta-viewport-large disagree**

| Content | zoom-enabled | large |
|---|---|---|
| `maximum-scale=abc` | fail | pass |
| `user-scalable=0.5` | fail | pass |
| `maximum-scale=-1` | pass | cantTell |

- Two viewport metas still fail when the first says `user-scalable=no`, although the last one wins in Chrome.

**R-14. Smaller items**
- Text `<input>` values and placeholders are never contrast-checked.
- CSS `zoom: 2` text isn't treated as large.
- Alt-quality wording for alts that are probably fine (all `cantTell`): "F-35" and "WD-40" read as file names; "★★★★☆" reads as a placeholder.
- area-alt-quality and input-image-alt-quality have no occurrence cap, unlike img-alt-quality.

**Suspected:**
- css-orientation-lock fails a 10×10 icon rotated 90°.
- The last float digits of margins differ between jsdom and Chromium.
- text-spacing overlap detection grows faster than linear inside one band; it is capped at 3,000 nodes.

**Held up:**
- Solid colours, rgba, hsl with alpha, CSS variables, `currentColor` and `light-dark()`.
- **No rounding at 4.5** (`#777` fails at 4.478, `#767676` passes at 4.542).
- Exact large-text boundaries.
- Alpha stacking.
- Gradients, images, blend modes and filters give `cantTell`.
- sr-only, `visibility`, `opacity: 0`, `<details>` and disabled content are excluded.
- Margins are deterministic, and leave SARIF, JUnit, EARL and baseline output unchanged.
- The target-size spacing exception is exact.
- `engine.environment` is accurate.
- The alt-quality allowance holds to 4,000 images and scales linearly.
- Layout rules under jsdom are `notApplicable`, not wrong.

---

## 6. Rules — ARIA, names, forms and structure

_In progress — will be added when that pass completes._

---

## 7. Suggested features for integrators

Gathered from the findings above, ordered by value to bindings, the extension and the lab:

1. **`engine.version`** (package version) on every result, wired into SARIF `driver.version` and the EARL assertor (O-5).
2. **`helpUrl` per rule and an Understanding URL per SC** in the results and the catalogs (O-5, C-16).
3. **Shadow-aware locations:** a selector chain per shadow root and a `structuralPath` that crosses roots (O-4).
4. **Formatters that understand `runa11yCoreAcrossFrames` output**, with a type guard that throws on anything else (O-3).
5. **Diagnostics for custom rules:** `skippedCustomRules`, a warning when a source string can't be rebuilt (method shorthand, CSP), and output validation that names the rule (C-2…C-9).
6. **Catalog support for `customRules`**, so a UI can list them before scanning (C-15).
7. **A runtime profile or standard API**, or an exported `profile-kit`, so a standard can ship without forking core (C-20).
8. **A compact output mode**, with meta held once in a catalog, for extensions and postMessage (O-12, S-2).
9. **An option-validation mode** (`strictOptions: true`) that throws on unknown keys, wrong types or unknown ids and tags, instead of warning or falling back (S-4, S-5, S-6).
10. **Types for the subpaths and for rule authoring** (`RuleContext`, `RuleHelpers`, `RuleReturn`) (O-10, C-19).
11. **Stable fingerprints:** attributes sorted and page-level rules reporting only the start tag (O-1, O-2).
