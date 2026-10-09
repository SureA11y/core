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
| 3–40 | Everything else in §1 of the findings | | Open. Next planned: the rest of PN-11 with PN-15 and PB-16 (namespace and id rules), which must land before 1.11.0. |

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

## 3. Open, from the measurements above

- **What #99 and #101 still cost.** contrast-computable is still 49% slower than in 1.10.0. The next step would be the cheaper early exit in `__paintBackdropOf`: answer "nothing near this text" from data computed once per scan, before any per-element ancestor walk. It's a deeper change to #101's code, not yet decided.
- **target-size-minimum** is 212% slower than in 1.10.0 (545 → 1,700 ms over the saved pages). It is now the largest single slowdown: 1.2 s of the 3.7 s by which whole scans grew. Its rework was left out of this audit at the maintainer's request, so it is noted here, not investigated.
