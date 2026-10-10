# Stress test of `main`, third round — outcomes

This file records what was done about each finding of [`2026-10-stress-test-3.md`](./2026-10-stress-test-3.md). The findings themselves stay as they were written.

- **Fix branch:** `fix/stress-test-3`, made from `main` at `eaa5d3f1`. It holds every fix, one branch for all of them until the maintainer says otherwise.
- **Before a fix:** each finding is reproduced on current `main` first.
- **Verifying a fix:**
  - results are compared field by field with `main` on the test pages and the saved pages;
  - the full suite and CI's checks are run;
  - timings are taken in Chromium against 1.10.0 and `main`.

Last updated 2026-10-09.

## 1. Status

| # | Finding | IDs | Status |
|---|---|---|---|
| 1 | Scans slower than 1.10.0 | CO-7, RB-4 | **contrast-computable part done** (§2.1). **text-spacing-content-loss done** (§2.2). Open: what #99 and #101 still cost, and target-size-minimum (out of this audit's scope, measured here). |
| 2 | A pack namespace equal to a core tag switches core rules off | PN-1, PT-2, PT-9 | **Done** (§2.3). Also done there: a namespace that starts core's rule ids is refused (part of PN-11). |
| 3 | The pack cache skips validation; key collisions; stale engine | PN-2, PN-3, PN-4, RB-13 | **Done** (§2.5). |
| 4 | The scaffold's `--title` is pasted unescaped | PT-3 | **Done** (§2.6). |
| 5 | Pack text can run as code in a page | PB-5, PB-6 | **Done**: names and versions validated (§2.4), written as data, and `</script` refused (§2.6). |
| 22 | Namespace and id rules are loose | PN-11, PN-15, PB-15, PB-16, PN-20 | **Done** (§2.4, and §2.28 for the rest). |
| 26 | `surea11y-pack` CLI | PT-5, PT-6, PT-7, PT-8, PT-17, PT-22 | **Done**: PT-8 in §2.4, the rest in §2.25. |
| 8 | `packScript` writes code that does not parse | PN-10, PB-4, PT-16, RB-6 | **Done** (§2.6). |
| 6 | TypeScript code written for 1.10.0 no longer compiles | PT-14, PT-4, PT-10, PT-11 | **Done** (§2.7). |
| 37 | Types and docs vs reality | OO-7, PT-10, OO-18, PT-19 | **Done** (§2.7 and §2.28). PT-10 was done by §2.7's ESM wrappers. |
| 7 | A rule reading outside its function passes its tests and lint, then fails in a browser | PT-1, PB-7 | **Done** (§2.8). |
| 9 | An occurrence's selector can resolve to another element | OO-1, RB-2, RB-8 | **Done** (§2.9). Open: very deep paths shortened from the top can match several elements (7 occurrences, one site). |
| 10 | A CSP that blocks inline styles gives text-spacing a false pass | RB-1 | **Done** (§2.10). |
| 27 | text-spacing leaves its stylesheet when removing it throws | RB-9 | **Done** (§2.10). |
| 11 | A button or link named only from a closed shadow root is a confident fail | RB-3 | **Done** for custom elements (§2.11). Open: a closed root on a built-in element (a `<span>`), which looks like an empty one; other name-from-content rules (menu items, tabs, options, treeitems, summary, tooltip). |
| 12 | A self-referencing ID reference on an aria-hidden element overflows the stack | CO-1 | **Done** (§2.12). |
| 13 | A selection that cancels itself runs no rule without a word | OO-2 | **Done** (§2.13). |
| 14 | Reporters disagree when an outcome and its occurrence tiers disagree | OO-4 | **Done** (§2.14). The rest of C-8/C-9 (a rule spoofing engine-owned fields, non-object occurrences) stays open. |
| 15 | `strictOptions: 'true'` or `1` silently means not strict | OO-5 | **Done** (§2.15). |
| 16 | Stored or compact pack results misreport | PB-12, PB-13, OO-3 | **Done** (§2.16). Left for item 23 (PB-23): a rollup whose `checksIds` isn't an array still makes the HTML report throw, and a repeated `standards` entry still renders its section twice. |
| 17 | A checklist's items reach neither SARIF nor JUnit | PB-14 | **Done** (§2.17). |
| 18 | link-in-text-block misses links whose sentence is in a sibling or wrapper element | CO-4 | **Done** for siblings (§2.18). A bold or italic wrapper around the link (`<strong><a>`) stays not applicable, as it would pass. |
| 19 | Packs in a page: separate scripts can't be combined, version skew, no trace | PB-1, PB-3, PB-17 | **Done** (§2.19): refused and reported, not combined. |
| 20 | One pack rule can replace `ctx.helpers` for every later rule, or change the DOM | PB-9, RB-7 | **Done** (§2.20). A rule that changes the page is named, not undone; changes inside shadow roots aren't seen by the watch. |
| 21 | Some rule throws or results abort the whole scan; circular or BigInt data breaks `JSON.stringify(result)` | RB-5, PB-8 | **Done** (§2.21). |
| 23 | `core` ranges are misread; a prerelease core satisfies a release range | PN-8, PN-21 | **Done** (§2.22). |
| 24 | Wrong shapes accepted or ignored silently | PN-5, PN-7, PN-23, OO-16 | **Done** (§2.23). |
| 25 | Doc slips in PACKS.md | PN-9, PN-24, PN-6 | **Done** (§2.24). |
| 28 | Elements inside `<math>` make rules error under jsdom, and results change between scans | CO-3 | **Done** (§2.26). |
| 32 | Two aria-hidden-focus reason codes missing from the finding-id inventory | OO-8 | **Done** (§2.27). |
| 33 | jsdom reads font-size keywords and `calc()` as 0 px | OO-9 | **Done** (§2.27); `larger`/`smaller` stay unresolved under jsdom (LIMITATIONS.md). |
| 34 | A null-prototype object in a list option crashes the scan; strict mode checks options late | OO-10 | **Done** (§2.27). |
| 36 | A policy that disallows `pass` reads as rules that did not complete; `allowedOutcomes` typos unchecked | OO-6 | **Done** (§2.27). |
| 40 | Text-spacing quotes `<style>` contents as page text | CO-6 | **Done** (§2.27). |
| 29 | SVG name rules take seconds on a self-naming label | CO-2 | **Done** (§2.28). |
| 30 | Name from content through ~2,000 shadow roots overflows the stack | RB-12 | **Done** (§2.28). |
| 31 | Broken page builtins give silently wrong results | RB-10 | **Done** (§2.28); DOM methods a page replaces are not checked (LIMITATIONS.md). |
| 35 | Wrong-typed options outside strict mode | OO-11, OO-12, OO-13, OO-15 | **Done** (§2.28). |
| 38 | Lint plugin gaps and false positives | PT-12, PT-13 | **Done** (§2.28). |
| 39 | Small items | PB-18, PB-19, PB-22, PB-23, OO-17, OO-19, PN-13, PN-14, PN-16, PN-17, PN-18, PN-19, PN-22, PT-15, PT-18, PT-20 | **Done** (§2.28); the English `css-hidden-focus` message ("Focusable a…") is left, as changing it changes every default result. |

Decisions in §2 of the findings: all open.

## 2. Done

### 2.1 contrast-computable: values worked out again for every text (CO-7, RB-4)

- **Commit:** `f3cb6fb9` on `fix/stress-test-3`, "Keep what the paint-order check shares per scan, and state its cost". It holds the code change and the CHANGELOG update in one commit, as the maintainer asked.

**What happened.** contrast-computable was timed alone at all 36 commits since 1.10.0 that touched the contrast code or `dom-helpers.js` (Chromium, fastest of 3 runs):

| Commit | 50k divs (ms) | dailymail (ms) | github (ms) | spiegel (ms) |
|---|---|---|---|---|
| v1.10.0 | 909 | 158 | 58 | 78 |
| `b41cfe2d` (#99, only visible text) | 996 | 175 | 65 | 85 |
| `b8b3d747` (#101, paint order) | 1,223 | 212 | 83 | 108 |
| `aa70aaa6`, `9bbfd91c` | ~1,300 | 240 | 101 | 132 |
| `9ee2455a` (earlier speed-up) | 1,185 | 217 | 87 | 113 |
| `main` (`eaa5d3f1`) | 1,134 | 226 | 90 | 118 |

The other commits are within noise.

**Why.**
- contrast-computable runs first among the contrast rules, so it pays for the shared text scan the other two reuse.
- **#101 (b8b3d747):** added `__paintBackdropOf` for every text element. Before it can say that nothing lies near the text, it:
  - builds the ancestor chain;
  - measures the element's box;
  - reads each ancestor's `overflow` and `z-index`;
  - parses the root's background, on every call.
- **aa70aaa6:** `__paintedPart`, which walks every painted box's ancestors, roughly doubled the overlap index's cost (18 → 34 ms on dailymail).
- **#99 (b41cfe2d):** added layout reads per text: its box, the clipping ancestors, and the scroll offsets.

**What was done.** These values are now kept once per scan, beside the paint caches already there:
- the root's facts;
- each element's overflow clipping;
- whether an element or an ancestor sinks under a negative `z-index`;
- the scroll offsets;
- the clip boxes above each ancestor.

A chain that the 1,000-ancestor guard cuts short keeps nothing, and is walked as before. Nothing measured changed.

**Results.** None changed:
- **jsdom:** 411 of 411 identical (137 test pages × 3 option sets).
- **Chromium:** 508 of 510 identical (137 test pages and 118 saved pages × 2 contrast modes).
- **The 2 that differed:**
  - knowyourmeme, which changes between loads;
  - uol's `engine.environment.images`, "loaded" or "loading".

  `main` against `main` gives the same kinds of difference.
- **The suite:** 4,603 of 4,603 tests pass, and every CI check passes.

**Timings** (Chromium, fastest of 5, contrast-computable alone):

| Page | 1.10.0 (ms) | `main` (ms) | Branch (ms) | Regression recovered |
|---|---|---|---|---|
| 50k divs | 876 | 1,213 | 1,070 | 42% |
| dailymail | 151 | 229 | 200 | 37% |
| github | 59 | 93 | 79 | 41% |
| spiegel | 81 | 119 | 100 | 50% |

**Whole scans, 118 saved pages** (fastest of 2 per page, per-rule sums):

| | 1.10.0 | `main` | Branch |
|---|---|---|---|
| contrast-computable | 3,025 ms | 4,793 ms | 4,477 ms |
| the three contrast rules | 3,698 ms | 5,498 ms | 5,200 ms |
| text-spacing-content-loss | 1,935 ms | 2,525 ms | 2,527 ms |
| target-size-minimum | 545 ms | 1,672 ms | 1,703 ms |
| whole scan | 13,578 ms | 17,401 ms | 17,191 ms |

- **On the saved pages:** the change recovers about 18% of contrast-computable's regression. Inside a full scan, part of what it saves had already been paid by rules that run earlier.
- **Against 1.10.0:**
  - contrast-computable is still about 49% slower, the price of #99 and #101 that is left;
  - a whole scan is about 27% slower.

**CHANGELOG.**
- The earlier speed-up entry now says "faster than earlier in this release", and gives this change's figures.
- #101's entry states what #99 and #101 cost against 1.10.0: the three contrast rules take about 40% longer, and a whole scan about 11% longer from them.

### 2.2 text-spacing-content-loss: walks up the tree repeated for every text (CO-7)

- **Commit:** `2fb74a60` on `fix/stress-test-3`, "Let text-spacing's walks up the tree share what they found". The code change and the CHANGELOG entry are in one commit.

**What happened.** The rule was timed alone at all 23 commits since 1.10.0 that touched it or `dom-helpers.js` (Chromium, fastest of 3 runs):

| Commit | wikipedia (ms) | dailymail (ms) | toyota (ms) | channelnewsasia (ms) | reebok (ms) |
|---|---|---|---|---|---|
| v1.10.0 | 64 | 114 | 30 | 38 | 42 |
| `abf1b653` (excerpt with fewer lines) | 65 | 99 | 32 | 40 | 42 |
| **`fe77743d`** (#184, fixed bars and scrolled-out text) | 95 | 120 | 56 | 63 | 50 |
| `main` | 93 | 116 | 56 | 65 | 52 |

The other commits are within noise.

**Why.**
- fe77743d added two walks from every text up to the root:
  - `paintClippersOf`, the boxes that clip what is painted;
  - `pinned`, a fixed or sticky ancestor.
- Both were kept per element, but the texts inside one box repeated the same walk.
- On toyota they cost 12 and 14 ms of the rule's 86 ms (profile of an unminified build).
- The older `clippersOf` walk had the same shape. It accounted for 15 ms in 1.10.0.

**What was done.**
- Each of the three walks keeps its answer for every element it passes, and stops at the first one already answered.
- `clippersOf` keeps its answer per element and per the axes that already scroll below it.
- The lists are only read, so texts can share them.
- The `scrollX`/`scrollY` reads (about 10 ms on toyota) were left alone: the scroll position can change once the spacing stylesheet forces a layout, so keeping it could change results.

**Results.** None changed:
- **Chromium:** 255 of 255 identical against `f3cb6fb9` (137 test pages and 118 saved pages). `f3cb6fb9` against itself also gave 255 of 255.
- **jsdom:** 411 of 411 identical.
- **The suite:** 4,603 of 4,603 tests pass, and every CI check passes.

**Timings** (Chromium, fastest of 5, the rule alone):

| Page | 1.10.0 (ms) | Before (ms) | After (ms) |
|---|---|---|---|
| wikipedia | 62 | 99 | 53 |
| dailymail | 113 | 125 | 98 |
| toyota | 31 | 61 | 28 |
| channelnewsasia | 37 | 68 | 39 |
| reebok | 44 | 53 | 43 |

**Whole scans, 118 saved pages:**

| | 1.10.0 | Before | After |
|---|---|---|---|
| text-spacing-content-loss | 1,912 ms | 2,541 ms | 1,812 ms |
| whole scan | 13,414 ms | 17,217 ms | 16,401 ms |

- The rule's regression is gone, and it is about 7% faster than in 1.10.0.
- A whole scan is now about 22% slower than 1.10.0, down from about 28%. What is left is contrast-computable (+50%, §3) and target-size-minimum (+211%, §3).

### 2.3 A pack's namespace switched core's rules off (PN-1, PT-2, PT-9)

- **Commit:** `1fd97c9c` on `fix/stress-test-3`, "Make only a pack's own rules opt-in, and keep its namespace off core's ids". The code, tests, docs and CHANGELOG are in one commit.
- **Choice:** option B, decided by the maintainer: keep the two apart rather than refuse the collision. A refusal would have to grow with every tag core adds, and would break published packs when it did.

**Cause.**
- A standard's `ruleTag` (for a pack, its namespace) made every rule carrying that tag opt-in, whoever brought the rule. Ownership was decided by the tag string alone, in five places:
  - the rule selection;
  - the rollup listing;
  - the composite tags;
  - the pack's composite membership;
  - the independence check.
- A standard's profile added the tag to its tag list, so it also selected core rules carrying a tag of the same name.

**What was done.**
- **Ownership:**
  - A rule entry says whether it is core's.
  - The catalog lists the opt-in rules and rollups by owner (`optInOwned`): a rule a pack or a profile's folder brings, or a standard's own rollup, carrying its tag.
  - Selection reads that list. Custom rules keep the tag test.
  - A pack's overrides count as core's rules.
- **Profiles:**
  - A standard profile's own tag is kept apart (`profileOwnTags`) and selects its own rules and rollups only.
  - A caller's `runOnly` can't set it.
  - An explicit `runOnly` tag still selects every rule carrying it.
- **Namespace rule:** a namespace that starts core's rule ids (`img`, `aria`, `link`) is invalid, and `surea11y-pack new` asks for another.
- **Residual, documented in PACKS.md:** core doesn't start a new rule id with a namespace a published pack uses.
- **Also found while testing:** on `main`, a pack's override that carried the pack's tag stopped running in default scans, so core's rule was gone. This is fixed too.

**Results.**
- **No pack, and core's sample pack:** identical.
  - jsdom: 822 of 822 (137 test pages × no pack, sample pack by default, under its profile, with `optInRules: 'all'`, and two other option sets).
  - Chromium: 508 of 510 (137 test pages and 118 saved pages × 2 contrast modes). The 2 are knowyourmeme, which changes between loads.
- **Colliding namespaces** (`best-practice`, `landmarks`, `tables`, `forms`): a default scan runs all 134 core rules, and none of the packs is skipped.
- **The pack's profile:** runs its tags' selection plus its own rule and item, and none of core's rules with the same tag.
- **The suite:** 4,608 of 4,608 tests pass, and every CI check passes.
- **New tests:** 5 in `packs.test.js` and `pack-scaffold.test.js`. All but the `runOnly` guard fail on `main`.
- **Older tests:** two used the namespace `p`, which starts core's `p-as-heading`. They now use `q`.

### 2.4 A pack's names and ids checked as documented (PN-11, PN-15, PB-16, part of PB-5 and PT-8)

- **Commit:** `eafebe3b` on `fix/stress-test-3`, "Check a pack's names and ids as documented". The code, tests, docs and CHANGELOG are in one commit.
- **Decisions** (maintainer's, 2026-10-09):
  1. ids have core's shape;
  2. of two packs with overlapping namespaces, the second by name is skipped;
  3. `wcagSc` names real WCAG criteria;
  4. versions are whole semver versions.

**What `checkPack` refuses now.**
- **Ids:** an id not in core's shape: lowercase letters and digits in parts joined by `-`, dots within a part. A rollup id may keep the capitals of a requirement's number, as in `sample-1.0-S1`. This is checked on rule, variant and rollup ids, profile names, and a standard's key.
- **Namespace:** profile names, a standard's `key` and its rollup ids must start with the namespace, and `ruleTag` must be the namespace.
- **Rules:** duplicate rule ids, a `meta` that is no object, and a `wcagSc` naming no WCAG criterion.
- **Name and version:** a name npm would refuse, and a version that isn't a whole version.
- **Two packs:** when namespaces are the same, or one starts the other's and `-`, the first by name runs and the other is skipped (it throws under `strictOptions`).

**Other changes.**
- `surea11y-pack new` asks for another name when npm would refuse it.
- Baselines and SARIF fingerprints read `reasonCode` only when it is a non-empty string.
- **Effect on PB-5:** `packScript` now refuses a name or version with a line break, because `checkPack` does. Checked with fresh objects.

**Results.**
- **jsdom:** 822 of 822 identical, without packs and with the sample pack.
- **Baselines and SARIF:** the baseline entries and SARIF log of every test page were identical. No core rule sets a non-string `reasonCode`.
- **Chromium:** the generated core and browser bundle don't change, so browser results can't differ.
- **The suite:** 4,612 of 4,612 tests pass, and every CI check passes.
- **New tests:** each new test fails on `1fd97c9c`.

**Seen on the way, then done as item 3 (§2.5):** a strict scan with pack objects that a non-strict scan already prepared reuses the cached engine, and doesn't validate again (PN-2). The new test builds fresh packs for its strict check.

### 2.5 The engine kept for the same packs (PN-2, PN-3, PN-4, RB-13)

- **Commit:** `9f08404c` on `fix/stress-test-3`, "Keep the engine for pack objects only, check it under strict mode, and freeze packs". The code, tests, docs and CHANGELOG are in one commit.
- **Choice:** option A, the maintainer's: freeze in `definePack`, rather than fingerprinting the packs on every scan.

**What was done.**
- **Strict calls (PN-2):** a strict call throws for a pack a kept engine skipped, as a fresh call would. This covers `strictOptions: true` and `packScript`, which is always strict.
- **Cache key (PN-3):** only lists of pack objects are kept. Anything else is checked as it comes, so `packs: ['3']` no longer runs the pack that happened to get id 3.
- **Changed packs (PN-4, RB-13):** `definePack` freezes the pack with its lists and objects, though not its functions, so a change throws in strict code. A pack made without `definePack` isn't frozen, and the docs say not to change one once used.

**Results.**
- **jsdom:** 822 of 822 identical, without packs and with the sample pack.
- **Chromium:** the generated core and browser bundle don't change.
- **The suite:** 4,615 of 4,615 tests pass, and every CI check passes.
- **pack-rgaa:** its 883 tests pass against this commit with its pack frozen. It was run in a scratch copy pointed at the branch, and the repository wasn't touched.
- **New tests:** each new test fails on `eafebe3b`.

### 2.6 What core writes for a pack always parses and runs nothing by accident (PT-3, PB-5, PB-6, PN-10, PB-4, PT-16, RB-6)

- **Commit:** `a5189830` on `fix/stress-test-3`, "Write pack code and titles so they always parse and never run by accident". The code, tests, docs and CHANGELOG are in one commit.
- **Choice for PB-6:** option A, the maintainer's: refuse `</script` and name the rule, rather than rewriting it.

**What was done.**
- **A rule's code is read back in each way it can be written,** and the first form that parses is kept. The check compiles in Node with `vm.Script` and never runs anything.
- **A function with no source** (bound, built in) makes the pack invalid, and `checkPack` names the rule.
- **The final script is checked to parse** before `packScript` returns it.
- **`</script` in a rule's code** makes `packScript` and `buildBrowserBundle` throw, naming the rule.
- **Names are written as data:** the script's header gives the pack names as JSON, and U+2028 and U+2029 are escaped.
- **The scaffold writes the title for each file type:**
  - a JavaScript string;
  - text inside a comment that can't end it;
  - a JSON string.

  A title with a control character is refused.

**Found on the way: a generated standard pack failed its own `npm test`.**
- **When:** the namespace sorted after `heading-order`, such as `titled` or `zeta`.
- **Why:** the template's expected rule list was in a fixed order.
- **Fix:** the list is now sorted. Both kinds now pass their 12 tests with namespace `zeta`.

**Results.**
- **jsdom:** 822 of 822 identical, without packs and with the sample pack.
- **Chromium:** the generated core and browser bundle don't change.
- **The suite:** 4,619 of 4,619 tests pass, and every CI check passes.
- **pack-rgaa:** its 883 tests pass against this commit, and its 1.3 MB pack script builds and parses.
- **New tests:** each new test fails on `9f08404c`.

### 2.7 TypeScript code written for 1.10.0 compiles again (PT-14, PT-4, PT-10, PT-11)

- **Commit:** `34064a05` on `fix/stress-test-3`, "Keep TypeScript code written for 1.10.0 compiling, and the types true". The code, tests, docs and CHANGELOG are in one commit.
- **Decisions:** the maintainer took all the recommendations.

**What was done.**
- **Fields added since 1.10.0:** `RuleMeta.helpUrl` and `tags`, and a frame's `selector` and `title`, are optional in the types. Results always carry them.
- **Contributor severity:** `contributors[].severity` is typed `string | null` again, as in 1.10.0, with a comment saying a missing contributor carries none. This is option (c): no result changes.
- **`window.a11ycore`:** the types no longer declare it, which avoids TS2717 in projects that declare it themselves. The README shows the line to add.
- **Smaller type fixes:**
  - `ruleMappedStandard` options are typed as they are read (PT-4);
  - `testing` `runOnly` takes every form a scan takes (PT-11).
- **Named ESM imports (PT-10):** `/browser` and `/eslint-plugin` have ES module entries (`.mjs`), so the named imports the types declare work in Node. `require()` is unchanged.
- **API_STABILITY.md:**
  - code compiled against a minor keeps compiling;
  - input types may accept more;
  - closed sets in results (`EngineErrorCode`) may gain a member.

  The note claiming results' `meta` has no `tags` is corrected.

**Accepted, and documented in API_STABILITY.md.**
- `EngineErrorCode` gained members.
- `LegacyTagRunOnly.type` and `CustomRule.meta` accept more.

**Results.**
- **The audit's assignability probe:** it went from 25 diagnostics to the 4 accepted widenings, plus its limitation with the generic `Open`.
- **The new type test:** it compiles code written for 1.10.0's types. It fails on `a5189830` with exactly the four breaks, and compiles against 1.10.0's own types.
- **Packaging:** a tarball installed in an empty project imports both entries by name and with `require()`.
- **Runtime:** no runtime file changed apart from the two new entries.
- **The suite:** 4,620 of 4,620 tests pass, and every CI check passes.

### 2.8 A rule reading outside its function fails its test and lint (PT-1, PB-7)

- **Commit:** `ca3e4dff` on `fix/stress-test-3`, "Catch a rule that reads outside its function before a page does". The code, tests, docs and CHANGELOG are in one commit.
- **Decision:** the maintainer took both parts.

**What was done.**
- **Tests (`@surea11y/core/testing`):** a scan with packs also runs them as a page has them.
  - The packs are registered by `packScript`'s script, once per prepared engine, and run by the in-page runner.
  - The two results must agree, as they must for core's rules.
  - A rule that fails with "X is not defined" only in the page gets a message naming X and saying why.
- **Lint:** a new plugin rule, `safe-dom/self-contained`, flags a name read in `runInPage` or `applicability` that the file defines outside them, however the functions are written. It is in `configs.recommended` and is on for core's rules.

**Results.**
- **Scan results:** no engine code changed, so they can't.
- **Core's rules:** none of the 134 is flagged by the new lint rule.
- **pack-rgaa:**
  - its 883 tests pass through the new path, taking 42 s against 39 s before;
  - its 69 rules lint clean.
- **The suite:** 4,622 of 4,622 tests pass, and every CI check passes.
- **New tests:** the test of a rule reading a module constant fails on `34064a05`.

### 2.9 An occurrence's selector names the reported element (OO-1, RB-2, RB-8)

- **Commit:** `bb2ec5f8` on `fix/stress-test-3`, "Name the reported element in an occurrence's selector". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Uniqueness is counted over the whole document:** the uniqueness of an id, test id, `name` or `aria-label` anchor is counted over the whole document and its open shadow roots, whatever is hidden, excluded or out of scope.
  - Before, the count left those elements out, so an anchor they shared looked unique.
  - Also before, a hidden element's own unique id was never used. That was RB-8's jsdom vs Chromium difference.
- **Found on the way:** `contrast-minimum` and `contrast-enhanced` set `#` and the raw id themselves, unchecked and unescaped, before the engine built the selector. An occurrence with an element now takes the engine's selector.

**Results** (Chromium, 137 test pages and 118 saved pages, 39,857 occurrences).
- **Selectors not naming exactly their element:** from 284 down to 15.
- **The 15 left:**
  - elements in shadow roots, which `document.querySelector` can't reach (`structuralPath` places them);
  - a missing `<title>` reported as absent;
  - 7 very deep elements on one site whose path is shortened from the top.
- **Changed selectors:** 303.
- **Other changes:** only selector fields in `data.details` (`targetSelector`, `conflictWith`), on 5 pages. On wwf, the old `conflictWith` matched two elements, and the new one matches the intended one.
- **jsdom:** results identical apart from selectors, 822 of 822.
- **Baselines and SARIF fingerprints:** unchanged, since they don't use selectors.
- **Scan time:** unchanged (+0.2% on six heavy pages).
- **The suite:** 4,623 of 4,623 tests pass, and every CI check passes.
- **The new test** fails on `ca3e4dff`.

### 2.10 text-spacing measures where a CSP blocks inline styles, and never leaves its spacing (RB-1, RB-9)

- **Commit:** `65e9b385` on `fix/stress-test-3`, "Apply text-spacing's spacing where a CSP blocks inline styles, and never leave it". The code, tests, translations, docs and CHANGELOG are in one commit.

**Checked in Chromium first.**
- Under `style-src 'self'`, `default-src 'none'` and a nonce-only policy, an added `<style>` has no effect, and the browser gives it no style sheet (`.sheet` is null).
- A constructed style sheet adopted by the document (`adoptedStyleSheets`) applies under all three, `@layer` included.

**What was done.**
- **The `<style>` stays the first choice,** so pages where it applies are measured exactly as before.
- **When the browser gives it no style sheet,** the spacing is applied as an adopted style sheet and measured.
- **Where neither applies,** the page is asked about (`SPACING_NOT_APPLIED`, cantTell) instead of passed. The message is in five languages, and the code is in the finding-id inventory.
- **Cleanup (RB-9):** the spacing is taken off however the page's code breaks one way of removing it: `removeChild`, then `remove()`, and at worst emptying the sheet.

**Results.**
- **Unchanged pages:** text-spacing results are identical on the 137 test pages and 118 saved pages in Chromium. jsdom is identical too (822 of 822).
- **The one saved page with a CSP** (flickr) allows inline styles, and is unchanged.
- **The suite:** 4,626 of 4,626 tests pass, and every CI check passes.
- **The three new Chromium tests:**
  - findings under three policies equal those without one;
  - a page where neither way applies is asked about;
  - the spacing comes off with a throwing `removeChild`.

  Each fails on `bb2ec5f8`.
- **Writing the test needed care:** `style-src 'self'` also blocks a page's `style` attributes, so the test styles its boxes from a same-origin file.

### 2.11 A button or link named inside a closed component is asked about (RB-3)

- **Commit:** `b84830ba` on `fix/stress-test-3`, "Ask about a button or link named inside a closed component, don't fail it". The code, tests, translations, docs and CHANGELOG are in one commit.

**What was done.**
- **The shared content-name helper** flags `closedContent` when its walk meets a custom element with no children and no open shadow root that still renders. It renders when it has a box where there is layout, or is a defined element where there is none (jsdom). Name values don't change.
- **`button-name-present` and `link-name-present`** turn an empty name with that flag into a question: `cantTell`, `name_closedContent`, `not-computable`.
- **Unchanged:**
  - a plain failure reads as before;
  - a button over an empty, undefined custom element is still failed.

**Kept out of scope.**
- **A closed root on a built-in element** (declarative `shadowrootmode="closed"` on a `<span>`) can't be told from an empty `<span>` showing a CSS icon. That is the common unnamed icon button, a true failure, so it is still failed. LIMITATIONS.md says so.
- **The other name-from-content rules** (menu items, tabs, options, treeitems, summary, tooltip) don't ask yet.

**Results.**
- **The audit's shadow-naming probe:** `closedShadowIcon` and `linkClosed`, which Chrome names "Save", are now `cantTell` instead of `fail`. `dsdClosed` (on a `<span>`) stays `fail`, as decided.
- **Unchanged pages:**
  - button and link results are identical on the 137 test pages and 118 saved pages in Chromium, which have no such component;
  - all jsdom results are identical (822 of 822).
- **The suite:** 4,628 of 4,628 tests pass, and every CI check passes.
- **New tests:** both fail on `65e9b385`.

### 2.12 aria-hidden ID references that come back to the element end (CO-1)

- **Commit:** `13dd66d1` on `fix/stress-test-3`, "End aria-hidden ID references that come back to the element". The code, test and CHANGELOG are in one commit.

**Cause.** Whether a reference lifts `aria-hidden` from an element depends on whether the referring element is itself visible. For an element that labels or describes itself, that asks the same question again, for ever, until the stack overflows.

**What was done.** The elements whose exception is being decided are kept up the call stack, and a reference from one of them doesn't count. Such a reference always recursed for ever before, so no result that ended can change.

**Results.**
- **The audit's cases:**
  - `region` no longer errors on a `div` that labels itself;
  - `button-name-present` no longer errors on a button that describes itself. It is now `notApplicable`, like the same button without the reference.
- **Controls, unchanged:**
  - a visible button named by hidden text still lifts `aria-hidden`;
  - a plain hidden button stays hidden.
- **Unchanged pages:**
  - jsdom: whole-scan results identical, 822 of 822;
  - Chromium: 508 of 510 identical. The 2 are knowyourmeme and uol, which change between loads with either build.
- **The suite:** 4,629 of 4,629 tests pass, and every CI check passes.
- **The new test** fails on `b84830ba`.

### 2.13 A rule selection that runs no rule says so (OO-2)

- **Commit:** `c068858e` on `fix/stress-test-3`, "Say so when a rule selection runs no rule". The code, tests, docs and CHANGELOG are in one commit.
- **Choice:** warn by default, and throw under `strictOptions`. Throwing by default would have changed what existing callers get, against the no-breaking-changes rule.

**What was done.**
- **Empty selection:** a scan whose selection kept no rule warns, naming the parts that cancel, and throws `INVALID_RUN_ONLY` under `strictOptions`, as an include naming nothing already does.
- **`includeMode`:** a value other than `'and'` or `'or'` warns and is read as `'and'`, and throws under `strictOptions`.

**Results.**
- **Scan results:** they don't change. jsdom results are identical, 822 of 822.
- **The suite:** 4,632 of 4,632 tests pass, and every CI check passes.
- **New tests:** the two of them fail on `13dd66d1`.

### 2.14 A rule's outcome agrees with its occurrences' tiers (OO-4)

- **Commit:** `06a27912` on `fix/stress-test-3`, "Make a rule's outcome agree with its occurrences' tiers". The code, tests, docs and CHANGELOG are in one commit.

**What was done.** `normalizeRuleResult` makes the outcome agree with the tiers before anything reads it, so SARIF, JUnit, baselines and EARL give one answer:
- a `fail`-tier occurrence makes a `cantTell` or `pass` into `fail`;
- a `fail` whose occurrences are all `cantTell`-tier becomes `cantTell`;
- a manual rule is still never `fail`, and its `fail`-tier occurrences become `cantTell` with it.

**Results.**
- **The audit's tier probe:** every shape now gets the same answer from all four reporters.
- **Core's rules never returned them at odds:**
  - jsdom: whole-scan results identical, 822 of 822;
  - Chromium: 509 of 510 identical. The 1 is knowyourmeme, which changes between loads.
- **The suite:** 4,634 of 4,634 tests pass, and every CI check passes.
- **New tests:** both fail on `c068858e`.

### 2.15 strictOptions read as a command line or environment variable spells it (OO-5)

- **Commit:** `a2acf217` on `fix/stress-test-3`, "Read strictOptions as a command line or environment variable spells it". The code, types, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **The helper `strictOf`:**
  - `true`, `'true'`, `'1'` and `1` are strict;
  - `'false'`, `'0'`, `0` and `''` are not;
  - any other value is read as not strict, with a warning naming it.
- **Every reader of the switch uses it:** the option checks, the empty selection (item 13), `includeMode`, and packs.
- **Types:** the type accepts those forms.

**Visible change, stated in the CHANGELOG.** A scan that already passed `'true'` or `1` is now strict, as it asked. A mistake in its options now throws, where it used to be ignored.

**Results.**
- **jsdom:** results identical, 822 of 822.
- **The suite:** 4,638 of 4,638 tests pass, and every CI check passes.
- **New tests:** three of the four fail on `06a27912`.

### 2.16 Compact and stored pack results report as the full ones (PB-12, PB-13, OO-3)

- **Commit:** `b973b769` on `fix/stress-test-3`, "Keep compact results and stored standards reportable". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Compact output keeps what can't be filled back in.** With `output.detail: 'findings'`, a pass or notApplicable with no occurrences is still cut to its id, outcome and type, unless core's own catalog couldn't put it back as it was. It stays whole then:
  - every rule of a scan with packs (the pack catalog now records its packs, in Node and in a page);
  - a custom rule;
  - a rule whose title or description the scan's `messages` changed.
- **Reporters read standards from the result itself when its list is unusable.** When `standards` is missing, not an array, has an entry without a string `key` and `standard`, or names `WCAG`, a standard a rollup's `meta.standard` or a built-in or pack rule's entries name that the list lacks is added under its own name, keyed by that name (`sample-standard`). The HTML report says the list could not be read. A standard only a custom rule names is still left out, with no note.
- **The WCAG table labels a row by its WCAG entry;** a rollup with none is labelled by its own standard ("Sample Standard S1"), never "WCAG S1".
- **i18n:** the new note in the five locales; I18N.md counts.

**Visible changes, stated in the CHANGELOG.**
- Compact results of scans with packs, custom rules or caller messages are larger, as those rules stay whole. In a browser, a non-English scan loads its locale as `messages`, so its reworded rules stay whole too.
- A damaged or missing list now gives SARIF tags and JUnit properties keyed by the standard's name (`sample-standard-S1`), where they were dropped.

**Results.**
- **Probes:** `06`, `06b` and `10c` now render every reporter identically from compact and full results; `10b` shows no "WCAG S1" row and keeps the SARIF tags and JUnit properties in every damaged variant.
- **jsdom:** results identical, 959 of 959 (fixtures with no options and six compact variants: plain, `fr`, all opt-in rules, a WCAG profile, EN 301 549 mappings, auditor contrast).
- **Packs, custom rules, messages:** 964 identical; the 406 differences are all in the three compact sets meant to change, and on 80 of them every difference is a rule kept whole, with outcomes and rollups unchanged.
- **Chromium:** 508 of 510 identical, full and compact; the 2 are `meme-knowyourmeme-homepage`, which changes itself.
- **The suite:** 4,644 of 4,644 tests pass, and every CI check passes.
- **New tests:** six fail on `a2acf217` (custom rule, messages and packs in compact output; packs in a page in Chromium; an unusable standards list; a rollup without a WCAG entry). A seventh, a custom rule's own standard, passes on both, guarding that it stays left out.

### 2.17 A checklist's items show in SARIF and JUnit (PB-14)

- **Commit:** `6f819da7` on `fix/stress-test-3`, "Show a checklist's items in SARIF and JUnit". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **The checklist gives its rules entries for its items.** Its `mappingsFor` returned `[]`; it now gives each rule an entry for every item that groups it (`{ standard: <title>, version, requirement: <item id>, title, wcagSc: [] }`), as a standard gives its rules one per requirement. A rollup has none beyond its own. SARIF and JUnit read those entries as they do a standard's, with no reporter change for JUnit.
- **SARIF names an item by its id.** A requirement already starting with the standard's key and "-" is its own tag (`city-images`), not `city-city-images`. No built-in or sample requirement starts that way, so their tags are unchanged.
- **Docs:** PACKS.md, ENGINE_OPTIONS.md and the checklist template's README say SARIF tags each rule with its items and JUnit lists them among its criterion's properties.

**Visible change, stated in the CHANGELOG.** Under a checklist's profile, each rule an item groups has an entry for it in `meta.normativeMappings`, SARIF tags it with the item's id, and JUnit adds `<property name="<namespace>" value="<item id>"/>` to its criterion's suite.

**Results.**
- **jsdom, one process per tree** (a first run had a checklist naming a rule that doesn't exist, so the pack was skipped in both trees and proved nothing; the rerun checks it isn't): identical on 137 of 137 pages with no pack, the sample standard, and the checklist without its profile. Under the checklist's profile, all 137 differ only in `normativeMappings`; SARIF and JUnit change with them, and the HTML report and EARL are identical.
- **Chromium:** a checklist registered with `packScript` gives the same entries and tags.
- **A checklist item grouping another pack's rule** is refused as before.
- **The suite:** 4,645 of 4,645 tests pass, and every CI check passes.
- **New test:** fails on `b973b769`.

### 2.18 link-in-text-block judges a link whose sentence is split into elements (CO-4)

- **Commit:** `012e1926` on `fix/stress-test-3`, "Judge a link whose sentence is split into elements in link-in-text-block". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Text in an inline element beside the link counts as text around it.** Only direct text nodes counted. Now an element sibling counts when it is `display: inline` and holds a letter or digit, unless it is another link, is drawn invisibly (`isVisuallyHidden`, a screen-reader-only label), is an inline-block, or the parent is a flex or grid container. At most 200 nodes are read per sibling, and the answer is kept per parent, so a parent with thousands of links stays linear.
- **The link is compared with the style of the element holding the text:** the parent when the text is typed directly (as before), else the inline element beside it, for weight, style and colour.

**The audit's two examples.**
- `<span>Please read our</span> <a>terms</a> <span>before you sign up</span>`: now applicable.
- The nerdwallet footer: on the real page the "NerdWallet Compare, Inc. NMLS ID# 1617539" span is `class="block"`, a line of its own, so "NMLS Consumer Access | Licenses and Disclosures" is a row of links and correctly stays not applicable. The simplified repro had them on one line; there it is now applicable.
- `<strong><a>terms</a></strong>` in a sentence stays not applicable: the bold wrapper sets the link apart, so it would pass.

**Results.**
- **Chromium, 255 pages (fixtures and 118 real pages), this rule old vs new:** 239 identical. 14 go from notApplicable to pass. dailymail gains two fails, "Contact us at: tips@dailymail.com" (1.8:1) and "Play now … View more" (2.7:1); with the corpus page's stylesheets blocked, both render as plain text beside a colour-only link. axe doesn't apply to either: it skips a link longer than the text around it, a heuristic it applies to direct text too and this rule has never used. A first version compared the link with the parent's style; it is now the text's own element.
- **Speed:** the rule takes 5.9 s over all pages, against 5.7 s.
- **jsdom, all rules:** 405 of 411 scans identical; the 6 are this rule and its 1.4.1 rollup on `all-pass.html` and `link-name-present-all-scenarios.html`, now applicable and passing.
- **The suite:** 4,647 of 4,647 tests pass, and every CI check passes.
- **New tests:** fail on `6f819da7`.

### 2.19 Packs a page doesn't run are reported, and packs from another core refused (PB-1, PB-3, PB-17)

- **Commit:** `9819bdba` on `fix/stress-test-3`, "Report packs a page doesn't run, and refuse packs from another core". The code, tests, docs and CHANGELOG are in one commit.

**Decision.** A page doesn't combine packs from separate `packScript` calls or run part of one: their catalog is core's with exactly those packs, checked against each other in Node, which the page can't redo. The docs now say packs a scan uses together go in one call, and the page reports any other naming.

**What was done.**
- **The in-page entry checks the named set before running.** Named packs are not run when no registered set matches them exactly, when their script was prepared with another core version, or when it uses a core rule the bundle lacks. The result lists each in `skippedPacks` (`{ name: "<name@version>", reason }`), as a Node scan does; the reason names the sets registered or the two versions. The scan warns with the same text and throws under `strictOptions`.
- **`packScript` records `core`,** the version it was prepared with.
- **The registry is read by its own keys:** a pack named `__proto__`, `toString` or `constructor` read an inherited property as a registered set (found while testing).
- **Docs:** ENGINE_OPTIONS.md "In a page", PACKS.md §8, and `skippedPacks` in OUTPUT_SCHEMA.md.

**Probes.** `01-inject-order.js`: d3, d4, e, f2, f3 and g now give `skippedPacks` and a warning naming the registered sets; f4 throws with it. `02-version-skew.js` b (a script using a core rule the bundle lacks): refused, and `contrast-minimum` and its rollup stay. a (the released 1.10.0 bundle) can't check, as it predates this.

**Results.**
- **jsdom, one process per tree:** identical on 548 of 548 scans (no pack, the sample standard, a checklist with and without its profile).
- **Chromium:** 508 of 510 identical; the 2 are `meme-knowyourmeme-homepage`, which changes itself.
- **The suite:** 4,650 of 4,650 tests pass, and every CI check passes.
- **New tests:** four fail on `012e1926`.

### 2.20 Pack and custom rules can't change what core's rules find (PB-9, RB-7)

- **Commit:** `a4744647` on `fix/stress-test-3`, "Keep pack and custom rules from changing what core's rules find". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Run order.** Rules running a pack's or a caller's own code (custom rules, pack rules, overrides; a pack's variant of a core rule runs core's code and is not one) run after core's. `checksResults` is put back in the catalog's order, so nothing visible moves. A pack catalog lists them as `packCodeRuleIds`.
- **Read-only views.** Those rules get `ctx.helpers`, `ctx.engineOptions` and `ctx.inputs.probes` through a Proxy that reads through and throws a TypeError ("Cannot change "queryAllSmart": what a rule is given is read-only, …") on set, define and delete, for plain objects and arrays at any depth. Functions, Maps and DOM nodes are given as they are; a frozen property reads as itself. Nothing core or the caller owns is frozen, and core's rules get the objects they got. The result's `engineOptions` echo is built from the scan's options, never from a view.
- **Page changes.** A MutationObserver on the document is taken around each of those rules (`takeRecords`, as the rule runs synchronously); a rule that changed the page is named in a `console.warn` with the number of changes. Core can't undo a change. Changes inside shadow roots are not seen.
- **Docs:** PACKS.md ("It only reads") and ENGINE_OPTIONS.md (custom rules).

**Probes.** `06-hostile-rules.js`: "replaces shared helpers" now leaves `img-alt-present` and `link-name-present` at fail/2 and fail/1 (they were notApplicable), and the hijacking rule is cantTell with the error; "mutates the DOM" leaves `img-alt-present` at fail/2 (it was fail/1) and warns; the name-helper case leaves them failing (they were pass). Every other case gives the output it gave.

**Results.**
- **jsdom, one process per tree:** identical on 548 of 548 scans (no pack, the sample pack, with all opt-in rules, a custom rule that reads); the pack ran and the custom rule was present in them.
- **Chromium:** 509 of 510 identical; the 1 is `meme-knowyourmeme-homepage`, which changes itself.
- **The suite:** 4,653 of 4,653 tests pass, and every CI check passes.
- **New tests:** two fail on `9819bdba`; the third (a rule that only reads) passes on both, as a guard.

### 2.21 A pack or custom rule can't abort the scan or its result (RB-5, PB-8)

- **Commit:** `cbb1c5b9` on `fix/stress-test-3`, "Keep a pack or custom rule from aborting the scan or its result". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Thrown values are described without throwing** (`describeThrown`), for every rule: the message, else the value as text, else "The rule threw a value that can't be described". A normal error reads as before.
- **A pack's or caller's rule's result is copied as plain data** (`plainRuleOutput`), inside a `try`: a BigInt as its digits, a node as its tag (`"<body>"`), a Map as its entries, a Set as its values, a Date by `toJSON`, a circular reference as `"[circular]"`, functions and Symbols left out. An occurrence's `__node` and a margin candidate's `el` stay nodes, as the engine locates them. A result that can't be read (a throwing getter or Proxy) makes that rule `cantTell`: "The rule's result could not be read: …". Core's rules return plain data and are not copied, so they cost nothing.
- **Caught by CI on the way:** the first version turned `marginCandidates[].el` into its tag, and three margin tests (a custom rule declaring a margin) failed; it now keeps them as nodes.

**Probes.** `p16b-customrules-containment.js`: the three cases that aborted the scan (an undescribable throw, an `outcome` getter, a throwing Proxy) now give `cantTell` for that rule in both entry points. `06-hostile-rules.js`: every case's result now passes `JSON.stringify`; the circular and BigInt cases gave "JSON.stringify throws".

**Results.**
- **jsdom, one process per tree:** identical on 548 of 548 scans (no pack, the sample pack, with all opt-in rules, a custom rule).
- **Chromium:** 510 of 510 identical.
- **The suite:** 4,656 of 4,656 tests pass, and every CI check passes.
- **New tests:** two fail on `a4744647`; the third (20,000 occurrences made plain quickly) passes on both, as a guard.

### 2.22 A pack's core range is read as npm reads it (PN-8, PN-21)

- **Commit:** `96213917` on `fix/stress-test-3`, "Read a pack's core range as npm reads it". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **`satisfiesRange` follows node-semver** (no `loose`, no `includePrerelease`), written from its source: x-ranges and partial versions (`1.x`, `^1`, `~1.10`, `>=2`), operators apart from their version (`>= 1.0.0`), hyphen ranges with partial ends, `~>`, `X`, build metadata dropped anywhere, npm's rules that a number after an x (`1.x.0`) and a whole version led by anything but `v` (`==1.2.3`) are no range, an alternative that allows any version making the whole range any version, and the prerelease rule (a prerelease is in an alternative only when one of its comparators names a prerelease of the same version).
- **One deliberate difference:** an empty range, or an empty alternative (`'^1.11.0 ||'`, `'+10'`), which npm reads as any version, is no range: in a pack's `core` it is a slip.
- **`semver` 7.8.5 as a development dependency,** for the agreement test only; core has no runtime dependency.
- **Docs:** PACKS.md (`core`), the `satisfiesRange` type comment.

**Agreement with npm.** Identical answers (null where npm's `validRange` is null, else `satisfies`) on 1,030,523 version and range pairs of a grid of every documented form, and on 3,314,880 pairs of 300,000 random ranges built from range tokens (106k of them valid). A test keeps a grid of them matching.

**Results.**
- **jsdom, one process per tree:** identical on 548 of 548 scans (no pack, the sample pack, with all opt-in rules, a custom rule). `core.js` and the browser bundle are unchanged.
- **The suite:** 4,658 of 4,658 tests pass, and every CI check passes.
- **New tests:** both fail on `cbb1c5b9`.

### 2.23 Pack and option shapes that were taken without a word are named (PN-5, PN-7, PN-23, OO-16)

- **Commit:** `1e259e1e` on `fix/stress-test-3`, "Name pack and option shapes that were taken without a word". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **A profile's `exclude`** (a checklist's or a standard's) must be `{ rules: [...], criteria: [...] }`, lists of strings, no other key; otherwise `checkPack` names it (`profiles.c-1.exclude must be { rules: [...], criteria: [...] }`) and the pack is skipped with the reason.
- **A standard's profile `version`** must be one of the standard's `versions`; otherwise a problem names both.
- **A profile severity is read in any case** (`'Critical'` is `critical`), as a rule's own `defaultSeverity` is; the stored level is lower-case.
- **`engineOptions.packs` that isn't a list** (a single pack, a string, `{}`) warns "must be a list of packs ([pack])" in scans and the catalog functions, and "must be a list of pack names" in a page; `strictOptions` throws, as before, now also from the catalog functions.
- **Docs:** ENGINE_OPTIONS.md (the accepted shapes; and the `packs` row, which still said a page doesn't run packs).
- **Caught while testing:** the first version read `packs.length` when no packs were given, failing three existing tests; fixed before the commit.

**Results.**
- **jsdom, one process per tree:** identical on 548 of 548 scans (no pack, the sample pack, with all opt-in rules, a custom rule).
- **Chromium:** 508 of 510 identical; the 2 are `meme-knowyourmeme-homepage` (changes itself) and `portal-uol-homepage` (the `engine.environment.images` flag).
- **The suite:** 4,663 of 4,663 tests pass, and every CI check passes.
- **New tests:** five fail on `96213917`.

### 2.24 Three slips in PACKS.md corrected (PN-9, PN-24, PN-6)

- **Commit:** `3f089cc6` on `fix/stress-test-3`, "Correct three slips in PACKS.md". Docs and CHANGELOG only.

**What was done.**
- **Placeholders** are `{{name}}`; a single brace is shown as written (PN-9).
- **`reportOccurrence`:** the example lists the occurrence it returns in `occurrences` and returns the outcome; called on its own, the failure is reported on the whole page, "failed for the page without naming an element" (PN-24, re-run: confirmed).
- **Pack rules and the pack's profiles:** a rule tagged with the namespace runs under every profile of the pack; one without it runs there only when the profile selects it by a tag or by id, so `tags: []` runs only what it lists and an item grouping a rule it doesn't run is `cantTell` (PN-6).
- **Dictionaries:** a pack may give core's keys for a locale core doesn't ship (`pt`), which translates core's rules there, and can't change them in a locale core ships. The doc said keys "must be the pack's own" (the conflict noted in "Held up"; checked: a `pt` dictionary entry for `img_altPresent_title` titles the rule in a `pt` scan).

**Results.** No code changed. The suite: 4,663 of 4,663 tests pass, and every CI check passes.

### 2.25 surea11y-pack reads its arguments strictly, and docs stays whole on a failure (PT-5, PT-6, PT-7, PT-17, PT-22)

- **Commit:** `a95a132e` on `fix/stress-test-3`, "Read surea11y-pack's arguments strictly, and keep docs whole on a failure". The code, tests, docs and CHANGELOG are in one commit.

**What was done.**
- **Arguments (PT-5, PT-22).** Each command's value flags (`--kind`, `--name`, `--namespace`, `--title`; `--pack`), plain flags (`--check`, `--no-examples`) and number of arguments are known. A value may follow a space or `=`. An unknown command or flag, a value missing (or another flag in its place) and an argument too many are an error naming it, with the usage, exit 1. `--help` and `-h`, after any command or none, print the usage and exit 0. The `Next: cd` hint quotes a folder that needs it.
- **docs (PT-6, PT-7, PT-17).** Each example has its own 15-second limit; one that can't be run (it doesn't load, or its page breaks the engine) is collected and the rest still run. `packDocs` writes its files only once everything has worked, so such an example is named and nothing is written. A rule that didn't complete is recorded as "cantTell (the rule did not complete: <error>)". Errors are one line: a pack that can't be loaded is named, a missing Chromium says to install it or use `--no-examples`, and the `undefined:` prefix (a pack without a name) is "The pack:". Core's own `rule-examples:outcomes` runs through the same runner, and its record is unchanged.

**Results.** Scans don't change: `core.js` and the browser bundle are untouched. The suite: 4,670 of 4,670 tests pass, and every CI check passes. **New tests** (`tests/packs/pack-cli.test.js`): all seven fail on `3f089cc6`.

### 2.26 A formula's style in jsdom is read as the style around it (CO-3)

- **Commit:** `18f035ac` on `fix/stress-test-3`, "Read a formula's style in jsdom as the style around it". The code, tests, docs and CHANGELOG are in one commit.

**What was found.** jsdom's `getComputedStyle` of `<math>` and of elements inside it throws, or returns a declaration whose property reads throw; which read throws changes with what was read before (a formula's own style read fine at one point and threw at another). So a check on the formula's own style is unreliable; the layout is not.

**What was done.**
- **`computedStyle` (dom-helpers.js):** without a layout (`hasLayoutOf` false, decided once per document), an element of a formula (`closest('math')`) has the style of the formula's parent, kept in the scan's style cache, so every rule and both scans see the same one. With a layout, a formula's style is read as any other.
- **`helpers.computedStyle` is given to rules.** Seven rules (`avoid-inline-spacing`, `contrast-minimum`, `contrast-enhanced`, `label-in-name`, `link-in-text-block`, `p-as-heading`, `scrollable-region-focusable`) asked for it and, not finding it, called the page's `getComputedStyle`, past the shared reading and its cache; `scrollable-region-focusable` kept erroring that way.
- **`target-size-minimum`** reads through it too (it called `getComputedStyle` itself).
- **Types and docs:** `RuleHelpers.computedStyle`, RULE_HELPERS.md.

**Results.**
- **The audit's four pages:** no rule errors, and two scans agree.
- **The audit's fuzz (`fuzz.js`, 3,000 pages with MathML, every batch to its last seed):** no rule error, no disagreement between scans, no scan over 5 s. It reported 305 affected pages; the first version of this fix, before `target-size-minimum` and the export, still left 136 (all `target-size-minimum`).
- **jsdom, every rule compared:** identical on 411 of 411 scans.
- **Chromium:** 508 of 510 identical; the 2 are `meme-knowyourmeme-homepage`, which changes itself.
- **Speed, Chromium, 118 pages, two runs each:** the eight rules reading styles take the same or less (`scrollable-region-focusable` 124 to 108 ms, `link-in-text-block` 189 to 172 ms); all rules 28,050 to 27,892 ms.
- **The suite:** 4,673 of 4,673 tests pass, and every CI check passes. On the way, the type test required `computedStyle` in `RuleHelpers`, and one Chromium test timed out launching the browser once (it passes on its own and in the full run after).
- **New tests:** the two jsdom ones fail on `a95a132e`; the Chromium one checks a formula keeps its own style there.

### 2.27 Batch 1: reason codes, jsdom font sizes, unprintable options, policy coercion, text-spacing quotes (OO-8, OO-9, OO-10, OO-6, CO-6)

From here, items are fixed in batches: one commit per item, with its CHANGELOG entry and tests that fail before, and the identity checks and CI run once per batch.

**Commits on `fix/stress-test-3`.**
- **Item 32 (OO-8), `d061d824`:** `aria-hidden-focus` declares its two runtime codes in `meta.reasonCodes` (they are set through `occReasonCode`, which the generator's source pass can't read, and no fixture reaches them); both are in `finding-ids.json` and in `released-finding-ids.json`, as they shipped in 1.10.0. `meta.reasonCodes` is read by the generator only, so results don't change. (A source pass reading `…ReasonCode = '…'` was rejected: it would also take `skip-link`'s `geometryReasonCode`, a detail, not a finding code.)
- **Item 33 (OO-9), `c7f7ce24`:** `parsePx` reads the font-size keywords at a browser's sizes (16px default; `xx-large` 32px) and `calc()` of lengths and numbers with `+ - * /` and parentheses, scanned character by character. `larger`/`smaller` need the parent's size and stay unresolved under jsdom (LIMITATIONS.md).
- **Item 34 (OO-10), `0cc44393`:** `parseCommaList`, `applyOptInRules` and `normalizeSelectorList` read a value as text through a reader that leaves out one with none; the Node and in-page entries check options under `strictOptions` before resolving the selection (`rules: [{}]` is now `INVALID_ENGINE_OPTIONS`).
- **Item 36 (OO-6), `5762200a`:** an outcome the policy doesn't allow is `cantTell` with what the rule found in a new `policyOutcome` field and no `error`, so SARIF and JUnit don't read it as a rule that did not complete; an outcome that is no outcome keeps its error. Unknown values in `allowedOutcomes`/`allowedConfidence` are left out with a warning (a list left empty falls back to the contract's); under `strictOptions` each must be a non-empty list of known values. Documented in OUTPUT_SCHEMA.md, API_STABILITY.md, POLICY.md and the types.
- **Item 40 (CO-6), `482dc70c`:** `text-spacing-content-loss` quotes an element's shown text, leaving out `<style>`, `<script>` and `<noscript>` text.

**Results.**
- **jsdom, every rule compared:** 405 of 411 scans identical. The 6 are `contrast-minimum` and `contrast-enhanced` on `contrast-all-scenarios.html` and `link-in-text-block-all-scenarios.html`: three messages now say "font size: 16px" where they said "0px" (inputs whose size jsdom keeps as a keyword); outcomes and occurrence counts are unchanged.
- **Chromium, 255 pages:** 253 identical. `edtech-udacity-homepage`: `text-spacing-content-loss` keeps its outcome and 12 occurrences, and its messages no longer quote CSS; `meme-knowyourmeme-homepage` changes itself.
- **The suite:** 4,679 of 4,679 tests pass, and every CI check passes.
- **New tests:** each item's fail on `18f035ac`.

### 2.28 Batch 2: name cycles and depth, page built-ins, options, lint, the rest of items 22 and 37, small items (CO-2, RB-12, RB-10, OO-11/12/13/15, PT-12/13, PB-15, PN-15, PN-20, OO-7, OO-18, PT-19, item 39)

**Commits on `fix/stress-test-3`** (one per item; item 39 in five, by area):
- **29 (CO-2), `f72b2d60`:** the elements whose text is being worked out are kept across nested computations, and one met again gives no text (accname visits a node once). The depth bound alone let a cycle through a label branch at every level: 92,732 reference walks for five elements. The fuzz page: 16 s to 64 ms, same names.
- **30 (RB-12), `58ea0a90`:** `getContentNameInfo` stops 256 levels into an element's content (Chrome gives no name 100 down) and flags `depth-limit`; `button-name-present` and `link-name-present` ask (`name_contentTooDeep`, five locales) where they ran out of stack.
- **31 (RB-10), `c8e6f7eb`:** `assertPageBuiltins` checks the built-ins the engine relies on before anything reads them and throws `PAGE_BUILTINS_BROKEN` naming each; `isThenable` ignores a `then` inherited from `Object.prototype`. The probe's 57 variants: every broken built-in it covers stops with the coded error, except `Object.keys` broken before the bundle loads (the bundle can't load) and the probe's own `performance.now`.
- **35 (OO-11/12/13/15), `91396279`:** `switchOf` reads on/off options as `strictOptions` is read; a wrong-typed on/off option and a non-object `engineOptions` warn; `runOnly` that is not a plain object by its type tag (cross-realm safe) throws; `rules[ruleId]` matches in any case and with the legacy prefix, and an unknown key is named with the closest id; an unusable `rootCanvasFallback` is white, warned and echoed; JUnit `cantTellAs` any case, else TypeError; a baseline file as saved is read by `matchBaseline`, SARIF and JUnit; the page watch leaves out nodes a helper adds and removes (the color parser's probe made pack rules look like they changed the page).
- **38 (PT-12/13), `718e0fb2`:** the accessors are `dom`, `helpers.dom`, `ctx.helpers.dom` and a document `document` or `ctx.document`; destructured reads are caught; literal-made variables and text under non-selector keys aren't flagged. Core's rules lint as before.
- **22 rest (PB-15, PN-20, PN-15), `6d763cd6`:** a pack's standard can't be named as `WCAG`, a built-in standard or another pack's; a rollup can't have a rule's id; dictionaries take several subtags; `readBy` must be a list.
- **37 rest (OO-7, OO-18, PT-19), `974bc036`:** `CompactScanResult`; custom `meta.wcagSc` entries as built-in ones state them (WCAG titles added to the criteria data, checked against every built-in rule); `details: null` typed; `getCheckDefById`, `getCompositeRuleById`, `getChecksForRunOnly` supported and typed; OUTPUT_SCHEMA.md's missing fields; pack title escaped in its catalog.
- **39:** `cdb52459` HTML report controls/bidi, string `checksIds`, duplicate standards, cross-frame `getMargins`; `1d615132` pack registry under `Symbol.for('surea11y.packs')` (PB-18; PB-19's `Object.assign` falls to item 31); `14d2bbe9` pack checks' reasons, own-key dictionary merge, sorted `skippedPacks`, `packs: []` not echoed, docs for `customRules` precedence and cross-pack references; `217abfdb` examples with a trailing label note or an `HTML` fence (one of core's own, `duplicate-id`'s WCAG 2.0 example, was skipped and is now recorded), `scaffoldPack('')`, `.mjs` default export; `d4356919` German `css-hidden-focus`.

**Caught on the way:** lint errors in three commits and a cross-realm `runOnly` check and duplicate warnings in item 35 (9 CI failures), each fixed inside its own commit before the push.

**Results.**
- **jsdom, every rule compared:** 411 of 411 scans identical.
- **Chromium, 255 pages:** 254 identical; `meme-knowyourmeme-homepage` changes itself.
- **Speed, Chromium, 118 pages, two runs each:** within noise (all rules 27,355 to 27,402 ms).
- **The suite:** 4,710 of 4,710 tests pass, and every CI check passes.
- **New tests:** each item's fail on `482dc70c`.

## 3. Open, from the measurements above

- **What #99 and #101 still cost.** contrast-computable is still 49% slower than in 1.10.0. The next step would be the cheaper early exit in `__paintBackdropOf`: answer "nothing near this text" from data computed once per scan, before any per-element ancestor walk. It's a deeper change to #101's code, not yet decided.
- **target-size-minimum** is 212% slower than in 1.10.0 (545 → 1,700 ms over the saved pages). It is now the largest single slowdown: 1.2 s of the 3.7 s by which whole scans grew. Its rework was left out of this audit at the maintainer's request, so it is noted here, not investigated.
