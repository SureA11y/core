# Stress test of `main`, third round — findings (2026-10-09)

> **Status:** what has been done about each finding, and what is still open, is in [`2026-10-stress-test-3-outcomes.md`](./2026-10-stress-test-3-outcomes.md). Item 1 is done in part (contrast-computable, text-spacing-content-loss), items 2 to 11 and 27 are done, items 22, 26 and 37 in part; the rest is open.

Third stress test of `main` at `eaa5d3f1`: package version 1.10.0 plus everything unreleased, including C-20 packs. It tried to break core, with most effort on what was added since the second round:
- packs in Node and in a page;
- `result.standards` and the reporters;
- the `surea11y-pack` scaffold and docs tool, the lint plugin and the test helpers;
- the package shape.

It also covered robustness, options and output contracts, and a comparison with the published 1.10.0 on saved real pages. target-size-minimum's rework was left out on purpose.

No source file was changed. Each area has its probes and a full findings file under [`2026-10-probes-3/`](./2026-10-probes-3/):

| Area | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| Packs in Node | [`packs-node/`](./2026-10-probes-3/packs-node/FINDINGS.md) | PN | jsdom | 24 (2 high) |
| Packs in a page, and the reporters | [`packs-browser/`](./2026-10-probes-3/packs-browser/FINDINGS.md) | PB | Chromium, jsdom | 24 |
| Scaffold, docs tool, lint, test helpers, package shape | [`tooling/`](./2026-10-probes-3/tooling/FINDINGS.md) | PT | npm tarball, tsc, Chromium | 22 (3 high) |
| Options, translations, output contracts | [`options-outputs/`](./2026-10-probes-3/options-outputs/FINDINGS.md) | OO | jsdom | 19 |
| Real pages (1.10.0 vs `main`), plus fuzzing | [`corpus/`](./2026-10-probes-3/corpus/FINDINGS.md) | CO | Chromium, jsdom | 7 |
| Robustness and scale | [`robust/`](./2026-10-probes-3/robust/FINDINGS.md) | RB | Chromium, jsdom | 13 |

That is 109 findings in all. Several areas found the same problem, and the table below merges those, leaving about 85 distinct issues.

**How findings were verified:**
- Almost every finding was reproduced twice by the probe that found it.
- During consolidation, these were re-run separately: every high finding, at least one medium finding per area, and the speed regression (timed again in Chromium on 6 pages).

Before fixing anything, reproduce it on current `main`.

---

## 1. Priorities

Ordered by how much each one damages trust in results, or blocks the 1.11.0 release. Items found by several areas are merged.

### Before 1.11.0

| # | Finding | IDs | Category |
|---|---|---|---|
| 1 | **Scans are ~26–29% slower than 1.10.0** on 118 real pages in Chromium (1.41× on 6 of the slowest, re-timed).<br>• contrast-computable +45–59%, bisected to `b41cfe2d` and `b8b3d747`.<br>• text-spacing-content-loss +27%.<br>• target-size-minimum (out of scope) is part of the total too.<br>The CHANGELOG calls the paint-order check faster, but compares it only with the earlier unreleased state.<br>**Status:** contrast-computable part done in `f3cb6fb9`, text-spacing-content-loss in `2fb74a60` (`fix/stress-test-3`); the rest open. See the outcomes file. | CO-7, RB-4 | perf, regression |
| 2 | **A pack namespace or `ruleTag` equal to a core tag silently removes core rules from every scan.**<br>• `best-practice` drops 27 rules, `landmarks` 11, `tables` 3.<br>• `surea11y-pack new aria-rules` (also forms-, images-, keyboard-, contrast) generates a pack that is skipped and whose own tests fail.<br>• `checkPack` reports no problem.<br>**Status:** done in `1fd97c9c` (`fix/stress-test-3`). See the outcomes file. | PN-1, PT-2, PT-9 | bug |
| 3 | **The pack cache skips validation.** An invalid pack seen once without strict mode no longer throws under `strictOptions` or in `packScript`.<br>Related: the string `'3'` collides with the object of internal id 3, and a pack changed after its first scan keeps its stale engine.<br>**Status:** done in `9f08404c` (`fix/stress-test-3`); see the outcomes file. | PN-2, PN-3, PN-4, RB-13 | bug |
| 4 | **`--title` is pasted unescaped into JS and JSON templates.** `Bob's Policy` gives a pack that doesn't load, and a crafted title runs code on `require`.<br>**Status:** done in `a5189830` (`fix/stress-test-3`); see the outcomes file. | PT-3 | bug / security |
| 5 | **Pack text can run as code in a page.**<br>• A line break (or U+2028) in a pack's name or version ends the generated script's comment.<br>• `</script>` in a rule's source breaks an inlined `buildBrowserBundle` and runs what follows.<br>• Versions are checked only by prefix.<br>**Status:** done in `eafebe3b` and `a5189830` (`fix/stress-test-3`); see the outcomes file. | PB-5, PB-6 | security |
| 6 | **Types that compiled against 1.10.0 no longer compile:**<br>• new required fields on `RuleMeta`, `ScannedFrame` and `UnreachableFrame`;<br>• a new `EngineErrorCode` member;<br>• a `Window.a11ycore` augmentation that conflicts with consumers' own (TS2717).<br>This goes against the no-breaking-changes principle.<br>Also: `pack.d.ts` mistypes `requirements` (the scaffold's own standard fails TS2740), and `runOnly` is mistyped in `testing.d.ts`.<br>**Status:** done in `34064a05` (`fix/stress-test-3`); see the outcomes file. | PT-14, PT-4, PT-11 | contract |
| 7 | **A rule that reads a module-level variable passes the pack's tests and lint, then fails in every browser** (`cantTell`, "X is not defined"). The test helpers run only the jsdom path, and no lint rule looks for free variables.<br>**Status:** done in `ca3e4dff` (`fix/stress-test-3`); see the outcomes file. | PT-1, PB-7 | contract |
| 8 | **`packScript` writes code that doesn't parse** for an arrow function with `(` in its parameters, or a bound function. `checkPack` accepts these, and the whole pack is then missing in the page.<br>**Status:** done in `a5189830` (`fix/stress-test-3`); see the outcomes file. | PN-10, PB-4, PT-16, RB-6 | bug |

### Wrong or misleading results (also in 1.10.0 unless noted)

| # | Finding | IDs | Category |
|---|---|---|---|
| 9 | **An occurrence's selector can resolve to another element.** When `#id`, `[data-testid]`, `[name]` or `[aria-label]` is shared with a hidden, excluded or out-of-scope element, `querySelector` returns that other element.<br>• Seen on the repo's own duplicate-id fixture.<br>• Responsive sites' hidden duplicate menus produce this shape.<br>• The same cause gives one element different selectors in jsdom and Chromium, so baselines don't carry over between them.<br>**Status:** done in `bb2ec5f8` (`fix/stress-test-3`); see the outcomes file. | OO-1, RB-2, RB-8 | bug |
| 10 | **A CSP that blocks inline styles turns text-spacing-content-loss into a confident `pass`.** The spacing is never applied, and nothing checks that it was.<br>**Status:** done in `65e9b385` (`fix/stress-test-3`); see the outcomes file. | RB-1 | false negative |
| 11 | **A button or link named only from a closed shadow root (also declarative `shadowrootmode="closed"`) is a confident `fail`.** Chrome names it.<br>**Status:** done for custom elements in `b84830ba` (`fix/stress-test-3`); see the outcomes file. | RB-3 | false positive |
| 12 | **An `aria-hidden` element whose `aria-labelledby`/`aria-describedby` names itself overflows the stack.** The affected rules end as `cantTell` with an error, sometimes after 5–18 s. | CO-1 | crash |
| 13 | **A selection that cancels itself out runs 0 rules with no warning, even under `strictOptions`**, and JUnit and SARIF show a clean pass. Examples: includes cancelled by excludes, disjoint `and`, an invalid `includeMode`. | OO-2 | bug / contract |
| 14 | **Reporters disagree on whether a check failed** when its outcome and its occurrences' tiers disagree. A `cantTell` with a fail-tier occurrence gates SARIF and JUnit but can't be baselined, and a `fail` with only cantTell-tier occurrences passes JUnit. This is the reporter side of C-8/C-9, which are still open. | OO-4 | contract |
| 15 | **`strictOptions: 'true'` or `1` silently means not strict.** These are the likely forms from an env var or CLI flag. | OO-5 | ergonomics |
| 16 | **Stored or compact pack results misreport.** Without a usable `standards` block, a pack standard's rollups render as "WCAG S1", and SARIF tags and JUnit properties vanish. A compact result loses pack titles, pack mappings, custom-rule metadata and caller messages in every reporter. | PB-12, PB-13, OO-3 | bug |
| 17 | **A checklist's items reach neither SARIF nor JUnit**, though PACKS.md and ENGINE_OPTIONS.md say they do. | PB-14 | doc / bug |
| 18 | **link-in-text-block misses links whose sentence is in a sibling or wrapper element.** The recent separator change loses more. | CO-4 | false negative |

### Packs: weaker spots

| # | Finding | IDs |
|---|---|---|
| 19 | In a page, packs registered by separate `packScript` calls can't be combined or named as a subset. A pack script used with a bundle of another version drops rules or the whole pack. All of this happens silently, even under strict mode, and leaves no trace in the result. | PB-1, PB-3, PB-17 |
| 20 | One pack rule can replace `ctx.helpers` for every later rule, or change the DOM, and so hide core failures. | PB-9, RB-7 |
| 21 | Some rule throws or results abort the whole scan (a throwing `toString`, throwing getters, a Proxy). Circular or BigInt occurrence data makes `JSON.stringify(result)` throw. | RB-5, PB-8 |
| 22 | Namespace rules are loose:<br>• not enforced on profile names, standard keys, ruleTags or rollup ids;<br>• a namespace may prefix core ids (`img`, `aria`);<br>• two packs may share a namespace;<br>• rule ids accept NUL, bidi characters and HTML, and a NUL lets a baseline entry match another rule;<br>• two checklists may share a title.<br>**Status:** mostly done in `eafebe3b` (`fix/stress-test-3`); see the outcomes file. | PN-11, PN-15, PB-15, PB-16, PN-20 |
| 23 | `core` ranges are misread: hyphen ranges, `\|\|`, `1.x`, `^1` and `>=2`. A prerelease core satisfies a release range. | PN-8, PN-21 |
| 24 | Wrong shapes are accepted or ignored silently:<br>• `packs: pack` (no list), a string, or `{}`;<br>• a profile `exclude` of the wrong shape;<br>• a standard profile `version` the standard lacks;<br>• profile severity in another case (`'Critical'`) skips the whole pack. | PN-5, PN-7, PN-23, OO-16 |
| 25 | Doc slips in PACKS.md: placeholders are `{{name}}`, not `{name}`; `reportOccurrence` must be pushed; rules without the namespace tag don't run under the pack's own profiles. | PN-9, PN-24, PN-6 |
| 26 | `surea11y-pack` CLI:<br>• unknown flags and `--k=v` are ignored, so `--kind=standard` gives a checklist;<br>• `docs` dies after 30 s on one bad example with a raw stack, after partly writing files, and drops a throwing rule's error;<br>• `new` accepts names npm rejects;<br>• help exit codes are inconsistent.<br>**Status:** PT-8 done in `eafebe3b` (`fix/stress-test-3`); see the outcomes file. | PT-5, PT-6, PT-7, PT-8, PT-17, PT-22 |

### Robustness and smaller items

| # | Finding | IDs |
|---|---|---|
| 27 | text-spacing-content-loss leaves its `!important` stylesheet in the page when removing it throws.<br>**Status:** done in `65e9b385` (`fix/stress-test-3`); see the outcomes file. | RB-9 |
| 28 | Under jsdom, elements inside `<math>` make about 30 rules error, and results change between two scans of the same DOM. No fixture contains `<math>`. | CO-3 |
| 29 | The SVG name rules take seconds on a label that a contained svg names itself from (30 s in jsdom on one fuzz page). | CO-2 |
| 30 | Name from content through about 2,000 nested shadow roots overflows the stack (new: 1.10.0 didn't walk shadow roots). The depth-limit `cantTell` from round 2 (RB-7) still reproduces. | RB-12 |
| 31 | Broken page builtins (`Array.prototype.filter`, `Object.prototype.then`) give a silently empty or all-`cantTell` result. | RB-10 |
| 32 | Two `aria-hidden-focus` reason codes shipped in 1.10.0 are missing from the finding-id inventory, so a rename would pass the tests and break users' baselines. The generator misses codes set through a variable. | OO-8 |
| 33 | jsdom reads font-size keywords and `calc()` as 0 px: messages say "font size: 0px", and `xx-large` text is held to 4.5:1. | OO-9 |
| 34 | A null-prototype object in a list option crashes the scan with an uncoded TypeError, even under strict mode. Strict mode checks options after the selection is resolved. | OO-10 |
| 35 | Wrong-typed options outside strict mode (S-6, still open) sometimes go the opposite way from what was meant: `perfStats: 'false'` turns it on, and `runOnly` as a Map runs every rule. Also ignored silently: `rules[typo]`, an invalid `rootCanvasFallback`, POSIX locales (`de_DE`), JUnit `cantTellAs: 'Failure'`, and `matchBaseline` given the whole file. | OO-11–OO-15 |
| 36 | A policy that disallows `pass` makes reporters say the rules "did not complete", and `allowedOutcomes` typos are never checked. | OO-6 |
| 37 | Types and docs vs reality:<br>• compact `checksResults` typed as full;<br>• custom `wcagSc` mappings lack `version`/`title`;<br>• `data.details: null`;<br>• ESM named imports from `/browser` and `/eslint-plugin` fail at runtime;<br>• several doc slips. | OO-7, PT-10, OO-18, PT-19 |
| 38 | Lint plugin: misses `dom.getElementById(ctx.document, …)`, `helpers.dom.*` and destructured reads, and has false positives on plain objects. | PT-12, PT-13 |
| 39 | Small items:<br>• NUL and bidi controls kept in the HTML report;<br>• a non-array `checksIds` crashes the HTML report;<br>• a string `__surea11yPacks` on the page breaks registration;<br>• the pack path depends on the page's `Object.assign`;<br>• `getMargins` returns `[]` for cross-frame results;<br>• `scaffoldPack('')` writes into the current folder;<br>• `docs` skips `HTML` fences and labels with trailing text;<br>• `.mjs` default exports aren't unwrapped;<br>• `describePacks` throws on `standard: {}`;<br>• misleading skip reasons;<br>• `skippedPacks` order;<br>• `packs: []` echoed;<br>• cross-pack references;<br>• `customRules` vs pack precedence;<br>• the German `css-hidden-focus` phrasing. | PB-22, PB-23, PB-18, PB-19, OO-17, PT-18, PT-15, PT-20, PN-13, PN-14, PN-16, PN-17, PN-18, PN-19, PN-22, OO-19 |
| 40 | Text-spacing quotes `<style>` contents as page text. | CO-6 |

---

## 2. Decisions for the maintainer

- **The speed regression (1).** Choose one before 1.11.0: accept it and document the cost against 1.10.0, or bring contrast-computable and text-spacing back toward 1.10.0's time. In both cases the CHANGELOG's "faster" wording needs correcting.
- **Placeholder AAA failures (CO-5).** contrast-enhanced now fails 29 of 118 pages on Chromium's default `::placeholder` color (#757575, 4.61:1). That color comes from the browser, not the author. This is documented (#103), but it's worth a decision on whether UA defaults should count.
- **Closed shadow roots (11).** `cantTell` when a host may hold a name the engine can't read, or a documented `fail`.
- **Packs immutability (3).** Freeze packs in `definePack`, fingerprint them, or document that they must not change after the first scan.
- **Run-time bound (RB-11, PB-10).** Add an engine option or document a host-side timeout. Today a rule or a page getter that never returns blocks the tab for good.

## 3. Features and improvements suggested by the results

- Reporters name the packs, their versions, and skipped packs:
  - SARIF `tool.extensions`;
  - JUnit properties;
  - the HTML report's meta bar;
  - EARL's assertor (PB-20).
- `skippedPacks` (or an equivalent) in in-page results (PB-17).
- The pack script records its core version, and the runner refuses a mismatch (PB-3).
- Rule output is made JSON-safe, as probes already are (PB-8). Helpers are frozen, or one copy per rule (PB-9).
- A cap per rule on occurrences, with a note when it's reached (PB-11: 100,000 occurrences give 15 MB of JSON and a 95 MB SARIF log).
- A smaller pack script, without core's whole catalog (PB-24: 210 KB for a one-rule pack).
- A lint rule for free variables in `runInPage`, and pack tests that also run the serialized path (PT-1).
- A real semver range parser, or a documented subset that rejects the rest (PN-8).
- Guidance for strict-CSP and Trusted Types pages. `page.evaluate(script)` works there; `addScriptTag({content})` doesn't (PB-21).

## 4. Missing tests (consolidated)

- **Packs:**
  - a namespace or ruleTag equal to a core tag;
  - strict mode and `packScript` after a non-strict call;
  - cache keys, and a pack changed after a scan;
  - `packs` not given as a list;
  - the shape of `exclude`;
  - semver forms;
  - `{{placeholder}}` messages;
  - `packScript` output parses for every function shape;
  - names and versions with line terminators, and `</script>` in sources;
  - in-page registration combinations, and version skew;
  - checklist items in SARIF and JUnit;
  - two checklists with one title;
  - reporters naming packs;
  - reporters fed by a Chromium pack scan.
- **Tooling:**
  - the scaffold installed from a packed tarball;
  - titles with quotes or newlines;
  - a rule with a module-level variable, run in a page;
  - a TypeScript compile of the scaffold's standard;
  - CLI flags and exit codes;
  - `docs` failure modes;
  - the lint gaps;
  - a d.ts compatibility check against the last release.
- **Engine:**
  - selector uniqueness against hidden, excluded and out-of-scope duplicates, and UA-hidden elements;
  - text-spacing under a CSP and when cleanup fails;
  - closed shadow roots, declarative too;
  - a self-referencing idref on an aria-hidden element;
  - MathML in jsdom;
  - link-in-text-block with a sibling or wrapper sentence;
  - deep shadow nesting in a full scan;
  - containment of throwing getters, Proxies and throwing `toString`;
  - a Chromium page-state test (DOM, scroll, focus, selection, events).
- **Options and outputs:**
  - a selection that ends empty;
  - a non-boolean `strictOptions`;
  - null-prototype list values;
  - compact vs full output with custom rules, packs and messages;
  - tier mismatches across reporters;
  - a policy-coerced pass;
  - finding ids for reason codes set through a variable;
  - jsdom keyword font sizes;
  - POSIX locales.
- **Performance:**
  - a Chromium comparison against the last release on a large flat page and a few corpus pages, run before each release.

## 5. Items from the earlier rounds re-checked here

- **Still reproduce:**
  - C-8/C-9 (custom-rule result shape not enforced), now visible as OO-4;
  - S-6 (wrong types ignored outside strict mode), as OO-11;
  - part of O-3 (`getMargins`), as OO-17;
  - round 2's RB-7 (the depth limit reported through `error`).
- **Fixed (round 2 robustness items):**
  - RB-1 (the `parentNode` hang);
  - RB-2 (named-property overrides);
  - RB-3 and RB-4 (now linear);
  - RB-5 (a throwing `shadowRoot` getter).
- **Not re-checked:** the other open items in §5 of [`2026-10-stress-test-outcomes.md`](https://github.com/SureA11y/core/blob/audit/2026-10-stress-test-outcomes/audits/2026-10-stress-test-outcomes.md) on the earlier audit branch.

## 6. What held up

- **No pack anywhere:** results are identical to having packs skipped. Against 1.10.0, every difference on 137 fixtures is a documented Unreleased change.
- **1.10.0 compatibility:**
  - A 1.10.0 baseline matches 789 of 789 failures on `main`.
  - Results stored by 1.10.0 render through `main`'s reporters with the same SARIF and JUnit totals.
  - No runtime export, bundle global or i18n file was removed.
- **The documented consumer flow works for both pack kinds:** scaffold, install from the tarball, then test, lint, docs and `docs:check`.
- **Results are stable:**
  - Two runs of the new bundle on 118 real pages were identical.
  - 5 scans in one tab gave identical results.
  - The next scan after a failed one equals a fresh scan.
- **The page is left as found:** no event reaches the page, and DOM, scroll, focus, selection and styles are unchanged (apart from RB-9).
- **Real libraries are tolerated:** Prototype, MooTools, Sugar and zone.js all give results identical to a clean page.
- **Escaping:** HTML, SARIF (valid 2.1.0), JUnit (well-formed with hostile text) and EARL hold up against hostile pack texts.
- **Translations:** 141 fixtures × 5 locales, with no raw placeholders, no English left over and no missing keys.
- **Every rule change seen on the real pages, apart from CO-4 and CO-5, was checked and correct:** for example `<a href role>`, names through open shadow roots, SVG `<title>` and paint-order contrast.
- **Scale:** most large-page cases are as fast as or faster than 1.10.0, apart from contrast-computable. Reporters stay linear up to 50,000 occurrences.
