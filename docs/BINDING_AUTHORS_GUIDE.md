# Binding authors' guide

Written for whoever builds the *next* framework binding on top of `surea11y` (Puppeteer, Cypress, Selenium, WebdriverIO, whatever comes after) — not for someone consuming a binding, and not for someone calling the engine directly. If that's you, see [`INTEGRATION.md`](./INTEGRATION.md) instead.

The first real binding, `surea11y-playwright` (a sibling project, not part of this repo), has already worked through most of the design questions a new binding hits. This doc exists so the next one doesn't have to re-derive them — it's a checklist and a map of "what the engine already gives you for free" vs. "what every binding has to build itself," backed by what that binding actually did, not theory.

## Core-engine vs. binding-layer: know which side you're on

Some engine-parity features (relative to other established engines) are **engine-level** — call the engine, get the behavior, no binding code required. Others are **binding-layer** — the engine deliberately doesn't own them, because they only make sense once you have a real automation driver (a `Page`/`Browser`/`ElementHandle`-shaped object) in front of you. Building a new binding without knowing which is which leads to either reimplementing something the engine already does, or missing something because "surely the engine handles that."

**Already engine-level, works the moment you call `runa11yCoreInPage`/`runDomRulesInPage` — no binding code needed:**
- All rule execution, WCAG SC mapping, composite rollups.
- `runOnly`/`engineOptions.rules`/`.tags`/`.tests` rule selection — including [WCAG-version filtering](./ENGINE_OPTIONS.md#filtering-by-wcag-version-21-vs-22) (`wcag21a`/`wcag22aa`-style tags): if your binding has any kind of `.withTags()`/`.options()` passthrough that forwards `runOnly`/`engineOptions` generically, WCAG-version filtering already works through it with zero extra code — just document the tag vocabulary for your users, the way `surea11y-playwright`'s README does.
- `structuralPath` on every `fail`/`cantTell` occurrence — if your binding passes occurrences through unreshaped (don't strip fields you don't recognize), this reaches your consumers automatically.
- `engineOptions.customRules` — runtime rule registration. Works through a generic `engineOptions` passthrough too, **but** see the caveat below: if your binding crosses a serialization boundary (see next section), your consumers must pass `runInPage`/`applicability` as `fn.toString()` source, not a live function. Worth a dedicated `.withCustomRules([...])` convenience method for ergonomics, but not required for the feature to work.
- Cross-frame scanning **if** your driver reaches every frame itself already (Puppeteer/Cypress/Selenium all can, via CDP or equivalent) — you don't need `runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder` at all. Just call the engine once per frame your driver already gives you and merge the results yourself (see `surea11y-playwright`'s `.frames(true)`, which does exactly this — no engine change was needed for it). The `postMessage`-based cross-frame functions exist specifically for the *no-automation-driver* case (a plain injected script) and are the wrong tool for a driver-based binding.

**Binding-layer — your binding has to build these itself, the engine won't:**
- **Element references.** The engine returns `selector`/`structuralPath` strings, never a live handle — it has no concept of your driver's element-reference type. Resolve `occurrences[i].selector` back to a real handle yourself (Playwright's approach: `page.evaluateHandle` instead of `page.evaluate`, then `elementHandle.$(selector)` per occurrence — see `.elementRef(true)` in `surea11y-playwright`).
- **Result verbosity/reporter filtering.** The engine deliberately always returns every rule's outcome, including `pass`/`notApplicable` — "not a violations-only list" is a stated engine design choice (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)), not an oversight to work around. If your consumers want a trimmed view for CI-scale output, that's a post-filter your binding adds (`surea11y-playwright`'s `.reportOnly(['fail','cantTell'])` is a simple array-filter over the full result — no engine change).
- **Formatted failure output for your framework's own assertion/reporting style** (e.g. Playwright/Jest-style multi-line failure messages). The engine's raw result is framework-agnostic on purpose; shaping it into "what shows up in a failed test's stack trace" is squarely binding territory.

## The serialization-boundary caveat

If your binding drives a *separate JS realm* (a browser page/tab is a different realm than your Node test process — this is Playwright/Puppeteer/Selenium's situation, not Cypress's, since Cypress test code already runs in-browser), anything you hand to `page.evaluate()`-equivalent gets structurally cloned/JSON-serialized. **Live functions do not survive that boundary.** This bit `surea11y-playwright` in two places:
1. `runa11yCoreInPage` itself is designed around this — it's fully self-contained (`.toString()`-serializable, no closure over outer scope) specifically so it can be reconstructed from source inside the page realm.
2. `engineOptions.customRules[].runInPage`/`.applicability` accept a function-source string for exactly this reason — a binding crossing this boundary must tell its consumers to pass `fn.toString()`, not `fn`. Document this prominently; it's an easy trap (a function looks like it should just work as an argument until it silently fails to serialize).

If your binding runs in the *same* realm as the page (a browser extension content script, or Cypress-style in-browser test code), this whole section doesn't apply to you — pass live functions freely.

## Things to check before shipping a new binding

A short list, derived from what the audit pass on `surea11y-playwright` actually found missing on a first pass (per its own `ROADMAP.md`) — worth checking explicitly rather than assuming your binding's generic passthrough covers them:
- [ ] Combinations of your own filtering methods behave sanely together (e.g. include+exclude on the same ID, tag-include + tag-exclude on the same tag) — these interact through the engine's `includeMode`/exclude-always-wins semantics ([`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md)), test them explicitly rather than assuming.
- [ ] `structuralPath` and `customRules` still work correctly when combined with whatever binding-layer features you build (verbosity filtering, element refs, per-frame scanning) — a filter applied after the fact should never silently drop fields a consumer expects on a surviving occurrence.
- [ ] If you support cross-frame scanning via your own driver, confirm each frame's result gets the same normalization (selector/structuralPath/severity) as a single-document scan — don't let a "per-frame" code path silently skip the shared result-shaping logic.
- [ ] TypeScript types (if you ship any) stay in sync with actual engine output — `structuralPath: number[] | null` and any new fields ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) is the source of truth) are easy to leave stale after an engine update.

## A known engine-side tradeoff worth knowing about

`src/core.js` is not small (~3.1MB as of 2026-07-22) because the bundler-free, no-driver-context functions (`runa11yCoreInPage`, `runa11yCoreAcrossFrames`, `a11yCoreEnableFrameResponder`) each carry their own complete self-contained copy of the rule catalog. If your binding only ever uses `require('@surea11y/core')` in Node and injects `runa11yCoreInPage.toString()` into the page (the same pattern `surea11y-playwright` uses), your actual browser-injected payload is unaffected by this — only your Node-side `require()` footprint grows. Worth knowing if your binding's own package size matters to your consumers.
