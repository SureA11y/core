# Stress test 4: jsdom rule fuzzing

Prefix **FZ**. 7 confirmed bugs. None is a thrown scan exception or a scan-wide crash: they are rule errors, verdicts that depend on rule order, wrong selectors, and slowness. Engine 1.11.1 plus Unreleased at `3af2008`, jsdom 29.1.1.

## How it ran
- **Generated cases:** seeds 1..2500 from a seeded grammar-based HTML generator (`gen.js`): ARIA roles and attributes including invalid tokens, all HTML elements, SVG and MathML islands, bogus table spans, circular `for`/`aria-labelledby`/`aria-owns` graphs, odd ids, `lang` values, odd inline CSS, template/slot, custom elements with open and closed shadow roots, dialogs, details, `srcdoc` iframes, huge text and deep nesting. 2,497 completed; 3 went over the 90 s per-case budget (seeds 144 and 526 are FZ-3; seed 1926 is jsdom spending 87 s setting a 105 KB `shadowRoot.innerHTML` in the harness, the scan itself takes 2.8 s).
- **Fixture mutations:** seeds 1..800 over the 137 fixtures (attributes dropped, duplicated, swapped or moved; values like `__proto__` or 3,000 characters). All completed.
- **Per case:** a full scan with perfStats and profileRules, then a second scan on a fresh parse for determinism; every 10th case also compares the two entry points. Locales rotate en, de, es, fr, ja; 20% of cases use `includeHiddenElements: true`, 10% `includeShadowDom: false`.
- About 7,000 full scans, plus scaling, deep-nesting, long-string (ReDoS) and prototype-key probes, and Chromium cross-checks through `surea11y.browser.js`.
- **Clean across the run:** no thrown scan exception; every result JSON-serialisable (no NaN, Infinity or functions); no outcome/tier contradiction; no unfilled `{{placeholder}}`, `undefined`, `NaN` or `[object Object]` in any locale (the one hit, German "Größe null", is the oracle's false positive).
- Scripts in this folder: harness `gen.js`, `check.js`, `worker.js`, `runner.js`, `agg.js`; minimisers `minimize.js`, `min-*.js`, `tokmin.js`; probes `scale.js`, `deep*.js`, `redos.js`, `proto.js`, `langproto.js`, `browser.js`, `bperf.js`, `pair.js`. `verify.js` re-runs FZ-1 and FZ-3 (re-run during consolidation: both reproduce). Raw `out*/` results are not kept.

## Confirmed

### FZ-1. `lang="constructor"` or `lang="__proto__"` breaks 4 rules and silently weakens 3 more (medium)
```html
<!doctype html><html lang="constructor"><head><title>Cats and dogs</title></head><body><main><h1>Overview of cats</h1><label for=i>Your name</label><input id=i><a href=/x>Cat food guide</a><img src=a.png alt="image"></main></body></html>
```
- **Error out:** `form-control-label-quality`, `heading-quality`, `link-name-quality`, `page-title-patterns` give `cantTell` with no occurrences and an error such as `byLang[lang].has is not a function` or `GENERIC_TITLES[pageLang].has is not a function`. Expected: the language read as unknown, as `lang="xx"` is.
- **Lose signals silently:** `img-alt-quality`, `area-alt-quality`, `input-image-alt-quality` drop their placeholder and redundant-prefix signals (`alt="image"` gets `placeholder` under `lang="en"`, nothing under `lang="constructor"`).
- Fixture mutations hit it too (contrast-all-scenarios, mutation seeds 30, 75, 188).
- **Cause:** word lists are plain objects indexed by a page-controlled value: `src/checks/manual/link-name-quality-manual.js:267`, `heading-quality-manual.js:267`, `form-control-label-quality-manual.js:306`, `page-title-patterns-manual.js:329` and `:332`, and `src/core/dom-helpers.js:4229` (`textAlternativeWordsFor` spreads `Object`).
- **Fix:** look up with `Object.prototype.hasOwnProperty.call`, or build the tables with `Object.create(null)` or as a `Map`.

### FZ-2. Results depend on rule order when aria-hidden content has aria-labelledby/describedby cycles (medium)
```html
<!doctype html><html><body aria-hidden="true"><dl id="d" role="rowgroup" aria-labelledby="b">I</dl><area id="a"><input aria-labelledby="c" id="b"><input aria-labelledby="x a" id="c"><span id="x" aria-labelledby="d">T</span></body></html>
```
- `aria-required-children`: alone `cantTell #d`, in a full scan `notApplicable`; it also flips with profileRules. `area-alt-present` and `area-alt-quality`, which run earlier, change the cached answer.
- A second case (gen seed 2271) flips `aria-braille-equivalent` between `cantTell` and `pass`: light DOM `<body aria-hidden="true"><x-card aria-braillelabel="tree"></x-card>T</body>`, open shadow root `<h3 id="lbl"></h3><form id="lbl" role="definition" aria-describedby="id2"><input aria-labelledby="id2 lbl" id="id2"></form>`.
- Expected: the same verdict alone as in a full scan, the invariant `tests/determinism.test.js` asserts.
- **Cause:** `isReferencedByVisibleIdRef` (`dom-helpers.js:1312`) cuts cycles through `__idrefInProgress`; the provisional "not eligible" answer from inside the cycle is cached by `__cacheAndReturn` (~l.2441), so whichever element is asked first decides for the rest.
- **Fix:** don't cache while `__idrefInProgress.size > 0` (simplest), or work out idref eligibility once per scan over the whole reference graph.

### FZ-3. p-as-heading is super-linear in nesting depth under jsdom (medium, performance)
`<main>` + N nested `<div>`s around `x`:

| Depth N | p-as-heading |
|---|---|
| 100 | 0.85 s |
| 200 | 3.0 s |
| 400 | 19.5 s |
| 800 | 131 s |

- At N=800, computing every element's style up front takes 1.4 s; in Chromium the rule takes 63 ms. It was the top rule in all 22 fuzz cases slower than 8 s (up to 38 s) and in both engine-caused timeouts.
- **Cause:** `isCandidate` in `src/checks/manual/p-as-heading-manual.js` calls `dom.querySelector(el, NOT_INLINE)` with a 45-selector list once per `div`; nwsapi spends 18.8 s on 400 such calls in a microbenchmark.
- **Fix:** an early-exit walk over descendants, checking tags against a `Set`.

### FZ-4. A closed `[popover]` isn't treated as hidden; under jsdom the verdict depends on rule order (low–medium)
```html
<!doctype html><html lang=en><head><title>t</title></head><body><main>L<a href="#" popover><img></a></main></body></html>
```
- jsdom: `link-name-present` fails; `img-alt-present` fails in a full scan but is `notApplicable` alone and flips with profileRules (about 30 rules changed this way in gen seed 93). jsdom reports `display` of `a[popover]` as `inline` at first and `none` once another element's style has been computed.
- Chromium: neither finding (the popover is `display:none`). Expected: not applicable inside a closed popover.
- **Fix:** in `isAccTreeEligible`'s ancestor checks (`dom-helpers.js` ~2473 and its twin ~2837), treat an element with `popover` that doesn't match `:popover-open` as hidden. Mention it in LIMITATIONS.

### FZ-5. When the selector check fails, the fallback can name the wrong element (low–medium, triggered under jsdom)
- `<svg><foreignObject><p id="dup">a</p><p id="dup">b</p></foreignObject></svg>`: both occurrences get `#dup`, so the second resolves to the first `<p>`. `<div id="a\b"><h5 id="dup">H</h5><p id="dup">x</p></div>`: same. Without a duplicate id these elements get a bare `div` or `img`.
- About 40 occurrences across 20+ seeds and 2 fixture mutations: duplicate-id, the contrast rules, aria-prohibited-children, option-name-present, region, button-name-present.
- Chromium builds the right path (`svg > foreignobject > p:nth-of-type(2)`, `#a\\b > p`).
- **Cause:** `buildSelectorUncached` (`dom-helpers.js` ~5478–5741) checks its path with `matches()`, which nwsapi gets wrong for a lowercased SVG tag (`foreignobject`) and an escaped backslash in an id. The fallback `buildSimpleSelector` (5405–5428) then returns `#id` without checking it is unique, or a bare tag.
- **Fix:** in the fallback, use `#id` only when `idx.idCount === 1`, otherwise return the unchecked path (still exact in a browser); keep the case of SVG and MathML tag names (`localName`).

### FZ-6. Quadratic regexes on long attribute and text values (low; a hostile page could stall a scan)

| Location | Payload | ~10–20k chars | 40k | 80k |
|---|---|---|---|---|
| `autocomplete-valid.js:140,214`, whitespace trim `/^[ws]+\|[ws]+$/g` | `"a"` + spaces + `"!"` | 0.48 s (20k) | 1.5 s | 7.3 s |
| `page-title-patterns-manual.js:342`, unanchored `.+\s*(sep)\s*\b(home…)\b` (and the split at :334) | any long title | ~1 s (20k) | 4.5 s | 18.9 s |
| `dom-helpers.js:4194` `TA_GENERATED_NAME_RE`, `\d{3,}[\d _-]*$` | `IMG_` + digits + `.jpgx` | 0.22 s (10k) | 1.7 s | – |
| `dom-helpers.js:4209` `stripTrailingPunctuationTA`, `/[…]+$/g` | `a` + dots + `x` | 0.13 s (10k) | 1.8 s | – |

- The same trailing-run pattern is in `heading-quality-manual.js:244` and `form-control-label-quality-manual.js:283`.
- **Fix:** trim with loops; anchor the title pattern with `^`; rewrite the digit tail as `\d{3,}(?:[ _-]+\d*)*$`; or cap input length before matching.

### FZ-7. The testing helper reports false entry-point disagreements, and a second scan of the same jsdom DOM under-reports contrast (low–medium)
```html
<!doctype html><html lang=en><head><title>t</title><style>*{color:#777;background:#888}</style></head><body><main><p style="background-image:url(hero.png)">Hello</p></main></body></html>
```
- First scan: `contrast-computable cantTell` (text over an image), as in Chromium. Second scan of the same DOM: `pass`. So `@surea11y/core/testing`'s `runa11yCoreOnHtml` / `runa11yCoreOnDom`, which run both entry points on one DOM, throw `AssertionError … contrast-computable: runDomRulesInPage and runa11yCoreInPage disagree` (gen seed 930).
- **Cause:** a jsdom bug: a fresh `getComputedStyle` reports `background-image: none` on the second read when an inline `background-image` overrides a stylesheet `background` shorthand. Same family as the text-shadow quirk LIMITATIONS lists. The per-scan cache protects one scan, not a second.
- **Fix:** cache the first background-image read per element across scans, as `__textShadowInfoEl` does; give the parity run in `src/testing.js` its own parse; document the quirk in LIMITATIONS.

## Plausible leads
- **FZ-P1. Hidden content referenced by an idref still gets structure checks.** An element inside an aria-hidden subtree referenced by `aria-labelledby` (even through a chain) is still judged by structure rules: `<div aria-hidden="true"><div role="list" id="l">I</div></div><input aria-labelledby="l">` makes aria-required-children `cantTell` on the hidden list. The idref exception exists for name computation; applying it to these rules, and transitively, looks unintended.
- **FZ-P2. Shadow-root selectors.** A selector for a top-level element of a shadow root (`math`, `img`, `track`) isn't pinned to the root, so `shadowRoot.querySelector` can return an earlier, deeper match (seen 8 times). The docs list this as a known ambiguity; a `:not(* *)` prefix on the first step would fix it.

## Improvements (performance, jsdom)
- Totals scale linearly for 23 breadth patterns. Apparent super-linear rules in single runs didn't reproduce when timed alone at 800/1600/3200 (aria-allowed-attr 127/158/688 ms, landmark-main-is-top-level 432/427/687 ms).
- aria-prohibited-children / aria-required-children on an 800-deep `role="list"` chain: 4.7 s and 2.4 s.
- contrast-computable is the largest single rule cost on wide pages, about a quarter of rule time: a `<select>` with 20k options, 23 s total, 4.8 s contrast-computable; 20k spans, 33 s total, 4.2 s plus 2.8 s in contrast-enhanced. Skipping `<option>` elements for contrast would help.
