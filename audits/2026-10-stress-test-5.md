# Stress test of `main`, fifth round: findings (2026-10-23)

A fifth stress test of `main` at `c528af08`: version 1.13.1 plus everything unreleased, 130 commits after the fourth round (`3af2008`). Most effort went to what those commits added:
- roles resolved on context (HTML-AAM inputs and table cells), the reworked name computation, the heading `role="none"` conflict, the widened `aria-allowed-attr` and `aria-valid-attr-value`;
- the three opt-in hooks (listeners, live regions, internals) and the new keyboard and scripting rules;
- the new contrast measurements (generated text, drop-down select, page canvas, placeholders, outlines, logos), margin bands, `moving-content-pausable`;
- the browser console helpers (`run`, `table`, `highlight`, `inspect`), the new standards contracts, the catalog and the reporters.

Around that, it re-ran every finding of the fourth round, fuzzed every rule, and timed the new code as pages grow.

No source file was changed. Each area has its probes and a findings file under [`2026-10-probes-5/`](./2026-10-probes-5/):

| Area | Folder | Prefix | Runtime | Confirmed |
|---|---|---|---|---|
| Roles, names, ARIA | [`names/`](./2026-10-probes-5/names/FINDINGS.md) | NR | Chromium AX tree, jsdom | 15 (1 high) |
| Keyboard rules and hooks | [`hooks/`](./2026-10-probes-5/hooks/FINDINGS.md) | KH | Chromium (keyboard driven), jsdom | 11 |
| Visual rules | [`visual/`](./2026-10-probes-5/visual/FINDINGS.md) | VI | Chromium, pixels | 14 |
| API, packs, console, reporters | [`api/`](./2026-10-probes-5/api/FINDINGS.md) | AP | Chromium, jsdom | 10 |
| Re-check, fuzzing, scale | [`robust/`](./2026-10-probes-5/robust/FINDINGS.md), [`RECHECK.md`](./2026-10-probes-5/robust/RECHECK.md) | RB5 | jsdom, Chromium | 9 |

That makes 59 confirmed findings, 58 once NR-11 and RB5-5 (the same gap) are merged. One is High, 19 Medium, the rest Low. No scan threw and nothing crashed.

**Basis**
- `main` at `c528af08`; the full suite passes there: 5,578 tests, none failed or skipped (Chromium found through `CHROMIUM_EXECUTABLE_PATH`).
- Chromium 153.0.8010.12 (`/opt/pw-browsers/chromium`, `--force-color-profile=srgb`), jsdom from the repo.
- WCAG 2.2 and its Understanding documents are the source of truth; WAI-ARIA 1.2 (and the 1.3 draft), accname, HTML-AAM, SVG-AAM, ARIA in HTML, HTML and CSS decide the details; Chromium's accessibility tree and painted pixels are supporting evidence.

**How findings were verified.** Each probe reproduced its findings at least twice with a minimal script. During consolidation, the findings ranked 1–20 below were re-run separately, and all reproduce on `c528af08`: NR-1, NR-2, NR-3, NR-4 (the file-input case; the video case did not fail in the re-run), NR-6, VI-1 (with a pixel sample of the field), VI-3, VI-6, VI-7, KH-1, KH-2, AP-1, AP-2, AP-4, RB5-8 and RB5-9. The others are marked *(not re-run)* where they appear. Before fixing anything, reproduce it on current `main`.

## What held up

- **Round 4 is fixed.** Of its 31 confirmed findings, 29 are fixed and verified by re-running their repros, and 2 are partly fixed (CH-3, OP-5); none is still open. Five fixes left a half-fix or a cousin, reported here as new findings (RB5-1, RB5-2, RB5-4, RB5-6, RB5-9). Details in [`RECHECK.md`](./2026-10-probes-5/robust/RECHECK.md).
- **Fuzzing:** about 13,000 jsdom scans (1,499 generated pages with the ten new rules in the grammar and prototype names in every value, 400 fixture mutations, five locales). No scan threw, every result serialised, no outcome contradicted its tiers, no unfilled placeholder, no DOM mutation, and the full scan, a rule alone, a random subset and a second scan always agreed.
- **Names and roles:** 2,852 input type × attribute cases, about 1,590 elements diffed against Chromium's AX tree (multiple, hidden and self-named labels, `aria-labelledby="x x"`, embedded controls, generated content, slots, shadow DOM, ElementInternals), 47 hidden-content cases, 26 heading-conflict variants, 7 modal-claim variants.
- **Hooks:** the listener hook is transparent to the page in about 25 checks (one exception, KH-7) and handles about 30 bookkeeping cases; 100,000 listeners cost tens of ms; the live-region hook is right in 32 cases apart from KH-2.
- **Visual:** about 300 cases matched the pixels: generated text, the page canvas and dark schemes, placeholders, background layers, outlines and shadows, blend and filter, large-text thresholds, margin bands for every rule, cookie banners, off-canvas menus, skip links, reduced motion and scroll timelines.
- **API:** `run()` matches a direct scan for 37 `runOnly` forms; the bundle's keys match its types; no overlay changes a later scan; hostile names never run; 600 random selections give the same rules in the catalog and the scan; SARIF validates, JUnit is well-formed, EARL and the baseline agree; 15,096 translated messages of the new rules are complete.
- **Speed:** the round-4 fixes hold (p-as-heading at depth 1,600 in 30 ms; 30 long values at 80k characters under 300 ms), and the new rules and the reworked name computation grow linearly up to 4,000 elements.

---

## 1. Priorities

Ordered by how much each one damages trust in results. The ranks are a proposal for discussion; the severity is the README's.

### P1: Wrong `fail`s and wrong verdicts on markup real sites use

| # | Finding | ID | Sev. | Where |
|---|---|---|---|---|
| 1 | **A control named by `aria-labelledby` pointing at `aria-hidden` text fails when the text is inside a child element.** `<button aria-labelledby=l>` with `<span id=l aria-hidden=true><b>Save</b></span>` fails `button-name-present`; the link, form-field and checkbox name rules fail the same way. Accname includes the whole referenced subtree; Chromium says "Save". Same in jsdom. | NR-1 | **High** | `dom-helpers.js:3311`, `:4145`, `:5438` |
| 2 | **Every unstyled drop-down `<select>` is measured on `#efefef`, but Chromium paints the field white.** `color:#767676` paints 4.54:1 (pass) and fails at 3.95. Wrong fails for painted ratios 4.5–5.17, and a wrong ratio on every unstyled select. | VI-1 | Medium | `contrast-helpers.js:919` |
| 3 | **WCAG rollups for 1.3.5, 3.3.2 and 2.5.8 say `notApplicable` on pages they apply to:** a form with an email field (1.3.5); unlabelled ARIA text fields the engine itself fails under 4.1.2 (3.3.2); a 12px `<span onclick>` (2.5.8). A conformance report built on the rollups overstates coverage. | AP-1 | Medium | `coverage/complete-applicability.js:25,31,32` |
| 4 | **With the listener hook, a working component fails `click-handler-keyboard-operable` when its key listener is on a shadow root** (Lit's `renderRoot`, or a slotted button). Tab then Enter works. The rule asks ancestors, the document and the window, never a ShadowRoot. | KH-1 | Medium | `click-handler-keyboard-operable.js:326,353,386` |
| 5 | **Text drawn with `background-clip: text` over a solid colour fails at 1.00:1;** painted 21:1. | VI-3 | Medium | `contrast-helpers.js:718`, `:3979` |
| 6 | **Buttons inside a sentence fail 2.5.8;** the same sentence with links passes. The SC's inline exception covers any target in a sentence. | VI-7 | Medium | `target-size-minimum.js:253` |
| 7 | **`<progress role=progressbar max=1000 aria-valuenow=500>`, `<input type=range role=slider min=1900 max=2100>` and `<meter role=meter>` fail `aria-valid-attr-value`:** the native min/max are ignored for ARIA's 0–100. Without the redundant role they pass. | NR-3 | Medium | `aria-valid-attr-value.js:142,161,209` |
| 8 | **The ARIA 1.3 role `image` fails `aria-roles-valid`,** though `sectionheader` and `sectionfooter` are accepted for the same reason (Chromium exposes them). | NR-6 | Medium | `aria-helpers.js:255` |
| 9 | **ARIA 1.2's deprecated global attributes fail on elements with no role** (`<input type=file aria-invalid>`) but only ask on a `<div>`, against the rule's own docs. | NR-4 | Medium | `aria-allowed-attr.js:852` |
| 10 | **A finding in a shadow root can point at the wrong element:** the selector of a top-level `<img>` in a shadow root resolves to an earlier, passing `<img>` deeper in it, in every reporter. | RB5-9 | Medium | `dom-helpers.js:6463` |
| 11 | **`role="alert"` with an explicit `aria-live` is not an alert to the live-region hook:** a needless question, and `getAnnouncements()` omits it, against ARIA and INTEGRATION.md. | KH-2 | Medium | `live-region-hook.js:251` |
| 12 | **`text-spacing-content-loss` mixes zoomed and unzoomed units:** under `zoom` or `scale()` it passes real clipping, or asks about clipping that isn't there. *(not re-run)* | VI-4 | Medium | `text-spacing-content-loss.js:687` |
| 13 | **An orientation lock in a sheet `@import`ed by a CORS cross-origin sheet passes,** breaking the documented "linked or imported". *(not re-run)* | VI-8 | Medium | `stylesheet-preload.js:39` |
| 14 | **The logo heuristic takes `btn-brand`, `text-brand-500`, a `brand-*` wrapper up to 6 levels up, a "Home" link and a language switcher for logos;** under a pack's `logoText: 'exempt'` their real failures pass. | VI-6 | Medium (variant) | `contrast-helpers.js:3850` |
| 15 | **A presentational SVG's `<title>`/`<desc>` names a link or button in Chromium** (Chromium: no name), while jsdom fails a correctly named SVG `<a>`. | NR-2 | Medium | `dom-helpers.js:5151`, `:5440`, `:5537` |

### P2: Speed

| # | Finding | ID | Sev. |
|---|---|---|---|
| 16 | **Every browser scan is quadratic in running animations,** whatever the selection: 1,000 / 2,000 / 4,000 animations take 0.6 / 2.5 / 10.7 s for one unrelated rule (re-run), 114 s at 10,000. `settleAnimations` interleaves reads and writes; reading all first took 16 ms at 4,000. Skeleton loaders and icon grids hit this. | RB5-8 | Medium |
| 17 | **`aria-required-parent` is O(items × owners) under `aria-owns`:** 4,000 owned items take 8.9 s in Chromium, 92 s in jsdom. *(not re-run)* | RB5-7 | Low–Medium |
| 18 | **`link-name-quality`'s trailing-punctuation pattern** takes 9.4 s on an 80k run (a cousin of FZ-6). *(not re-run)* | RB5-6 | Low |

### P3: The console helpers, before they ship

All unreleased, so cheapest to fix now.

| # | Finding | ID | Sev. |
|---|---|---|---|
| 19 | **`inspect('names')` shows `<input type=button|submit|reset>` as "(no name)"** while `button-name-present` passes them; it also gives `<select multiple>` as combobox and a grid's `<td>` as cell (NR-10). | AP-2, NR-10 | Medium, Low |
| 20 | **`a11ycore.run()` silently runs all 144 rules** when the selection is put at the top level (`run({ wcag })`, the documented form until `c528af08`) or given as a string or list. | AP-4 | Medium |
| 21 | **`inspect('focus-order')` is not the Tab order:** every radio of a group listed, an `aria-hidden` link Tab reaches left out, shadow content numbered last. *(not re-run)* | AP-3 | Medium (radios) |
| 22 | Overlays break under a CSP without inline styles (AP-5), and are misplaced when `<html>` is transformed, zoomed or has a margin (AP-6); `openReport()` can't be retried after one failure (AP-10). *(not re-run)* | AP-5, AP-6, AP-10 | Low |

### P4: Smaller items

**Names and ARIA**
- **NR-5:** a `<td>` in a table whose presentational role is overridden (focusable, or a global attribute) is still roleless, so its cell attributes fail.
- **NR-7:** a nested `aria-labelledby` is followed inside a labelledby traversal, giving a wrong `label-in-name` fail.
- **NR-8:** text directly inside a closed `<details>` goes into names (no outcome changed; wrong in messages and `inspect`).
- **NR-9:** `page-has-heading-one` ignores `aria-level` on h1–h6, which `heading-order` honours.
- **NR-11 = RB5-5:** `aria-allowed-attr` skips an `<input>` with an unknown or obsolete type, which HTML makes a text field.
- **RB5-4:** `<input type="constructor">` or `"__proto__"` makes `aria-allowed-attr` error out (the FZ-1 class, in a plain-object table).
- **NR-12:** `<input aria-placeholder>` alone fails, where `<div role=textbox aria-placeholder>` asks.
- **NR-13:** under jsdom, a button named only by generated content fails; LIMITATIONS.md says so only for contrast.
- **NR-14:** `aria-prohibited-children` says a `<button>` "has no role".
- **NR-15:** `aria-valuenow="0x10"` is accepted as 16.
- **RB5-2:** element references set from script (`ariaErrorMessageElements`, `ariaControlsElements`…) are read for names only; four other rules ignore them (CH-3's other half).
- **RB5-3:** Chromium reflects the misspelled `aria-labeledby` through `ariaLabelledByElements`, so the engine names such elements in a browser and fails them under jsdom; RULE_EXAMPLES.md says it is ignored.

**Keyboard and hooks**
- **KH-3:** every `<textarea>` gets a `scrollable-region-focusable` question in Chromium (its default `overflow: auto`), none in jsdom. Low by the rubric but on every page with a textarea, so cheap and visible.
- **KH-4:** key handling attached on first focus counts as "no key listener" (debatable).
- **KH-5, KH-6, KH-7:** the listener hook drops a `new String('keydown')` type and another realm's listeners, counts a listener with an already-aborted signal, and reads `options.capture` twice.
- **KH-8:** `invalid-field-error-message` fails a visible message inside a `visibility: hidden` box, and treats aria-hidden text unevenly.
- **KH-9:** `onclick="javascript:void(0)"` and similar no-ops are not recognised.
- **KH-10:** the F55 rule misses `onfocus` handlers that move focus elsewhere, and files F55's own Example 3 under the wrong code.
- **KH-11:** `aria-expanded-state-mismatch` counts a `content-visibility: hidden` panel as shown, against its docs.

**Visual**
- **VI-2:** a customizable select with no author `<button>`: its closed text is never measured.
- **VI-5:** under forced colors, the page's forced-colors rules and system colours still apply, so results differ from forced colors off.
- **VI-9:** adopted and shadow-root style sheets are not read by `css-orientation-lock` and `css-hidden-focus`.
- **VI-10, VI-11:** `css-hidden-focus` misses `scale(0)`, `overflow-x: clip` and `!important` hiding, and asks about `&:focus` and `:has(:focus)` rules.
- **VI-12:** text moved off the page by `text-indent` fails contrast.
- **VI-13:** large text is judged by `font-size` despite `font-size-adjust` (debatable).
- **VI-14:** LAYOUT_MEASUREMENT.md still says a placeholder below its ratio is always `cantTell`.

**API and packs**
- **AP-7:** 17 rules (the text-alternative family, `manual-review`) report findings with no `reasonCode`, so a standard's `reasonCodes` row can never match them, silently.
- **AP-8:** `checkPack()` and `definePack` approve rule-mapped standards every scan then skips.
- **AP-9:** the catalog functions don't warn about a selection that cancels itself, as the scan does.
- **RB5-1:** a focusable element inside a customizable select's button is reported by no rule (CH-1's fix), against the decision in DESIGN_CHALLENGES.md.
- **OP-5 (round 4), partly fixed:** `surea11y-pack new` takes the last of two `--name` values.

---

## 2. Decisions needed

These are not clear bugs. Each needs a decision before anything is built.

- **3.3.1 or ARIA for `invalid-field-error-message`.** It fails when `aria-errormessage` points at a hidden message even though the error is shown elsewhere in text (a `role=alert` summary, the label). WCAG 3.3.1 is met; ARIA's MUST is broken. Which one may make a 3.3.1 `fail`? (KH lead 1)
- **`form-control-single-label` still fails a field with two labels.** Its stated reason (screen readers announce an unpredictable subset) is contradicted by HTML-AAM and by the name computation change in this release, which joins every label. Keep, ask instead, or drop? (NR lead 1)
- **`listitem-parent-valid` fails `<li>` in `<ul role=group|navigation>`,** where ARIA in HTML makes the `li` generic. (NR lead 2)
- **An input whose `list` names no datalist:** textbox (HTML-AAM, current) or combobox (ARIA in HTML)? (NR lead 4)
- **The CH-4 fix leaves a light fill plus a light outline as `cantTell`.** `fail` when both are below the ratio? (RB5 lead)
- **Large text by computed `font-size` or by the size drawn** (`font-size-adjust`, VI-13).
- **`strictOptions` and unknown profiles or opt-in tags:** a typo of a profile runs every rule with only a warning. Profiles are an open set; throw anyway under strict mode? (AP lead, round-4 OP-P2)
- **`focus-not-removed-by-script` maps 2.1.1 and 2.4.7;** F55 also names 3.2.1. Add it? (AP lead)
- **Key handling attached on first focus** (KH-4): `fail` or `cantTell`?

## 3. Improvements and features

Found along the way; none was promised.

**Accuracy**
- **A shared "event path" helper** for the listener-reading rules: element ancestors, assigned slots, shadow roots and hosts, the document and the window, in DOM order. It fixes KH-1 and gives every future listener rule the same answer.
- **Read the native range for range roles** (NR-3) and **an input's value and default label everywhere a name is read** (AP-2): both are one helper that two places skip.
- **Follow `@import` in fetched cross-origin sheets, and read adopted and shadow-root sheets** in one style-sheet walker for `css-orientation-lock`, `css-hidden-focus` and any later CSS rule (VI-8, VI-9, VI-11's nesting).
- **Read every `aria*Elements` reflection where its attribute is read** (RB5-2), and decide whether to follow Chromium's reflection of `aria-labeledby` (RB5-3).
- **Pixel-check the native controls the engine models** (select, checkbox, radio, range) in a Chromium test, so the UA default colours stay right as browsers change (VI-1).
- **Tighten the logo heuristic** to `logo` / `brand` as whole class tokens on the element or its link, and to the banner's first link only when it holds an image or the site name (VI-6).
- **Make the rollup applicability list a tested claim:** for each criterion in `complete-applicability.js`, a fixture of in-scope markup the rules must not call `notApplicable` (AP-1).

**Speed**
- **Batch `settleAnimations`** (read every animation, then write): RB5-8's measured fix, 10.7 s → 16 ms at 4,000.
- **Index `aria-owns` once per scan** for `aria-required-parent` (RB5-7), and **bound the punctuation regex** in `link-name-quality` (RB5-6).

**Robustness**
- **Use `Object.create(null)` or a `Map` for every table indexed by a page value:** RB5-4 is the second instance after FZ-1. A lint rule or a fuzz invariant ("every page string as `__proto__`") would close the class.
- **Prove shadow-root selectors resolve to their element** in the fuzz harness (RB5-9), as FZ-5's fix does for the light DOM.

**Console helpers**
- **Refuse, or warn about, a `run()` argument that isn't an options object,** and keep the selection only under `runOnly` (AP-4).
- **Draw overlays with constructable style sheets** (CSP-proof) **inside a top-layer popover** (no transform or zoom offsets) (AP-5, AP-6).
- **Build `inspect('focus-order')` from the rules' own focus model:** one stop per radio group, the `aria-hidden` focusable included and flagged, shadow content at its host (AP-3).

**Contracts and docs**
- **Give the text-alternative rules reason codes** (AP-7): PACKS.md already promises them, and `checkPack` could then refuse a `reasonCodes` row for a code no rule emits.
- **Run the standard's own `validate` in `checkPack` and `definePack`** (AP-8), and the self-cancelling check in the catalog functions (AP-9).
- **LIMITATIONS.md:** generated-content names under jsdom (NR-13), SVG SMIL and animated GIFs unseen by `moving-content-pausable`, forced colors (VI-5) until fixed.
- **Dev tool:** `scripts/ax-tree-differential.js` keeps its own global-attribute list, four short; reuse the engine's (NR lead 9).

## 4. Leads still open

Recorded in each area's `FINDINGS.md`; not confirmed, or very rare.
- **Live regions:** nested `aria-live="off"` inside a polite region recorded as polite; `aria-relevant` ignored by the hook.
- **Keyboard:** `accesskey` on a `role=button` div not counted.
- **Owners and widgets:** `aria-owns-valid` ignores hidden owners and mutual owners; shadow-DOM composites in `widget-keyboard-focusable`.
- **Names:** alt text from `content: "x" / "Alt"` joined with no space; an `<input type=button>` inside a label adds nothing to its name; `hidden="until-found"` with author `content-visibility: visible`.
- **Visual:**
  - `::first-line` / `::first-letter` asked about though computable;
  - `open-quote` text not counted;
  - a 1px visually-hidden box without `clip` fails contrast;
  - `moving-content-pausable` counts an animation's delay as movement, and asks about `playbackRate` 0 and off-screen elements;
  - broken-image alt text not measured.
- **Round 4, still open:** OP-P1 to OP-P6, the strict-mode whitespace inconsistency, the Kelvin sign ([`RECHECK.md`](./2026-10-probes-5/robust/RECHECK.md)).
- **Extreme markup:** `contrast-computable` grows with depth squared beyond about 200 levels, and `target-size-minimum` at about n^1.4 on 10,000 inline targets with no spaces.

## 5. Next steps

1. **Agree the priorities and the decisions** of §1–§2.
2. **Record this round in the register:** merge `main` into `audit/2026-10-stress-test-outcomes` as its README says, add these findings to `FINDINGS.md` (merging NR-11 with RB5-5), and move round 4's 29 fixed findings to *Fixed*.
3. **Fix on branches from `main`,** one issue per item, P1 first. For each P1 item, a Chromium test where it touches rendering.
