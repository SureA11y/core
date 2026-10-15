# Stress test 4: accuracy in Chromium (modern CSS and HTML)

Prefix **CH**. 5 confirmed bugs: 3 high-severity false fails, 1 medium false negative, 1 low false fail. No crashes.

**Setup**
- Engine: `surea11y.browser.js` at `3af2008`, run with `a11ycore.runa11yCoreInPage(location.href, null, {}, null)` under the default `strictConformance` contract unless noted.
- Browser: Chromium 141.0.7390.37 (launched with `executablePath: '/opt/pw-browsers/chromium'`).
- Ground truth: Chromium's accessibility tree (CDP `getPartialAXTree` / `getFullAXTree`) for names, roles and states; a full-page screenshot sampled per element for contrast.
- Scripts in this folder: harnesses `h.js`, `ch.js`, `th.js`, `nh.js`; contrast `c1`–`c7`; target size `t0`–`t3`; names and roles `n1`–`n6`. `verify-lead.js` re-runs CH-1 to CH-3 (re-run during consolidation: all three reproduce).

## Confirmed

### CH-1. `nested-interactive-controls-absent` fails every customizable `<select>` (false fail, high)
```html
<label>Fruit <select><button><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>
```
- **Observed:** `fail`, "This <select> has interactive controls nested inside it: button", with and without `appearance: base-select`.
- **Expected:** `pass`. Chromium exposes `combobox "Fruit"` and marks the `<button>` ignored (`inertElement`). This is the HTML spec's customizable-select markup; the button can't be focused, although `el.inert` is false and `tabIndex` is 0.
- **Where:** `src/checks/automatic/nested-interactive-controls-absent.js`, `collectNestedOperable` (l.260) and `isOperableInteractive` (l.216).
- **Fix:** in a `<select>`, skip its first-child `<button>` and the `<selectedcontent>` subtree, which the browser makes inert.

### CH-2. Names and states set through `ElementInternals` are ignored (false fail, high)
```html
<x-icon-btn role="button" tabindex="0"><span class="icon" aria-hidden="true"></span></x-icon-btn>
<x-icon-btn role="img"></x-icon-btn>
<x-icon-btn role="textbox" tabindex="0"></x-icon-btn>
<x-c role="checkbox" tabindex="0">Subscribe</x-c>          <!-- internals.ariaChecked='false' -->
<x-c role="slider" tabindex="0" aria-label="Volume"></x-c> <!-- internals.ariaValueNow/Min/Max -->
<script>customElements.define('x-icon-btn', class extends HTMLElement{constructor(){super();this.attachInternals().ariaLabel='Save';}});</script>
```
- **Chromium:** `button "Save"`, `image "Save"`, `textbox "Save"`, a checkbox with `checked=false`, a slider at 5 (0–10).
- **Engine fails:** `button-name-present` (when the host has a child), `role-img-text-alternative-present`, `textbox-name-present`, and `aria-required-attr` ("aria-checked is required", "aria-valuenow is required").
- **Partly covered already:** only a sized host with no children gets `cantTell`, through the closed-shadow heuristic `noteClosedContent` (`src/core/dom-helpers.js:4894`). Zero-size hosts fail `button-name-present` and `link-name-present`.
- **Where:** names come from attributes only, in `getAriaLabelInfo` / `getAriaLabelledByInfo` (`src/core/dom-helpers.js:889-922`); `aria-required-attr` reads attributes only (`src/checks/automatic/aria-required-attr.js:228`).
- **Fix:** a page script can't read internals. For a defined autonomous custom element (`customElements.get(localName)`) whose missing name or state could come from internals, report `cantTell` instead of `fail`, and list the case in LIMITATIONS.

### CH-3. ARIA element references set from script are ignored (false fail, high)
```html
<span id="lbl">Email address</span><input id="f"><button id="b"></button>
<script>f.ariaLabelledByElements=[lbl]; b.ariaLabelledByElements=[lbl];</script>
```
- Chromium reflects the attribute as `aria-labelledby=""` and exposes `textbox "Email address"` and `button "Email address"`. A reference from inside an open shadow root to a light-DOM label behaves the same.
- **Engine fails:** `form-control-programmatic-label-present` and `button-name-present`, including the shadow-root input.
- **Where:** `getAriaLabelledByInfo` (`src/core/dom-helpers.js:900-922`) and the id-reference index around l.1263.
- **Fix:** element reflection is Baseline 2025. When `el.ariaLabelledByElements` is non-empty, use it instead of the attribute; same for `ariaDescribedByElements`, `ariaControlsElements`, `ariaActiveDescendantElement`, `ariaOwnsElements`, `ariaErrorMessageElements`, `ariaDetailsElements`.

### CH-4. Text drawn only by a stroke or shadow passes contrast silently (false negative, medium)
```html
<body style="background:#fff">
<h2 style="color:transparent;-webkit-text-stroke:1px #ccc;font-size:32px">Outlined heading</h2>
<h2 style="color:#fff;-webkit-text-stroke:1px #ccc;font-size:32px">Outlined heading</h2>
<p style="color:transparent;text-shadow:0 0 0 #ccc">Shadow text</p>
<p style="color:#fff;text-shadow:1px 1px 0 #ccc">Shadow text</p>
```
- **Pixels:** `#ccc` glyphs on `#fff`, 1.61:1. **Engine:** `pass`, no occurrence.
- **Control:** with a fill just off the background (`#fafafa`) the engine gives the intended `cantTell` (`TEXT_STROKE` / `TEXT_SHADOW`).
- **Cause:** two shortcuts drop the text before the stroke and shadow checks: `isUndrawn` (`src/core/contrast-helpers.js:620-628`) treats a transparent fill as undrawn; `isSameColorAsBackground` (`src/core/contrast-helpers.js:746-761`, used at l.809 and l.861) treats a fill equal to the background as invisible.
- **Fix:** in both, count a visible stroke or shadow as drawn text, so it reaches the existing `cantTell`.

### CH-5. `link-in-text-block` fails links that draw no text (false fail, low)
```html
<p>Read the <a href="#z" style="color:#000;text-decoration:none"></a> now and also more words here.</p>
```
- **Observed:** `fail`, "relies on color alone". **Expected:** not applicable; nothing is drawn, and `link-name-present` already reports the real problem. The same wrong 1.4.1 fail fires for a custom-element link named through internals (CH-2).
- **Where:** applicability in `src/checks/automatic/link-in-text-block.js:818-829` never checks for visible text or a box.
- **Fix:** skip links with no rendered text and a zero-area box.

## Plausible leads
- **CH-P1. A drop-down `<select>` is measured by its options' colours, not what the closed control draws** (`c7.js`). `<select style="color:#000"><option style="color:#bbb">` is drawn black but fails at 1.92:1, even for options neither selected nor shown; a `#bbb` select with black options passes. Only the opened popup would justify the fail, and that is platform-dependent (Chromium on Linux and Windows paints option colours, the macOS native popup doesn't). Suggest measuring the select's own colour and reporting other options as `cantTell` ("shown only when open").
- **CH-P2. Generated text is never measured.** `::before`/`::after` `content` and `::marker` numbers always pass; one `::before` sample was 1.61:1 on screen. Neither LIMITATIONS nor LAYOUT_MEASUREMENT says so.
- **CH-P3. An animation paused by the author at `opacity: 0`** is measured at its end state and passes while the text is invisible. Edge case.
- **CH-P4. `img-alt-decorative` asks (`cantTell`) about an `<img>` inside `[inert]`**, which Chromium ignores and `img-alt-present` skips.

## Checked and correct
- **Contrast (against pixels):** `light-dark()` in both schemes; `color-mix()` in srgb and oklab, including a semi-transparent mixed background; relative colour syntax; `currentColor` chains; `-webkit-text-fill-color`; `prefers-color-scheme` under both emulations; root `color-scheme: dark`, `light dark`, `only dark` and `<meta name=color-scheme>` (measured on `#121212` in `auditorAssist`, `cantTell` in strict); ancestor opacity; `::selection`; input values; large-text thresholds in rem, em, `clamp()` and `cqi`, bold at 18 vs 19px; `zoom` on the element and an ancestor; animations, transitions, `@starting-style`, WAAPI fill and delay, `reverse both`; `content-visibility: auto` far down the page. `cantTell` by design, as expected: `mix-blend-mode`, `background-clip: text`, gradients, `filter`, `backdrop-filter`, `::first-letter`.
- **Target size:** inline-link exception; spacing exception including `scale(0.5)`; adjacent 16px targets; `scale(2)`; an open anchor-positioned popover; rotated targets; an open modal dialog (only its targets judged).
- **Names and roles:** `popovertarget` and `commandfor` buttons, named and empty; `<search>`; `<dialog closedby>`; `<details name>` with closed content excluded; `inert`; `hidden=until-found`; declarative shadow DOM, slotted and fallback names, a named-slot link, a label inside the shadow root; `aria-hidden` around a focusable control in a modal fails correctly, and content behind the modal is left out.
- **Frames:** `iframe-name-present`, `identical-iframes-same-purpose` (`cantTell`) and `iframe-focusable-content` behave on `srcdoc` and sandboxed frames. `runa11yCoreAcrossFrames` is not in the browser bundle, as INTEGRATION.md says.

## Improvements
1. **Plain pages get a lot of `cantTell`.** With no background on html or body, every text node is `cantTell` (`BACKGROUND_NOT_OPAQUE_AT_ROOT`), though Chromium paints a white canvas when no dark scheme is asked for. The engine already reads the dark canvas from a probe element; reading the light canvas the same way would clear this.
2. **Record `forced-colors` and `prefers-color-scheme` in `engine.environment`.** Under emulated forced colours the engine fails author colours that aren't on screen; correct for WCAG, confusing without a note.
3. **One inert exclusion for every rule**, as `img-alt-present` already has (CH-P4).
4. **LIMITATIONS entries** for internals-provided names, states and roles; generated `content` and `::marker` text; script-set element references (until CH-3 is fixed).
5. **Fix LAYOUT_MEASUREMENT's `<select>` line.** It says the shown option is not measured, but option colours are (CH-P1).
