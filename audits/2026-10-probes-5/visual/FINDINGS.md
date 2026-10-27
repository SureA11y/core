# Visual probe (VI): contrast, layout and visual rules in Chromium

Target `c528af08`, browser bundle, Chromium 153 with `--force-color-profile=srgb`. Ground truth is pixels: screenshots decoded by `png.mjs` (zlib). `regionStats` takes the background as the most common colour, and the ink as the colour with the highest ratio against it. Run `node cases.mjs ./findings-cases.mjs` (engine + pixels), plus the `t-*.mjs` scripts named per finding. Every repro was run twice with identical results.

| id | finding | verdict | severity |
|---|---|---|---|
| VI-1 | Native drop-down `<select>` measured on its computed `#efefef`; Chromium paints the field white | Bug | Medium |
| VI-2 | Customizable select without an author `<button>`: the closed control's text is never measured | Gap | Low |
| VI-3 | `background-clip: text` over a solid colour fails at 1:1 | Bug | Medium |
| VI-4 | `text-spacing-content-loss` mixes zoomed and unzoomed units | Bug | Medium |
| VI-5 | Forced colors: the page's forced-colors rules and system colours still apply | Bug | Low |
| VI-6 | `looksLikeLogo` false positives; `logoText: 'exempt'` drops real failures | Bug | Medium (variant) / Low (hint) |
| VI-7 | 2.5.8's inline exception applied to links only | Bug | Medium |
| VI-8 | A lock in a sheet `@import`ed by a CORS cross-origin sheet passes | Bug | Medium |
| VI-9 | Adopted and shadow-root style sheets are not read | Gap | Low |
| VI-10 | `css-hidden-focus` misses `scale(0)`, `overflow-x: clip` and `!important` hiding | Gap | Low |
| VI-11 | `css-hidden-focus` asks about `&:focus` and `:has(:focus)` rules | Inconsistency | Low |
| VI-12 | Text moved off the page by `text-indent` fails contrast | Bug | Low |
| VI-13 | Large text judged by computed `font-size` despite `font-size-adjust` | Debatable / Gap | Low |
| VI-14 | LAYOUT_MEASUREMENT.md still says placeholders are always cantTell | Bug (docs) | Low |

## VI-1: Native drop-down select measured on `#efefef`; Chromium paints it white

Repro: `<style>body{font:16px Arial;background:#fff} #a{color:#767676}</style><label>Country <select id=a><option>First choice</option><option>Second</option></select></label>`

- **In plain words:** 1b262e67 uses the select's computed `background-color` (ButtonFace, `#efefef`). While only color, padding, width or outline are styled, Chromium draws the native field white (`t-select-scope.mjs`: centre pixel 255,255,255). With `border-radius` or a `background-color` set, `#efefef` is painted and the engine is right.
- **Painted:** `#767676` on `#fff` = 4.54 (pass). **Engine:** fail 3.95 (`#767676`/`#efefef`).
- Wrong fails for painted 4.5 to ~5.17 (3 to 3.45 for large text, 7 to 8.05 for AAA); every unstyled select reports a wrong ratio.
- **Spec:** WCAG 1.4.3 "The visual presentation of text … has a contrast ratio of at least 4.5:1". **Docs:** LAYOUT_MEASUREMENT.md "measured as the closed control draws it".
- **Cause:** `src/core/contrast-helpers.js:919` (`__closedSelectTextOwner`, `:501`) takes the select's computed background.
- **Verdict:** Bug. **Severity:** Medium.

## VI-2: base-select: the closed control's own text is never measured

- **Repro:** `#a,#a::picker(select){appearance:base-select} #a{color:#aaa}` with no author `<button>`. Painted `#aaa` on `#fff` = 2.32.
- **Engine:** pass. Its 2 "eligible text nodes" are the closed picker's options (0×0, `checkVisibility` false, computed black). With `<button><selectedcontent>` the button is measured.
- **Docs:** "the button of a customizable select by its own text".
- **Cause:** `contrast-helpers.js:441-443` excludes base-select; nothing measures the UA button.
- **Verdict:** Gap. **Severity:** Low.

## VI-3: `background-clip: text` over a solid colour fails at 1:1

- **Repro:** `#a{background:#000;-webkit-background-clip:text;background-clip:text;color:transparent;font-size:32px}` on a white page.
- Painted `#000`/`#fff` = 21; **engine:** fail "1.00 (#000/#000)". `background-color:#222` with `-webkit-text-fill-color:transparent`: painted 15.9, engine fail 1.00. A white clip on a black page: painted 21, fail. A true failure (`#ddd`, 1.36) is reported as 1.00.
- **Docs:** the comment at `contrast-helpers.js:686-690` says such text is asked about by the computability check.
- **Cause:** `contrast-helpers.js:718-723` keeps the text; `getComputabilityBlocker` (`:3979`) has no `background-clip: text` case, so the solid layer becomes the background.
- **Verdict:** Bug. **Severity:** Medium.

## VI-4: `text-spacing-content-loss` mixes zoomed and unzoomed units

- **Repro:** a 200×40 box with `overflow:hidden`, holding 2 lines. With no zoom: cantTell `TEXT_CLIPPED_PARTLY`, 4px.
- `html{zoom:.8}` or `transform:scale(.8)`: the pixels show the same cut (line rect 27.6 to 42.6 against a box bottom of 38.4, ink band cut), but the engine gives **pass**, with margin "-3.8 inside".
- `zoom:2` or `scale(2)`: **notApplicable**.
- `html{zoom:1.25}` with auto-height `overflow:hidden` clearfix wrappers: nothing is lost, yet the engine gives **cantTell** `TEXT_CLIPPED_FURTHER`, "shows 0 of the 1 lines".
- **Spec:** WCAG 1.4.12 "No loss of content or functionality occurs by setting all of the following".
- **Cause:** `text-spacing-content-loss.js:687-699`: `boxOf` takes `clientWidth`/`clientHeight` (unzoomed) while Range rects are visual. This feeds `visibleBefore` at `:729-745`.
- **Verdict:** Bug. **Severity:** Medium.

## VI-5: Forced colors: results differ from forced colors off

- **Repro:** `.badge{background:#f80;color:#fff} @media (forced-colors: active){.badge{background:Canvas;color:CanvasText}}`: off = fail 2.39; forced = pass. `p{color:GrayText}`: off = fail 3.95; forced = pass. Plain colours are identical.
- **Docs:** LAYOUT_MEASUREMENT.md "a page scanned with forced colors on gives the same outcomes, ratios and occurrences as with them off".
- **Cause:** `dom-runner.js:1137` adds only `forced-color-adjust:none`; the media query and system colours stay forced.
- **Verdict:** Bug. **Severity:** Low.

## VI-6: `looksLikeLogo` false positives; the `logoText: 'exempt'` variant drops real failures

- **Repro:** all `#aaa` on white (2.32). Flagged as logos:
  - `<button class="btn btn-brand">Buy now`;
  - `<p class="text-brand-500">`;
  - text inside `section.brand-story`, 6 levels up;
  - `<header><nav><a href="/">Home`;
  - `<header><a href="/fr/">Français`;
  - `div.marca-agua p`.
- A pack variant with `logoText: 'exempt'` (`t-variant.mjs`, packScript) passes them all; core's default fails them with the logo hint.
- **Spec:** 1.4.3 "Text that is part of a logo or brand name has no contrast requirement."
- **Cause:** `contrast-helpers.js:3850-3910`: `brand` is matched as any class word, the ancestor walk goes 7 levels up, and a home link of any text counts.
- **Verdict:** Bug. **Severity:** Medium for the variant, Low for the default hint.

## VI-7: The inline exception covers links only

- **Repro:** `<p style="font-size:12px">Choose <button>yes</button>/<button>no</button> for this sentence of text.</p>` (buttons styled as links).
- **Engine:** fail, undersized and too close; the same page with `<a>` passes.
- **Spec:** 2.5.8 Inline: "The target is in a sentence or its size is otherwise constrained by the line-height of non-target text".
- **Cause:** `target-size-minimum.js:253-262` `isInlineLinkTarget` (`a[href]` / `role=link` only), used at `:288`. The documented scope, "a link in a sentence", is narrower than the SC.
- **Verdict:** Bug. **Severity:** Medium.

## VI-8: A lock in a sheet `@import`ed by a CORS cross-origin sheet passes

- **Repro:** page on 127.0.0.1; `imp.css` on localhost, served with `Access-Control-Allow-Origin: *`, holds `@import lock.css` (the portrait `rotate(-90deg)` lock). The page really is rotated: html transform `matrix(0,-1,1,0,0,0)`.
- `preloadStyleSheets` returns only `imp.css`, whose text is just the `@import`. **Engine:** pass.
- **Docs:** CHANGELOG "fetches … every such sheet the server shares (CORS), linked or imported"; the rule: "One still unreadable makes a result with no lock cantTell".
- **Cause:** `stylesheet-preload.js:39-55` follows `@import` only in readable sheets; `css-orientation-lock.js:445-460`. Scripts: `t-xorigin*.mjs`.
- **Verdict:** Bug. **Severity:** Medium.

## VI-9: Adopted and shadow-root sheets are not read

- **Repro:** a lock in `document.adoptedStyleSheets` gives `css-orientation-lock` notApplicable. A skip link whose `:focus{top:0}` is in an adopted sheet, or in a web component's shadow `<style>` or adopted sheet, gives `css-hidden-focus` cantTell, though it shows on focus.
- **Cause:** `css-hidden-focus-manual.js:354` and `css-orientation-lock.js:445` walk `document.styleSheets` only.
- **Verdict:** Gap. **Severity:** Low.

## VI-10: `css-hidden-focus` misses (checked by pressing Tab, `t-focusvis.mjs`)

- `nav{transform:scale(0)}`: links are focused at 0×0, engine notApplicable.
- A slide past an `overflow-x:clip` track: focused but clipped, notApplicable.
- `.skip{position:absolute!important;top:-40px!important} .skip:focus{top:0}`: stays off-screen, notApplicable.
- **Spec:** 2.4.7.
- **Cause:** `focusedVisibilityHints` (~`380-401`) ignores the priority of the hiding rule; the container hints don't cover scale or clip.
- **Verdict:** Gap. **Severity:** Low.

## VI-11: `css-hidden-focus` asks about content brought into view by `&:focus` or `:has(:focus)`

- **Repro:** `.skip{position:absolute;top:-40px; &:focus{top:0}}` and `body:has(nav a:focus) nav{transform:none}` are both visible on focus, yet the engine gives cantTell.
- Un-nested rules, `:focus-visible`, `:is`, `:where`, `@media` and `@layer` all work.
- **Cause:** `css-hidden-focus-manual.js:340-343` does not walk rules nested in a style rule.
- **Verdict:** Inconsistency. **Severity:** Low.

## VI-12: Text moved off the page by `text-indent` fails contrast

- **Repro:** `#a{text-indent:-9999px;color:#eee}` (own text), and the same on `::before`. The pixels over `#a` are all white; the engine fails it at 1.16.
- **Spec:** 1.4.3 Incidental, text "not visible to anyone … no contrast requirement".
- **Cause:** `contrast-helpers.js:715-760`: `isUndrawn` uses the element's box, not the text's line rects.
- **Verdict:** Bug. **Severity:** Low.

## VI-13: Large text judged by computed font-size despite `font-size-adjust`

- **Repro:** `font-size:24px;font-size-adjust:0.3;color:#949494`. The cap height painted is 9px, as for 14px Arial, yet the engine counts it as large text and passes it at 3.03.
- **Understanding 1.4.3:** "The actual size of the character that a user sees…".
- **Verdict:** Debatable / Gap. **Severity:** Low.

## VI-14: Docs: placeholders

- LAYOUT_MEASUREMENT.md, "Form fields", says a placeholder below its ratio is cantTell "whoever chose its colours".
- The rule and the CHANGELOG fail page-chosen colours (`c-ph.mjs`). The engine's values match the pixels (`t-ph.mjs`).
- **Verdict:** Bug (docs). **Severity:** Low.

## Leads

- `::first-line` / `::first-letter` colours are asked about (`PSEUDO_ELEMENT_COLOR`) though Chromium computes them; painted 1.92.
- `open-quote` text is not counted as generated text.
- A visually-hidden box without `clip` (1px, `overflow:hidden`) fails contrast.
- `moving-content-pausable`:
  - counts the delay as movement;
  - asks about `playbackRate` 0 and about off-screen or 0×0 elements;
  - SMIL and animated GIFs are not seen, and that is undocumented.
- The margin's closest text is picked by absolute headroom across sizes (documented).
- A transparent iframe over a dark parent is cantTell (documented).
- Broken-image alt text is not measured.
- TS5 returns notApplicable instead of pass (cosmetic).

## What held up

About 300 cases:
- generated text: 45;
- canvas and colour scheme: 25, every ratio equal to the pixels;
- placeholders: 20;
- background layers: 21;
- stroke and shadow: 16;
- blend, filter and colour syntax: 18;
- large-text thresholds: 20, exact at 24px and 18.67px bold, with `zoom`, `clamp()` and `cqi`;
- margin bands: every boundary as the CHANGELOG says, for contrast, `link-in-text-block`, target size and text spacing;
- target size: 14;
- text spacing: 11, including the cookie-banner `body{overflow:hidden}` case;
- `css-hidden-focus`: 31, off-canvas menus and skip links included;
- `moving-content-pausable`: 24, reduced motion, scroll timelines and marquee included;
- orientation lock: 13;
- plain forced-colour pages.
