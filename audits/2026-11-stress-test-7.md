# Stress test of `main`, seventh round: findings (2026-11-20)

The seventh stress test of `main` ran at `ec664338`: version 1.17.0 plus the unreleased 1.18.0 work, after the sixth round's fixes and #408 and #409. It looked as usual for wrong verdicts, misses, slowness and memory kept after a scan. It also looked at what changed since round 6:
- `reflow-horizontal-scroll`, the newest rule;
- `p-as-heading`'s two new codes (`BOLD_SHORT_DIV`, `BOLD_LEAD_LINE`);
- the API that integrators and packs use.

Like round 6, this round has no `FINDINGS.md` per area: its findings were fixed the same day, and this report says where. Each area's probes are under [`2026-11-probes-7/`](./2026-11-probes-7/):

| Area | Folder | Prefix | Runtime | Confirmed |
|---|---|---|---|---|
| Reflow and `p-as-heading` | [`reflow-headings/`](./2026-11-probes-7/reflow-headings/) | RW | Chromium at 320px, jsdom | 11 |
| Target size and focus not obscured | [`visual/`](./2026-11-probes-7/visual/) | VL | Chromium | 8 |
| Accessible names, ARIA and landmarks | [`names-aria/`](./2026-11-probes-7/names-aria/) | AN | jsdom, Chromium (accessibility tree over CDP) | 9 |
| The integrator's API: outcomes, reporters, packs, console | [`api/`](./2026-11-probes-7/api/) | IF | Node, Chromium | 7 |
| Robustness, speed and memory | [`robust/`](./2026-11-probes-7/robust/) | SP | Chromium, jsdom | 3 |

That makes 38 confirmed findings: none High, 14 Medium and 24 Low. No scan threw and nothing crashed.

**Basis**
- `main` at `ec664338`.
- Chromium 153 (`/opt/pw-browsers/chromium`), and jsdom from the repo.
- WCAG 2.2 and its Understanding documents are the source of truth. HTML, WAI-ARIA 1.2, ARIA in HTML, HTML-AAM and the CSS specs decide the details, and Chromium's layout and accessibility tree are supporting evidence.

**How findings were verified.** Each finding was reproduced by its probe, then re-run separately on `ec664338` during consolidation; all 38 reproduced. Each was reproduced again while it was fixed, with a regression test that fails without its fix ([#411](https://github.com/SureA11y/core/pull/411)).

## What held up

- **Fuzzing:** about 8,000 scans of about 1,000 generated and mutated pages, in Chromium and jsdom (`robust/fuzz-*.js`). There was no crash or rule error and no broken invariant, and no scan changed the page's DOM. Rescans and single-rule runs matched the full scan.
- **Reporters:** SARIF validated in 12 variants, and JUnit stayed well-formed. Escaping in the HTML report, JUnit and SARIF held against injection attempts (`api/t8-hostile.js`, `names-aria/report-xss.js`).
- **Names:** 120 accessible names matched Chromium's accessibility tree (`names-aria/corpus-names*.js`).
- **Speed:** no regression against 1.17.0 across 152 fixtures (ratio 1.01; `robust/perf-*.js`).
- **Memory:** no leak over 1,200 repeated scans in Chromium, with or without the hooks, or in jsdom (`robust/mem-*.js`). SP-2 below is memory kept *between* scans, not a leak.

---

## 1. Findings

They are ordered by area, the most damaging first in each, and graded on the README's severity scale. All are fixed in [#411](https://github.com/SureA11y/core/pull/411), unreleased, for 1.18.0.

### Reflow and `p-as-heading` (both new since 1.17.0)

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| RW-2 | **Reflow fails a code editor**, such as `contenteditable` with `white-space: pre` as CodeMirror makes, in a box that scrolls sideways. The same code read-only, in `<pre contenteditable>` or in `<textarea wrap=off>`, passes (`rw-code-editor-fail.js`). | Bug | Medium | #411, `25e7848a`: editable text that keeps its lines counts as preformatted |
| RW-3 | **Reflow fails a carousel or chip row whose items hold a field**, though each item fits. The same row with links is only asked about, and the rule's own carousel case leans pass (`rw-carousel.js`). | Bug | Medium | #411, `25e7848a`: the carousel lean comes before the field lean |
| RW-1 | **Content hidden by `clip` or `clip-path` that widens the page fails as unattributed.** The same content with `visibility: hidden` passes since #408 (`rw-clippath-unattributed.js`). | Bug | Medium | #411, `25e7848a`: content clipped away, or with `opacity: 0`, is undrawn |
| RW-7 | **`BOLD_LEAD_LINE` asks about a name above an address, a staff card or an e-mail signature** once the lines add up to 80 characters (`ph-leadline-address.js`). It came from #407, which tested only a short address. | Bug | Medium | #411, `d471b2b0`: the code removed (§2) |
| RW-4 | The carousel lean is worked out on the cut item's children, not on the row. | Bug | Low | #411, `25e7848a` |
| RW-5 | An app shell whose scrolling `<main>` sits under an app bar is only asked about, not judged as the page (`rw-app-shell-header.js`). | Gap | Low | #411, `25e7848a` (decided: the shell is the page) |
| RW-6 | An absolutely positioned element that escapes its box isn't named in the finding (`rw-abs-escape-unattributed.js`). | Gap | Low | #411, `25e7848a` |
| RW-8 | `p-as-heading` asks about a bold price or percentage as a title. | Bug | Low | #411, `d471b2b0`: `%`, `‰` and currency signs count as part of a number |
| RW-9 | `p-as-heading` asks about bold text with no letters (★★★★, `* * *`) as a title (`ph-symbol-only.js`). | Bug | Low | #411, `d471b2b0`: text with no letter or digit is skipped |
| RW-10 | A bold `<div>` beside its text, as a float or a table cell, is still asked about (`ph-div-beside.js`). | Bug | Low | #411, `d471b2b0`: the code removed (§2) |
| RW-11 | jsdom and Chromium disagree when the weight comes from `bolder` (`ph-bolder-jsdom-vs-chromium.js`). | Inconsistency | Low | #411, `c498801a`: `bolder` and `lighter` resolved against the parent's weight |

### Target size and focus not obscured

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| VL-2 | **Small targets inside shadow roots (Lit, Shoelace, Ionic) are never found too close to each other (2.5.8):** the hit test answered with their host, so they were taken as covered. | Gap | Medium | #411, `d5f19693`: the hit test drills into open shadow roots |
| VL-7 | **A consent overlay or fixed banner on screen during the scan hides spacing failures under it (2.5.8)** (`t17-overlay.js`). | Gap | Medium | #411, `d5f19693`: a box covering a target and its neighbour alike no longer hides how close they are |
| VL-3 | **A percentage or `calc()` `scroll-padding-top` is read as 0**, so a page that clears its sticky header is still asked about (2.4.11) (`gt-scrollpad.js`). | Bug | Medium | #411, `d5f19693`: read against the viewport's height, as the browser applies it |
| VL-4 | **Without a doctype, focus-not-obscured gets the viewport's height wrong:** a fixed header goes unreported and a footer is described as a top bar (`t9-quirks.js`). | Bug | Medium | #411, `d5f19693`: the height of the scrolling element |
| VL-5 | **A sticky or fixed header inside a shadow root is never found (2.4.11)** (`t13-shadow-header.js`). | Gap | Medium | #411, `d5f19693` |
| VL-1 | The 2.5.8 hint can say "move 1 px" when 2 px are needed. | Bug | Low | #411, `d5f19693`: the larger of the two distances the exception needs |
| VL-6 | The enhanced rule says "entirely hidden" under a see-through header (`t14-semi.js`). | Bug | Low | #411, `d5f19693`: only an opaque cover hides entirely |
| VL-8 | A checkbox the author resized keeps the user-agent exception (`t19-ua.js`). | Bug | Low | #411, `d5f19693`: outside 12 to 16 pixels it is the author's size |

### Accessible names, ARIA and landmarks

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| AN-1 | **A form-associated custom element labelled by `<label>` fails as unnamed.** HTML counts such elements as labelable, and Chromium names them (`internals*.js`). | Bug | Medium | #411, `4b259c53`; the registry is asked once per name, `55346be4` |
| AN-2 | **A web component's `<header>` or `<footer>` inside an `<article>` or `<main>` counts as another page banner:** header and footer scoping didn't look through shadow trees, though other rules do (`shadow-header*.js`, `slot-banner.js`). | Bug | Medium | #411, `4b259c53` |
| AN-3 | Three messages quote values with no length limit, so a 1 MB value gives a 6 MB result (`longq*.js`). | Bug | Low | #411, `4b259c53`: new helper `quoteText`, also used by `image-redundant-alt` and `label-in-name` |
| AN-4 | `<input type=submit value="">` counts as named "Submit" (`submit-empty.js`). | Bug | Low | #411, `4b259c53` |
| AN-5 | `landmark-one-main` and `bypass-blocks-present` don't read excluded areas as context, as round 6 decided rules that judge the whole page should (`excl*.js`). | Inconsistency | Low | #411, `4b259c53` |
| AN-6 | `aria-required-children` and `listitem-parent-valid` disagree about `<li>` children of `role=list` (`p-list*.js`, `slot-li.js`). | Inconsistency | Low | #411, `4b259c53`: both take it as a list item, as browsers expose it |
| AN-7 | An invalid `aria-checked` on a native checkbox fails, where one on `<option>` or `<summary>` is only asked about (`p-checkbox.js`, `an7-recheck.js`). | Debatable | Low | #411, `4b259c53` (decided: asked about) |
| AN-8 | `presentation-role-conflict` says "This role=\"presentation\" element" of an image with no role attribute. | Wording | Low | #411, `4b259c53` |
| AN-9 | The hints for an image or SVG with no name speak of where it leads, also on headings. | Wording | Low | #411, `4b259c53` |

### The integrator's API

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| IF-1 | **A custom or pack rule returning `fail` with only passing occurrences keeps `fail`:** the WCAG rollup and EARL say failed, while SARIF, JUnit and baselines report nothing. Through `excludeSelectors` the same occurrences settle correctly. This is the other half of round 6's CG-14 (`IF1-passtier-fail.js`). | Bug | Medium | #411, `00afc5a1`: the outcome is the worst of the occurrences' tiers |
| IF-7 | **A pack's certain `fail`, such as WAI-ARIA's, gates CI only when another profile is also listed.** Scanned alone, SARIF only warns and JUnit passes (`IF7-pack-fail-alone.js`). | Inconsistency | Medium | #411, `00afc5a1` (decided: a pack's profile alone keeps its verdict); `55346be4` keeps a page's `Object.prototype.then` from breaking it |
| IF-2 | The console's `table()` and `highlight()`, and the HTML report's card count, include passing occurrences. | Bug | Low | #411, `00afc5a1` |
| IF-3 | The types and the output schema leave out `'pass'` values the engine gives. | Bug | Low | #411, `00afc5a1` |
| IF-4 | Output order depends on the machine's locale (`localeCompare`), which breaks JUnit's promise of byte-identical reports (`IF4-locale-order.js`). | Bug | Low | #411, `00afc5a1`: English order everywhere |
| IF-5 | A pack with a getter that throws crashes the scan, the catalog and `checkPack` (`IF5-unreadable-pack.js`). | Bug | Low | #411, `00afc5a1`: a problem, and the pack skipped |
| IF-6 | `run({ type, values })` silently runs every rule (`IF6-run-legacy-keys.js`). | Bug | Low | #411, `00afc5a1`: refused, pointing to `runOnly` |

### Robustness, speed and memory

| # | Finding | Verdict | Sev. | Fixed |
|---|---|---|---|---|
| SP-1 | **`duplicate-id-aria` gets cubically slower** when repeated cards reuse an id and refer to it: 4 s at 200 cards in jsdom and 9 s at 400 in Chromium; 140 s at 400 cards under the test suite's jsdom (`dupid-aria*.js`). | Bug | Medium | #411, `f24a57ca`: under a second |
| SP-2 | A finished scan leaves about 20 MB of caches on a second global, `window.__a11ycoreSharedCache`, holding detached nodes until the next scan. The docs say the bundle defines one global (`globals.js`, `retained-*.js`). | Bug | Low | #411, `f24a57ca`, `025aa9c4`: removed when the scan ends |
| SP-3 | Two rules copy uncapped lists into each finding: `landmark-unique`'s `others`, and the "why no name" hints' id and element lists. Results grow to tens of MB on pages with hundreds of matches (`landmark-others.js`, `bighint.js`). | Bug | Low | #411, `f24a57ca`: five in messages, then `…`; ten in `others` |

Also fixed in #411, from the register: **R4:OP-P1**, `describePacks([proxy])` with a Proxy whose traps throw (`00afc5a1`).

## 2. Decisions taken

All were taken on 2026-11-20.

- **`reflow-horizontal-scroll` becomes a manual rule: it asks, and never fails** (`5e9541f8`). It measures one layout. Whether what that layout cuts off, or scrolls sideways, is really lost is for a person to judge: the content may be reachable another way, may need two dimensions, or may be cut the same way at every width. Comparing with a wider layout was considered and set aside as too fragile. Sideways scrolling and a cut field still lean fail. Of the engines compared in round 6, it is still the only one that measures 1.4.10.
- **`p-as-heading` keeps only `BOLD_SHORT_PARAGRAPH`** (`d471b2b0`). `BOLD_SHORT_DIV` and `BOLD_LEAD_LINE`, added in #407 for R6:CE-1 and CE-2 and never released, asked about too much on real pages (RW-7, RW-10).
- IF-7: a pack's profile scanned alone gives the check the pack's verdict, as a scan of several profiles does.
- AN-7: an invalid `aria-checked` on a native checkbox or radio is asked about, as on `<option>`.
- RW-5 and RW-1: a scrolling region that fills the viewport is the page, and `opacity: 0` counts as hidden.

## 3. What the fixes found

The full suite, run after the fixes, found three problems in them, fixed in `55346be4`:
- the first version of the IF-7 change returned nothing for a page that adds `then` to `Object.prototype`;
- AN-1's labelable check asked the custom element registry 41 times where once was meant;
- `quoteText` had no type.

## 4. Effect on the published packages

The 12 published packages that use core were run against #411 and against `main`. Two tests change, both from the decisions in §2, and need a one-line update at each package's next release:
- **`@surea11y/pack-wai-aria`**, "an unnamed grid: a question for WCAG, a failure of WAI-ARIA": the check is now `fail` under the WAI-ARIA profile alone (IF-7).
- **`@surea11y/pack-rgaa`**, "RGAA 9.3 and WCAG 1.3.1 both ask about `<li>` items in a role="list"": WCAG 1.3.1 is now `passedInPart` (AN-6); RGAA 9.3 still asks.

All other package results are the same as on `main`.
