# Round 4 findings re-checked on `c528af08`

Every confirmed finding of the fourth round (`origin/audit/2026-10-stress-test-4`, `3af2008`) and its leads, re-run on the current tree. A "fixed" status means the repro was run again and the expected result came back. Each fix was then probed for regressions and half-fixes. Those that turned up something are marked **→ RB5-n** (see `FINDINGS.md`).

The round-4 scripts that were reused are copied, unchanged except for the Chromium path, under `r4/<area>/`.

| Status | Count |
|---|---|
| Fixed, verified | 29 |
| Fixed, with a half-fix or a cousin left (new finding) | 5 of those 29: CH-1, CH-3 (partly fixed), FZ-1, FZ-5/RP-3, FZ-6 |
| Partly fixed | 2 (CH-3, OP-5) |
| Still open | 0 confirmed. 8 leads are still open. |

## Confirmed findings

| ID | Round-4 problem | Status | Fixing commit(s) | Re-run (script) and what came back | Regressions and cousins probed |
|---|---|---|---|---|---|
| CH-1 | Customizable `<select>` fails `nested-interactive-controls-absent` | **Fixed** | 5768f5bd, 2972b8aa (decision recorded) | Plain, `base-select`, `multiple` and `size=3` selects all pass. Chromium marks the button `inertElement`/`notRendered`. | A link, `role=button` span, script-added `<input>` or `<button>` inside the select's button is still reported, as decided. But a `<span tabindex=0>`, `contenteditable`, `<details>`/`<summary>` or `<audio controls>` there is reported by **no** rule, though inside a plain `<button>` `presentational-children-focusable-absent` fails them all **→ RB5-1**. A second button, or a button after a `<div>`, is still failed, as decided (Chromium exposes it as a button). |
| CH-2 | `ElementInternals` names and states ignored | **Fixed** | f0bb37d1, be17bbc0, 1104ef35, a17a8255, 638be0ed | With no hook, all four give `cantTell` (`name_internals`, `state_internals`). With `internalsHookScript()` installed early: all pass. A custom element with no internals still fails. | Chromium names them. |
| CH-3 | ARIA element references set from script ignored | **Partly fixed** | 88404330 | `ariaLabelledByElements` now names an input and a button (pass). | Only names read the references. `invalid-field-error-message`, `aria-expanded-state-mismatch`, `widget-keyboard-focusable` and `form-control-programmatic-label-quality` ignore `ariaErrorMessageElements`, `ariaControlsElements`, `ariaActiveDescendantElement` and labelling references, though Chromium exposes all of them (`ch3-rel-ax.mjs`). The result is a missed fail and false questions **→ RB5-2**. Chromium also reads the misspelled `aria-labeledby` through `ariaLabelledByElements`, so the fix names elements in the browser that jsdom fails **→ RB5-3**. Ownership through `ariaOwnsElements` is ignored too, but Chromium 153 ignores it as well (`ch3-owns-ax.mjs`, see leads). |
| CH-4 | Outline-only or shadow-only text passes | **Fixed** | de96f3de, d25a9e9b | A transparent fill with a `#ccc` stroke, a fill equal to the background, and a shadow-only case all **fail** `BELOW_THRESHOLD`. A dark stroke gives `cantTell TEXT_STROKE`. A zero-width stroke is left out. | Thresholds are right: 3.54:1 at 32 px is not a 1.4.3 fail and is a 1.4.6 fail; 4.54:1 passes 1.4.3; 4.48:1 fails. A **mixed** fill and outline, all light (`#eee` fill, `#ddd` stroke on white), is `cantTell` rather than `fail`. The commit scopes the fail to "fill draws nothing" (lead). |
| CH-5 | `link-in-text-block` fails a link that draws nothing | **Fixed** | 59718efa | Empty and whitespace-only links: only `link-name-present` fails. | A link holding only an `aria-hidden` icon glyph still fails `link-in-text-block` (debatable, lead). |
| OP-1 | 18 options of the wrong type dropped without a warning | **Fixed** | 8ba80a48 | `op-recheck.js`: none of 24 wrong-type options is silent. `r4/options/verify-b1.js` warns for each. | — |
| OP-2 | Checklist pack rule with `wcagSc` silently skipped | **Fixed** | 8da258aa | `op3b.js`: `definePack` and `checkPack` are clean, `skippedPacks` is `[]`, and the rule runs (`fail`) with and without the profile. | — |
| OP-3 | `packScript` writes code that isn't the rule | **Fixed** | 25950101 | `op-recheck.js`, `op3b.js`: Symbol, renamed, getter, computed, quoted-name, numeric-key, U+2028-key and bound functions are refused by `definePack`. Arrow functions, `['runInPage']` literals and static class methods are accepted, and give the same result in the page and in Node. | — |
| OP-4 | Variant ratio takes NaN, ±Infinity, 0 or negatives | **Fixed** | 52acc5e4 | NaN, ±Infinity, 0, -1, `"4.5"` and null are all refused. | `normalTextRatio: 22` or `1e308` is accepted. No text can reach that ratio, so every text fails (lead). |
| OP-5 | `surea11y-pack new` writes invalid packs | **Partly fixed** | ec7b3efa | `--title WCAG`, `--kind standard --title "EN 301 549"` and `--name ' '` are refused. A title of `__NAMESPACE__` is kept as written. | `--name=a --name=b` still lets the last one win silently (the round's minor sub-point). |
| OP-6 | Strict pack errors have no `code` | **Fixed** | 62ab448e | The core range, a name string and a duplicated pack each give `INVALID_ENGINE_OPTIONS`. | — |
| OP-7 | `strictOptions` warning wrong for Symbol, missing for BigInt | **Fixed** | 37a0836a | Symbol, BigInt, function and `"yes"` are each named by type. `1` is accepted by design (`strictOf`). | — |
| RP-1 | A policy without `fail` still gives `fail` | **Fixed** | d9a2024b | `r4/reporters/policy.js`: all three rules are `cantTell` with `policyOutcome: fail`. SARIF gives `warning`, and JUnit 0 failures. | — |
| RP-2 | HTML report fails its own self-scan when no row is shown | **Fixed** | 0fb78aa4 | `r4/reporters/emptytable.js`: no failing rule in the WCAG 2.2 AA self-scan of a clean report. | — |
| RP-3 | No reporter shows `shadowHostSelectors` | **Fixed** | f181176e | `rp3.js`: HTML, SARIF, JUnit and baseline carry the host chain, nested hosts included. EARL has no per-element pointers. | The reporters show the hosts, but the selector *inside* the shadow root can still name the wrong element (round-4 lead FZ-P2) **→ RB5-9**. |
| RP-4 | HTML report throws on `null` entries | **Fixed** | 8756854d | `r4/reporters/repros.js` B2: null check, occurrence and rollup all render. | — |
| RP-5 | French JUnit suite name has a trailing space | **Fixed** | 591f7247 | `<testsuite name="WCAG 4.1.2"`. | — |
| RP-6 | SARIF notes for passing rules | **Fixed** | d7d32b74 | A passing `contrast-minimum` gives no `invocations`. | — |
| RP-7 | SARIF `uri` invalid for spaces; a non-string url throws | **Fixed** | 86b02cd6 | `dist/my%20page.html`, and `url: 5` renders. | — |
| SE-1 | Lowercase `a11ycore-` prefix on a standard's rollup selects nothing | **Fixed** | 08741439 | `r4/selection/repro/r1`: all three spellings run `sample-statement-link` (fail). | — |
| SE-2 | Custom tag starting with `wcag` adds no criteria | **Fixed** | 99298bdf | `r2`: `wcagteam` reports 1.1.1 like `team` does. | — |
| SE-3 | Excluded custom rule reported as "not selected" | **Fixed** | 37bed2cf | `r3`: `reason: "excluded by the selection."`, `excluded: true`. | — |
| SE-4 | A standard's tag carried only by its rollups is "unknown" | **Fixed** | 7926e74d | `r4`: no longer unknown, and no "ignored" warning beside another tag. The tag on its own runs no rule (warned) and reports `P1: cantTell`. | — |
| SE-5 | `runOnly.optInTags` silently dropped | **Fixed** | 40720631 | `r5`: throws `INVALID_RUN_ONLY`, pointing to `engineOptions.optInRules`. | — |
| FZ-1 | `lang="constructor"`/`"__proto__"` breaks word-list rules | **Fixed** | 1e6114b8 | `fz1-lang-proto.js`: 20 lang values (`__proto__`, `constructor`, `toString`, `hasOwnProperty`, `valueOf`, `isPrototypeOf`, `propertyIsEnumerable`, `toLocaleString`, `__defineGetter__`, `__lookupGetter__`, `prototype`, `length`, `name`, `caller`, upper case and subtag variants), on `<html>` and on `<main>`, with 4 titles. No rule errors, and every quality rule behaves exactly as for `lang="xx"`. | Same class elsewhere: `<input type="constructor">`/`"__proto__"` makes `aria-allowed-attr` error out, through a plain-object table indexed by the type (`proto-values.js`, 32 page-value slots × 9 names) **→ RB5-4**. |
| FZ-2 | Rule order changes verdicts with aria-hidden idref cycles | **Fixed** | d135406a | `fz-recheck.js`: both round-4 cases, and a new cycle through hidden content, give the same verdict in the full scan, alone and under profiling. | No alone/full or subset/full difference in 1,900 fuzz cases (see below). |
| FZ-3 | p-as-heading super-linear in nesting depth | **Fixed** | dca409f5 | `speed-recheck.js fz3`: 5, 72, 49 and 30 ms at depths 100, 400, 800 and 1600. In round 4 these were 0.85 s, 19.5 s and 131 s. | Cousins: other `querySelector`/`matches` calls with long selector lists, per element (`td-has-header` `NAMED_CONTENT`, `nested-interactive-controls-absent`, `label-in-name`, `form-control-label-quality` `closest(ROW_SELECTOR)`). All are linear in the curves. |
| FZ-4 | Closed `[popover]` not hidden; order-dependent under jsdom | **Fixed** | 513cbd15 | `popover`, `manual`, `hint`, `auto` and an invalid value are all hidden, and stable in every rule order. | — |
| FZ-5 | Fallback selector names the wrong element | **Fixed** (light DOM) | d1f70182 | `fz-recheck.js`: SVG `foreignObject` with duplicate ids, a backslash id, MathML, and 9 odd ids. Every selector resolves to its element. | In shadow roots: **→ RB5-9**. Under jsdom, a value with `&` or an astral character gives a selector that is right in Chromium but that jsdom's selector engine can't resolve (lead). |
| FZ-6 | Quadratic regexes on long values | **Fixed** | c1ee1ab8 | `speed-recheck.js fz6`, 30 payloads at 20k and 80k characters: `autocomplete-valid` 17 ms, `page-title-patterns` 17 ms, the alt-text and file-name patterns under 15 ms. | One cousin missed: `link-name-quality`'s `normalize()` still has `/[\s.,;:!?。、>»›→]+$/g`, which takes 0.5 s at 20k, 2.4 s at 40k and 9.4 s at 80k (`redos2.js`) **→ RB5-6**. Every other `+$` pattern in `src/` was read and is anchored or bounded. |
| FZ-7 | Testing helper reports a false entry-point disagreement | **Fixed** (helper); quirk documented | d0499363 | `runa11yCoreOnHtml` and `runa11yCoreOnDom` no longer throw. Two scans of the same DOM by hand still give `cantTell`, then `pass`. That is the jsdom quirk LIMITATIONS.md now describes. | — |

## Round-4 leads

| Lead | Status | Commit | Evidence |
|---|---|---|---|
| JUnit/SARIF/EARL ignore `wcagLevel`/`wcagVersion` | Fixed | 14ef39c9, aa95244f, dff59ec5 | `r4/reporters/level.js`: under `wcagLevel: 'AA'`, 1.4.6 is out of the JUnit suites. SARIF gives it as `note` with no `wcag-1.4.6` tag. EARL has no `isPartOf` for 1.4.6 or 4.1.1. |
| CH-P1 drop-down select measured by option colours | Fixed | 1b262e67 | A black select with grey options gives `cantTell SELECT_OPTION_COLOR` on the option not shown. A grey select fails. |
| CH-P2 generated text not measured | Fixed | 207c9e47 | A light `::before` and a light `::marker` fail. |
| CH-P3 paused animation at opacity 0 | Unchanged, not a bug | — | No finding. The text is not visible. |
| CH-P4 `img-alt-decorative` asks about `[inert]` | Fixed | 1b1c60b0 | No occurrence. |
| Plain pages get many `cantTell` | Fixed | 1bfa3943 | Measured against the white canvas: the light text fails, the readable text passes. |
| OP-P1 throwing Proxy escapes `describePacks` | **Still open** | — | `leads-op.js`: `describePacks([proxy])` throws `PACK_OWNKEYS`. |
| OP-P2 strict doesn't catch an unknown profile, mappings, optInRules or bad CSS | **Still open** | — | All four only warn under `strictOptions`. |
| OP-P3 non-boolean `applicability` applies everywhere | **Still open** | — | `undefined`, `0`, `NaN`, `'false'` and `null` all run the rule, with no warning. Only `false` gives `notApplicable`. |
| OP-P4 `rootCanvasFallback` accepts non-colours | **Still open** | — | `inherit`, `currentColor`, `rgb(1,2,3,4,5)` and `rgb(1,2,3,)` are accepted silently. `notacolor` is warned. |
| OP-P5 `<!--<script` in rule code | **Still open** | — | `packScript` accepts it. |
| OP-P6 holes in pack lists | **Still open** | — | `rules: [ , ]` is accepted while `[null]` is refused. Holes in `excludeSelectors` pass under strict. |
| Catalog functions don't validate options | Fixed | 1d518d4c | `r6`: `getRulesForRunOnly` throws under strict for `AA+`. |
| SE whitespace under strict, Kelvin sign | **Still open** (minor) | — | Under strict, `' aA '` is accepted and `'2.1 '` throws. `linK-name-present` (Kelvin sign) selects the rule. `wcagLevel: null` now throws under strict, as `wcagVersion: null` does. |
| Rollup id in `includeTestIds` | Unchanged | — | Runs no rule, reports the rollup as `cantTell`, and warns. |
| Stored results from before the tier fix split the reporters | Fixed | f9f40fce | `cantTell` with a fail-tier occurrence gives a SARIF error, a JUnit failure, a baseline entry and EARL `failed`. |
| EARL merges frames that share a URL | Fixed | 9f39a93f | (commit and its test). Not re-probed in a browser. |
| Hostile field types crash the reporters | Fixed | d317dc1c | `leads-misc.js`: object `normativeMappings`, numeric `ruleId`, object `rulesResults` and a numeric selector. All 4 reporters render, and SARIF stays valid. |
| FZ-P1 idref exception applied to structure rules | Fixed | d135406a | Hidden list referenced by `aria-labelledby`: `notApplicable`. |
| FZ-P2 shadow-root selectors not pinned to the root | **Still open, now confirmed** | — | **→ RB5-9** |
| `name-cycle-speed` timing, `executablePath` in tests | Fixed | ae6e2c81, 1e0290e6 | Read from the commits. Not re-run. |
