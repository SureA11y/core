# Stress test of the whole engine, eleventh round: findings (2026-11-22)

The eleventh round ran at `462df5b4`, `main` after #421 (1.17.0 plus the unreleased 1.18.0 work). The owner asked for the whole engine, not only the latest additions, and looked for bugs and performance problems. It had five parts:
- **a bug hunt** over the whole engine (prefix B11);
- **a speed, scaling and memory test** (prefix P11);
- **an independent stress test of the bug fixes** (prefix R11F);
- **an independent stress test of the speed fixes** (prefix R11P);
- **a run of the other projects against the fixes** (§4).

Every fix is in [#422](https://github.com/SureA11y/core/pull/422) (branch `round-11-fixes`), merged 2026-11-22 as `ec311ea8`; unreleased, for 1.18.0. Five B11 findings, and five questions from the reviews, were decided by the owner on 2026-11-22 and made in [#423](https://github.com/SureA11y/core/pull/423), merged the same day as `d1a51036` (§2). As in rounds 6 to 10, there is no `FINDINGS.md` per area; probes are under [`2026-11-probes-11/`](./2026-11-probes-11/):

| Part | Folder | Prefix | Runtime | Findings |
|---|---|---|---|---|
| Bug hunt | [`bugs/`](./2026-11-probes-11/bugs/) | B11 | jsdom, Chromium | 15 |
| Speed, scaling, memory | [`perf/`](./2026-11-probes-11/perf/) | P11 | Node, jsdom, Chromium | 6 |
| Review of the bug fixes | [`review/`](./2026-11-probes-11/review/) | R11F | jsdom, Chromium | 11 |
| Review of the speed fixes | [`perf-review/`](./2026-11-probes-11/perf-review/) | R11P | jsdom, Chromium | 4 |

That makes 36 findings. **31 are fixed** in #422: 10 of B11, all of P11, R11F and R11P. **5 needed a decision**: B11-9, B11-10, B11-12, B11-13 and B11-14, decided and made in #423. Three of the R11F findings were regressions the bug fixes had caused (R11F-1, R11F-2, R11F-4); the reviews caught them before merge.

**Basis**
- `main` at `462df5b4` (1.17.0 plus the unreleased 1.18.0 work), Chromium 153 (`/opt/pw-browsers/chromium`), jsdom from the repo. The speed part also ran `254b644f` (round 8) and v1.17.0 for comparison.
- WCAG 2.2 and its Understanding documents are the source of truth; the ACT rules, WAI-ARIA 1.2, HTML and the CSS specs decide the details; Chromium is supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, and again while it was fixed, with a regression test that fails without its fix (#422). The two reviews ran their probes before and after the fixes, in jsdom and Chromium.

**Running the probes.** Run each with `node <probe>` from its folder. They read built checkouts by absolute path, kept as they were: `/home/user/core-r11` is `462df5b4`, `core-r8` is `254b644f`, `core-v117` is v1.17.0, and `/home/user/r11-review` and `/home/user/r11-perf-review` are the fix branch as each review saw it. Change those constants to run elsewhere; each checkout needs `npm ci` and `npm run build`. Paths into the round's own folders are relative. `bugs/h.js`, `review/sc.js` and `perf-review/h.js` are the harnesses: the last two run each case in jsdom and Chromium, before and after the fixes. `perf/pages.js` writes the realistic pages (`node pages.js`).

**What the probes leave out.** Generated pages and outputs, and anything large: the realistic pages `perf/page-*.html` (16 KB to 700 KB; `node pages.js` writes them); results (`*.json`, `*.jsonl`, `*.log`, 0.2 to 8.4 MB) and CPU profiles (`*.cpuprofile`, up to 1 MB); the unminified bundles (5 MB each), which `perf/abfile.js` and `perf/prof-chrome.js` with `UNMIN` set need; the scan outputs of `bugs/pages/` (0.3 MB each); `review/before.json` and `after.json` (1.1 MB, the output of `review/diffall.js`); and a copy of the built `src/` (9 MB) with the four `dbg*.js` scripts that read it.

---

## 1. Findings

### 1.1 Bug hunt

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| B11-1 | Under jsdom, the contrast rules ignore HTML presentational hints (`<font color>`, `<body text>`, `bgcolor`) and SVG `fill` attributes, so faint text passes; Chromium fails it at 1.11:1 to 1.32:1 (`hints.js`). | Medium | Fixed: hints and `fill` read under jsdom |
| B11-2 | `form-group-name-present` misses groups made through shadow DOM (radios slotted into a shadow `<fieldset>`, or in a shadow root inside a light one), so the radios lean fail; Chromium's tree has the group (`fg.js`, `fg2.js`). | Medium | Fixed: flat-tree ancestors |
| B11-3 | Under jsdom, `link-in-text-block` fails a link whose underline is on a child element; Chromium passes it (`lintb.js`). | Medium | Fixed |
| B11-4 | Under jsdom, `scrollable-region-focusable` misses every box set with the `overflow` shorthand, against its own header (`scroll.js`). | Medium | Fixed: shorthand expanded |
| B11-5 | `tabindex` is read with `Number()`, not HTML's integer parsing: `1.5` and `2abc` missed, `0x1` reported as positive, `1e3` quoted as 1000 (`tabidx.js`). | Low–Med. | Fixed everywhere tabindex is read |
| B11-6 | `form-group-name-present`: a `<legend>` holding only `<img alt="Size">` counts as no name (`fg.js`). | Low–Med. | Fixed: legend named from content |
| B11-7 | `symbol-graphic-contrast` leans fail on disabled controls, which 1.4.11 exempts (`sym.js`). | Low–Med. | Fixed |
| B11-9 | `symbol-graphic-contrast` judges a currency sign or 〒 inside text as a graphic at 3:1; a breadcrumb `>` too (`sym.js`, `sym2.js`, `pages/checkout.html`). | Low–Med. | Decided (§2) |
| B11-10 | `symbol-graphic-contrast` leaves out rating stars that carry screen-reader-only text; its header says "visible text" (`sym.js`). | Low–Med. | Decided (§2) |
| B11-8 | `form-group-name-present` counts radios under `aria-hidden`, against its header (`fg.js`). | Low | Fixed |
| B11-11 | `symbol-graphic-contrast` reports nested symbol elements twice (`sym.js`). | Low | Fixed: each element for its own text |
| B11-12 | `form-control-label-quality` gives `DUPLICATE_LABEL_TEXT` to an ARIA combobox and its own popup listbox (`combo.js`). | Low | Decided (§2) |
| B11-13 | `page-title-patterns`: real titles with `{word}` or `${...}` lean fail as leaked placeholders (`titles.js`). | Low | Decided (§2) |
| B11-14 | `<marquee onmouseover="this.stop()">` leans fail with "no way to pause", while a button elsewhere that stops it leans pass (`battery5.js`). | Low | Decided (§2) |
| B11-15 | `<marquee hidden>`: jsdom passes; Chromium draws it (`display: inline-block`) and asks (`marq.js`). | Low | Fixed: drawn under jsdom |

What behaved correctly: 115 accessible-name cases against Chromium's tree (`names1.js`); five batteries of 63 to 82 cases over ARIA, images, forms, tables, widgets, landmarks and media (`battery1.js` to `battery5.js`); round 10's rule changes (`p-as-heading`, video posters, `aria-prohibited-children`, `<embed>`, click handlers); odd time budgets; a full Chromium scan left the page's DOM, focus, scroll, form values, selection and open states unchanged (`mutate.js`); no rule gave `error` on the three realistic pages (`parity.js`); the new rules' messages in de, es, fr and ja.

### 1.2 Speed, scaling and memory

Before/after numbers are from core's CHANGELOG ("Unreleased", "Fixed", round 11) and the fix commits.

| # | Finding | Sev. | Regression? | Outcome |
|---|---|---|---|---|
| P11-1 | Each `excludeSelectors` entry adds about 40% to a scan in Chromium: the exclude list was sorted and joined on every `isExcluded` call, and the shadow-root cache was off whenever any exclusion was set (`excl.js`). | High | No (v1.17.0 the same) | Fixed: 40 selectors on a 9,000-element page add about 10%, not 6.7 times |
| P11-2 | `contrast-computable` is 30–80% slower on text-heavy pages since `254b644f`: each text re-read every ancestor's mask, shadow, transform and top layer (`ab-rule.js`). | Medium | Yes (round 8) | Fixed: 1000 paragraphs under 320 wrappers, 1276 ms to 618 ms (r8: 534 ms) |
| P11-3 | Under jsdom, the target-size rules are 3–9 times slower since `254b644f`: 18 `[role~="x" i]` selectors (`ab-jsdom.js`). | Medium | Yes (round 8, jsdom only) | Fixed: `target-size-minimum` 263 ms to 21 ms on a 1000-row table |
| P11-4 | `form-control-label-quality` is quadratic in checkboxes and radios (`scale-chrome.js`). | Medium | No | Fixed: 8,000 fields, 19.6 s to 0.4 s |
| P11-5 | `css-focus-indicator-suppressed` scales with focus rules × focusable elements. | Low | No | Fixed: 1000 rules × 1000 links, 1444 ms to 657 ms |
| P11-6 | `label-in-name` builds its `\p{scx=…}` expressions on every scan (`empty-chrome.js`). | Low | Yes (round 9) | Fixed: first scan of a small page, 2.4 ms to 0.1 ms |

What behaved correctly: **nothing leaked memory**. In Chromium, 30 scans of one page left DOM nodes, listeners, documents, frames, style sheets, timers and observers where the first scan left them, with no detached nodes; the heap levels off. Under jsdom, the heap stayed flat over 30 scans of one document and over three passes of the 148 fixtures. 19 kinds of content, from links and table cells to shadow components, scaled linearly. Round 9 and 10 features (`timeBudgetMs`, `maxOccurrencesPerRule`, `resize-text-content-loss`, `form-group-name-present`, `symbol-graphic-contrast`) cost little. Before the fixes, the 159 corpus pages took 10% longer than at `254b644f`, mostly through P11-2. The fixes take the browser bundle to 2,033 KB; its budget was raised to 2,040 KB.

### 1.3 Review of the bug fixes

An independent stress test of the B11 fixes, before and after, in jsdom and Chromium. All 11 findings are fixed in #422.

| # | Finding | Regression? | Probes |
|---|---|---|---|
| R11F-1 | Under jsdom, SVG text over a painted shape was measured against white, now that the `fill` attribute is read: light text on a dark `<rect>` failed at 2.32:1. Now asked about. | Yes (B11-1) | `s2.js` to `s4.js` |
| R11F-2 | Under jsdom, `text-decoration: underline transparent` inside a link counted as an underline, so the link passed; Chromium fails it. | Yes (B11-3) | `l1.js` |
| R11F-3 | Under jsdom, `link-in-text-block` still failed underlines from `<u>` and `<ins>`, an `!important` rule, an `@layer` rule, `var()` or `revert`. | No | `l1.js` |
| R11F-4 | Under jsdom, the `overflow` expansion copied an unsubstituted `var()` into both axes and read it as scrolling; `overlay`, `<textarea>` and `<select>` also differed from Chromium. | Yes (B11-4) | `s1.js`, `s5.js`, `s6.js` |
| R11F-5 | Under jsdom, colour hints stopped at shadow boundaries. | No | `p1.js` |
| R11F-6 | Under jsdom, legacy colour values took any CSS keyword (`Canvas`, `AccentColor`, `currentcolor`, `inherit`); HTML matches named colours only. | No | `p2.js` |
| R11F-7 | Under jsdom, `color: revert` and `revert-layer` came back as the keyword or transparent; `all` did not win over a hint. | No | `p1.js`, `p2.js` |
| R11F-8 | Under jsdom, `bgcolor` on `<marquee>`, an invalid `fill`, `fill="url(#g) red"` and a `<marquee hidden>` whose display a rule reverts differed from Chromium. | No | `p1.js` |
| R11F-9 | A tabindex outside the 32-bit range was read; the browser ignores it. | No | `t1.js` to `t3.js` |
| R11F-10 | A control in a disabled fieldset's first `<legend>` was taken as inactive; HTML leaves it enabled. | No | `y1.js` to `y3.js` |
| R11F-11 | A `<legend hidden>` named its group, and radios that no slot takes were counted. | No | `s7.js`, `s8.js`, `ax.js` |

The review also led to two smaller fixes: the tabindex rule's summary quotes the attribute as written, not the number read; and under jsdom, a hinted element's style is read once per scan (5 × 400 nested spans under `<body text>` had been 15–20% slower; `perf.js`, `perf2.js`). `diffall.js` compares every fixture before and after.

### 1.4 Review of the speed fixes

An independent stress test of the P11 fixes. All four are fixed in #422 (`NOTES.txt`).

| # | Finding | Sev. | Outcome |
|---|---|---|---|
| R11P-1 | Under jsdom, a selector jsdom cannot read (`button:-moz-focusring`) in P11-5's joined list of focus rules made the list throw, read as no match, so valid rules such as `button:focus` were lost (`t-r11p-moz.js`). | Medium | Fixed: the list runs only in a browser; where it throws, each rule is tested |
| R11P-2 | `role="x&nbsp;button"` (or with a vertical tab or U+FEFF) became a target-size candidate in Chromium; role tokens were split on any whitespace, not ASCII whitespace (`t-target.js`). | Low | Fixed: ASCII whitespace only, for every role reader |
| R11P-3 | Under jsdom, `css-focus-indicator-suppressed` with 1000 rules went from 7.3–8.1 s to 9.9–10.9 s when every candidate matches the list (`abj.js`). | Low | Fixed with R11P-1 |
| R11P-4 | jsdom's selector engine can answer a list differently from its selectors one by one (`:nth-child(An+B of S)`). A risk, not a scan regression (`min-list.js`). | Info | Fixed with R11P-1 |

The review found P11-1 to P11-4 and P11-6 sound, with no change on 155 fixtures in jsdom and Chromium. The `css-hidden-focus` cost that seemed to grow is not a regression: it is the same before and after.

---

## 2. Decisions taken

All taken by the owner on 2026-11-22 and made in [#423](https://github.com/SureA11y/core/pull/423), merged 2026-11-22 as `d1a51036`, each with a test that fails before it. #423's commits number the review questions D6 to D10, and the SVG follow-up D11.

**From the bug hunt**
- **B11-9:** a currency sign or 〒 next to letters or digits is text, held to 4.5:1; a separator such as a breadcrumb `>` stays a graphic.
- **B11-10:** `symbol-graphic-contrast` counts visible text only.
- **B11-12:** a combobox and its own popup are one field.
- **B11-13:** a placeholder title leans fail only in clear cases.
- **B11-14:** a marquee that stops only on hover keeps its fail lean, with a true message (`MARQUEE_STOPS_ONLY_ON_HOVER`).

**From the reviews**
- **D6:** `aria-disabled` exempts contrast only on user interface components. A later CI catch kept ACT afw4f7's case: a label in an `aria-disabled` group stays exempt.
- **D7:** under jsdom, the overflow question says no layout was available.
- **D8:** closed shadow roots are documented in `LIMITATIONS.md`.
- **D9:** cascade layer order is applied for underlines under jsdom.
- **D10:** the 32-bit range is checked per attribute, as Chromium does: `select size` up to 4294967295; `colspan` clamped to 1000; `rowspan` clamped to 65534.
- **D11 (the follow-up):** under jsdom, SVG text over a shape that certainly covers it is measured.

Round 12 stress-tested #423 before merge ([report](./2026-11-stress-test-12.md)).

## 3. Lesson

Round 10's measure, an independent stress test before merge, was applied to both sets of fixes. It found three regressions of the bug fixes (R11F-1, R11F-2, R11F-4) and a lost match in a speed fix (R11P-1) before #422 was merged.

## 4. Downstream

- The 12 published packages were run against the branch. One result changed: a `pack-rgaa` test expected `<marquee hidden>` to be not applicable. Chromium draws it (`display: inline-block`), so the test was updated on `pack-rgaa`'s draft branch `core-1.18` (`255e6aa`).
- The CMS repository's tests give the same results on `main` and on the branch.
- The four packs' draft branches were rerun against the round 11 core in round 12 ([report §5](./2026-11-stress-test-12.md#5-downstream)).
