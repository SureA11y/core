# Fifth stress test: robustness (re-check, fuzzing, scale)

Prefix **RB5**. Engine at `c528af08`, jsdom from `node_modules`, Chromium 153.0.8010.12 at `/opt/pw-browsers/chromium`.

- The re-check of the fourth round's 31 findings and its leads is in [`RECHECK.md`](./RECHECK.md): 29 fixed, 2 partly fixed, none still open.
- Nine confirmed findings follow. Five come from checking the fixes for half-fixes and cousins (RB5-1, -2, -4, -6, -9). The others come from fuzzing, differential runs and scale curves.
- Every repro was run at least twice, and timings were taken in at least two separate runs.

**Scripts**
- Helpers: `j.js` (jsdom scan), `sp.js` (timing curves).
- Round-4 rechecks: `*-recheck.*`, `ch*.mjs`, `fz*.js`, `op*.js`, `rp3.js`, `leads-*.js`.
- Fuzz harness: `fuzz/`, with `gen5.js`, `check5.js`, `worker5.js`, `runner5.js`, `agg5.js`, `parity5.mjs` and the minimisers.
- Scale probes: `scale5.js`, `scale-chromium.mjs`, `owns-*.{js,mjs}`, `anim-*.mjs`, `list-depth.js`, `ts-inline.mjs`.
- Outputs: `out-*.txt`, `fuzz/out-*`.

---

## RB5-1. A focusable element inside a customizable `<select>`'s button is reported by no rule unless it is a control

**Repro** (Chromium):
```html
<style>select,::picker(select){appearance:base-select}</style>
<label>Fruit <select><button><span tabindex="0">i</span><selectedcontent></selectedcontent></button>
<option>Apple</option></select></label>
```
The same happens with `<span contenteditable="true">`, `<details><summary>`, or `<audio controls>` in the button.

**In plain words:** the CH-1 fix makes the select's own button inert. That rightly stops it being failed as a nested control. The project then decided that a focusable thing an author writes *inside* that button is still to be reported. That holds only for links, buttons, inputs and widget roles. A `tabindex` span, an editable span, a `<details>` or a media player with controls inside the button now goes unreported. In a plain `<button>`, the same markup fails.

| | plain `<button>` | the select's `<button>` |
|---|---|---|
| `<span tabindex=0>` | `presentational-children-focusable-absent` fail | nothing |
| `contenteditable` span | fail | nothing |
| `<details><summary>` | fail | nothing |
| `<audio controls>` | fail | nothing |
| `<a href>` | fail (both rules) | `nested-interactive-controls-absent` fail (as decided) |

- **Engine says:** pass. **Should say:** fail, as DESIGN_CHALLENGES.md decided.
- **Spec:** HTML, the `button` element, content model: "Phrasing content, but there must be no interactive content descendant and no descendant with the tabindex attribute specified." (whatwg/html, §4.10.6).
- **Engine's own docs:** `docs/DESIGN_CHALLENGES.md` (decision 2026-10-15): "Only the button: a focusable element an author puts inside it is still a nested control … All three are still reported."
- **Chromium:** the button and everything in it are `inertElement`.
- **Cause:** `hasBlockingInert` treats the select's first `button` as inert (`src/core/dom-helpers.js:829-848`), so `presentational-children-focusable-absent` skips the button. `nested-interactive-controls-absent` counts only native controls and widget roles (`NATIVE_INTERACTIVE_SELECTOR`, `src/checks/automatic/nested-interactive-controls-absent.js:158`), so a `tabindex` span or editable span isn't one.
- **Verdict:** Inconsistency, with the project's own decision. **Severity:** Low.

## RB5-2. Element references set from script are read for names only; four rules ignore the same references

**Repro** (Chromium; each case against the same markup with the content attribute):
```html
<label for="g">Email</label><input id="g" aria-invalid="true"><span id="err" hidden>Enter an email</span>
<script>g.ariaErrorMessageElements=[err]</script>
<button id="t" aria-expanded="true">Menu</button><ul id="menu" hidden><li>Home</li></ul>
<script>t.ariaControlsElements=[menu]</script>
<span id="lbl">Email address</span><input id="f"><script>f.ariaLabelledByElements=[lbl]</script>
<div id="lb" role="listbox" aria-label="Fruit"><div role="option" id="o1">Apple</div></div>
<script>lb.ariaActiveDescendantElement=o1</script>
```

**In plain words:** the CH-3 fix taught the name computation to read references a script sets as elements. The rules added since, and two older ones, still read only the attribute. Chromium exposes every one of these relations (`ch3-rel-ax.mjs`: `errormessage`, `controls`, `activedescendant` and `describedby` relations all present when set as elements).

| Case | With the attribute | Set as elements |
|---|---|---|
| Hidden error message | `invalid-field-error-message` **fail** `ERROR_MESSAGE_HIDDEN` | `cantTell NO_ERROR_MESSAGE` (a missed fail) |
| Visible error message | pass | `cantTell NO_ERROR_MESSAGE` (a false question) |
| `aria-expanded="true"`, panel hidden | `aria-expanded-state-mismatch` `cantTell EXPANDED_TRUE_CONTROLLED_HIDDEN` | nothing |
| Label from a visible span | nothing | `form-control-programmatic-label-quality` `cantTell label_from_hidden_labelledby` (wrong: the label is visible) |
| Active descendant, host not focusable | `widget-keyboard-focusable` `ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE` | `COMPOSITE_NO_TAB_STOP` (wrong code) |

- **Spec:** WAI-ARIA 1.2 `aria-errormessage`: "Identifies the element (or elements) that provides an error message for an object." HTML reflects the attribute as `ariaErrorMessageElements`, and an element set there is the attribute's value as far as the accessibility tree goes. Chromium shows that above.
- **Engine's own docs:** `docs/RULE_HELPERS.md:579-586` documents `getReflectedRefs(el, attr)` for `aria-describedby`, `aria-controls`, `aria-owns`, `aria-errormessage`, `aria-details` and `aria-flowto`. No rule but the name helpers and three image rules call it.
- **Cause:** `src/checks/automatic/invalid-field-error-message.js`, `src/checks/manual/aria-expanded-state-mismatch.js`, `src/checks/manual/widget-keyboard-focusable.js` and `src/checks/manual/form-control-programmatic-label-quality-manual.js` read the attributes and never call `getReflectedRefs` (`grep -c getReflectedRefs` gives 0 in each).
- **Verdict:** Bug: a partial fix of CH-3, and the new rules repeat the old gap. **Severity:** Low. The pattern is uncommon, and one case is a missed fail.

## RB5-3. In a browser, a misspelled `aria-labeledby` names an element; under jsdom it doesn't. The engine's docs say it names nothing

**Repro** (`labeledby-reflect.mjs`, `fuzz/par-one.mjs`):
```html
<button id="i" aria-labeledby="v"></button><span id="v">Save</span>
<input aria-labeledby="lbl"><span id="lbl">Email</span>
<img src="a.png" aria-labeledby="v2"><span id="v2">Chart of sales</span>
```

**In plain words:** the same page gets opposite verdicts depending on where it is scanned.
- In Chromium, `ariaLabelledByElements` also reflects the misspelled `aria-labeledby` (`{attr: null, labeled: "v", reflected: ["v"]}`). The CH-3 fix reads that property when `aria-labelledby` is absent, so the engine names the button "Save" and passes it.
- Under jsdom, the same button fails `button-name-present`.

This was the root cause of every name-rule disagreement the jsdom/Chromium differential found: `button-name-present`, `img-alt-present`, `form-control-programmatic-label-present` and `label-in-name` (seeds 21, 23 and 25, minimised by `fuzz/min-par5.mjs`).

- **Engine says:** in Chromium, pass. Under jsdom, fail. The same engine flags the attribute itself as invalid (`aria-valid-attr` `cantTell ARIA_ATTR_INVALID`).
- **Spec:** WAI-ARIA 1.2 defines only `aria-labelledby`; accname 1.2 step 2B reads "the aria-labelledby attribute". `aria-labeledby` is not a WAI-ARIA attribute.
- **Engine's own docs:** `docs/RULE_EXAMPLES.md:371`: "`aria-labeledby` is a typo (the real attribute is `aria-labelledby`) and is silently ignored by assistive technology."
- **Chromium:** names them (`button "Save"`, `image "Chart of sales"`).
- **Cause:** `getReflectedRefs` (`src/core/dom-helpers.js:1046-1055`), used at `:1368` for names, trusts `el.ariaLabelledByElements` whenever the `aria-labelledby` attribute is missing. Fix: read the reflection only when the content attribute is `""`, which it is when a script set elements. Or check that `aria-labeledby` is absent.
- **Verdict:** Inconsistency: jsdom and browser disagree, and the browser result contradicts the engine's own docs. **Severity:** Low. A typo, but a common one.

## RB5-4. `<input type="constructor">` or `type="__proto__"` makes `aria-allowed-attr` error out

**Repro** (`rb-input-type-proto.js`, `proto-values.js`):
```html
<label>Name <input type="constructor" aria-pressed="true"></label>
```
- **Engine says:** `aria-allowed-attr` `cantTell` with error `allowed.has is not a function`. The other findings on the page are lost with it. The same happens for `__proto__` and `CONSTRUCTOR`. `toString` and the like are lowercased by the attribute read, so they miss the table.
- **Should say:** the input is a text field, so `fail ARIA_ATTR_NOT_ALLOWED`, as for `type="text"` (see RB5-5).
- **Cause:** `INPUT_ALLOWED[type]` on a plain object (`src/checks/automatic/aria-allowed-attr.js:909`, lookup at `:939`). This is the FZ-1 class that round 4 suggested fixing everywhere ("`Object.create(null)` or a `Map` for every table indexed by a value from the page").
- **Probe:** 32 slots where a table is indexed by a page value, × 9 prototype names (`proto-values.js`). This was the only failure. The new rules' tables are `Set`/`Map` or guarded with `hasOwnProperty`.
- **Verdict:** Bug. **Severity:** Low.

## RB5-5. `aria-allowed-attr` skips an `<input>` whose type is invalid or obsolete, which HTML makes a text field

**Repro** (`rb-input-type-proto.js`, jsdom; the same in Chromium):
```html
<label>Name <input type="datetime" aria-pressed="true"></label>   <!-- also type="txt", type="foo" -->
```
- **Engine says:** `notApplicable`. With `type="text"` it fails `ARIA_ATTR_NOT_ALLOWED`.
- **Should say:** fail, as for a text input.
- **Chromium:** `textbox "Name"`.
- **Spec:** HTML, the `input` element: "The `type` attribute's missing value default and invalid value default are both the Text state." HTML-AAM maps `input type=text` (the Text state) to `textbox`. `aria-pressed` is not supported on `textbox` (WAI-ARIA 1.2, `aria-pressed`, "Used in Roles: button").
- **Cause:** the rule builds a key `'input[type=' + raw value + ']'` (`aria-allowed-attr.js:958-963`) and leaves elements whose key is not in `IMPLICIT_ROLE_BY_ELEMENT` out of scope. The shared `getInputRole` (`src/core/aria-helpers.js:1484-1514`) maps "any type the browser doesn't know" to `textbox`, so the engine contradicts itself. The name rules see the field: `form-control-programmatic-label-present` fails an unlabelled `type="datetime"`.
- **Verdict:** Gap, a clear violation missed. **Severity:** Low. `type="datetime"` is still common on old forms.

## RB5-6. `link-name-quality` is quadratic on a long run of punctuation inside link text (a cousin of FZ-6)

**Repro** (`redos2.js`, jsdom; `speed-recheck.js fz6`):
```html
<a href="/x">a........(40,000 dots)........x</a>
```

| Run length | 5k | 10k | 20k | 40k | 80k |
|---|---|---|---|---|---|
| `link-name-quality` | 76 ms | 106 ms | 519 ms | 2.36 s | 9.4 s |

The same curve holds for `!?` runs, and for an `aria-label` of dots. A trailing run with no `x` after it, or dashes, is fast.

- **Cause:** `normalize()` in `src/checks/manual/link-name-quality-manual.js:286` keeps `/[\s.,;:!?。、>»›→]+$/g`, the very pattern c1ee1ab8 replaced in `heading-quality`, `form-control-label-quality` and the text-alternative helpers ("a regex like /[.,]+$/ retries the run from every position in it").
- **Spec:** none (performance). A hostile or broken page could stall a scan, as FZ-6 said.
- **Verdict:** Bug, a half-fix of FZ-6. **Severity:** Low.

## RB5-7. `aria-required-parent` is O(items × owners) with `aria-owns`

**Repro** (`owns-scale.js`, `scale5.js`, `owns-chromium.mjs`):
```html
<div role="list" aria-owns="it0"></div> … ×n … <div role="listitem" id="it0">x</div> … ×n
<!-- or one listbox owning n options -->
<div role="listbox" tabindex="0" aria-label="L" aria-owns="o0 o1 … o(n-1)"></div><div role="option" id="o0">…</div> …
```

| n | 500 | 1,000 | 2,000 | 4,000 |
|---|---|---|---|---|
| Lists each owning an item, Chromium | 151 ms | 575 ms | 2.27 s | 8.9 s |
| Same, jsdom | — | 3.9 s | — | 92 s |
| One listbox owning n options, Chromium | 29 ms | 152 ms | 428 ms | 1.88 s |
| Same, jsdom | — | 1.0 s | — | 20.5 s |

`aria-owns-valid` and `aria-required-children` stay under 50 ms on the same pages. A data grid or virtual list that re-parents a thousand rows or options with `aria-owns` passes 2 s under jsdom, and in Chromium from about 2,000 items.

- **Cause:** for every element whose required context role is missing from its DOM ancestors, `hasAcceptableOwnerContext` runs `queryAllSmart('[aria-owns]')` and splits every owner's token list (`src/checks/automatic/aria-required-parent.js:260-281`). `aria-owns-valid` already builds a `Map` from each owned id to its owners in one pass (`aria-owns-valid.js:95-131`). The same index would make this linear.
- **Verdict:** Bug (performance). **Severity:** Low to Medium.

## RB5-8. In a browser, any scan is quadratic in the number of running animations

**Repro** (`anim-scale.mjs`, `scale-chromium.mjs`, `anim-settle-micro.mjs`, Chromium):
```html
<style>@keyframes m{from{transform:translateX(0)}to{transform:translateX(50px)}}.a{animation:m 10s infinite}</style>
<span class="a">M0</span> … ×n
```

| Running animations | 500 | 1,000 | 2,000 | 4,000 | 10,000 |
|---|---|---|---|---|---|
| Full scan | 0.44 s | 0.82 s | 3.1 s | 12.0 s | 114 s |
| Scan of `img-alt-present` alone | 0.17 s | 0.78 s | 2.6 s | 13.3 s | — |
| Sum of all rule timings | 0.21 s | 0.27 s | 0.46 s | 0.93 s | ~2 s |

Nearly all the time is outside the rules, even when one unrelated rule is selected.

- **Cause:** `settleAnimations` (`src/core/dom-runner.js:1024-1096`) reads `playState`, `currentTime` and `getComputedTiming()` of each animation and then sets its `currentTime`, one animation at a time. Each write makes the next read update style for the whole document.
- **Measured fix:** a microbenchmark of the same loop in the page, reading every animation first and then writing, takes 4, 14 and 16 ms for 1k, 2k and 4k, against 0.63 s, 2.46 s and 10.4 s interleaved.
- **Who hits it:** pages with hundreds of animated skeleton placeholders, spinners or icons. At 2,000 animations a scan takes 2.5 s more.
- **Verdict:** Bug (performance). **Severity:** Medium: every browser scan of such a page pays it, whatever the selection.

## RB5-9. The selector of a top-level element in a shadow root can name a different, deeper element (round-4 lead FZ-P2, now confirmed)

**Repro** (`fzp2-shadow-sel.js`, jsdom; the same in Chromium):
```html
<x-card id="h"></x-card>
<script>customElements.define('x-card', class extends HTMLElement { constructor(){ super();
  this.attachShadow({mode:'open'}).innerHTML =
   '<div class="media"><img src="deep.png" alt="Deep photo"></div><img src="top.png"><div><button>Buy</button></div><button></button>'; } });</script>
```

- **Engine says:** `img-alt-present` fails `top.png` with `shadowHostSelectors: ["#h"]`, `selector: "img"`, and `button-name-present` fails the empty button with `selector: "button"`.
- `document.querySelector('#h').shadowRoot.querySelector('img')` returns the passing `deep.png` image, and `…querySelector('button')` returns the "Buy" button. The HTML report, SARIF, JUnit and baseline all show `#h >>> img`, which points at the wrong element.
- **Engine's own docs:** `docs/OUTPUT_SCHEMA.md:216`: "`document.querySelector(s[0]).shadowRoot.querySelector(s[1])…shadowRoot.querySelector(selector)` finds the element." Line 215 says an element in a shadow root is placed by `structuralPath`, but line 218 says `structuralPath` is `null` for every element in a shadow tree, so nothing places it.
- **Fuzz:** all 26 wrong-element selector reports in 1,500 generated pages were of this kind.
- **Cause:** `buildSelectorUncached` (`src/core/dom-helpers.js:6463-6466`) stops the path at an element with no `parentElement`, the shadow root's child, and calls it pinned. That holds for `<html>`, not for a shadow root, where the bare `img` (or `img:nth-of-type(k)`, counted only among the root's children) matches at any depth. Fix: check uniqueness in the root there, or anchor the first step to the root's children, for example `:not(* > *)`.
- **Verdict:** Bug: a broken integrator contract, against the docs. **Severity:** Medium. Components often hold the same tag at two depths.

---

## Leads

- **CH-4 fix scope: light fill plus light outline.** `color:#eee; -webkit-text-stroke:1px #ddd` on white (every colour drawn is below 1.4:1) gives `cantTell TEXT_STROKE`, not `fail`. d25a9e9b fails only text "whose fill draws nothing". By the same reasoning ("no reading of it can meet the criterion") a fill and outline that are all too light could fail. That needs a decision.
- **`ariaOwnsElements` ownership.** With ownership set as elements, `aria-required-parent` fails the owned options and `aria-required-children` asks about the listbox. Chromium 153 also builds no ownership from `ariaOwnsElements` (the listbox has no children, `ch3-owns-ax.mjs`). It matches what assistive technology gets, so this is debatable.
- **jsdom selector engine.** Under jsdom, occurrence selectors with `&` in an attribute value (`input[aria-label="&lt;b&gt;"]`, 178 reports) or an astral character (`[aria-label="🙂"]`, 93) can't be resolved by jsdom's own `querySelector`. They are correct CSS and resolve in Chromium. The engine confirms paths with `matches()`, which nwsapi gets right for `&` and wrong for emoji. This is cosmetic, and in the same jsdom family as FZ-5.
- **`contrast-computable` on deep nesting.** Cost is about depth² with text at every level. Nested lists 200, 400 and 800 deep took 2.4 s, 26 s and 159 s (each `<li>` has a `::marker` to measure). At realistic depths (≤100) it stays under 1 s (`list-depth.js`).
- **`target-size-minimum` on thousands of adjacent inline targets with no whitespace between them** is about n^1.4: 10,000 `<span role=link>` in one run took 10 s. With spaces, or with real links, it is linear (`ts-inline.mjs`).
- **`aria-owns-valid` on an `aria-owns` ancestor chain** 1,000 deep took 2.3 s. Pathological.
- **OP-4 remainder:** a variant's `normalTextRatio` above 21 (`22`, `1e308`) is accepted, so every text fails.
- **OP-5 remainder:** `surea11y-pack new --name=a --name=b` takes the last one silently.
- **Still open from round 4** (details in RECHECK.md): OP-P1, OP-P2, OP-P3, OP-P4, OP-P5, OP-P6, the SE strict whitespace inconsistency, and the Kelvin sign.
- **`link-in-text-block` on a link holding only an `aria-hidden` icon glyph** fails `COLOR_ONLY_DIFFERENTIATION`. This is debatable.
- **An SVG-namespace `<dialog>` is taken for an HTML dialog.** `<svg><dialog></dialog></svg>` fails `dialog-name-present` in Chromium, though Chromium has the element out of the tree (`notRendered`) and it is no dialog. Under jsdom it is `notApplicable`, or a fail with `open`. Rare markup, but it shows a namespace-blind tag check.
- **Harness note, not the engine:** after a script reads a jsdom tree node by node, `window.close()` can take 30 s on a 150 KB page (`fuzz/bisect-close.js`). The fuzz harness doesn't close those windows.

## What held up

- **Fuzzing (jsdom), ≈13,000 scans:**
  - 1,499 generated pages from `fuzz/gen5.js`, which is round 4's grammar plus 15 constructs for the new rules: `aria-owns` cycles and duplicates, `label[for]` targets, widgets and active descendants, `aria-expanded`/`aria-controls`, `aria-invalid`/`aria-errormessage`, inline `onfocus`/`onclick`, title-only names, live regions, animations and marquees, grid and treegrid cells, repeated `aria-labelledby` ids, conditional input roles, presentational headings, `hidden=until-found`/`content-visibility`/popover, and modal dialogs. Prototype names went into ids, roles, ARIA values, langs and tokens.
  - 400 fixture mutations, including prototype values in `id`, `lang`, `role`, `aria-owns`, `for`, `aria-errormessage`, `aria-live`, `headers` and `autocomplete`.
  - Per case: a profiled full scan, a second scan, the parity scan every 10th case, the full scan again with the DOM serialised before and after, 3 random rules each scanned alone, and a random ~20% subset of rules.
  - Locales en, de, es, fr and ja. `includeHiddenElements` on in 20% of cases, `includeShadowDom` off in 10%.
  - **No scan threw. Every result serialised. No outcome contradicted its tiers. No unfilled placeholder in any locale** (the 6 hits are German "Größe null", a false positive of the oracle). **The scan never changed the DOM**, light DOM, open and closed shadow roots included. **No result differed between the full scan, the rule alone, a random subset, and a second scan.** No case went over 90 s. The one timeout was the harness's `window.close()`.
- **jsdom vs Chromium parity:** 254 generated pages without shadow roots, non-layout rules, with styles stripped (`fuzz/parity5.mjs`; `fuzz/out-parity-*.jsonl`). 218 agree on every rule. Each of the 36 that differ, minimised with `fuzz/min-par5.mjs` (`fuzz/out-minpar.txt`) or classified by what it contains, comes down to one of these:
  - RB5-3 (`aria-labeledby`), 10 pages;
  - parser differences, not engine ones: Chromium's new `<select>` parser keeps elements inside `<select>` (14 pages), and jsdom, with scripting off, parses `<noscript>` content as markup;
  - the documented `<dialog open aria-modal>` difference (removed from the corpus after the first 40 seeds);
  - rendering, which jsdom lacks: text in an SVG `<title>`, content of a `<meter>`;
  - one lead below (an SVG-namespace `<dialog>`).
- **Prototype-named page values:** 32 places where a table is indexed by a page value × 9 names; only RB5-4. 20 lang values on `<html>` and on an element, × 4 titles; no errors and no weakened signals.
- **Speed fixes:** p-as-heading at depth 1600 takes 30 ms. Long values: 30 payloads at 80k characters, only RB5-6 over 300 ms.
- **Linear (jsdom 250 to 4,000):**
  - several labels per input;
  - `aria-labelledby` with 4,000 repeats of one id (88 ms), with n distinct ids, or as a chain n deep;
  - n invalid fields with messages;
  - n `role=button` without `tabindex`;
  - a listbox of n options with an active descendant;
  - n `onclick`/`onfocus` handlers;
  - n title-only buttons;
  - n labels for missing ids;
  - a live log of n entries, n live regions, n marquees;
  - n buttons controlling one panel, one button controlling n panels;
  - 4,000-cell grid and treegrid tables.
- **Linear (Chromium 1,000 to 10,000):**
  - 10,000 `addEventListener` listeners with the listener hook: 3.5 s, the same as without the hook;
  - the live-region hook recording a 10,000-entry log or 10,000 filled regions: 1.7 s;
  - a 10,000-cell grid: 2.1 s.
