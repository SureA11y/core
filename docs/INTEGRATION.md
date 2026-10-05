# Integration guide

surea11y/core is a library, not a CLI or a service — you call it from your own Node script, test suite, or browser-automation code. This page covers the real ways to run it, plus how to wire it into CI.

## Which runner function to use

The first two take the same four arguments — `(pageUrl, contextSelector, engineOptions, runOnly)` — and return the same result shape (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)). They differ only in *where* they can run:

| Function | Use when | Why |
|---|---|---|
| `runDomRulesInPage` | Calling directly in the same Node process where you `require('@surea11y/core')` | Normal function call — references the module's own closures (`CHECK_DEFS`, rule implementations, etc.) directly. |
| `runa11yCoreInPage` | Handing the function itself to a *different* JS realm — most commonly Puppeteer/Playwright's `page.evaluate` | Fully self-contained: its entire body (rule catalog, implementations, shared helpers) is inlined, so `fn.toString()` + re-evaluating that source in a browser tab (which has no access to your Node module scope at all) still works. Verified by `tests/runa11yCoreInPage-serialization.test.js`, which literally does this — reconstructs the function from source in a separate VM realm and runs it. |
| `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder` | Same context as `runa11yCoreInPage` (browser extension / content script / bundled widget code — no automation driver), when you also need to reach into `<iframe>`s | See "Cross-frame scanning" below — a separate, async pair of functions, not a variant of the other two. |

Both of the first two need a real `document`/`window` to already exist in whatever context they run in — neither runner creates one. That's the actual fork in the two patterns below.

## Pattern 1 — jsdom in Node (no real browser)

Good for: server-rendered HTML, static files, CI without a browser dependency, unit-testing components.

```js
const { JSDOM } = require('jsdom');
const { runDomRulesInPage } = require('@surea11y/core');

const html = '<!doctype html><html><body><img src="logo.png"></body></html>';
const dom = new JSDOM(html, { url: 'https://example.com/', pretendToBeVisual: true });

// The runners read `document`/`window` as ambient globals, not as parameters.
global.window = dom.window;
global.document = dom.window.document;

const result = runDomRulesInPage('https://example.com/', null, {}, null);

console.log(result.checksResults.filter((r) => r.outcome === 'fail'));

dom.window.close();
```

`pretendToBeVisual: true` matters — it's what makes jsdom compute *something* for `getComputedStyle` (needed by the contrast rules and anything checking computed layout properties). Note jsdom has no real CSS layout engine — see [`LIMITATIONS.md`](./LIMITATIONS.md) for what that rules out entirely (e.g. `target-size-minimum` needs real `getBoundingClientRect()` and will report `notApplicable` under plain jsdom).

## Pattern 2 — a real browser via Puppeteer or Playwright

Good for: fully-rendered pages (client-side-rendered apps, real CSS layout/paint), testing your actual production site, anything Pattern 1's jsdom limitations rule out.

```js
// Puppeteer
const puppeteer = require('puppeteer');
const { runa11yCoreInPage } = require('@surea11y/core');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com/');

const result = await page.evaluate(
  runa11yCoreInPage,   // page.evaluate serializes this function and runs it inside the page
  'https://example.com/',
  null,                 // contextSelector
  {},                   // engineOptions
  null                  // runOnly
);

console.log(result.checksResults.filter((r) => r.outcome === 'fail'));
await browser.close();
```

```js
// Playwright — NOT the same shape as Puppeteer. Playwright's page.evaluate(fn, arg)
// only ever accepts ONE arg value; page.evaluate(fn, a, b, c, d) throws
// "Too many arguments. If you need to pass more than 1 argument to the
// function wrap them in an object." (confirmed against a real Playwright
// page — this is not a theoretical distinction). Since runa11yCoreInPage
// itself takes 4 positional arguments, wrap it in a single-arg function
// that destructures one options object, embedding runa11yCoreInPage's own
// source via .toString() so the wrapper is still fully self-contained once
// serialized into the page (the same technique used by this project's
// internal live-DOM comparison tooling, maintained outside this repo).
const wrapperSource = `(args) => {
  const runa11yCoreInPage = ${runa11yCoreInPage.toString()};
  return runa11yCoreInPage(args.url, args.contextSelector, args.engineOptions, args.runOnly);
}`;
// eslint-disable-next-line no-eval
const wrapperFn = eval(wrapperSource);

const result = await page.evaluate(wrapperFn, {
  url,
  contextSelector: null,
  engineOptions: {},
  runOnly: null
});
```

This is the only pattern that gives every rule real computed layout, so it's the one to reach for if you need `target-size-minimum` or any other geometry-dependent check to actually run instead of reporting `notApplicable`.

## Pattern 3 — a standalone `<script>` tag (no driver, no bundler)

Good for: a manual check against a page open in a real browser, a bookmarklet, or any other context where there's no automation driver and no build step to reach for.

`@surea11y/core` ships `surea11y.browser.js` at the package root, a bundle generated from the same rule sources as `src/core.js`. Loading it directly defines one global, `a11ycore`:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
  console.log(result.checksResults.filter((r) => r.outcome === 'fail'));
</script>
```

`a11ycore.runa11yCoreInPage` is the exact same function described in Pattern 2 above — the bundle exists only to solve *loading* it without `require`/a module system, not to add a separate API surface. It carries the same self-containment property (own inlined rule catalog, no free variables), which is what makes a plain `<script>` tag sufficient.

### Scanning in a language other than English

The bundle carries English only. Every other locale ships beside it as its own file — load one after the bundle and that language becomes available:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script src="node_modules/@surea11y/core/surea11y.i18n.de.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, { locale: 'de' }, null);
</script>
```

Load as many as you need; each adds one language and they don't interfere. Order matters only in that the bundle has to come first — a side file loaded on its own throws with a message saying so.

Ask for a locale whose file you haven't loaded and you get English, not an error, with `result.engine.locale.reason` set to `dictionary-not-loaded` so it's visible rather than silent. See [`I18N.md`](./I18N.md).

Why the split: the bundle is fetched over the network, and every language would otherwise be paid for by every page whether used or not. Keeping English inline and the rest optional took roughly 280 KB off the download and stops it growing as languages are added. The Node package is unaffected — `require('@surea11y/core')` still has every locale built in.

If you'd rather supply a dictionary yourself, `engineOptions.messages` takes `{ [locale]: { key: value } }` directly and wins over a loaded side file.

### What the bundle leaves out

Deliberately excluded: `runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder`. Cross-frame scanning needs the embedded frame to load the engine and opt in too (see "Cross-frame scanning" below) — not a fit for a single dropped-in script tag. Use the npm package directly if you need it.

## Waiting for the page before a scan

A scan reads the page as it is at that moment. On a page that has just opened, web fonts may still be loading and images may not have arrived, and layout rules measure what is on screen: text in a fallback font, boxes that change size when their image lands. The same page scanned a second later can give another result. The scan records this in `engine.environment.fonts` and `.images` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)), but the better fix is not to scan until the page has settled.

`waitForPageReady(options)` does that waiting. The scan never calls it itself; call it just before you scan. It waits, in order, for the window's `load` event, for `document.fonts.ready`, and for every image still loading (except those with `loading="lazy"`, which wait for the reader to scroll). It never rejects: when the time runs out it resolves anyway and says what was still pending, so you can scan regardless and still know the result was taken on a page that hadn't settled.

| Option | Default | What it does |
|---|---|---|
| `timeoutMs` | `5000` | The most it waits in total, across every step. `0` checks once without waiting. |
| `quietMs` | off | Also waits until the DOM has not changed for this many milliseconds, for a page whose script is still building it after `load`. Off by default: a page that keeps updating itself (a live feed, a clock) never goes quiet, and would always use the whole timeout. |
| `document` | the page's `document` | The document to wait for, such as a frame's. |

It resolves with:

```js
{
  ready: true,          // false when the time ran out first
  waitedMs: 412,
  pending: {
    load: false,        // the load event had not fired
    fonts: false,       // a font face was still loading
    images: 0,          // images still loading, lazy ones not counted
    domChanging: false  // only with quietMs: the DOM was still changing
  }
}
```

It takes one options object and uses nothing from outside its own body, so a driver can send it into the page as it sends `runa11yCoreInPage`:

```js
const { waitForPageReady, runa11yCoreInPage } = require('@surea11y/core');

// Puppeteer or Playwright: both accept a function and one argument.
const ready = await page.evaluate(waitForPageReady, { timeoutMs: 5000 });
if (!ready.ready) console.warn('Scanning a page still loading:', ready.pending);
const result = await page.evaluate(runa11yCoreInPage, url, null, {}, null); // Puppeteer
```

In the page itself, with the standalone bundle (Pattern 3) or from a CMS plugin or browser extension that loaded it, it is on the same global:

```js
const ready = await a11ycore.waitForPageReady({ timeoutMs: 3000 });
const result = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
```

In jsdom (Pattern 1) there is nothing to wait for: jsdom loads no fonts or images, so it resolves at once with `ready: true`.

## Scoping a scan to part of the page

Pass a CSS selector as the 2nd argument (`contextSelector`) to scan one subtree instead of the whole document — e.g. `runDomRulesInPage(url, '#app', {}, null)` to skip a surrounding CMS chrome you don't control. Pass an array of selectors (or a single comma-separated selector string) to scan multiple, possibly disjoint regions in one run — e.g. `runDomRulesInPage(url, ['#header', '#main'], {}, null)`. A selector that matches nothing scans nothing rather than the whole page: check `result.contextMatch.elementCount` before you report a scoped scan as clean. An invalid selector throws. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) for the full `contextSelector` reference and for `excludeSelectors`, the complementary "skip specific elements anywhere" option.

## CI: gating a build on the result

The engine returns data, not a verdict — deciding what fails your build is up to you. The straightforward gate is "any `fail` outcome, in the atomic results, fails the build":

```js
const failures = result.checksResults.filter((r) => r.outcome === 'fail');
if (failures.length > 0) {
  console.error(`${failures.length} accessibility rule(s) failed:`);
  for (const f of failures) {
    console.error(`  ${f.ruleId}: ${f.occurrences.length} occurrence(s)`);
  }
  process.exit(1);
}
```

Notes for CI specifically:
- `cantTell` outcomes are advisory by design (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#outcome-values)) — most teams log them without failing the build, since they require human judgment the CI run can't make.
- For "only fail on *new* violations," the CLI has a built-in baseline/allowlist mechanism (`--write-baseline`/`--baseline`, see [`BASELINE.md`](./BASELINE.md)). Calling the library directly, the same matching logic is available as `buildBaselineEntries(result)`/`matchBaseline(result, baselineEntries)` from `require('@surea11y/core/baseline')` — or diff `checksResults` against a saved prior run yourself if your pages don't fit that model (see `BASELINE.md`'s "known limitation").
- Prefer Pattern 1 (jsdom) in CI unless you specifically need real-browser layout — it avoids the extra weight of a Puppeteer/Playwright + browser-binary install in your pipeline.

## Browser extension context

`runa11yCoreInPage` is also the right function for a content-script/DevTools-panel context — inject it the same way you'd inject any content script, call it directly (no serialization step needed there since it's already running in the page's own realm), and it has no dependency on the extension's own execution environment beyond a standard DOM.

### Cross-frame scanning (including cross-origin)

`runa11yCoreInPage` only ever scans the single document it runs in — it has no visibility into `<iframe>` content, same-origin or not. For most uses that's fine (rules apply to the current document; a consumer running once per frame, e.g. once per content-script injection into `all_frames: true`, already covers every frame independently). But sometimes you want ONE scan's result to include what's inside embedded frames too — payment widgets, cookie-consent dialogs, third-party embeds — which is what the cross-frame functions below are for.

`runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder` are a separate, additive pair of functions for exactly this — not needed at all if you're driving the browser with Puppeteer/Playwright (see "Pattern 2" above): an automation driver already reaches every frame unconditionally via CDP, which is strictly *better* than what's described here. This exists specifically for when there's **no automation driver** — a plain script/bundled widget/browser extension running inside the page itself, fully subject to the same-origin policy.

**How it works**: a parent frame's `runa11yCoreAcrossFrames()` call pings each direct child `<iframe>`/`<frame>` via `postMessage`; if — and only if — that child has *also* called `a11yCoreEnableFrameResponder()` (its own opt-in to being scannable from above), it runs its own scan and replies with the result, which the parent includes. **A non-cooperating frame (the common case for most third-party embeds you don't control) is simply unreachable** — the same-origin policy allows no way around it from inside the page.

**Who a responder answers**: the frame that embeds it, and nothing else. Enabling the responder is consent to be scanned *from above*, not by anything that can reach you — a sibling frame can obtain a reference through `parent.frames[i]` and `postMessage` to you across origins, and a scan result carries `occurrences[].html`, which is DOM content the same-origin policy otherwise makes unreadable to it. A `run` command whose sender is not the direct parent is ignored, as is one arriving at a window nothing embeds. Replies are matched the same way: only the frame a request was addressed to can answer it, so another window cannot settle a scan in flight by naming its id. The relay is hop-by-hop — a grandchild is reached through its own parent — so a legitimate request always arrives from the direct parent.

```js
// Inside the embedded/child page (e.g. a widget's own bundle), once, at load:
const { a11yCoreEnableFrameResponder } = require('@surea11y/core');
a11yCoreEnableFrameResponder(); // opts this frame in to being scanned from above

// Inside the parent page:
const { runa11yCoreAcrossFrames } = require('@surea11y/core');
const result = await runa11yCoreAcrossFrames(null, null, {}, null);

console.log(result.topFrame.checksResults.filter((r) => r.outcome === 'fail'));   // this document's own findings
for (const frame of result.frames) {
  if (frame.error) continue; // unreachable -- no cooperating responder, or it timed out
  console.log(frame.topFrame.checksResults.filter((r) => r.outcome === 'fail'));  // that frame's findings
  // frame.frames holds ITS OWN nested children, recursively -- a tree, not a flat list
  // (unlike Playwright's .frames(true), which can flatten since page.frames() already
  // gives every frame regardless of nesting depth; a postMessage relay can't know about
  // a grandchild without asking through its own child first).
}
```

A few things worth knowing:
- **Async, unlike the other two runners** — `postMessage` round-trips can't be synchronous, so this is a separate, Promise-returning pair rather than an `engineOptions` flag on `runa11yCoreInPage` (which stays synchronous, unchanged, for every existing caller).
- **`engineOptions.pingWaitTime`** (default `500`ms) and **`engineOptions.frameWaitTime`** (default `60000`ms) control how long a child frame gets to answer a ping and a full run request respectively.
- **No jsdom/Node equivalent** — this is browser-only. jsdom's window/frame model doesn't meaningfully represent independent-realm cross-origin `postMessage`, and the feature has no purpose in Node anyway.
- **Bundler-free, like `runa11yCoreInPage`** — raw-source injection (a bookmarklet, a content script with no build step) still works with no bundler, but the slice you inject has to start at the `// SELF-CONTAINED in-page runner` marker rather than at the cross-frame block. `runa11yCoreAcrossFrames` scans its own frame by calling `runa11yCoreInPage`, so the two travel together. Everything from that marker to `module.exports` is one contiguous chunk with no `require()` in it. If you *do* use a normal bundler/`require`/`import`, that works too, unchanged.
- **Cost**: these two functions used to carry their own private copy of the rule catalog and helpers, which put the catalog in `src/core.js` three times over and took the file to ~4.3MB. They share `runa11yCoreInPage`'s copy now, which brings it to ~2.67MB and leaves one copy to grow as rules are added.
- **No origin/identity check on the sender** beyond the message's own namespaced envelope. Running a read-only scan and replying with DOM-derived results isn't a privileged operation; the content involved is no more sensitive than what's already rendered on the page.
