# Stress test of `main`, fourth round: findings (2026-10-14)

A smaller fourth stress test of `main` at `3af2008`: version 1.11.1 plus everything unreleased. Most effort went to what was added since the third round:
- scans that name checks now report criteria, `wcagLevel` and `getRulesForRunOnly`;
- profiles that waive criteria, and pack profiles that set `wcagVersion`;
- rule ids matched in any case;
- the HTML report's self-scan.

Around that, it covered:
- options, packs and custom rules under hostile input;
- accuracy in Chromium on modern CSS and HTML;
- the reporters and stored results;
- fuzzing every rule under jsdom.

No source file was changed. Each area has its probes and a findings file under [`2026-10-probes-4/`](./2026-10-probes-4/):

| Area | Folder | Prefix | Runtime | Confirmed |
|---|---|---|---|---|
| Selection, and which criteria a scan reports | [`selection/`](./2026-10-probes-4/selection/FINDINGS.md) | SE | jsdom, Chromium spot checks | 5 (all low or low/medium) |
| Options, packs, custom rules | [`options/`](./2026-10-probes-4/options/FINDINGS.md) | OP | jsdom, CLI | 7 |
| Accuracy in Chromium | [`chromium/`](./2026-10-probes-4/chromium/FINDINGS.md) | CH | Chromium 141 | 5 (3 high) |
| Reporters and stored results | [`reporters/`](./2026-10-probes-4/reporters/FINDINGS.md) | RP | jsdom, Chromium | 7 |
| Fuzzing the rules | [`fuzz/`](./2026-10-probes-4/fuzz/FINDINGS.md) | FZ | jsdom, Chromium cross-checks | 7 |

That makes 31 confirmed bugs, with no overlap between areas, plus leads and suggestions. No scan threw and nothing crashed.

**How findings were verified:**
- Each probe reproduced its findings with a minimal script.
- During consolidation, these were re-run separately and all reproduce on `3af2008`: CH-1, CH-2, CH-3, OP-1, RP-1, FZ-1 and FZ-3.

Before fixing anything, reproduce it on current `main`.

**Evidence for the top findings.** [`2026-10-stress-test-4-evidence.md`](./2026-10-stress-test-4-evidence.md) weighs the findings ranked 1–7 below against WCAG, the ACT rules, the specs and browsers, and gives a verdict and the decisions each one needs.

## What held up

- **`getRulesForRunOnly` matches the scan.** On about 2,900 random selections, it gave exactly the scan's `rulesResults`, and `getChecksForRunOnly` its `checksResults`. The selections mixed rule ids in any case, tags, WCAG targets, levels and versions, every built-in profile, pack profiles, waivers, custom rules and `optInRules`.
  - No rollup contradicted its children.
  - No criterion appeared above `wcagLevel`.
  - 4.1.1 was never added under 2.2.
  - Repeat scans were identical.
- **Fuzzing:** about 7,000 jsdom scans of generated and mutated pages.
  - No scan threw.
  - Every result could be serialised.
  - No outcome contradicted its occurrences' tiers.
  - No message in five locales had an unfilled placeholder.
- **Reporters:** about 1,600 stored results passed through every reporter.
  - SARIF always validated, and JUnit was always well-formed XML.
  - Counts agreed across reporters.
  - Baselines round-tripped, and fingerprints held across scans and unrelated edits.
  - Hostile strings ran no script in the HTML report.
- **Packs and options:**
  - No prototype pollution through any option, pack or id.
  - Garbage returned by rules is contained.
  - No state leaks between scans.
  - `satisfiesRange` agrees with semver.
- **Chromium:**
  - Modern colour syntax (`light-dark()`, `color-mix()`, relative colours), colour schemes, zoom, container units and animations are measured right.
  - Target size, popovers, dialogs and declarative shadow DOM behave as expected.

---

## 1. Priorities

Ordered by how much each one damages trust in results.

### Wrong results

| # | Finding | ID | Kind |
|---|---|---|---|
| 1 | **A customizable `<select>` fails `nested-interactive-controls-absent`.** The HTML spec's `<select><button><selectedcontent>` markup is flagged for a nested button, which the browser makes inert. Every page that adopts the new select gets a false `fail`. | CH-1 | false fail |
| 2 | **Names set by script are ignored.** A control named through `ariaLabelledByElements` (Baseline 2025), or through `ElementInternals` (`ariaLabel`, `ariaChecked`, `ariaValueNow`) on a custom element, fails `button-name-present`, `form-control-programmatic-label-present`, `textbox-name-present`, `role-img-text-alternative-present` and `aria-required-attr`. Chromium names them. The fix for element references is to read the reflected property. Internals can't be read from a page, so the fix there is `cantTell` on defined custom elements. | CH-3, CH-2 | false fail |
| 3 | **A policy that doesn't allow `fail` still gives `fail`.** With `allowedOutcomes` set to pass, cantTell and notApplicable, a rule with fail-tier occurrences comes out `fail` (seen with `aria-prohibited-attr` and `aria-roles-valid`), so SARIF and JUnit fail CI. The tier-agreement step runs after the policy and undoes it. | RP-1 | contract |
| 4 | **Rule order changes verdicts.** Both cases break the determinism invariant: a rule alone and in a full scan give different answers.<br>• An aria-hidden subtree with an aria-labelledby cycle caches an unfinished answer.<br>• A closed `[popover]` isn't treated as hidden; under jsdom its `display` changes once another element's style has been read. | FZ-2, FZ-4 | nondeterminism |
| 5 | **`lang="constructor"` or `"__proto__"` makes 4 quality rules error out and silently weakens 3 alt-text rules.** The word lists are plain objects indexed by the page's language. | FZ-1 | bug |
| 6 | **Outlined or shadow-only text passes contrast.** `color: transparent` with a `#ccc` stroke on white (1.61:1 on screen) gives `pass` with no occurrence, because the "undrawn" and "same colour as background" shortcuts run before the stroke and shadow checks. | CH-4 | false negative |
| 7 | **Selectors can name the wrong element.**<br>• Under jsdom, when the path check fails (SVG `foreignObject`, a backslash in an id), the fallback uses a duplicate `#id` or a bare tag.<br>• No reporter shows `shadowHostSelectors`, so a finding in a shadow tree is located by a selector that matches another element. | FZ-5, RP-3 | bug |

### Options and packs fail without a word

| # | Finding | ID |
|---|---|---|
| 8 | **18 options of the wrong type are dropped with no warning**, though ENGINE_OPTIONS.md says such a value is "always" warned about. Examples: `locale: 5`, `output.detail: 'finding'`, `contrast.mode: 'auditor'`, `excludeSelectors: 5`. `strictOptions` finds them, but outside strict mode the result of its check is thrown away (`engine-options.js:268`). | OP-1 |
| 9 | **A checklist pack whose namespace-tagged rule sets `wcagSc` passes `definePack` and `checkPack`, then every scan skips it**, with an error that names EN 301 549. PACKS.md §3's own example invites this. | OP-2 |
| 10 | **`packScript` can write code that parses but isn't the rule's function**: a computed method name, a renamed method, a Symbol key or a getter. The rule then vanishes in the page, or no pack in the script registers at all. | OP-3 |
| 11 | **A variant takes `NaN`, `Infinity`, `0` or a negative ratio.** The base rule then uses its default, or never fails. | OP-4 |
| 12 | **Selection edge cases:**<br>• the lowercase `a11ycore-` prefix on a standard's rollup id selects nothing;<br>• a custom tag starting with `wcag` adds no criteria;<br>• `runOnly.optInTags` is accepted, then dropped;<br>• an excluded custom rule is "not selected, name it to run";<br>• a rule-mapped standard's tag is warned "unknown; ignored" yet still selects. | SE-1 to SE-5 |

### Speed

| # | Finding | ID |
|---|---|---|
| 13 | **p-as-heading under jsdom is super-linear in nesting depth.** At depth 100, 200, 400 and 800 it takes 0.85 s, 3.0 s, 19.5 s and 131 s. It ran 63 ms in Chromium. It was the slowest rule in every fuzz case over 8 s. Cause: a 45-selector `querySelector` per `div`. | FZ-3 |
| 14 | **Quadratic regexes on long values.** At 40k–80k characters:<br>• `autocomplete-valid`'s trim takes 7.3 s;<br>• `page-title-patterns` takes 18.9 s;<br>• two text-alternative helpers take 1.7–1.8 s. | FZ-6 |

### Smaller items

- **RP-2:** the HTML report fails its own `table-th-has-data-cells` check when no row is shown, for example on a clean result.
- **RP-4:** the HTML report throws on `null` entries, which the other reporters skip.
- **RP-5:** the French JUnit suite name has a trailing space.
- **RP-6:** SARIF adds notes for passing rules.
- **RP-7:** SARIF `uri` values are invalid for relative paths with spaces, and a non-string url throws.
- **CH-5:** `link-in-text-block` fails a link that draws nothing.
- **FZ-7:** a jsdom quirk makes a second scan of the same DOM miss a background image, so `@surea11y/core/testing` reports a false entry-point disagreement.
- **OP-5:** `surea11y-pack new` writes invalid packs for `--title WCAG` or `--name ' '`, and fills tokens inside the title.
- **OP-6:** strict pack errors carry no `code`.
- **OP-7:** the `strictOptions` warning is wrong for a Symbol and missing for a BigInt.

---

## 2. Leads and decisions

These are not clear bugs. Each needs a decision, or more evidence.

- **JUnit, SARIF and EARL ignore `wcagLevel` and `wcagVersion`.** An AA-scoped run gets a failing `WCAG 1.4.6` (AAA) JUnit suite, and naming `duplicate-id` under 2.2 gives a `WCAG 4.1.1` suite. JUnit builds suites from each rule's mappings rather than from `rulesResults`, and no doc says so. **Decide** whether the reporters should follow the scan's level and version. (`reporters/` leads)
- **Drop-down `<select>` contrast.** It is measured by the options' colours, not by what the closed control draws: a black select with grey options fails, and a grey select with black options passes. (CH-P1)
- **Generated text is not measured.** `::before`/`::after` content and `::marker` text are never checked, and the docs don't say so. (CH-P2)
- **Plain pages get many `cantTell`s.** With no background set on html or body, almost all text is `cantTell`, though Chromium paints a white canvas when no dark scheme is asked for. Reading the light canvas the way the dark one is read would clear most of these. (CH improvement 1)
- **`strictOptions` lets the costliest CI mistakes through.** An unknown `profile` (which runs every rule), unknown `mappings` or `optInRules` tags, and invalid `excludeSelectors` CSS only warn. (OP-P2)
- **The catalog functions don't validate options.** `getRulesForRunOnly` with `wcagLevel: 'AA+'` lists every level, where the scan throws under strict mode. (SE leads)
- **Results stored before the tier fix still split the reporters:** SARIF and JUnit fail them, while the baseline and EARL don't. (RP leads)
- **An idref exception applies to structure rules.** Hidden content referenced by `aria-labelledby` is still judged by `aria-required-children`. (FZ-P1)
- **An `applicability` that returns a non-boolean** makes the rule apply everywhere, with no note. (OP-P3)

## 3. Suggestions

- **Read element references and flag internals.** Read `aria*Elements` reflection everywhere ids are read. Add LIMITATIONS entries for internals-provided semantics, generated content, and the jsdom `background-image` and `[popover]` quirks.
- **Treat inert content the same in every rule:** `img-alt-decorative` still asks about an `<img>` inside `[inert]`.
- **Use `Object.create(null)` or a `Map` for every table indexed by a value from the page.** FZ-1 is one instance.
- **Wider self-scan test for the HTML report:** add a clean result, a cross-frame result, a pack, ja/de, and 320 px. At 320 px the report scrolls sideways.
- **JUnit suite names are translated**, so a locale change breaks CI test history. Consider stable, untranslated suite names.
- **`engine.environment` could record `forced-colors` and `prefers-color-scheme`.**
- **Speed:**
  - Cut off the typo-distance check by length (10k unknown keys add 2.3 s).
  - Skip `<option>` elements in contrast under jsdom.
  - Document that hosts should reuse pack objects (about 140 ms each to prepare).
- **Tests:**
  - Make every Chromium test launch through the shared `executablePath` lookup. 8 tests fail where only full Chromium is installed.
  - Turn `name-cycle-speed`'s 2.5 s wall-clock limit into a count of the work done. It took 5.8 s under load.
  - Adopt the selection probe's random-selection harness as a property test.
- **Docs:**
  - PACKS.md says a pack "never passed through definePack" is skipped, but such packs run.
  - PACKS.md says `ctx.rule` gives "its id", but the field is `ctx.rule.ruleId`.
  - The `wcagLevel` type rejects mixed case, which the docs allow.
  - The HTML report's "1 of 2 checks were not selected" needs the singular case.

## 4. State of `main` before this round

The full suite on `3af2008` passes 4,165, fails 9 and skips 98. None of the failures is an engine bug:
- **8** call `chromium.launch()` without the shared `executablePath`, and Playwright's headless-shell build isn't installed in the audit environment.
- **1** is `name-cycle-speed`, whose wall-clock limit was exceeded under the probes' CPU load.
