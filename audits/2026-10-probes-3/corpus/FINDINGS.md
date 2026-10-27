# Real-page corpus and fuzz — findings

- **Branch:** `audit/2026-10-stress-test-3` at `eaa5d3f1`, the same code as `main`.
- **Old bundle:** the published `@surea11y/core@1.10.0` (`npm pack`), `package/surea11y.browser.js`.
- **New bundle:** the root `surea11y.browser.js`. A rebuild from `src/` came out byte-identical, so it is current.
- **target-size-minimum is left out on purpose:** its rework is not reviewed here, and it is excluded from the transitions and the findings. Its time is still part of the whole-scan timings, and CO-7 says how much.

## Method

### Part 1: real pages in Chromium

- **Corpus:** 118 saved pages from `../surea11y-core-comparisons/corpus/real-world/*.html`.
- **Browser setup:** Playwright Chromium at 1280×800 with all network aborted. Each page was loaded with `setContent`, given a 1.5 s wait, then the bundle was injected.
- **Scan call:** `runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, null)`.
- **Runs:**
  - New ran twice and old once, each in a fresh browser context (`run-corpus.js`, tallied by `compare.js`).
  - Timings were confirmed serially without profiling (`timing.js`: old and new alternated, 2 runs each, the fastest kept).
- **Tools used to examine the changed rules:**
  - `inspect.js`: a rule's occurrences on a page.
  - `probe-el.js`: an element's geometry and paint stack.
  - `snippet.js`, `anyfail.js`: a snippet under both bundles, with Chromium's role and name for it.
  - `axname.js`: Chromium's accessible name for one element.

### Part 2: fuzzing in jsdom (`fuzz.js`)

- **What the documents contain:**
  - random HTML, SVG and MathML, and custom elements;
  - open shadow roots;
  - invalid and multi-token roles, and invalid ARIA values;
  - idrefs with self-references, cycles and duplicates;
  - odd `lang` values, entities and unclosed tags;
  - nesting up to 120 levels.
- **How each document is scanned:** with `optInRules: 'all'`, through both entry points with the `@surea11y/core/testing` parity assertion, then once more on a fresh DOM.
- **Seeds:**
  - 1–3000: all generators.
  - 10001–13000: without MathML (`FUZZ_NO_MATH=1`), since MathML hides other problems under jsdom (CO-3).
  - 12651–12683: only timed.
- **Minimising:** crashers were shrunk with `minimize.js`.

`corpus-compare-summary.json` is the old-vs-new summary.

## Verification during consolidation

- **CO-1 and CO-3:** re-run with `repro.js`.
  - CO-1: `region cantTell … Maximum call stack size exceeded`.
  - CO-3: `region cantTell … Cannot read properties of undefined (reading 'length')`.
- **CO-7:** re-timed independently on 6 of the slowest pages with `timing.js` in Chromium, 4 alternated runs each, the fastest kept. Old totalled 1,267 ms and new 1,786 ms, 1.41× (these pages were picked for being slow).
- **Per-rule time added on those 6 pages:**

| Rule | Added time |
|---|---|
| contrast-computable | +196 ms |
| target-size-minimum | +171 ms (out of scope here) |
| text-spacing-content-loss | +121 ms |
| Any other rule | under 5 ms |

## Findings

| ID | Title | Category | Severity | Since |
|---|---|---|---|---|
| CO-1 | Self-referencing aria-labelledby/aria-describedby on an aria-hidden element overflows the stack [V] | crash | medium | 1.10.0 or earlier |
| CO-2 | SVG name rules take seconds when an svg inside a label is named from that label [V] | perf | medium | 1.10.0 or earlier |
| CO-3 | Under jsdom, elements nested inside `<math>` make rules error and change results between scans [V] | crash (jsdom only) | low–medium | 1.10.0 or earlier |
| CO-4 | link-in-text-block ignores text in sibling or wrapper elements; the separator change drops more [V] | false negative | medium | new loss plus an older gap |
| CO-5 | Placeholder contrast fails AAA on 29 pages because of Chromium's default `::placeholder` color | design question | info | new (documented, #103) |
| CO-6 | text-spacing-content-loss quotes `<style>` contents as the clipped text [V] | message quality | low | 1.10.0 or earlier |
| CO-7 | Whole-page scans are about 29% slower; contrast-computable is +59% [V] | perf (regression) | medium | new |

### CO-1: Self-referencing idref on an aria-hidden element overflows the stack

- **Repro** (Chromium and jsdom, old and new):
  `<div id="x" aria-hidden="true" aria-labelledby="x">Hi</div><main><p>ok</p></main>`.
- **Observed:** `region` returns `cantTell` with `error: "Maximum call stack size exceeded"`.
- **Other forms:**
  - `<button id="b" aria-hidden="true" aria-describedby="b">` makes `button-name-present` error.
  - The fuzz runs also hit `canvas-text-alternative-quality`, `role-img-text-alternative-present` and `iframe-name-present`.
- **Cost:** unwinding the overflow is slow. One fuzz seed took 18 s.
- **Cause:**
  - In `src/core/dom-helpers.js`, `isAccTreeEligible` (2357) calls `isReferencedByVisibleIdRef(node)` on its aria-hidden path (2611).
  - `isReferencedByVisibleIdRef` (1251) then calls `isAccTreeEligible(ref)` for each referrer.
  - Nothing guards against a node being checked while its own check is in progress, so a node that references itself recurses forever.
- **Expected:** a reference from an element to itself can't make that element visible.

### CO-2: SVG name rules take seconds on a label an svg names itself from

- **Repro:** `<label id="L">Hello<span id="A"><textarea role="document"></textarea></span><svg aria-labelledby="L A">x</svg></label>`.
- **Small case:** `svg-text-alternative-present` and `-quality` each take about 0.2 s in Chromium and about 1.1 s in jsdom on 5 elements.
- **Fuzz seed 12683** (`repro-co2-seed12683.html`, 94 elements):
  - Chromium: 6.6 s;
  - jsdom: 30 s;
  - old: about the same in both.
- **Trigger:** both parts are needed: the self-naming label, and a `textarea[role=document]` in the second reference.
- **Likely cause:** the profile is flat across `getLabelSubtreeNameInfo` (`dom-helpers.js:3576`) and `getContentNameInfo` (`:4505`), which suggests repeated walks with no caching.

### CO-3: Under jsdom, elements inside `<math>` make rules error and change results between scans

- **Cause:** in jsdom 29.1.1, `getComputedStyle(el)` of a MathML descendant throws on inherited properties. `isAccTreeEligible` and `isDomVisibleEligible` don't catch it.
- **Repros:**

| Markup | Rules that error |
|---|---|
| `<math><mn><mi></mi></mn></math>` | `region` |
| `<math><mtext><nav></nav></mtext></math>` | `region`, `scrollable-region-focusable` |
| `<math><mn><object></object></mn></math>` | `object-text-alternative-present` |
| `<math><mfrac lang=" "><mn><semantics></semantics></mn></mfrac></math>` | `valid-lang` |

- **A plain formula scans clean.**
- **Scale:** 305 of 3000 fuzz documents were affected, across 30 rules.
- **Results change between scans of the same DOM:**
  - `aria-valid-attr-value` reported 35 occurrences, then 34;
  - `aria-prohibited-children` reported fail, then pass;
  - the parity assertion failed on 25 seeds.
- **Chromium:** not reproduced.
- **Expected:** a style read that throws counts as "can't read the style" for that element.

### CO-4: link-in-text-block ignores text in sibling or wrapper elements

- **Cause:** `hasSurroundingText` (around `link-in-text-block.js:613`) reads only the direct text-node children of the link's parent.
- **New loss:** since 63cbede4, "|" and "·" separators don't count as text.
  - Repro: `<p><span>Company Inc. ID 1617539</span> <a href="/a">Consumer Access</a> | <a href="/b">Licenses</a></p>`. It went from fail to notApplicable.
  - On the corpus, 2 colour-only links were lost on finance-nerdwallet-homepage.
- **Older gap** (notApplicable in both versions):
  - `<p><span>Please read our</span> <a>terms</a> <span>before you sign up</span></p>`;
  - `<p>Please read our <strong><a>terms</a></strong> before you sign up.</p>`.

### CO-5: Placeholder contrast fails AAA on 29 pages because of Chromium's default color

- **Observed:** contrast-enhanced went from pass to fail on 29 pages, and from notApplicable to fail on 2.
  - Nearly all of these are empty fields with Chromium's default `::placeholder` #757575 on white (4.61:1).
  - This is documented in CHANGELOG #103.
- **The question:** the color comes from the browser, not the author, so these AAA failures may not be the page author's.
- **At AA, real failures were found:** for example, Trello's #97a0af at 2.64:1.

### CO-6: text-spacing-content-loss quotes CSS text

- **Where:** edtech-udacity-homepage (old and new). The quoted "cut-off text" is `.css-1cfnwmw{width:18px;…`, from an inline `<style>` (emotion SSR) inside the article.
- **Expected:** quote only rendered text.

### CO-7: Whole-page scans are slower on most pages

- **Serial Chromium timings** (no profiling):

| | Old | New | Ratio |
|---|---|---|---|
| Corpus total | 13,446 ms | 17,283 ms | 1.29 |
| Median page | | | 1.28 |

- **63 of 118 pages** are more than 20% and more than 20 ms slower.
- **Worst ratios:**

| Page | Old | New | Ratio |
|---|---|---|---|
| saas-github-repo-page | 168 ms | 278 ms | 1.65 |
| social-meetup-homepage | | | 1.58 |
| legal-lsc-homepage | | | 1.56 |
| forms-bankrate-homepage | | | 1.54 |

- **Largest absolute increase:** news-dailymail-homepage, 434 → 626 ms.
- **Without target-size-minimum:** about ×1.26, from the profiled run.
- **Per-rule time, corpus sums:**

| Rule | Old | New | Change |
|---|---|---|---|
| contrast-computable | 3,356 ms | 5,347 ms | +59% |
| text-spacing-content-loss | 2,247 ms | 2,849 ms | +27% |
| label-in-name | 152 ms | 246 ms | +62% |

- **How it spreads:** the contrast-computable increase is on every page, about +50–100 ms on large ones.
- **Re-checked independently:** see "Verification during consolidation" above.

## Transitions (Chromium, 118 pages, target-size-minimum excluded)

- **Volume:** 56 outcome transitions across 11 rules, and occurrence-count changes in 12 rules.
- **Stability:** the two new runs were identical on every page.
- **Crashes:** no rule returned `cantTell` with an `error` on any page, old or new.

| Rule | Transitions | Occurrences (old → new) | Verdict |
|---|---|---|---|
| contrast-enhanced | pass→fail 29, notApplicable→fail 2, pass→notApplicable 2 | 679 → 705 | CO-5. Two pages lost their only measured "text", an SVG `<title>`, which is correct. |
| contrast-minimum | pass→fail 3, fail→pass 2, pass→notApplicable 2, notApplicable→pass 2 | 77 → 96 | held up |
| contrast-computable | cantTell→pass 2, pass→cantTell 2 | 1315 → 1267 | held up |
| link-name-present | fail→pass 1 | 461 → 122 | held up: the findings that went away were double reports, or the role=alert false fail |
| text-spacing-content-loss | pass→cantTell 1, cantTell→pass 2 | 83 → 104 | mostly the new `TEXT_CLIPPED_FURTHER`; spot-checked |
| link-in-text-block | pass→notApplicable 2 | 13 → 11 | one of them is CO-4 |
| button-name-present | fail→pass 1 | — | held up (shadow root) |
| form-control-programmatic-label-quality | cantTell→pass 1 | — | held up (shadow root) |
| img-alt-decorative | cantTell→notApplicable 1 | — | held up |
| aria-prohibited-attr | cantTell→fail 1 | — | held up (Chromium agrees) |
| area-alt-quality | — | 254 → 50 | the intended cap of 50 (#157) |
| form-control-single-label | — | 2 → 1 | held up (duplicate id) |
| identical-links-same-purpose | — | 171 → 170 | not inspected |

## Held up

Each item was checked against the rendered page or Chromium's accessibility tree.

- **`<a href role=…>`** (c4e74870):
  - The 339 link-name-present findings that went away were double reports. The matching rule still reports them: menuitem-name-present, or button-name-present.
  - `<a href role="alert">` was an old false fail.
  - Roles tab, img, button, presentation and none match Chromium.
- **Names through shadow roots** (9bbfd91c): MDN's sidebar toggle and filter input are now named as Chromium names them. Before, they were a false fail and a cantTell.
- **Contrast:**
  - SVG `<title>` is no longer measured.
  - memrise's 42 menu links (1.30:1) are confirmed by `elementsFromPoint`.
  - Carousel cards outside the scroll origin are no longer reported.
  - Items scrolled out of an `overflow:auto` list are measured in place.
- **Embedded listbox** (9f55447a): aria-prohibited-attr went from cantTell to fail, and Chromium gives "" too.
- **Duplicate `id`:** `<label for>` reaches only the first of two inputs that share it.
- **`TEXT_CLIPPED_FURTHER`:** the udacity occurrences are on line-clamped cards that lose lines once the spacing is applied. The message is right.
- **Determinism:** the two new runs were identical in Chromium.
- **Fuzzing without MathML:** apart from CO-1 and CO-2, nothing threw, no rule errored, no scan differed from the next and no entry points disagreed.
- **Harness memory:** a synchronous loop of jsdom scans keeps closed documents alive until the event loop turns. 1.10.0 behaves the same. This comes from the harness, not the engine.

## Missing tests

- **CO-1:** an aria-hidden element whose aria-labelledby or aria-describedby names itself.
- **CO-2:** a timing guard for the SVG name rules on a label that a contained svg references.
- **CO-3:** MathML descendants in jsdom rule tests. No fixture contains `<math`.
- **CO-4:** link-in-text-block with the sentence in sibling `<span>`s, and with the link wrapped in `<strong>`/`<em>`.
- **CO-6:** a quoted excerpt from an element that contains `<style>` or `<script>`.
- **CO-5:** UA-default `::placeholder` colour, whichever way CO-5 is decided.
- **CO-7:** a Chromium timing comparison against the last release, run before each release.
