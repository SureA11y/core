# Binding authors' guide

Written for whoever builds the *next* framework binding on top of `@surea11y/core` (Puppeteer, Cypress, Selenium, WebdriverIO, whatever comes after) — not for someone consuming a binding, and not for someone calling the engine directly. If that's you, see [`INTEGRATION.md`](./INTEGRATION.md) instead.

The first real binding, `@surea11y/playwright` (a sibling project, not part of this repo), has already worked through most of the design questions a new binding hits. This doc exists so the next one doesn't have to re-derive them — it's a checklist and a map of "what the engine already gives you for free" vs. "what every binding has to build itself," backed by what that binding actually did, not theory.

## Core-engine vs. binding-layer: know which side you're on

Some engine-parity features (relative to other established engines) are **engine-level** — call the engine, get the behavior, no binding code required. Others are **binding-layer** — the engine doesn't own them, because they only make sense once you have a real automation driver (a `Page`/`Browser`/`ElementHandle`-shaped object) in front of you. Building a new binding without knowing which is which leads to either reimplementing something the engine already does, or missing something because "surely the engine handles that."

**Already engine-level, works the moment you call `runa11yCoreInPage`/`runDomRulesInPage` — no binding code needed:**
- All rule execution, WCAG SC mapping, composite rollups.
- `runOnly`/`engineOptions.rules`/`.tags`/`.tests` rule selection — including [WCAG-version filtering](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22) (`wcag21a`/`wcag22aa`-style tags): if your binding has any kind of `.withTags()`/`.options()` passthrough that forwards `runOnly`/`engineOptions` generically, WCAG-version filtering already works through it with zero extra code — just document the tag vocabulary for your users, the way `@surea11y/playwright`'s README does. The same passthrough carries [`runOnly.wcag`](./ENGINE_OPTIONS.md#selecting-by-wcag-target-runonlywcag) (`{ wcag: { version: '2.2', level: 'AA' } }`, the rules for a WCAG target) and [`runOnly.bestPractices`](./ENGINE_OPTIONS.md#adding-the-best-practices-runonlybestpractices) (`true` adds the rules that name no criterion); forward `runOnly` whole rather than rebuilding it from the fields you know.
- `structuralPath` on every `fail`/`cantTell` occurrence — if your binding passes occurrences through unreshaped (don't strip fields you don't recognize), this reaches your consumers automatically.
- `engineOptions.customRules` — runtime rule registration. Works through a generic `engineOptions` passthrough too, **but** see the caveat below: if your binding crosses a serialization boundary (see next section), your consumers must pass `runInPage`/`applicability` as `fn.toString()` source, not a live function. Worth a dedicated `.withCustomRules([...])` convenience method for ergonomics, but not required for the feature to work.
- Cross-frame scanning **if** your driver reaches every frame itself already (Puppeteer/Cypress/Selenium all can, via CDP or equivalent) — you don't need `runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder` at all. Just call the engine once per frame your driver already gives you and merge the results yourself (see `@surea11y/playwright`'s `.frames(true)`, which does exactly this — no engine change was needed for it). The `postMessage`-based cross-frame functions exist specifically for the *no-automation-driver* case (a plain injected script) and are the wrong tool for a driver-based binding. If your binding does hand on a result from `runa11yCoreAcrossFrames`, it is a tree, not a flat list: `{ topFrame, frames }`, where each frame entry has the frame's `url`, `selector` (a CSS selector for the `<iframe>`/`<frame>` in its parent's document) and `title` (its `title` attribute, or `null`), then either `topFrame` and its own `frames` or, for a frame that did not answer, `error`. `flattenCrossFrameResult(result)` from `@surea11y/core` lists every frame, the top one first, each with its `frame` position (`path`, `title`, `url`) and its `result` or `error`. The reporters read this shape as it is (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#cross-frame-result-runa11ycoreacrossframes)).

**Binding-layer — your binding has to build these itself, the engine won't:**
- **Element references.** The engine returns `selector`/`structuralPath` strings, never a live handle — it has no concept of your driver's element-reference type. Resolve `occurrences[i].selector` back to a real handle yourself (Playwright's approach: `page.evaluateHandle` instead of `page.evaluate`, then `elementHandle.$(selector)` per occurrence — see `.elementRef(true)` in `@surea11y/playwright`).
- **Result verbosity/reporter filtering.** The engine always returns every rule's outcome, including `pass`/`notApplicable` — "not a violations-only list" is a stated engine design choice (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)), not an oversight to work around. If your consumers want a trimmed view for CI-scale output, that's a post-filter your binding adds (`@surea11y/playwright`'s `.reportOnly(['fail','cantTell'])` is a simple array-filter over the full result — no engine change). A result trimmed by hand is no longer the scan's result to the reporters: JUnit counts one test per rule it finds, and EARL makes one assertion per rule, so the rules you dropped are missing from both. The supported compact form is `engineOptions.output.detail: 'findings'`: it keeps every rule's outcome, drops only what the catalog can give back, and every reporter reads it as the full result (see `engine.outputDetail` in [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#top-level-result)).
- **Formatted failure output for your framework's own assertion/reporting style** (e.g. Playwright/Jest-style multi-line failure messages). The engine's raw result is framework-agnostic on purpose; shaping it into "what shows up in a failed test's stack trace" is squarely binding territory.

## The serialization-boundary caveat

If your binding drives a *separate JS realm* (a browser page/tab is a different realm than your Node test process — this is Playwright/Puppeteer/Selenium's situation, not Cypress's, since Cypress test code already runs in-browser), anything you hand to `page.evaluate()`-equivalent gets structurally cloned/JSON-serialized. **Live functions do not survive that boundary.** This bit `@surea11y/playwright` in two places:
1. `runa11yCoreInPage` itself is designed around this — it's fully self-contained (`.toString()`-serializable, no closure over outer scope) specifically so it can be reconstructed from source inside the page realm.
2. `engineOptions.customRules[].runInPage`/`.applicability` accept a function-source string for exactly this reason — a binding crossing this boundary must tell its consumers to pass `fn.toString()`, not `fn`. Document this prominently; it's an easy trap (a function looks like it should just work as an argument until it silently fails to serialize).

If your binding runs in the *same* realm as the page (a browser extension content script, or Cypress-style in-browser test code), this whole section doesn't apply to you — pass live functions freely.

## Things to check before shipping a new binding

A short list, derived from what the audit pass on `@surea11y/playwright` actually found missing on a first pass (per its own `ROADMAP.md`) — worth checking explicitly rather than assuming your binding's generic passthrough covers them:
- [ ] Combinations of your own filtering methods behave sanely together (e.g. include+exclude on the same ID, tag-include + tag-exclude on the same tag) — these interact through the engine's `includeMode`/exclude-always-wins semantics ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)), test them explicitly rather than assuming.
- [ ] `structuralPath` and `customRules` still work correctly when combined with whatever binding-layer features you build (verbosity filtering, element refs, per-frame scanning) — a filter applied after the fact should never silently drop fields a consumer expects on a surviving occurrence.
- [ ] If you support cross-frame scanning via your own driver, confirm each frame's result gets the same normalization (selector/structuralPath/severity) as a single-document scan — don't let a "per-frame" code path silently skip the shared result-shaping logic.
- [ ] TypeScript types (if you ship any) stay in sync with actual engine output — `structuralPath: number[] | null` and any new fields ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) is the source of truth) are easy to leave stale after an engine update.

## Getting the engine into the page without paying for it twice

A binding that crosses a realm boundary has to get the engine into the page
somehow. The obvious way — serialize `runa11yCoreInPage` with `.toString()` and
hand it to the driver's evaluate-in-page call — works, and is what
`@surea11y/playwright` did first, but it sends the whole engine **on every
call**: about 2.7 MB per frame, per scan. A five-frame scan sends it five times,
and the next scan sends it all again.

The package ships a smaller way. `@surea11y/core/browser` is the standalone
bundle: the same `runa11yCoreInPage`, minified, about 1.1 MB, which defines
`window.a11ycore`. Load it into the document once and every later scan costs a
few hundred bytes.

The shape below is deliberately driver-neutral — `evaluateInPage` stands for
whatever your driver calls it (`page.evaluate` in Playwright and Puppeteer,
`browser.execute` in WebdriverIO, `driver.executeScript` in Selenium, which
takes a *string* of script text rather than a function):

```js
const fs = require('fs');
const BUNDLE = fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8');

// Returns true when window.a11ycore is ready to use in this document.
async function ensureEngine(target) {
  if (await evaluateInPage(target, () => typeof window.a11ycore !== 'undefined')) return true;
  try {
    await evaluateInPage(target, (src) => (0, eval)(src), BUNDLE);
  } catch {
    return false;
  }
  // Confirm it actually landed rather than assuming: see the CSP note below.
  return evaluateInPage(target, () => typeof window.a11ycore !== 'undefined');
}
```

Then use it if it is there, and keep the serialize path as the fallback:

```js
async function scan(target, args) {
  if (await ensureEngine(target)) {
    return evaluateInPage(
      target,
      (a) => window.a11ycore.runa11yCoreInPage(a.url, a.contextSelector, a.engineOptions, a.runOnly),
      args
    );
  }
  return evaluateInPage(target, serializedRunnerFn, args); // what your binding does today
}
```

Four things to know before adapting it:

- **Verify the global appeared; don't assume.** That is what makes this safe to
  adopt across drivers without auditing each one's execution model. A driver
  whose script execution is subject to the page's own CSP will fail to define
  the global, `ensureEngine` returns false, and the scan falls back to the
  payload it uses today rather than breaking.
- **Don't reach for `addScriptTag`.** It injects an inline `<script>`, which a
  page serving `script-src 'self'` refuses — confirmed in Chromium against both
  a page and a sub-frame. Playwright's and Puppeteer's `evaluate` run through
  CDP, outside the page's CSP, so the snippet above was confirmed working under
  `script-src 'self'` with no `unsafe-eval`. Other drivers execute scripts by
  other means; the presence check above is what covers the difference.
- **A navigation clears it.** `window.a11ycore` belongs to the document, so the
  check has to run per frame and after every navigation. That is why `scan`
  calls `ensureEngine` unconditionally rather than caching a flag on the
  binding.
- **The bundle carries English only.** Every other locale is a side file, so a
  binding forwarding `engineOptions.locale` must load the matching one the same
  way, before the scan:

  ```js
  const primary = String(locale || 'en').trim().toLowerCase().split('-')[0];
  if (primary && primary !== 'en') {
    let localePath;
    try {
      localePath = require.resolve(`@surea11y/core/i18n/${primary}`);
    } catch {
      localePath = null; // not a locale this build ships; English is the fallback
    }
    if (localePath) {
      await evaluateInPage(target, (src) => (0, eval)(src), fs.readFileSync(localePath, 'utf8'));
    }
  }
  ```

  Without it the scan still succeeds, but in English, with
  `engine.locale.reason` reporting `dictionary-not-loaded` — the engine saying
  this step was missed, rather than a failure to swallow.

Results are identical either way: same rules, same composites, same `engine`
block, verified over a page seeded with a spread of violations. This is only
about what crosses the wire.

### Which situation is your binding in

Only the first row pays the serialization cost this section is about.

| Binding | Realm | What to do |
|---|---|---|
| Playwright, Puppeteer, Selenium, WebdriverIO | Node drives a separate browser realm | Everything above: load `@surea11y/core/browser` into the document once, scan through `window.a11ycore`, keep the serialize path as fallback. |
| Cypress | Test code already runs in the browser, with the app under test in a same-origin frame | No serialization boundary, so nothing crosses the wire — but the engine still has to be evaluated into the app's realm rather than called from the runner's, or it reads the wrong `document`. `require` the engine and `win.eval` its source there (what `@surea11y/cypress` does), or read the bundle with `cy.readFile` and evaluate that instead; both put it in the right realm. Size is not the deciding factor here. |
| Jest, Vitest, or anything else driving jsdom in-process | One realm, in Node | None of this applies. `require('@surea11y/core')` and call `runDomRulesInPage` against the DOM you already have — see [`INTEGRATION.md`](./INTEGRATION.md) Pattern 1. Injecting a bundle here would be strictly worse. |
| Browser extension, bookmarklet, injected script | Already in the page | Load the bundle once and call it; that is the case it was built for. |

## Packs

A pack (rules, a standard or a checklist from a package of its own; see [`PACKS.md`](./PACKS.md#8-use-it)) is prepared in Node, so it reaches a page as a script. Inject `packScript(packs)` from `@surea11y/core/pack` after the bundle, in every frame you scan and again after each navigation, as for the bundle itself. Then name the packs in `engineOptions.packs` as `name@version`.

- **One call for packs used together.** The page runs packs only as one `packScript` call registered them, so pass every pack a scan needs to one call and name them all in `engineOptions.packs`. A page can't combine two calls' packs.
- **The same core version.** A pack script is prepared with the core that wrote it, so take `packScript` from the same `@surea11y/core` as the bundle you inject.
- **Pass `skippedPacks` on.** Named packs the page doesn't run (no call registered exactly that set, or the script came from another core version) are not an error by default: the scan runs without them, warns, and lists each in the result's `skippedPacks` with the reason; under `strictOptions` it throws. See [Packs in `ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core).

`@surea11y/playwright`'s `.withPacks(policy)` does all of this; see [`INTEGRATION.md`](./INTEGRATION.md#packs-in-a-page) for the plain driver calls.

## A time limit on a scan

Nothing in the page can stop a scan once it has started, and most drivers' evaluate-in-page call has no time limit of its own. A binding should put one on that call and give up on the tab when it passes; see [A time limit on a scan](./INTEGRATION.md#a-time-limit-on-a-scan) in `INTEGRATION.md`.

## A page that broke JavaScript built-ins

A page whose scripts change a JavaScript built-in the engine relies on (`Array.prototype.filter`, `Map`, `JSON.stringify` and others) stops the scan with an error whose `code` is `PAGE_BUILTINS_BROKEN` and whose message names each one, rather than giving a result that reads well and is wrong (see [`LIMITATIONS.md`](./LIMITATIONS.md#environment-dependent--depends-on-how-you-run-it)). Retrying does not help. Report it to your users as its own case, not as a failure of your binding. A driver that rethrows an in-page error may keep only its message, so if your users need the code, catch the error in the page and return `code` and `message` from there.
