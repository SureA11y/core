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
| 22 | Namespace and id rules are loose | PN-11, PN-15, PB-15, PB-16, PN-20 | **Mostly done** (§2.4). Open: two checklists with one title, or a title equal to a core standard's name (PB-15, PN-20); locales with two subtags rejected and a string `readBy` ignored (PN-15). |
| 26 | `surea11y-pack` CLI | PT-8 | **In part** (§2.4): `new` refuses a name npm would refuse. The rest of item 26 is open. |
| 8 | `packScript` writes code that does not parse | PN-10, PB-4, PT-16, RB-6 | **Done** (§2.6). |
| 6 | TypeScript code written for 1.10.0 no longer compiles | PT-14, PT-4, PT-10, PT-11 | **Done** (§2.7). |
| 37 | Types and docs vs reality | OO-18 (in part) | The `meta.tags` note in API_STABILITY.md is corrected (§2.7). The rest is open. |
| 7 | A rule reading outside its function passes its tests and lint, then fails in a browser | PT-1, PB-7 | **Done** (§2.8). |
| 9 | An occurrence's selector can resolve to another element | OO-1, RB-2, RB-8 | **Done** (§2.9). Open: very deep paths shortened from the top can match several elements (7 occurrences, one site). |
| 10–21, 23–25, 27–36, 38–40 | Everything else in §1 of the findings | | Open |

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

## 3. Open, from the measurements above

- **What #99 and #101 still cost.** contrast-computable is still 49% slower than in 1.10.0. The next step would be the cheaper early exit in `__paintBackdropOf`: answer "nothing near this text" from data computed once per scan, before any per-element ancestor walk. It's a deeper change to #101's code, not yet decided.
- **target-size-minimum** is 212% slower than in 1.10.0 (545 → 1,700 ms over the saved pages). It is now the largest single slowdown: 1.2 s of the 3.7 s by which whole scans grew. Its rework was left out of this audit at the maintainer's request, so it is noted here, not investigated.
