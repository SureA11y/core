# Integration guide

surea11y/core is a library, not a CLI or a service — you call it from your own Node script, test suite, or browser-automation code. This page covers the real ways to run it, plus how to wire it into CI.

## Which runner function to use

The first two take the same four arguments — `(pageUrl, contextSelector, engineOptions, runOnly)` — and return the same result shape (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)). They differ only in _where_ they can run:

| Function                                                   | Use when                                                                                                                                                            | Why                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runDomRulesInPage`                                        | Calling directly in the same Node process where you `require('@surea11y/core')`                                                                                     | Normal function call — references the module's own closures (`CHECK_DEFS`, rule implementations, etc.) directly.                                                                                                                                                                                                                                                                                         |
| `runa11yCoreInPage`                                        | Handing the function itself to a _different_ JS realm — most commonly Puppeteer/Playwright's `page.evaluate`                                                        | Fully self-contained: its entire body (rule catalog, implementations, shared helpers) is inlined, so `fn.toString()` + re-evaluating that source in a browser tab (which has no access to your Node module scope at all) still works. Verified by `tests/runa11yCoreInPage-serialization.test.js`, which literally does this — reconstructs the function from source in a separate VM realm and runs it. |
| `runa11yCoreAcrossFrames` / `a11yCoreEnableFrameResponder` | Same context as `runa11yCoreInPage` (browser extension / content script / bundled widget code — no automation driver), when you also need to reach into `<iframe>`s | See "Cross-frame scanning" below — a separate, async pair of functions, not a variant of the other two.                                                                                                                                                                                                                                                                                                  |

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

`pretendToBeVisual: true` matters — it's what makes jsdom compute _something_ for `getComputedStyle` (needed by the contrast rules and anything checking computed layout properties). Note jsdom has no real CSS layout engine — see [`LIMITATIONS.md`](./LIMITATIONS.md) for what that rules out entirely (e.g. `target-size-minimum` needs real `getBoundingClientRect()` and will report `notApplicable` under plain jsdom).

## Pattern 2 — a real browser via Puppeteer or Playwright

Good for: fully-rendered pages (client-side-rendered apps, real CSS layout/paint), testing your actual production site, anything Pattern 1's jsdom limitations rule out. It scans the page in the state it is in: to check a menu or a dialog, open it with the driver and scan again. That checks what the open state contains, not whether a keyboard user can open it.

```js
// Puppeteer
const puppeteer = require('puppeteer');
const { runa11yCoreInPage } = require('@surea11y/core');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com/');

const result = await page.evaluate(
  runa11yCoreInPage, // page.evaluate serializes this function and runs it inside the page
  'https://example.com/',
  null, // contextSelector
  {}, // engineOptions
  null // runOnly
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

`a11ycore.runa11yCoreInPage` is the exact same function described in Pattern 2 above — the bundle exists only to solve _loading_ it without `require`/a module system, not to add a separate API surface. It carries the same self-containment property (own inlined rule catalog, no free variables), which is what makes a plain `<script>` tag sufficient.

In an app built with a bundler (esbuild, webpack, Vite, Rollup), import it instead; the module's export is the same object, and importing it still defines the global, so a language file loaded after it finds it:

```js
import a11ycore from '@surea11y/core/browser';
// or: import { runa11yCoreInPage } from '@surea11y/core/browser';

const result = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
```

The arguments are the same as anywhere else. A scan scoped to one region, limited to WCAG 2.2 A and AA, with two noisy widgets left out:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(
    location.href,
    '#main', // contextSelector: scan only this region
    {
      excludeSelectors: ['#cookie-banner', '.intercom-launcher'],
      contrast: { mode: 'auditorAssist' } // trade some false-positive protection for more findings
    },
    { wcag: { version: '2.2', level: 'AA' } } // runOnly
  );
</script>
```

### From the browser console

For a scan by hand, the bundle has a few helpers. Load it into any open page from the browser's console (the Console tab of the developer tools), then:

```js
// Pasted into the console of the page to check.
const s = document.createElement('script');
s.src = 'https://cdn.jsdelivr.net/npm/@surea11y/core/surea11y.browser.js';
document.head.append(s);

// Once it has loaded:
a11ycore.version;                       // the engine's version
const result = await a11ycore.run();     // scan the page
a11ycore.table(result);                  // the findings, worst first
a11ycore.highlight(result);              // box each one on the page
await a11ycore.openReport(result);       // the HTML report, in a new tab
```

- `run(options)` scans the page and resolves to the result. It fetches the style sheets the page can't read first, as `runa11yCoreInPageAsync` does. `options` takes the engine options (`locale`, `profile`, `wcag`, `excludeSelectors`…) and two of its own: `context`, a selector to scan only part of the page, and `runOnly`, the rule ids to run. `await a11ycore.run({ context: 'main', runOnly: ['img-alt-present'] })`.
- `table(result, { all })` prints, with `console.table`, one row per occurrence of a `fail` or `cantTell` rule: outcome, severity, rule, element (its selector) and summary. Failures come first, then questions, each by severity. It returns the rows. `{ all: true }` adds a row for each rule that passed or did not apply.
- `highlight(result)` draws a box over each element a `fail` (solid red) or `cantTell` (dashed amber) occurrence names, labelled with the rules that reported it, and returns how many it marked. The boxes are in a layer of their own: one element added to the page, holding a shadow root, hidden from assistive technology and inert. The page's own elements are never changed. An element with no box on screen (`display: none`) gets none. `clearHighlights()` removes the layer, and `run()` removes it before it scans.
- `openReport(result, options)` opens the scan's [HTML report](./REPORT.md) in a new tab and resolves to its address. The report is in its own file, `surea11y.report.js`, which it fetches from beside the bundle the first time (so the bundle doesn't carry it for pages that never ask). A bundle loaded by a bundler has no address of its own: pass `{ reportScript: url }`, or load `surea11y.report.js` with a `<script>` tag. `{ report: { title } }` goes to the report. Where the browser blocks the new tab, the address is logged to open by hand.

A page's Content Security Policy can block loading a script from a CDN, or the report file. Where it does, load the files from the page's own origin, or scan the page with a driver (Pattern 2).

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

### Packs in a page

A pack (rules, a standard or a checklist from a package of its own; see [Packs in `ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core)) is prepared in Node, so it reaches a page as a script. In Pattern 2, inject `packScript(packs)` from `@surea11y/core/pack` into the page (and into every frame you scan) before the scan, and name the packs in `engineOptions.packs` as `name@version`; in Pattern 3, load it after the bundle, or ship one file with `buildBrowserBundle({ packs })`. The rules' code is written into the script, so it runs where a Content Security Policy forbids `eval`.

```js
const { runa11yCoreInPage } = require('@surea11y/core');
const { packScript } = require('@surea11y/core/pack');
const policy = require('@acme/a11y-pack');

await page.evaluate(packScript([policy]));
// Puppeteer; in Playwright, wrap it as shown above.
const result = await page.evaluate(runa11yCoreInPage, page.url(), null, {
  packs: ['@acme/a11y-pack@0.1.0'],
  profile: 'acme-policy'
});
```

The bindings do this for you: `.withPacks(policy)`.

In a page with no driver (Pattern 3: a `<script>` tag, a bookmarklet, an extension's content script), the pack arrives as a file, as the bundle does. Build one file in Node, the bundle with the packs registered after it, with the core you will ship:

```js
// In Node, once per release of core or of a pack.
const fs = require('node:fs');
const { buildBrowserBundle } = require('@surea11y/core/pack');
const policy = require('@acme/a11y-pack');

fs.writeFileSync('surea11y-acme.js', buildBrowserBundle({ packs: [policy] }));
```

```html
<script src="surea11y-acme.js"></script>
<script>
  const result = a11ycore.runa11yCoreInPage(location.href, null, {
    packs: ['@acme/a11y-pack@0.1.0'],
    profile: 'acme-policy'
  }, null);
</script>
```

A pack's script runs only with the core that wrote it: it carries the catalog core and the packs make together, checked in Node, and points at core's own rules by id. A page whose bundle is another core version runs the scan without the packs and lists each in `skippedPacks`, naming the two versions. One file holds both, so they can't fall out of step. Build it again when you update core or a pack, and update the `name@version` the page names with it.

Where core's bundle is already on the page (a tool that loads it for its own scans, with a language side file after it), write `packScript([policy])` to a file with the same core and load it after the bundle instead:

```html
<script src="node_modules/@surea11y/core/surea11y.browser.js"></script>
<script src="acme-pack.js"></script> <!-- fs.writeFileSync('acme-pack.js', packScript([policy])) -->
```

### What the bundle leaves out

Deliberately excluded: `runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder`. Cross-frame scanning needs the embedded frame to load the engine and opt in too (see "Cross-frame scanning" below) — not a fit for a single dropped-in script tag. Use the npm package directly if you need it.

## Waiting for the page before a scan

A scan reads the page as it is at that moment. On a page that has just opened, web fonts may still be loading and images may not have arrived, and layout rules measure what is on screen: text in a fallback font, boxes that change size when their image lands. The same page scanned a second later can give another result. The scan records this in `engine.environment.fonts` and `.images` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)), but the better fix is not to scan until the page has settled.

`waitForPageReady(options)` does that waiting. The scan never calls it itself; call it just before you scan. It waits, in order, for the window's `load` event, for `document.fonts.ready`, and for every image still loading (except those with `loading="lazy"`, which wait for the reader to scroll). It never rejects: when the time runs out it resolves anyway and says what was still pending, so you can scan regardless and still know the result was taken on a page that hadn't settled. Whether to scan anyway, wait longer or stop is your tool's choice; if it scans, keep what was pending with the result.

| Option      | Default               | What it does                                                                                                                                                                                                                                                       |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `timeoutMs` | `5000`                | The most it waits in total, across every step. `0` checks once without waiting. A value that isn't a finite number of 0 or more (negative, `NaN`, `Infinity`) uses the default, with a `console.warn`.                                                             |
| `quietMs`   | off                   | Also waits until the DOM has not changed for this many milliseconds, for a page whose script is still building it after `load`. Off by default: a page that keeps updating itself (a live feed, a clock) never goes quiet, and would always use the whole timeout. |
| `document`  | the page's `document` | The document to wait for, such as a frame's.                                                                                                                                                                                                                       |

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

### Style sheets from another origin

A page's script can't read the rules of a style sheet served from another origin (a CDN, a fonts service), so a rule that looks for something in the CSS, such as `css-orientation-lock`, can't tell whether it is there, and asks. Give the scan their text in `engineOptions.styleSheetTexts` (`[{ href, text }]`, the sheet's URL and its CSS) and the rules read it in their place.

`preloadStyleSheets()` fetches it in the page, as axe does before it scans: every sheet the page can't read, linked or imported, that the server shares (CORS), each given up after `timeoutMs` (default 5000). `runa11yCoreInPageAsync`, on the bundle, does that and then scans:

```js
const result = await a11ycore.runa11yCoreInPageAsync(location.href, null, {}, null);
```

A server that doesn't share its sheet can't be read from the page at all. A tool driving the browser can fetch it from outside the page, where no CORS applies, and pass it in the same option; the bindings do.

```js
const { preloadStyleSheets, runa11yCoreInPage } = require('@surea11y/core');
const styleSheetTexts = await page.evaluate(preloadStyleSheets, { timeoutMs: 5000 });
const result = await page.evaluate(runa11yCoreInPage, url, null, { styleSheetTexts }, null); // Puppeteer
```

A sheet still unreadable leaves `css-orientation-lock` `cantTell` (`STYLESHEETS_NOT_READABLE`).

## Reading private ElementInternals: the internals hook

### The problem

A custom element can name itself, set its states, and give itself a role through `ElementInternals`. Many components keep their internals in a private field, where nothing outside the class can reach them:

```js
customElements.define(
  'x-check',
  class extends HTMLElement {
    #internals;
    constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#internals.ariaLabel = 'Subscribe';
      this.#internals.ariaChecked = 'false';
    }
  }
);
```

```html
<x-check role="checkbox"></x-check>
```

The browser exposes the name "Subscribe" and the checked state, so the element meets 4.1.2. But no page script can read them back, so a scan can't tell whether the element has a name: the name rules ask instead of deciding, and `aria-required-attr` asks about the state. `binary-control-name-present` reports `cantTell` with an occurrence like this:

```js
{
  summary: 'This <x-check> is a custom element that may give itself a name through ElementInternals, which no script can read, so whether it has one could not be told.',
  occurrenceOutcome: 'cantTell',
  uncertainty: { code: 'not-computable', needed: 'Whether the component names itself through ElementInternals.' },
  data: { details: { reasonCode: 'name_internals' } },
  selector: 'html > body > main > x-check'
}
```

A component that keeps its internals on a property (`_internals`, `internals`, `internals_`, `__internals`) is read through it without any of this; see [`LIMITATIONS.md`](./LIMITATIONS.md#environment-dependent--depends-on-how-you-run-it).

### What the hook does

`internalsHookScript()`, from `@surea11y/core`, returns a script to run in the page before the page's own scripts. It wraps `HTMLElement.prototype.attachInternals`: each call goes to the browser's own method with the same `this` and arguments, the page gets back the very object the browser returned, and an error the browser throws (calling it twice on one element, say) reaches the page unchanged. On success it also records the element and its internals in a `WeakMap` for the scan to read, under `Symbol.for('surea11y.internals')` on the global. The wrapper keeps the method's name, `length` and property attributes. Installing it twice in a page wraps once.

It is opt-in. Core never installs it, and a scan of a page without it gives the same result as before. It contains no `eval`, and the init-script APIs below run it whatever the page's Content Security Policy says.

### Installing it

Install it with your driver's API for scripts that run before a page's own, so it is in place before any component attaches internals. A frame is its own realm, with its own `attachInternals`, so the hook must run in every frame you scan; the Playwright, Puppeteer and CDP calls below do that for every frame, and again after each navigation.

```js
const { internalsHookScript } = require('@surea11y/core');

// Playwright
await page.addInitScript({ content: internalsHookScript() });

// Puppeteer
await page.evaluateOnNewDocument(internalsHookScript());

// Chrome DevTools Protocol (Selenium's CDP access, a CDP session)
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: internalsHookScript() });

// WebDriver BiDi (script.addPreloadScript takes a function's source)
await bidi.send('script.addPreloadScript', {
  functionDeclaration: `() => {\n${internalsHookScript()}\n}`
});
```

Cypress runs the app in a frame of its own, and fires `window:before:load` with that frame's window before the app's scripts run. Register the handler before `cy.visit` (in a `beforeEach`, say); `cy.visit(url, { onBeforeLoad: (win) => win.eval(internalsHookScript()) })` does the same for one visit. Cypress strips the app's Content Security Policy by default; if yours keeps it and forbids `eval`, this form can't run. Frames inside the app don't get it this way.

```js
import { internalsHookScript } from '@surea11y/core';

cy.on('window:before:load', (win) => win.eval(internalsHookScript()));
```

On a page you build yourself, the same script as the first `<script>` in `<head>` works too.

### What the scan reports with it

With the hook installed early, the engine reads the internals of every element that attached them, wherever the component keeps them. The checkbox above gets its name "Subscribe" and its `aria-checked`, so `binary-control-name-present` and `aria-required-attr` pass. A defined custom element that never attached internals is no longer a question either: the hook saw every call, so the element is judged by its attributes and content, and a `<x-plain role="button">` with no name fails `button-name-present` instead of asking.

A role works the same way. A component can give itself a role through its internals, with no role attribute:

```js
customElements.define(
  'x-toggle',
  class extends HTMLElement {
    #internals;
    constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#internals.role = 'switch';
    }
  }
);
```

```html
<x-toggle></x-toggle>
```

The browser exposes it as a switch, so it needs a name like any switch (4.1.2). HTML makes that role the element's default role, the one a tag gives a native element, which a role attribute overrides. With the hook, or with internals kept on a property, the engine reads it in that place: `binary-control-name-present` fails the unnamed `<x-toggle>` above, and passes it once `this.#internals.ariaLabel` names it. The same holds for every rule that applies to a role whatever gave it: the other name rules, `aria-allowed-attr` and `aria-prohibited-attr`, `nested-interactive-controls-absent`, `presentational-children-focusable-absent`, `label-in-name`, `target-size-minimum`, the landmark, heading and link rules, and the context and owned elements of `aria-required-parent` and `aria-required-children`. The rules ACT scopes to an explicit role, the role attribute (`aria-required-attr`, and which containers `aria-required-children` and `aria-prohibited-children` judge), leave it out, as they leave out a native element's role.

Without the hook, a role kept in a private field can't be read, and the element has no role for the scan, as before. The engine doesn't ask about it: nearly every custom element on a page could have one, so every component would become a question. Install the hook to have these roles checked.

The result says whether the hook was there, in `engine.environment.internalsHook` (see [`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md)):

```js
result.engine.environment.internalsHook;
// 'early': installed before the page's scripts
// 'late': installed after they ran (or the page replaced attachInternals after it)
// undefined: no hook in this document
```

Each frame's result in a cross-frame result records its own frame's.

### Early and late

The hook records only what is attached after it is installed. `early` means it was installed while the document was still loading (`document.readyState === 'loading'`), which an init script is and a `page.evaluate` after the page has loaded is not. An early hook has seen every `attachInternals` call, so an element it has no record of has no internals.

A late hook can only add what it sees from then on:

```js
await page.goto(url);
await page.evaluate(internalsHookScript()); // late: the components are already built
```

Here `<x-check>`, built before the hook, is asked about as without it, and so is the element that never attached internals, since a late hook can't tell it from one that attached them earlier. An `<x-check>` the page creates after the hook (a dialog it opens, a list it renders) is read. The result says `internalsHook: 'late'`.

The readyState test is the closest a script can get: `customElements` can't list what is already defined, and internals attached earlier leave no trace. A script that runs while the document is loading but after some of the page's own scripts (one placed after them in the markup) is recorded as early though it missed what they did; install it with an init script, or as the first script in the page.

Where the document has already loaded but none of its code has run yet, the readyState test can't tell. That is the case in a jsdom test environment (Jest, Vitest): the setup file runs after the document has loaded and before the test defines any component, in the same window. There, say so: `internalsHookScript({ early: true })` records the hook as early whatever the document's state.

```js
// jest.setup.js or vitest.setup.js, before any component is imported
const { internalsHookScript } = require('@surea11y/core');
window.eval(internalsHookScript({ early: true }));
```

`early: true` is a promise you make: that no code of the page's or the test's has run before it. If one has, an element that attached internals before the hook is judged on its markup, as if it had none. Only the first copy installed in a window counts, so install it once, first.

### What a page can notice, and the limits

- `HTMLElement.prototype.attachInternals` is no longer the browser's own function: its source isn't `[native code]`, and it is not the same object as a fresh frame's. Its name, `length` and property attributes are the same, and it is no constructor, like the original.
- A stack trace taken inside a call to it has one more frame.
- `Symbol.for('surea11y.internals')` is defined on the global, not enumerable, and can't be changed or removed.
- Any script in the page can read any element's internals through it, as the scan does, so a component's private internals are no longer private. Install it for test and audit runs, not in pages you serve to users.
- A polyfill or library that replaces `attachInternals` after the hook takes over. If it still calls the method it replaced, the hook keeps recording; either way the engine treats the hook as late, since internals could now be handed out without it seeing them.
- Elements that attached internals before the hook was installed are not read; see above.
- A browser or driver with no way to run a script before the page's own (WebDriver classic on its own, a tool that only scans after load) can only install it late.
- A page can define `Symbol.for('surea11y.internals')` itself. The engine reads it only where it has the hook's shape (a real `WeakMap`, read with core's own `WeakMap.prototype.get`, holding real `ElementInternals`) and runs none of the page's getters, but a page that forges one is lying to its own scan.
- Without the hook, a role set only through internals kept in a private field is not seen, and the element is not asked about; see above and [`LIMITATIONS.md`](./LIMITATIONS.md#environment-dependent--depends-on-how-you-run-it).

## Seeing listeners added from script: the listener hook

### The problem

The keyboard rules read handlers from the markup. Most pages add theirs from script, where no page script can list them afterwards:

```html
<div class="save" role="button" tabindex="0">Save</div>
<script>
  document.querySelector('.save').addEventListener('click', save);
</script>
```

The browser fires `click` from Enter and Space only on native controls, so this button does nothing from the keyboard: a 2.1.1 failure. Without the hook the scan can't see the listener, so `click-handler-keyboard-operable` doesn't report the element at all. Written with `onclick="save()"`, it would have been asked about.

### What the hook does

`listenerHookScript()`, from `@surea11y/core`, returns a script to run in the page before the page's own scripts. It wraps `EventTarget.prototype.addEventListener` and `removeEventListener`, and the setters of the handler properties (`el.onclick = fn`, `document.onkeydown = fn`). Each call goes to the browser's own method with the same `this` and arguments, the page gets back what the browser returned, and an error it throws reaches the page unchanged. Listeners are not wrapped: the page removes one with the same function it added, and an event reaches it as before. The wrappers keep the methods' names, `length` and property attributes. Installing it twice in a page wraps once.

It records, for each element, the document and the window, which listeners it has of the types the rules ask about: `click`; `keydown`, `keyup` and `keypress`; `focus`, `blur`, `focusin` and `focusout`; and `mouseover`, `mouseout`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave` and `dblclick`. A listener of any other type is passed straight through. The record is a `WeakMap` under `Symbol.for('surea11y.listeners')` on the global, so it keeps no element alive.

It is opt-in. Core never installs it, and a scan of a page without it gives the same result as before. It contains no `eval`.

### Installing it

The same way as the internals hook, with your driver's API for scripts that run before a page's own, in every frame:

```js
const { listenerHookScript } = require('@surea11y/core');

// Playwright
await page.addInitScript({ content: listenerHookScript() });

// Puppeteer
await page.evaluateOnNewDocument(listenerHookScript());

// Chrome DevTools Protocol
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: listenerHookScript() });

// Cypress, before cy.visit
cy.on('window:before:load', (win) => win.eval(listenerHookScript()));
```

Both hooks can be installed together; each is its own script.

### What the scan reports with it

- **`click-handler-keyboard-operable`** judges an element with a click listener of its own as it judges one with an inline `onclick`, and counts a key listener on the element, or on something in it, as a key handler: the button above passes once it also listens for `keydown`. If the element is in the tab order, has the `button`, `link`, `checkbox` or `switch` role, and an early hook saw no key listener on it, inside it, above it, on the document or on the window, it fails (`CLICK_HANDLER_NO_KEY_LISTENER`): no key event reaches a handler, so Enter and Space do nothing. A key listener only above the element, on an ancestor, the document or the window, is asked about (`CLICK_HANDLER_KEY_LISTENER_ABOVE`). It may handle this element's keys or only others'.
- **A click listener on a container is the container's.** A framework that delegates events adds its listeners to its root element or the document, not to each button. Nothing says which element such a listener serves, so it makes no element inside a candidate. On such a page the scan sees the root's listeners, and judges its buttons by their markup, as without the hook.
- **`mouse-only-event-handlers`** asks about an element with a pointer listener added from script, named as its attribute (`onmouseover`), unless the element has a keyboard equivalent: a key, focus or blur listener, or `focusin`/`focusout`, which also fire for a focused element inside it. It still never fails: a pointer listener may only track the pointer or draw a hover effect.
- **`widget-keyboard-focusable`** leaves an element with a click listener to `click-handler-keyboard-operable`, as it does one with an inline `onclick`.

The result says whether the hook was there, in `engine.environment.listenerHook`: `'early'`, `'late'`, or absent without one.

### Early and late

As with the internals hook, `early` means it was installed while the document was still loading, which an init script is. An early hook has seen every listener the page added, so a missing one proves there is none; only then does `click-handler-keyboard-operable` fail for lack of a key listener. A late hook, installed after the page's scripts ran, sees only what is added afterwards, and the rule asks instead (`CLICK_HANDLER_NO_KEY_HANDLER`). `listenerHookScript({ early: true })` records it as early whatever the document's state, for a jsdom test setup that runs before the code under test:

```js
// jest.setup.js or vitest.setup.js
const { listenerHookScript } = require('@surea11y/core');
document.querySelector('*'); // see below
window.eval(listenerHookScript({ early: true }));
```

jsdom's selector engine adds `keydown` and `keyup` listeners to the window the first time a selector runs, for its own `:focus-visible`. Installed before that, the hook records them as the page's, and every element reads as having a key listener above it. Run one selector first, as above. A real browser adds no such listeners.

### What a page can notice, and the limits

- `addEventListener`, `removeEventListener` and the handler property setters are no longer the browser's own functions: their source isn't `[native code]`. Their names, `length` and property attributes are the same. A stack trace taken inside a call has one more frame.
- `Symbol.for('surea11y.listeners')` is defined on the global, not enumerable, and can't be changed or removed. Any script in the page can ask it which elements have listeners. Install it for test and audit runs, not in pages you serve to users.
- Each call costs a little more: in Chromium about 1.5 µs the first time a target gets a listener of one of the recorded types, and 0.2 µs for a repeated add or remove, measured with 12,000 listeners on 3,000 elements.
- A listener added with `once`, or with a `signal` that later aborts, is still recorded after it goes: the hook does not wrap listeners to learn when. A listener the page added is what the rules judge.
- An inline handler attribute (`onclick="…"`) is not a call to either method, so the hook doesn't record it; the rules read those from the markup, as before.
- A library that replaces `addEventListener` after the hook takes over; the engine then treats the hook as late.
- A page can define `Symbol.for('surea11y.listeners')` itself. The engine reads it only where it has the hook's shape, and runs none of the page's getters.

## A time limit on a scan

A scan runs in one go inside the page, and nothing in the page can stop it once it has started: a page getter or a rule that never returns blocks that tab for good. Limit the time from where you start the scan, and give up on the tab when the limit passes: your time limit stops the wait, not the script running in the page, so close that tab and use a new one. 60 seconds is far above what a normal page takes (most finish in well under a second), so it only catches the broken ones:

```js
// Playwright or Puppeteer: page.evaluate has no time limit of its own.
async function scanWithin(page, ms, scan) {
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`the scan took longer than ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([scan(), late]);
  } catch (err) {
    // The tab may still be busy with the scan: close it, and use a new one.
    await page.close().catch(() => {});
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// The browser bundle (Pattern 3) defines window.a11ycore in the page; it
// works the same in Playwright and Puppeteer.
const fs = require('node:fs');
await page.evaluate(fs.readFileSync(require.resolve('@surea11y/core/browser'), 'utf8'));

const result = await scanWithin(page, 60_000, () =>
  page.evaluate(() => window.a11ycore.runa11yCoreInPage(location.href, null, {}, null))
);
```

In jsdom (Pattern 1) the scan runs on Node's own thread, so a timer there can't fire until it ends: run the scan in a worker thread or a child process, and end that when the limit passes. A CI job's own time limit is the last resort for both.

## Scoping a scan to part of the page

Pass a CSS selector as the 2nd argument (`contextSelector`) to scan one subtree instead of the whole document — e.g. `runDomRulesInPage(url, '#app', {}, null)` to skip a surrounding CMS chrome you don't control. Pass an array of selectors (or a single comma-separated selector string) to scan multiple, possibly disjoint regions in one run — e.g. `runDomRulesInPage(url, ['#header', '#main'], {}, null)`. A selector that matches nothing scans nothing rather than the whole page: check `result.contextMatch.elementCount` before you report a scoped scan as clean. An invalid selector throws. See [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) for the full `contextSelector` reference and for `excludeSelectors`, the complementary "skip specific elements anywhere" option.

## Reporting by criterion: letting users choose checks

(This and more, for any tool built on core, is in [`BUILDING_ON_CORE.md`](./BUILDING_ON_CORE.md).)

A tool that reports by WCAG criterion (a conformance view, a checklist per criterion, a VPAT draft), and lets its users run only some checks, can use three things together. [`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md#which-criteria-a-scan-reports) has the reference.

- **The criteria of the checks you run come back.** Name the checks your user picked (`runOnly: { includeRuleIds: [...] }`, or `engineOptions.rules.include`), and `rulesResults` holds the rollup of each criterion they check: a failing check fails it. A criterion only some of whose checks ran comes back `cantTell`, with `data.details.reasonCode` `composite.rollup.cantTell.notSelectedChild` and each check that didn't run marked `notSelected: true` among the contributors. Show such a criterion as "partly checked", never as passed. The HTML report does: "Partly checked: 1 of 2 checks were not selected for this scan". A criterion tag (`tags: ['wcag143']`) gives that criterion alone.
- **Say which conformance target the scan is for.** Pass `engineOptions.wcagVersion` and `engineOptions.wcagLevel` with the checks. Criteria above the level, or outside the version, are left out, so a run of "only the contrast checks" of a 2.2 AA audit reports 1.4.3, not 1.4.6 (AAA), though `contrast-computable` checks both. Neither option changes which checks run. Unlike version/level tags beside the rule ids, they don't drop a named check that has no WCAG tag, such as a best-practice or custom one. The result says what applied: `engine.wcagVersion`, and `engine.wcagLevel` when you gave one.
- **Know what a scan will cover before running it.** `getRulesForRunOnly(runOnly, engineOptions)` lists the rollups a scan with that selection and those options reports, and `getChecksForRunOnly(runOnly, engineOptions)` the checks it runs. Both use the scan's own logic, packs and custom rules included, so a coverage summary, a plan shown before a long crawl, or a record of what each run checked matches what the results will hold. Each check result's `rollupIds` then names the criteria it counted toward.

```js
const engineOptions = { wcagVersion: '2.2', wcagLevel: 'AA' };
const runOnly = { includeRuleIds: picked }; // the checks your user chose

const criteria = getRulesForRunOnly(runOnly, engineOptions).map((r) => r.id); // before the scan
const result = runDomRulesInPage(url, null, engineOptions, runOnly);
for (const rollup of result.rulesResults) {
  const partly = rollup.data.details.contributors.some((c) => c.notSelected);
  console.log(
    rollup.ruleId,
    partly && rollup.outcome !== 'fail' ? 'partly checked' : rollup.outcome
  );
}
```

A standard's own requirements (a pack's standard or checklist) come back the same way while the standard is in play: under its profile, or with its tag selected or unlocked through `optInRules`. A WCAG scan doesn't show them.

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
- For "only fail on _new_ violations," the CLI has a built-in baseline/allowlist mechanism (`--write-baseline`/`--baseline`, see [`BASELINE.md`](./BASELINE.md)). Calling the library directly, the same matching logic is available as `buildBaselineEntries(result)`/`matchBaseline(result, baselineEntries)` from `require('@surea11y/core/baseline')` — or diff `checksResults` against a saved prior run yourself if your pages don't fit that model (see `BASELINE.md`'s "known limitation").
- Prefer Pattern 1 (jsdom) in CI unless you specifically need real-browser layout — it avoids the extra weight of a Puppeteer/Playwright + browser-binary install in your pipeline.

## Browser extension context

`runa11yCoreInPage` is also the right function for a content-script/DevTools-panel context — inject it the same way you'd inject any content script, call it directly (no serialization step needed there since it's already running in the page's own realm), and it has no dependency on the extension's own execution environment beyond a standard DOM.

### Cross-frame scanning (including cross-origin)

`runa11yCoreInPage` only ever scans the single document it runs in — it has no visibility into `<iframe>` content, same-origin or not. For most uses that's fine (rules apply to the current document; a consumer running once per frame, e.g. once per content-script injection into `all_frames: true`, already covers every frame independently). But sometimes you want ONE scan's result to include what's inside embedded frames too — payment widgets, cookie-consent dialogs, third-party embeds — which is what the cross-frame functions below are for.

`runa11yCoreAcrossFrames`/`a11yCoreEnableFrameResponder` are a separate, additive pair of functions for exactly this — not needed at all if you're driving the browser with Puppeteer/Playwright (see "Pattern 2" above): an automation driver already reaches every frame unconditionally via CDP, which is strictly _better_ than what's described here. This exists specifically for when there's **no automation driver** — a plain script/bundled widget/browser extension running inside the page itself, fully subject to the same-origin policy.

**How it works**: a parent frame's `runa11yCoreAcrossFrames()` call pings each direct child `<iframe>`/`<frame>` via `postMessage`; if — and only if — that child has _also_ called `a11yCoreEnableFrameResponder()` (its own opt-in to being scannable from above), it runs its own scan and replies with the result, which the parent includes. **A non-cooperating frame (the common case for most third-party embeds you don't control) is simply unreachable** — the same-origin policy allows no way around it from inside the page.

**Who a responder answers**: the frame that embeds it, and nothing else. Enabling the responder is consent to be scanned _from above_, not by anything that can reach you — a sibling frame can obtain a reference through `parent.frames[i]` and `postMessage` to you across origins, and a scan result carries `occurrences[].html`, which is DOM content the same-origin policy otherwise makes unreadable to it. A `run` command whose sender is not the direct parent is ignored, as is one arriving at a window nothing embeds. Replies are matched the same way: only the frame a request was addressed to can answer it, so another window cannot settle a scan in flight by naming its id. The relay is hop-by-hop — a grandchild is reached through its own parent — so a legitimate request always arrives from the direct parent.

```js
// Inside the embedded/child page (e.g. a widget's own bundle), once, at load:
const { a11yCoreEnableFrameResponder } = require('@surea11y/core');
a11yCoreEnableFrameResponder(); // opts this frame in to being scanned from above

// Inside the parent page:
const { runa11yCoreAcrossFrames } = require('@surea11y/core');
const result = await runa11yCoreAcrossFrames(null, null, {}, null);

console.log(result.topFrame.checksResults.filter((r) => r.outcome === 'fail')); // this document's own findings
for (const frame of result.frames) {
  if (frame.error) continue; // unreachable -- no cooperating responder, or it timed out
  console.log(frame.topFrame.checksResults.filter((r) => r.outcome === 'fail')); // that frame's findings
  // frame.frames holds ITS OWN nested children, recursively -- a tree, not a flat list
  // (unlike Playwright's .frames(true), which can flatten since page.frames() already
  // gives every frame regardless of nesting depth; a postMessage relay can't know about
  // a grandchild without asking through its own child first).
}

// The reporters take the tree as it is, every frame included:
const { renderSarifReport } = require('@surea11y/core/sarif');
const sarif = renderSarifReport(result);
```

A few things worth knowing:

- **Custom rules reach the child frames** as their source: `postMessage` can't carry a function, so a `runInPage` or `applicability` given as one is sent as its `toString()`, which the frame turns back into a function. A frame whose Content Security Policy forbids `'unsafe-eval'` skips such a rule and says so in its `skippedCustomRules`.
- **Async, unlike the other two runners** — `postMessage` round-trips can't be synchronous, so this is a separate, Promise-returning pair rather than an `engineOptions` flag on `runa11yCoreInPage` (which stays synchronous, unchanged, for every existing caller).
- **`engineOptions.pingWaitTime`** (default `500`ms) and **`engineOptions.frameWaitTime`** (default `60000`ms) control how long a child frame gets to answer a ping and a full run request respectively.
- **No jsdom/Node equivalent** — this is browser-only. jsdom's window/frame model doesn't meaningfully represent independent-realm cross-origin `postMessage`, and the feature has no purpose in Node anyway.
- **Bundler-free, like `runa11yCoreInPage`** — raw-source injection (a bookmarklet, a content script with no build step) still works with no bundler, but the slice you inject has to start at the `// SELF-CONTAINED in-page runner` marker rather than at the cross-frame block. `runa11yCoreAcrossFrames` scans its own frame by calling `runa11yCoreInPage`, so the two travel together. Everything from that marker to `module.exports` is one contiguous chunk with no `require()` in it. If you _do_ use a normal bundler/`require`/`import`, that works too, unchanged.
- **Cost**: these two functions used to carry their own private copy of the rule catalog and helpers, which put the catalog in `src/core.js` three times over and took the file to ~4.3MB. They share `runa11yCoreInPage`'s copy now, so there is one copy to grow as rules are added.
- **No origin check on the sender**: a responder answers its embedding frame whatever that frame's origin (see "Who a responder answers" above). Running a read-only scan and replying with DOM-derived results isn't a privileged operation; the content involved is no more sensitive than what's already rendered on the page.
