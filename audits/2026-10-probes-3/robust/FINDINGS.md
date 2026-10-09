# Robustness and scale — findings

- **Engine code:** `eaa5d3f1`.
- **Browser:** Chromium, Playwright's headless shell 1234.
- **How the engine was run:**
  - In Chromium, the root `surea11y.browser.js` was injected and the scan run through CDP `Runtime.evaluate`, so pages that patch builtins can't break the driver.
  - In jsdom, through `src/testing.js` and `runDomRulesInPage` / `runa11yCoreInPage`.
- **Comparison bundle:** `@surea11y/core@1.10.0` from npm.
- **target-size-minimum:** out of scope for this round.
- **Probes:** in this folder as `pN-*.js`, with their output in `out-pN*.txt`. `harness.js` holds the shared runners.
  - `p02-legacy-libs.js` needs the five libraries in its header downloaded into `./vendor`.
  - `p11-scale.js` and `p18-bisect-contrast.js` need `SCRATCH` pointing at a folder with the 1.10.0 package at `pkg110/package`.
- **[V]:** reproduced by a second run. RB-1, RB-3 and RB-9 were re-run again during consolidation.

| ID | Title | Category | Severity | Runtime |
|---|---|---|---|---|
| RB-1 | A CSP that blocks inline styles turns text-spacing-content-loss from `cantTell` into a confident `pass` | false negative | medium | Chromium [V] |
| RB-2 | An occurrence's `#id` selector resolves to a hidden element with the same id (same root as OO-1) | bug | medium | both [V] |
| RB-3 | A button or link named only from a closed shadow root is a confident `fail` (Chrome names it) | false positive | medium | Chromium [V] |
| RB-4 | contrast-computable is 45–55% slower than in 1.10.0 on large pages; whole scans are 18–44% slower (same as CO-7) | perf | medium | Chromium [V] |
| RB-5 | Some throws or results from a custom or pack rule abort the whole scan | contract | low | both [V] |
| RB-6 | `packScript` writes unparseable code for some function shapes, and `checkPack` accepts them (same as PN-10) | bug | low | Node [V] |
| RB-7 | A pack or custom rule that changes `ctx.helpers` changes every later rule's results (same as PB-9) | contract | low | jsdom [V] |
| RB-8 | An element the UA stylesheet hides gets a different selector in jsdom and Chromium | contract | low | both [V] |
| RB-9 | text-spacing leaves its `!important` spacing stylesheet in the page when removing it throws | bug | low | Chromium [V] |
| RB-10 | Broken page builtins give silently wrong results, including an empty result | contract | low | Chromium [V] |
| RB-11 | Nothing bounds a scan's run time | feature | low | Chromium |
| RB-12 | Name from content through ~2,000 nested shadow roots overflows the stack | bug | low | Chromium [V] |
| RB-13 | The pack engine cache ignores changes to a pack object (same as PN-4) | contract | low | Node [V] |

## RB-1. A CSP that blocks inline styles turns text-spacing-content-loss into a confident `pass`

- **Repro:** `p07-text-spacing-csp-leftover.js`. Two boxes clip text that the extra spacing would push out.
- **Observed:**

| Page CSP | Outcome |
|---|---|
| none | `cantTell`, 1 occurrence |
| `style-src 'self'` | `pass`, 0 occurrences |
| nonce-only | `pass`, 0 occurrences |
| `default-src 'none'` | `pass`, 0 occurrences |

- **Expected:** `cantTell`, because the spacing was never applied. The engine can tell this: the `<style>` element's `sheet` holds no rules, and no computed `letter-spacing` changed.
- **Cause:** `src/checks/automatic/text-spacing-content-loss.js:549-560` inserts an inline `<style>` and measures again without checking that the style took effect.

## RB-2. An occurrence's `#id` selector resolves to a hidden element with the same id

- **Repro:** `p14-selector-hidden-dup-id.js`, with `<div hidden id="x">old</div><button id="x"></button>`.
- **Observed:**
  - `button-name-present` reports `#x`, which resolves to the hidden `<div>`.
  - The same happens when the other copy is inside a `display:none` container or a closed `<details>`.
  - `[data-testid]` and `[name]` anchors have the same problem.
- **Cause:** `createSelectorUniqIndex` (`src/core/dom-helpers.js:5182-5240`) counts over `queryAllSmart`, which drops hidden content (`:1593-1595`).
- **Why it matters:** responsive sites often keep a hidden copy of their navigation with the same ids.
- **Related:** the same root cause as OO-1.

## RB-3. A button or link named only from a closed shadow root is a confident `fail`

- **Repro:** `p09-shadow-names.js`, cases `closedShadowIcon`, `linkClosed` and `dsdClosed`.
  - Example: `<button><x-icon-closed></x-icon-closed></button>`, where the component attaches a closed root containing `<img alt="Save">`.
  - A declarative `<template shadowrootmode="closed">` behaves the same.
- **Observed:** `button-name-present` and `link-name-present` give `fail`. Chrome names them "Save" and "DSD closed".
- **Expected:** `cantTell` when content the engine can't read may supply the name. One signal is a defined custom element, or a host with a DSD template, that has no light children but has a rendered box.
- **Docs:** ENGINE_OPTIONS.md:321 says closed roots are unreachable, but not that naming rules then fail with confidence.
- **Who it affects:** frameworks with closed roots, such as native-shadow Lightning Web Components.
- **Open roots:** all 32 open-root cases matched Chrome.

## RB-4. contrast-computable is 45–55% slower than in 1.10.0 on large pages

- **Repro:** `p11-scale.js` (`REPS=2`, `profileRules`) and `p18-bisect-contrast.js`.

| Page | contrast-computable, head / 1.10.0 (ms) | Whole scan, head / 1.10.0 (ms) |
|---|---|---|
| 50,000 flat `<div>`s | 1,222 / 821 | 2,185 / 1,708 |
| 200,000 flat `<div>`s | 4,933 / 3,225 | 8,713 / 6,733 |
| 1,000 links over 400-span shadow cards | 10,682 / 7,440 | 21,139 / 14,752 |
| 300×100 table | 971 / 617 | 1,700 / 1,266 |
| 40,000 `<p>` | 998 / 820 | 1,565 / 1,328 |

- **Linear:** the cost grows linearly with page size, so this is a constant-factor slowdown, not a quadratic one.
- **Bisect** (contrast-computable on 50,000 divs):

| Commit | Time (ms) |
|---|---|
| `v1.10.0` | 865–908 |
| `6195c74d` | 867–941 |
| `b41cfe2d` (check only visible text) | 993–1,048 |
| `b8b3d747` (paint order) | 1,242–1,258 |
| `eaa5d3f1` (head) | 1,159–1,180 |

`9ee2455a` won back part of the cost.

- **Changelog:** the Unreleased CHANGELOG reports the paint-order check as faster, but compares it only with the earlier unreleased state, not with 1.10.0.
- **Related:** the real-page comparison (CO-7) found the same slowdown.

## RB-5. Some throws or results from a custom or pack rule abort the whole scan

- **Repro:** `p16b-customrules-containment.js`, and `p16-packs.js` part (d).
- **Cases that abort the scan:**
  - `throw { toString() { throw new Error('nested') } }`;
  - a result whose `outcome` getter throws;
  - a `Proxy` result whose getters throw.
- **Observed:** `runDomRulesInPage` and `runa11yCoreInPage` both throw, and no result comes back.
- **Expected:** `cantTell` with `error` for that rule only, as ENGINE_OPTIONS.md:469 promises for a throwing rule.
- **Cause:**
  - `String(err && err.message ? err.message : err)` at `src/core/dom-runner.js:1565` and `:1604` throws again.
  - `typeof result.then` (`:1615`) and `result.outcome` (`:1363`, `:1656`) are read outside a `try`.
- **Contained correctly:** plain throws, `throw null`, cyclic results, non-node occurrences, and 100,000 occurrences (204 ms).

## RB-6. `packScript` writes a script that doesn't parse for some function shapes

- **Repro:** `p16-packs.js` part (a).
- **Shapes that fail:** `(ctx, o = String(1)) => ...` and `fn.bind(null)`.
- **Observed:** `checkPack` reports 0 problems, but the script fails `new Function(...)`.
- **Cause:** `functionExpression` (`src/pack.js:678-685`).
- **Related:** the same issue as PN-10 / PB-4.

## RB-7. A pack or custom rule that changes `ctx.helpers` changes every later rule's results

- **Repro:** `p16-packs.js` part (b). A pack rule `acme-a` runs first, because ids are sorted.
- **Observed:**
  - Replacing the name helpers turns `button-name-present` and `img-alt-present` from `fail` into `pass`.
  - Replacing `queryAllSmart` turns them into `notApplicable`.
- **Cause:** the shared mutable `sharedHelpers` (`src/core/dom-runner.js:1062`, `:1507`).
- **Related:** the same issue as PB-9.

## RB-8. The same element gets a different selector in jsdom and Chromium when the UA stylesheet hides it

- **Repro:** `p13-selector-runtime.js`, `p12b-parity-detail.js`. The element is `<div id="c"><audio id="a1" autoplay src="x.mp3"></audio></div>`.
- **Observed:** `no-autoplay-audio` gives `#a1` in jsdom but `#c > audio` in Chromium. Chromium's UA stylesheet hides `<audio>` without `controls`.
- **Effect:** a baseline written from a jsdom scan won't match the same finding from a browser binding.
- **Cause:** the same as RB-2.

## RB-9. text-spacing leaves its spacing stylesheet in the page when removing it throws

- **Repro:** `p07-text-spacing-csp-leftover.js`, `p06-recovery-determinism.js`. The page's `Node.prototype.removeChild` throws on its first call.
- **Observed:**
  - The rule gives `cantTell` with an error.
  - `<style data-surea11y="surea11y-text-spacing">` stays in `<head>`, and the page keeps rendering with `!important` spacing (the `<h1>` measured 3.84px / 48px).
- **Cause:** the `finally` at `text-spacing-content-loss.js:561-566` calls `removeChild` once, with no fallback (`style.remove()`, or disabling `style.sheet`).

## RB-10. Broken page builtins give silently wrong results, including an empty result

- **Repro:** `p01-hostile-builtins.js` (57 variants), `p02-legacy-libs.js`.

| Page change | Effect |
|---|---|
| `Array.prototype.filter = function(){ return this }` | A well-formed result with `checksResults: []` and no error |
| `Object.prototype.then = function(){}` | All 134 rules give `cantTell` with "runInPage returned a Promise" |
| `getBoundingClientRect` or `getComputedStyle` throwing or returning garbage, `Number.isFinite` false, `querySelectorAll` throwing | contrast-minimum and contrast-enhanced go from `fail` to `notApplicable`, with no error |
| `Map.prototype.set`, `Array.prototype[Symbol.iterator]`, `JSON.stringify`, `Object.keys`, `Array.prototype.push` or `RegExp.prototype.exec` throwing | The whole scan throws |

- **Docs:** LIMITATIONS.md doesn't say the engine uses the page's own builtins.
- **Real libraries:** they held up (see "Held up"), so this needs a deliberately or badly broken page.

## RB-11. Nothing bounds a scan's run time

- **Repro:** `p04-custom-elements.js`, case `infiniteGetterOnOne`. One custom element's `shadowRoot` getter busy-waits for 3 s.
- **Observed:** the scan takes 9,024 ms because the getter is read 3 times. The control page takes 24 ms.
- **The gap:** no option bounds the time or lets a caller stop a scan. A getter that never returns blocks the tab for good. Only `waitForPageReady` has a `timeoutMs`.

## RB-12. Name from content through ~2,000 nested shadow roots overflows the stack

- **Repro:** `p11-scale.js` case `buttonOverNestedShadow2000`; `p17-name-depth-threshold.js`.
- **Observed:**
  - In a full scan, `button-name-present` gives `cantTell` with "Maximum call stack size exceeded". 1.10.0 didn't walk shadow roots, so it gave `fail`.
  - With only that rule selected, it passes up to 1,500 levels.
  - Chrome's own name is "" from 100 levels on.
- **Already in 1.10.0:** a button over 3,000 nested light-DOM spans overflows in both versions.
- **Cause:** recursion once per level (`collect` → `walkChildren` → `collectChild`, `dom-helpers.js:4558-4810`). `maxContentNodes` (5,000) caps the number of nodes visited, not the depth.

## RB-13. The pack engine cache ignores changes to a pack object

- **Repro:** `p16-packs.js` part (c). After a scan, adding a rule to the pack or replacing a rule's `runInPage` has no effect on the next scan.
- **Cause:** `preparePacks` (`src/pack.js:620-628`) keys its cache by object identity.
- **Related:** the same issue as PN-4.

## Round 2 items re-checked on current code

| Round 2 item | Status now |
|---|---|
| RB-1 (`<input name="parentNode">` hang) | Fixed: 24 ms, correct outcomes |
| RB-2 (named-property overrides) | Fixed: 142 names compared, with zero differences |
| RB-3 (image-redundant-alt quadratic) | Fixed: 2 / 3 / 4 ms at 2,000 / 4,000 / 8,000 images |
| RB-4 (selector building on wide siblings) | Fixed: 26 / 42 / 80 ms at 4,000 / 8,000 / 16,000 images |
| RB-5 (throwing `shadowRoot` getter) | Fixed |
| RB-7 (depth limit reported through `error`) | Still reproduces: a plain 250-deep chain gives `cantTell` with `error: "Ancestor walk hit its depth limit…"` (`p15-deep-nesting.js`) |

## Held up

- **Real libraries that extend builtins:** these gave results identical to a clean page:
  - Prototype.js 1.7.3 and 1.6.1;
  - MooTools 1.6.0;
  - Sugar 2.0.6 extended;
  - zone.js 0.14.4.
- **Polluted prototypes, also identical:**
  - `Object.prototype` polluted with common keys;
  - `Array.prototype.includes` patched to return true.
- **Other patched builtins with no effect:**
  - `contains` and `JSON.parse`;
  - `Date.now` returning NaN;
  - `Math.max` and `Math.min`;
  - `Promise` removed;
  - `CSS.escape` removed;
  - `elementFromPoint`, `focus` and `getAnimations`;
  - `defineProperty`, `Function.prototype.toString` and `localeCompare` throwing;
  - `console`, `Intl` and `structuredClone` removed.
- **Page state after a scan** (`p05`): these are unchanged:
  - outerHTML and shadow content;
  - scroll position;
  - focus and selection;
  - popover, dialog and details state;
  - stylesheets and computed styles.

  No events reached the page. The only mutations were the text-spacing `<style>` being added and removed.
- **Animation settling** (`p08`): moving animations to their end and back fires no end or finish events, and resolves no promises.
- **Determinism:** 5 scans in one tab gave identical digests.
- **Recovery:** after a builtin trap made a scan throw (16 builtins, at various call counts), the next scan equalled a fresh one every time.
- **DOM churn during a scan:** these caused no hang and no error:
  - MutationObserver and ResizeObserver;
  - focus handlers;
  - attributeChangedCallback and connectedCallback;
  - scroll and selection handlers.
- **Hostile custom elements:** getters that throw, and a lying `role` getter, left results unchanged.
- **Shadow DOM naming:** 30 of 33 cases match Chrome's accessibility tree. The 3 misses are RB-3.
- **`<a href role=X>`:** for 43 role values the engine agrees with Chrome. One gap is left: `role="listitem"` outside a list, which Chrome exposes as an unnamed link.
- **Layout variants** (`p19`) are consistent with Chrome's tree:
  - `content-visibility` and `hidden=until-found`;
  - zoom, scale, vertical writing and RTL;
  - sticky and fixed positioning;
  - dialog and popover;
  - opacity, clip-path and inert;
  - srcdoc frames.

  One difference: below-the-fold `content-visibility:auto` content, which Chrome marks ignored, is still checked.
- **jsdom vs Chromium parity over 141 fixtures:** only layout rules differ. The non-layout differences are:
  - RB-8;
  - `valid-lang` and `iframe-focusable-content`, one fixture each;
  - form-control-label-quality's clip-hidden labels.
- **Scale, head vs 1.10.0, apart from RB-4:**

| Page | Head (ms) | 1.10.0 (ms) |
|---|---|---|
| 20,000 mixed paragraphs | 4,551 | 6,197 |
| 20,000 `aria-labelledby` inputs | 6,003 | 7,103 |
| 20,000 headings | 1,038 | 1,315 |
| 5,000 shadow-icon buttons | 1,087 | 1,105 |
| 5,000 slotted components | 1,359 | 1,296 |
| 50,000-rect SVG | 782 | 735 |
| 10 MB text node | 932 | 990 |
| 500 srcdoc iframes | 33 | 31 |
| 5,000-deep span chain | 439 | 602 |

- **Problems that aren't the engine's:**
  - Chromium never finished laying out 600 or more levels of alternating div/span nesting, before any scan ran.
  - A page that builds 2,000 nested shadow roots at load crashed the renderer with either bundle.

## Missing tests

- text-spacing-content-loss under a CSP that blocks inline `<style>` (RB-1), and when removing its stylesheet fails (RB-9).
- Occurrence selectors when an id, `data-testid` or `name` is shared with a hidden element (RB-2), and for elements the UA stylesheet hides (RB-8).
- Naming rules over closed shadow roots, including declarative `shadowrootmode="closed"` (RB-3).
- Containment of custom and pack rules:
  - a non-Error throw whose `toString` throws, a result with throwing getters, and a Proxy result (RB-5);
  - a rule that changes `ctx.helpers` (RB-7).
- A Chromium performance guard for `contrast-computable` against the last release (RB-4).
- Name from content through deep shadow nesting in a full scan (RB-12).
- A page-state test in Chromium, as `p05-page-state.js` does.
