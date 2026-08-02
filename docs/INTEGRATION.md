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

Deliberately excluded from this bundle: `runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder`. Cross-frame scanning needs the embedded frame to load the engine and opt in too (see "Cross-frame scanning" below) — not a fit for a single dropped-in script tag. Use the npm package directly if you need it.

## Scoping a scan to part of the page

Pass a CSS selector as the 2nd argument (`contextSelector`) to scan one subtree instead of the whole document — e.g. `runDomRulesInPage(url, '#app', {}, null)` to skip a surrounding CMS chrome you don't control. Pass an array of selectors (or a single comma-separated selector string) to scan multiple, possibly disjoint regions in one run — e.g. `runDomRulesInPage(url, ['#header', '#main'], {}, null)`. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) for the full `contextSelector` reference and for `excludeSelectors`, the complementary "skip specific elements anywhere" option.

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
- For "only fail on *new* violations," the CLI has a built-in baseline/allowlist mechanism (`--write-baseline`/`--baseline`, see [`BASELINE.md`](./BASELINE.md)). Calling the library directly, the same matching logic is available as `buildBaselineEntries(result)`/`matchBaseline(result, baselineEntries)` from `require('@surea11y/core/src/baseline')` — or diff `checksResults` against a saved prior run yourself if your pages don't fit that model (see `BASELINE.md`'s "known limitation").
- Prefer Pattern 1 (jsdom) in CI unless you specifically need real-browser layout — it avoids the extra weight of a Puppeteer/Playwright + browser-binary install in your pipeline.

## Browser extension context

`runa11yCoreInPage` is also the right function for a content-script/DevTools-panel context — inject it the same way you'd inject any content script, call it directly (no serialization step needed there since it's already running in the page's own realm), and it has no dependency on the extension's own execution environment beyond a standard DOM.

### Cross-frame scanning (including cross-origin)

`runa11yCoreInPage` only ever scans the single document it runs in — it has no visibility into `<iframe>` content, same-origin or not. For most uses that's fine (rules apply to the current document; a consumer running once per frame, e.g. once per content-script injection into `all_frames: true`, already covers every frame independently). But sometimes you want ONE scan's result to include what's inside embedded frames too — payment widgets, cookie-consent dialogs, third-party embeds — the same real scenario other engines' own cross-frame messaging protocols exist for.

`runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder` are a separate, additive pair of functions for exactly this — not needed at all if you're driving the browser with Puppeteer/Playwright (see "Pattern 2" above): an automation driver already reaches every frame unconditionally via CDP, which is strictly *better* than what's described here. This exists specifically for when there's **no automation driver** — a plain script/bundled widget/browser extension running inside the page itself, fully subject to the same-origin policy, exactly like other engines' equivalent mechanisms are.

**How it works**: a parent frame's `runa11yCoreAcrossFrames()` call pings each direct child `<iframe>`/`<frame>` via `postMessage`; if — and only if — that child has *also* called `a11yCoreEnableFrameResponder()` (its own opt-in to being scannable from above), it runs its own scan and replies with the result, which the parent includes. **A non-cooperating frame (the common case for most third-party embeds you don't control) is simply unreachable** — this mirrors the same real limitation other engines have for non-cooperating frames; it is not a gap `surea11y` closes that they don't have either.

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
- **`engineOptions.pingWaitTime`** (default `500`ms) and **`engineOptions.frameWaitTime`** (default `60000`ms) control how long a child frame gets to answer a ping and a full run request respectively, matching the defaults other engines use for the equivalent options.
- **No jsdom/Node equivalent** — this is browser-only. jsdom's window/frame model doesn't meaningfully represent independent-realm cross-origin `postMessage`, and the feature has no purpose in Node anyway.
- **Bundler-free, like `runa11yCoreInPage`** — both functions are fully self-contained (their own private copy of the rule catalog and every helper they need), so raw-source injection (a bookmarklet, a content script with no build step) works with zero bundler needed, exactly like `runa11yCoreInPage` already does. If you *do* use a normal bundler/`require`/`import`, that works too, unchanged.
- **Cost of that self-containment**: `src/core.js` grew from ~1.86MB to ~3.1MB, since these two functions each needed their own complete private copy of the rule catalog and shared helpers rather than sharing the outer `RULE_IMPLS`. If this file's size ever becomes a real problem, the fix would be to drop the bundler-free requirement for just these two functions (accepting that cross-frame scanning in "plain script injection" mode needs a real bundler, unlike `runa11yCoreInPage` alone) rather than tripling the embedded catalog again for some future feature.
- **No origin/identity check on the sender** beyond the message's own namespaced envelope — matching the same permissiveness other engines take here. Running a read-only scan and replying with DOM-derived results isn't a privileged operation; the content involved is no more sensitive than what's already rendered on the page.
