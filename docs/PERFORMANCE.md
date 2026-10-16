# Performance

How long a scan takes, release by release, measured against the engine's own earlier releases. Each release's entry in [`CHANGELOG.md`](../CHANGELOG.md) says what changed in a rule's cost; this page is the record over time.

## What is measured

- **The scan alone, in Chromium.** The browser bundle is injected into the page and `runa11yCoreInPage` is timed inside it with `performance.now()`. Page load, injection and the round trip to the test runner are left out. Chromium is where releases differ: most of a scan is style and layout work that only a real browser does.
- **Conformance target:** the `wcag22-aa` profile.
- **Fresh state for every scan:** a new page, with garbage collected first, so no scan inherits another's caches.
- **Releases as published:** each release is installed from npm, the code users run.
- **Results as well as time:** every scan records each rule's outcome and finding count. A scan of the same page must give the same answer every time, and a release that finds more is told apart from one that does the same work more slowly.

## Pages

Pages are large on purpose: a longer scan makes timer and machine noise a small share of it.

| Suite | What | Why |
|---|---|---|
| Composite | Every scenario fixture in [`tests/`](../tests) combined into one page, about 8,500 elements, with ids prefixed per fixture so references still resolve. The fixtures are frozen at one commit, so every release scans the same page. | Every rule applies, on every branch it distinguishes: a change in any rule's cost shows. |
| Scaling | Six known hot paths, each generated at N and 4N elements: sibling paragraphs, nested wrappers, sibling links, table rows, cards with overlays, shadow components. | Time that grows faster than the page is the kind of regression small pages hide. The growth exponent between N and 4N tells linear (about 1.0) from quadratic (about 2.0). |
| Real-world | Large public pages (news, retail, right-to-left), frozen with their styles, so nothing is fetched while measuring. | Real markup, CSS and nesting depth. Their content belongs to their publishers, so they are not redistributed; where their results add to the composite page's, the history's notes say so. |

Composite and scaling pages are generated from this repository and can be rebuilt by anyone.

## How a release is measured

Two protocols:

| | Quick | Full |
|---|---|---|
| When | Comparing releases | When quick flags something, or for jsdom, the binding and growth exponents |
| Environments | Chromium | Chromium, jsdom (the CLI's path), the Playwright binding (`analyze()`, round trip included) |
| Pages | Composite, three real-world pages, the 4N size of each hot path | Every page, both sizes of each hot path |
| Scans per release and page | 1 warm-up, 5 timed, 1 profiled | 2 warm-up, 7 timed, 3 profiled |

Releases in one run are measured interleaved, in an order that rotates every round, so a machine that slows down mid-run slows every release alike. Warm-up scans are discarded; the median of the timed scans is reported, with its spread (median absolute deviation, as a share of the median). Per-rule timings come from separate profiled scans (`perfStats`, `profileRules`), since profiling costs time of its own.

### One scale across machines and years

Absolute times depend on the machine, the operating system and the Chromium version, and drift between days on the same machine: on one Apple M3, 1.9.0's composite scan took 448 ms one day and 506 ms three days later. Measurements from different runs are therefore never compared directly. Every run includes earlier releases as **anchors**, and every number published here is a ratio taken within a single run.

- **Each run measures the new release and the release before it.** The new release's index is the previous release's index times the ratio between the two in that run, page by page:

  `index(new) = index(previous) × time(new) / time(previous)`, both times from the same run.

  Linked this way, every release is expressed on the scale of the first one measured (1.8.0 = 1.00), whatever machine each run used.
- **A second anchor checks the link.** Where a run's time allows, it also measures an older release, normally the reference release. Its index, computed through the new run, should match the one already published. When it doesn't, beyond noise, the environment changed some pages' costs more than others (a new Chromium can make layout cheaper and leave scripting as it was), and the link is reported as uncertain rather than published as exact.
- **An anchor must give the same results as before.** Its outcomes and finding counts must match the previous run's exactly. If they don't, the pages or the browser changed what the scan sees, and the run is not linked.
- **Every run keeps its environment,** even though the published numbers are ratios: the machine, its operating system, Node, Playwright and Chromium versions, whether it is virtualized, the harness commit and a fingerprint of the pages, and the load, free memory and power source at the start and end of the run, with a note for anything the run can't detect itself. Normalizing removes the scale, not the reasons behind it: when a link is uncertain, or a later run disagrees, the environment is where the explanation is. The [runs](#runs) table below lists them.
- **Errors add up along the chain,** one link's noise per release. Every so often, at least once per major release, every release is measured again in a single run on one machine. That resets the chain to direct measurements, and the history below is replaced by it.

## How to read the numbers

- **An index is a ratio to 1.8.0** on the same page; below 1.00 is faster. A difference within the run's spread is noise.
- **A slower release is not always a regression.** A rule that now checks more of the page costs more, and the [changelog](../CHANGELOG.md) says when one does. The per-rule timings show which rules a change in time comes from, and whether those rules' results changed with it: a rule slower with the same results is a regression; one that is slower and finds more may be paying for what it now finds.
- **jsdom is not a browser.** Scans under jsdom are dominated by jsdom's own style computation, and skip layout. Full runs check that the Node path still works and hasn't slowed; its times are not comparable with Chromium's.
- **Only this engine's releases are compared here.** Engines run different rule sets, so a faster engine is not doing the same work faster, and a comparison with another engine is out of scope for this page.

## History

Chromium. Index to 1.8.0 (= 1.00) on the same page in the same run; lower is faster. Scaling is the 4N size of each hot path: sibling links on its own, since 1.10.0 removed its superlinear cost, and the range over the other five.

| Release | Composite | Real-world (3 pages) | Scaling, 4N (5 hot paths) | Sibling links, 4N | Run | Linked through |
|---|---:|---:|---:|---:|---|---|
| 1.8.0 | 1.00 | 1.00 | 1.00 | 1.00 | [1, 2](#runs) | reference |
| 1.9.0 | 1.00 | 1.00–1.04 | 0.96–1.03 | 1.01 | [2](#runs) | same run as 1.8.0 |
| 1.10.0 | 1.11 | 1.09–1.20 | 0.96–1.15 | 0.41 | [2](#runs) | same run as 1.8.0 |
| 1.11.1 | 1.27 | 1.34–1.38 | 1.11–1.30 | 0.31 | [2](#runs) | same run as 1.8.0 |
| 1.12.0 | 1.28 | 1.43–1.62 | 1.14–1.26 | 0.36 | [2](#runs) | same run as 1.8.0 |

Notes:

- **1.8.0 and 1.9.0:** the sibling-links hot path grows superlinearly (growth exponent 1.40 between N and 4N, run 1): `link-in-text-block` read the text beside each link once per link. 1.10.0 reads it once per parent, and the path takes 0.31–0.41 of 1.8.0's time from then on. Run 2 measures the 4N sizes only, so it gives no exponents.
- **1.10.0 to 1.12.0:** the added time is in the rules, not around them, and most of it is in rules that now find more. `contrast-computable` judges text against more of what the page paints and asks about more of it; from 1.11.1, `target-size-minimum` fails 242 targets on the Daily Mail page where 1.9.0 failed 14. From 1.11.0 the shared caches are filled before the first rule (about 350 ms over the ten pages of run 2), where earlier versions charged them to `aria-valid-attr`. `text-spacing-content-loss` takes about 12% longer from 1.11.0 than in 1.10.0, with the same results: the checks 1.11.0 added (text under a fixed or sticky box, text scrolled out of view, text already cut off, clipping only by the boxes that hold the text) cost most on the composite page, whose fixtures exercise them, and on deep nesting, and its time on the real-world pages is unchanged.
- **The real-world pages** are the three of the quick protocol: Spiegel, Daily Mail and Falabella. 1.12.0's largest increases are on Spiegel and Falabella, and both are in `contrast-computable`: on Spiegel it asks about 50 passages where 1.11.1 asked about 31; on Falabella its results are unchanged and it takes longer.

## Runs

Each run behind the history, with what it ran on and how it links to the runs before it. **Link factor** is the median, over the anchor's pages, of its time in this run over its time in the run it links to, and the pages more than 10% from that median; **Same results** says whether the anchor gave the same outcomes and finding counts in both runs.

| Run | Date | Machine | System | Browser | Harness and pages | Conditions | Releases | Anchors | Link factor | Same results |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-05 | Apple M3, 8 cores, 24 GB | macOS (darwin 25.5.0, arm64), Node 22.14.0 | Chromium 151.0.7922.34 | full protocol; harness commit and page fingerprint not yet recorded | not recorded | 1.8.0, 1.9.0 | — (first run) | — | — |
| 2 | 2026-10-16 | Apple M3, 8 cores, 24 GB, not virtualized | macOS 26.5.2 (darwin 25.5.0, arm64), Node 22.14.0, Playwright 1.62.1 | Chromium 151.0.7922.34 | quick protocol; harness 9e4e9e4, pages 8c67ab164d8f | on AC power; load 5.55 at start, 3.63 at end; 2.6 GB free at start, 1.6 GB at end | 1.8.0, 1.9.0, 1.10.0, 1.11.1, 1.12.0 | 1.8.0 and 1.9.0, to run 1 | 1.10 (1.8.0) and 1.09 (1.9.0); every page within 10% | yes, on every page |
