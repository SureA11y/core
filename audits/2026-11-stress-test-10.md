# Stress test of the 1.18.0 work, tenth round: findings (2026-11-21)

The tenth round ran at `6e2b905c`, `main` with #420 (a time budget, pack names and versions in reports, an opt-in cap of occurrences per rule, and the new 1.4.4 rule `resize-text-content-loss`), all merged the same day. It had two parts:
- **a general stress test** (prefix S10), with a close look at what #420 added;
- **a comparison with four other open-source engines**, named here only as engine A to D (prefixes C10 for core's findings, G10 for coverage gaps).

Every finding is fixed or decided in [#421](https://github.com/SureA11y/core/pull/421), merged 2026-11-21 as `462df5b4` (one commit on `main`; unreleased, for 1.18.0). As in rounds 6 to 9, there is no `FINDINGS.md` per area; probes are under [`2026-11-probes-10/`](./2026-11-probes-10/):

| Part | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| General stress test | [`stress/`](./2026-11-probes-10/stress/) | S10 | Node, jsdom, Chromium | 9 |
| Comparison with engines A to D | [`compare/`](./2026-11-probes-10/compare/) | C10, G10 | Chromium | 8, and 5 coverage gaps |

That makes 17 findings (7 Medium, 1 Low to Medium, 9 Low) and 5 gaps. **11 were evident and are fixed**; 6 findings and 2 gaps were decided by the owner on 2026-11-21 and made in #421 (§2); 2 gaps were closed without a change, and G10-4 is covered by C10-4.

**Basis**
- `main` at `6e2b905c` (1.17.0 plus the unreleased 1.18.0 work), Chromium 153 (`/opt/pw-browsers/chromium`), jsdom from the repo.
- WCAG 2.2 and its Understanding documents are the source of truth; the ACT rules, WAI-ARIA 1.2, HTML and the CSS specs decide the details; Chromium is supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, and again while it was fixed, with a regression test that fails without its fix (#421).

**What the probes leave out.** The probes that install or run another engine, their raw outputs, and the key that names the engines are not kept here; their results are summarised in §1.3. `stress/tb-frames.js` needs `core-iife.js`, `src/core.js` bundled with esbuild (11 MB, not kept); `stress/media.js` needs short WAV and WebM files, not kept (any 2 s and 5 s audio and a 6 s video with and without sound do).

---

## 1. Findings

### 1.1 General stress test

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| S10-1 | A profile the time budget skips is listed only in `engine.profilesNotRun`, not in `notRun`: `matchBaseline`, EARL, the bundle's `table()` and the HTML report's count read the scan as complete; no warning (`tb-multiprofile.js`, `tb-mp-reporters.js`, `tb-table.js`, `tb-mp-html.js`). SARIF and JUnit were right. | Medium | Fixed: its rules listed in `notRun`, with a warning |
| S10-2 | `maxOccurrencesPerRule` drops undecided occurrences that lean fail from the `leanFail` and `leanFailAs` gates: 7 lean-fail tables give 6 new uncapped, 0 capped at 1 (`cap-leanfail.js`, `cap-reporters.js`; `cap-random.js 7 12`: 11 of 12 random pages). | Medium | Fixed: counted in `occurrencesOmittedLeaningFail`, and gated |
| S10-3 | `resize-text-content-loss` leans fail on text shown in full when preserved trailing spaces hang past a `white-space: pre-wrap` box (`rt1.js`, `rt2.js`). | Medium | Fixed: only glyphs measured |
| S10-5 | In `runa11yCoreAcrossFrames`, each frame starts the whole `timeBudgetMs` again: 3 frames, a 500 ms budget, 2,610 ms, nothing incomplete (`tb-frames.js`). | Low–Med. | Decided |
| S10-4 | "+N more" plurals: JUnit "2 occurrence that needs manual reviews"; HTML "kept 1 occurrences", in de, es and fr too (`grammar.js`). | Low | Fixed |
| S10-6 | In vertical writing modes, an ellipsis or line clamp is reported as `TEXT_CLIPPED_AT_640`, and `clipCss` leaves out what truncates it (`rt2.js`). | Low | Fixed: inline axis from `writing-mode` |
| S10-7 | `p-as-heading` never asks about a bold line ending in a colon ("Ingredients:", "Step 1:") (`pash.js`). | Low | Decided |
| S10-8 | `page-title-patterns` knows "untitled" defaults only in English; a leaked placeholder (`undefined`, `{{title}}`) gets no lean (`titles.js`). | Low | Decided |
| S10-9 | `timeBudgetMs: Infinity` is refused, though the docs take any number above 0 (`opts.js`). | Low | Decided |

What behaved correctly: budgets of `1e-300` (no rule runs, all listed in `notRun`) and `1e9` (identical to none); the cap over 20 random pages, one and two profiles (outcomes, rollups, totals and `totalFail` unchanged; failures kept first); pack names and versions in all four reporters, escaped; `resize-text-content-loss` on nine kinds of correct markup, RTL ellipsis, SVG text, 4,000 clipped cards in 0.25 s; tables, `autocomplete` token lists, media with real audio and video; the new messages in all five locales.

### 1.2 Comparison: core's findings

Repro pages are in [`compare/repro/`](./2026-11-probes-10/compare/repro/); their file numbers predate the findings' order: C10-1 `c10-4-tablist-wrapper.html`, C10-3 `c10-5-embed-nonmedia.html`, C10-4 `c10-3-onclick-div.html`, C10-5 `c10-2-scroll-fits.html`, C10-6 `c10-1-marquee-lean.html`, C10-7 `c10-6-video-poster.html`; `c10-7-prohibited-label.html` backs no finding. `compare/probes/run-repro.js` scans them all.

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| C10-1 | `aria-prohibited-children` passes a `role=button` beside a tab when both sit in a roleless wrapper in a `tablist`; Chromium's tree is the same as without the wrapper (ACT bc4a75). | Medium | Fixed: roleless wrappers looked through |
| C10-2 | `aria-prohibited-children` ignores children owned through `aria-owns` (ACT bc4a75 Failed Example 5). | Medium | Fixed |
| C10-3 | `embed-text-alternative-present` fails an `<embed>` of a PDF, a page or Flash at high confidence; the `<object>` rule leaves the same resources out. | Medium | Fixed: shared `embedsNonMedia` |
| C10-4 | `click-handler-keyboard-operable` says nothing about a non-focusable `<div onclick>` styled as a button ("Add to cart"): no `cursor: pointer`, so out of scope. | Medium | Decided |
| C10-5 | `scrollable-region-focusable` asks about boxes Chromium measured as fitting their content ("This element can scroll…", leaning pass); ACT 0ssw9k calls them inapplicable. | Low | Fixed: not applicable when measured to fit |
| C10-6 | The fail lean on `<marquee>` disappears when any inline script mentions `marquee`, `.start(` or `.stop(`, the engine's own bundle included (`compare/probes/marquee.js`). | Low | Fixed: only a script that reaches a marquee counts |
| C10-7 | `video-poster-text-alternative-present` fails a poster video with no name, and judges no video without a poster; 1.1.1's exception for time-based media asks only for identification. | Low | Decided |
| C10-8 | `docs/ACT_RULE_MAPPING.md` says a role description on a roleless element fails; the rule asks. | Low | Fixed (docs) |

**Coverage gaps**

| # | Criterion | What another engine checks | Outcome |
|---|---|---|---|
| G10-1 | 1.3.1 (H71, ARIA17) | Radio buttons or checkboxes that share a `name` in no named group (B 42 times in 9 files) | Decided: new rule `form-group-name-present` |
| G10-2 | 1.3.3 | Instructions with sensory words ("the round button on the right") (B 128 times in 60 files) | Not done: too noisy (FINDINGS §4) |
| G10-3 | 3.2.2 (H32) | A form with no submit button (D, 10 times in 5 fixtures) | Not done (FINDINGS §4) |
| G10-4 | 4.1.2, 2.1.1 | An element with a mouse handler and no role (B) | Covered by C10-4 |
| G10-5 | 1.4.11 | Symbol-only text used as a graphic, such as ★★★★☆ at 1.4:1 (A asks) | Decided: new rule `symbol-graphic-contrast` |

### 1.3 Comparison: summary

Core, A, B, C and D ran in the same Chromium build, network blocked, on core's 146 scenario fixture pages, 1,189 of the 1,211 W3C ACT test cases (all 87 rules; core, A and C only) and 12 realistic pages written for the round (blog post, product page, forms, tables, dialog, web components, SPA, checkout, docs, landing page).

**ACT corpus.** A verdict is right when it fails a failed example, or passes or is inapplicable on a passed or inapplicable one.

| Engine | Right | Asks | Wrong | No rule |
|---|---|---|---|---|
| core | 762 | 160 | 17 | 250 |
| A | 685 | 56 | 40 | 408 |
| C | 494 | 204 | 4 | 487 |

Core's 17 "wrong" cases are not errors: 13 are judgement rules no engine automates (image of text 0va7u6, descriptive headings b49b2e, labels cc0f0a, link purpose aizyf1 and 5effbb), and 4 are differences of scope (aaa1bf ignores controls where core follows the 80f0bf composite; kb1m8s Failed Example 5 is asked about by `presentation-role-conflict`; 4b1c6c needs `runa11yCoreAcrossFrames`). The one real ACT miss is C10-2's. Core's 160 asks are its documented spec-only decisions (674b10, 6a7281, 5f99a7, 4e8ab6, 46ca7f), contrast it cannot compute, and C10-5's cases.

**Where core is more right.** The others fail hidden, inert, `display: none`, closed-`<details>` and disabled content, and text at opacity they do not apply, where ACT's applicability leaves it out; core does not. Core alone fails inverted or out-of-range ARIA range values (Chromium exposes a corrected value). On 2.5.8, A's check is off by default and B passes overlapping 24 px circles; core's 85 failures were checked against the spacing rule. Core also found an inherited-colour link with no underline, a field left unlabelled by a duplicate id, and an empty icon button in shadow DOM that others missed. Text contrast and accessible names agree on every visible element.

**Timing**, in-page, median of 3 runs on the 12 realistic pages: core 151 ms per page (max 172 ms), about twice A (72 ms) and C (94 ms); B 62 ms, D 10 ms (D crashed on 2 pages). Core is steady; A's maximum was 10 s, waiting for an autoplay video.

---

## 2. Decisions taken

All taken by the owner on 2026-11-21 and made in [#421](https://github.com/SureA11y/core/pull/421), each with a test that fails before it.

- **S10-5:** one time budget for the whole cross-frame scan; each frame gets what is left, and a frame reached with none left runs no rule and is incomplete.
- **S10-7:** a final colon ends no sentence: a bold "Step 1:" line is asked about.
- **S10-8:** the default titles of the five shipped languages, and CMS defaults, are generic on any page; a leaked placeholder is asked about (`placeholderTitle`), leaning fail.
- **S10-9:** `timeBudgetMs: Infinity` means no limit.
- **C10-4:** a non-focusable element with a click handler, drawn as a button, is asked about (`CLICK_HANDLER_NOT_FOCUSABLE`), leaning fail.
- **C10-7:** a poster video with no name is asked about, leaning fail, instead of failing.
- **G10-1:** new manual rule `form-group-name-present` (1.3.1): radio buttons sharing a name in no named group are asked about, leaning fail; checkboxes, with no lean.
- **G10-5:** new manual rule `symbol-graphic-contrast` (1.4.11): symbol-only text under 3:1 is asked about, leaning fail.
- **C10-1, side effect accepted:** a separator beside a radio inside a plain card in a `radiogroup` (the Angular Material shape of fixture cases 16 and 17) now fails.
- **G10-2, G10-3:** not done (FINDINGS §4).

## 3. Lesson

The general round found four bugs in features merged the same day (#420). Agreed measure: **an independent stress test of new features before their pull request is merged.**

## 4. Downstream

- The four packs' draft pull requests for core 1.18 were updated: `pack-rgaa` maps `resize-text-content-loss` to RGAA 10.4.1 and `symbol-graphic-contrast` to 3.3.2, and `form-group-name-present` to no test.
- The CMS repository gave the new rules editor titles ([SureA11y/cms#36](https://github.com/SureA11y/cms/pull/36)).
