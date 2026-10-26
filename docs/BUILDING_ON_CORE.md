# Building tools on core

This guide is for people building a tool that runs `@surea11y/core` and does something with its results: a command line, a binding for a test runner, a CI integration, a browser extension, a dashboard, an audit or conformance-report generator. Core's own [CLI](https://github.com/SureA11y/cli#readme) and the browser bindings ([`@surea11y/playwright`](https://github.com/SureA11y/playwright#readme) and the others in the README's [Which package do I need?](../README.md#which-package-do-i-need)) are tools of exactly this kind, and are good places to see the patterns below in use.

Core decides what each check found. Your tool decides when to scan, which checks to run, and how its users see and act on the results, and that is where the mistakes this guide warns about happen: a page that wasn't scanned shown as clean, a `cantTell` counted as a pass, a passing criterion read as conformance.

It doesn't restate the reference. Each section says what core gives a tool, what to rely on and what to watch for, and links to the page that has the details.

- [1. What you can rely on](#1-what-you-can-rely-on)
- [2. Running a scan](#2-running-a-scan)
- [3. Choosing what to check, and knowing it in advance](#3-choosing-what-to-check-and-knowing-it-in-advance)
- [4. Presenting results](#4-presenting-results)
- [5. Comparing runs and tracking findings](#5-comparing-runs-and-tracking-findings)
- [6. Letting your users extend it](#6-letting-your-users-extend-it)
- [7. A checklist for a new tool](#7-a-checklist-for-a-new-tool)

The `js` examples run in order, as one script, in core's tests (`tests/building-on-core-guide.test.js`), so they stay correct as core changes. Examples marked `js browser` need a page and a browser driver, and are not run.

## 1. What you can rely on

**The contract.** [`API_STABILITY.md`](./API_STABILITY.md) says what semver covers: the [stable result fields](./API_STABILITY.md#stable-fields-covered-by-semver), the [entry points](./API_STABILITY.md#package-entry-points-covered-by-semver) (`@surea11y/core` and its subpaths: `/report`, `/sarif`, `/junit`, `/earl`, `/baseline`, `/wcag`, `/en301549`, `/pack`, `/testing`, `/browser`, ...), and the [extension points](./API_STABILITY.md#extension-points). Build on what it lists as supported. The root also exports a few internal names (`CHECK_DEFS`, `COMPOSITE_RULES`, `__internal`, ...) that may change in any minor release; `scripts/data/public-api.json` classifies every export, and a test keeps it complete.

**Two versions.** `engine.version` is the core release that produced a result, and `engine.schemaVersion` the version of the result's shape. A result's content can change between releases while its shape stays the same, so record both.

**Determinism.** The same page with the same options gives the same result: the engine reads no clock and no randomness. `engineOptions.timestamp` is yours to pass (`new Date().toISOString()`), and `profileRules` is the one option that adds timings that differ between runs. So a tool can diff results, cache them, and snapshot-test them.

**What to store with every result.** A result read later, or by someone else, needs the conditions it was taken under. They are all on `result.engine` ([`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md#top-level-result)):

```js
const { JSDOM } = require('jsdom');
const core = require('@surea11y/core');

// Scan an HTML string in Node (Pattern 1 of INTEGRATION.md): the runners
// read `document` and `window` as globals.
function scanHtml(html, engineOptions = {}, runOnly = null) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return core.runDomRulesInPage('https://example.test/', null, engineOptions, runOnly);
  } finally {
    dom.window.close();
  }
}

const PAGE =
  '<!doctype html><html lang="en"><head><title>Shop</title></head><body><main>' +
  '<img src="logo.png"><a href="/cart"></a>' +
  '<p style="color:#777;background:#fff">Free delivery on orders over 50 euros</p>' +
  '</main></body></html>';

const result = scanHtml(PAGE, { wcagVersion: '2.2', wcagLevel: 'AA', timestamp: '2026-10-13T12:00:00Z' });

// What a stored result needs beside it to be read later.
const { version, schemaVersion, wcagVersion, wcagLevel, profile, packs, mappings, locale, environment } =
  result.engine;
const record = {
  core: version,
  schemaVersion,
  wcagVersion,
  wcagLevel: wcagLevel || null, // the level the criteria were gated by, when the scan had one
  profile: profile || null, // present only when a profile applied
  packs: packs || [],
  mappings: mappings || [],
  locale: locale.resolved,
  layout: environment.layout // false in jsdom: no layout, so layout rules can't decide
};
```

`engine.profile` is present only when the profile you asked for applied; an unknown name, or a selection of your own that overrides it, leaves it out with a warning. A tool that offers profiles should check it rather than assume.

## 2. Running a scan

[`INTEGRATION.md`](./INTEGRATION.md) covers this in full. In short:

- **Which runner.** `runDomRulesInPage` in the same Node process as core; `runa11yCoreInPage` handed to another realm, such as a browser driver's `page.evaluate`; the standalone bundle (`@surea11y/core/browser`) in a page with no driver; `runa11yCoreAcrossFrames` for frames, cross-origin ones included. See [Which runner function to use](./INTEGRATION.md#which-runner-function-to-use).
- **When to scan.** A page still loading fonts or images gives layout rules something else to measure. `waitForPageReady` waits for it, with a time limit, and never rejects ([Waiting for the page](./INTEGRATION.md#waiting-for-the-page-before-a-scan)). Put your own time limit where you start the scan ([A time limit on a scan](./INTEGRATION.md#a-time-limit-on-a-scan)).
- **Part of a page.** `contextSelector` scopes a scan. A selector that matches nothing scans nothing: `result.contextMatch.elementCount === 0` means "not scanned", never "clean". Show it as not scanned, and say the selector found nothing, rather than as a page with no findings ([Scoping a scan](./INTEGRATION.md#scoping-a-scan-to-part-of-the-page)).
- **What no later script can read.** Three opt-in hooks run before the page's own scripts, as an init script, and let a scan see what it otherwise can't: `internalsHookScript()` the `ElementInternals` custom elements keep private, `listenerHookScript()` the listeners a page adds from script, and `liveRegionHookScript()` what its live regions are given. `HOOK_REASON_CODES` lists the reason codes each one decides or changes, for a tool that documents them ([`BINDING_AUTHORS_GUIDE.md`](./BINDING_AUTHORS_GUIDE.md#the-hooks)).
- **Style sheets from another origin.** A page's script can't read them, so the rules that read CSS ask about them. Pass their text in `engineOptions.styleSheetTexts`: `preloadStyleSheets()` fetches those a server shares from inside the page, and a tool driving the browser can fetch the others from outside it ([Style sheets from another origin](./INTEGRATION.md#style-sheets-from-another-origin)).
- **In a page or an extension.** Inject the browser bundle, and the locale side file for a language other than English ([Scanning in a language other than English](./INTEGRATION.md#scanning-in-a-language-other-than-english)). Packs reach a page through `packScript` ([Packs in a page](./INTEGRATION.md#packs-in-a-page)).

```js browser
// A driver-based tool (Puppeteer here): page.evaluate serializes the function
// into the page, which is why runa11yCoreInPage carries everything it needs.
const { runa11yCoreInPage } = require('@surea11y/core');
await page.goto(url);
const result = await page.evaluate(runa11yCoreInPage, url, null, { wcagVersion: '2.2', wcagLevel: 'AA' }, null);
```

Playwright's `page.evaluate` takes a single argument, so it needs a small wrapper: see [Pattern 2](./INTEGRATION.md#pattern-2--a-real-browser-via-puppeteer-or-playwright).

Results from jsdom and from a browser differ for rules that need a layout (`target-size-minimum`, `text-spacing-content-loss`, the geometry part of the contrast rules): `engine.environment.layout` says which kind of scan it was. [`LIMITATIONS.md`](./LIMITATIONS.md#environment-dependent--depends-on-how-you-run-it) lists what each environment can decide.

## 3. Choosing what to check, and knowing it in advance

[`ENGINE_OPTIONS.md`](./ENGINE_OPTIONS.md) is the reference.

**A conformance target.** `runOnly: { wcag: { version: '2.2', level: 'AA' } }` runs the rules for that target's criteria, and `bestPractices: true` adds the rules that test no criterion ([Selecting which rules run](./ENGINE_OPTIONS.md#selecting-which-rules-run)). A profile (`engineOptions.profile: 'section508'`, or a pack's) names a standard instead ([Conformance profiles](./ENGINE_OPTIONS.md#conformance-profiles)).

**Letting users pick checks.** Name the checks, and say the conformance target with `wcagVersion` and `wcagLevel`: they decide which criteria are reported without changing what runs. Version and level tags beside the rule ids would also drop named checks that carry no WCAG tag, such as best-practice or custom ones ([Which criteria a scan reports](./ENGINE_OPTIONS.md#which-criteria-a-scan-reports)).

**Knowing what a scan covers before running it.** `getChecksForRunOnly(runOnly, engineOptions)` lists the checks a selection runs, and `getRulesForRunOnly(runOnly, engineOptions)` the criteria it reports. They use the scan's own selection, packs and custom rules included, so a coverage plan, a confirmation before a long crawl, or a record of what each run checked matches what the results will hold:

```js
const engineOptions = { wcagVersion: '2.2', wcagLevel: 'AA' };
const runOnly = { includeRuleIds: ['img-alt-present', 'link-name-present', 'contrast-computable'] };

const willRun = core.getChecksForRunOnly(runOnly, engineOptions).map((c) => c.ruleId);
const willReport = core.getRulesForRunOnly(runOnly, engineOptions).map((r) => r.id);
// willReport: 1.1.1, 1.4.3, 2.4.4 and 4.1.2 -- not 1.4.6 (AAA), which
// contrast-computable also checks.

const picked = scanHtml(PAGE, engineOptions, runOnly);
const reported = picked.rulesResults.map((r) => r.ruleId);
if (reported.join() !== willReport.join()) throw new Error('the plan and the scan disagree');
```

**Building a picker.** `getChecksCatalog(engineOptions)` and `getRulesCatalog(engineOptions)` list every check and criterion, with titles in the scan's locale, tags, WCAG criteria and severities; `@surea11y/core/wcag` has every WCAG 2 criterion with its level per version, title and links; `getProfileWcagTarget(profile)` gives the WCAG target a profile comes to. `describePacks(packs)`, from `@surea11y/core/pack`, lists what each pack brings, for a tool that lets users choose packs.

**Options your users write.** A tool that takes options from a config file or the command line should pass `strictOptions: true` (or let users turn it on): a misspelt option or a value of the wrong type then throws `INVALID_ENGINE_OPTIONS` with every problem listed, instead of a warning in a log nobody reads ([Catching mistakes in the options](./ENGINE_OPTIONS.md#catching-mistakes-in-the-options-strictoptions)). A selection with an include list that names no rule or tag throws `INVALID_RUN_ONLY` either way; one whose parts cancel each other out, so that no rule runs, warns, and throws under `strictOptions`.

## 4. Presenting results

[`OUTPUT_SCHEMA.md`](./OUTPUT_SCHEMA.md) is the reference.

**By check or by criterion.** `checksResults` holds one result per check that ran, `rulesResults` one per criterion (and per requirement of another standard in play). Each check result's `rollupIds` names the criteria it counted toward, so a tool can go from either to the other.

**`cantTell` is a result, not a failure to report.** It means a person has to decide: it is neither a violation nor a pass. The engine reserves `fail` for what it can decide without guessing, and says `cantTell` with a reason where it can't ([Outcome values](./OUTPUT_SCHEMA.md#outcome-values)). So:

- show it apart from fails and passes, as "needs review";
- show why: an occurrence's `uncertainty.code` is a closed vocabulary to branch on, and `uncertainty.needed` says what would settle it ([Uncertainty codes](./OUTPUT_SCHEMA.md#uncertainty-codes));
- show how to answer it: each `cantTell` occurrence of a core rule carries `howToCheck`, a few steps and what a person sees if it passes or fails ([How to check](./OUTPUT_SCHEMA.md#how-to-check));
- show which way it points, where the page gives evidence: `lean` (`toward: 'pass'` or `'fail'`, with why and a caution). It is still a question ([`LEANS.md`](./LEANS.md));
- keep it out of failure counts, and never count it as a pass.

To sort a review queue as core's reporters do, read each occurrence with `reviewGroupOf(check, occurrence)` (`'fail'`, `'leanFail'`, `'leanPass'` or `'open'`) and `occurrenceOutcome(check, occurrence)`, rather than the check's outcome: one rule's findings can sit in different groups.

A tool that drops `cantTell`, or counts it as a pass, reports more confidence than the engine has.

**A criterion checked in part** is `cantTell` with `reasonCode` `composite.rollup.cantTell.notSelectedChild`, and the checks the scan didn't select are marked `notSelected` among its contributors. Show it as "partly checked", never as passed:

```js
function criterionStatus(rollup) {
  const { contributors } = rollup.data.details;
  const notSelected = contributors.filter((c) => c.notSelected).length;
  if (rollup.outcome === 'fail') return 'fails';
  if (notSelected) return `partly checked (${contributors.length - notSelected} of ${contributors.length} checks)`;
  if (rollup.data.details.reasonCode === 'composite.rollup.cantTell.partialCheck') return 'checks passed, needs review';
  if (rollup.data.details.reasonCode === 'composite.rollup.cantTell.partialCoverage') return 'nothing found to check, needs review';
  return { pass: 'passes its checks', cantTell: 'needs review', notApplicable: 'not applicable' }[rollup.outcome];
}

const statuses = Object.fromEntries(picked.rulesResults.map((r) => [r.ruleId, criterionStatus(r)]));
```

**A criterion whose checks all pass is not a conformance claim, and no WCAG rollup says `pass`.** A WCAG criterion passes only when its rules check all it asks, and none does yet (`COMPLETE_CHECK` in `src/coverage/complete-applicability.js` is empty): where every check of a criterion came back clean on the page as it was scanned, its rollup is `cantTell` with `reasonCode` `composite.rollup.cantTell.partialCheck`. The parts the checks cover are met, and a person checks the rest. Show it apart from other `cantTell`s if you like ("checks passed, needs review"), never as passed. Likewise, a criterion whose rules all found nothing to check is `notApplicable` only where they find every case it applies to (2.4.3, 2.4.4, 2.4.7, 2.4.9, 2.5.3 and 4.1.1, listed in the same file); for any other it is `cantTell` with `composite.rollup.cantTell.partialCoverage`, since content no rule looks for may still be there. The same holds for a standard's requirement that restates WCAG criteria or is marked partial; a `pass` comes only from a standard's own requirement its rules check in full. Even then, say what was checked, what needs review and what no check covers, and don't call a criterion, a page or a product conformant on the strength of passes ([What this engine cannot tell you](./WCAG_CONFORMANCE.md#what-this-engine-cannot-tell-you)).

**Results in a tool that uses AI.** A result is structured evidence, which makes it usable input for a model that explains findings, drafts fixes or sorts `cantTell` cases for a reviewer. Keep the two apart: store and show the engine's outcome, rule and uncertainty as they are, and mark what the model adds as its suggestion. A model's reading of a `cantTell` is not the engine settling it, and a suggested fix is not a verified one until a scan or a person confirms it. Occurrences carry the page's markup and text, so treat a result as page content before sending it to an outside service.

**Ready-made outputs.** `@surea11y/core/report` renders an HTML report, `/sarif` SARIF for code-scanning dashboards, `/junit` JUnit XML for CI test views, and `/earl` EARL for audit tooling ([`REPORT.md`](./REPORT.md), [`SARIF.md`](./SARIF.md), [`JUNIT.md`](./JUNIT.md), [`EARL.md`](./EARL.md)). Each is a pure function of a result, saved or fresh, cross-frame or not; build your own view only for what they don't show. A build that gates on failures can also gate on the undecided findings that lean fail, without gating on every question: `renderJunitReport(result, { leanFailAs: 'failure' })` and `renderSarifReport(result, { leanFailAs: 'error' })`, with `leanFailWcagOnly: true` to leave out best-practice rules; `leaningFailures(result)` lists the findings such a gate counts ([`LEANS.md`](./LEANS.md#for-people-building-tools)).

```js
const { renderSarifReport } = require('@surea11y/core/sarif');
const { renderJunitReport } = require('@surea11y/core/junit');

const sarif = JSON.parse(renderSarifReport(result));
const junit = renderJunitReport(result);
```

**Large runs.** `engineOptions.output: { detail: 'findings' }` keeps whole only the results that report something (an empty page's result goes from about 264 KB to 91 KB), and the reporters read them as full results ([`output.detail`](./ENGINE_OPTIONS.md#engineoptions--the-rest)).

**Other standards.** `engineOptions.mappings` (or a standard's profile) names each result's requirements in another standard, such as EN 301 549, and `result.standards` describes the standards a result names, so a stored result renders the same wherever it is read ([Other standards](./ENGINE_OPTIONS.md#other-standards-mappings)).

**Languages.** `locale` translates titles, summaries and hints; `engine.locale` says which dictionary was used, and whether it was complete ([Knowing which locale you actually got](./I18N.md#knowing-which-locale-you-actually-got)). Each occurrence keeps its translation keys and parameters (`i18n`), for a tool with dictionaries of its own.

## 5. Comparing runs and tracking findings

**Finding identity.** Match findings across runs by identity, not by selector, which shifts when unrelated markup changes. A finding is `ruleId` + `reasonCode` + its element's `html` ([Finding identity](./API_STABILITY.md#finding-identity)). A reason code doesn't change once shipped, except when a minor release splits it by cause or gives one to a rule that had none: a baseline written by the release before keeps matching for one minor release, and `migrateBaselineEntries` rewrites it to the new codes ([Upgrading](./BASELINE.md#upgrading)). `@surea11y/core/baseline` matches a scan against recorded findings, which is how "fail only on new violations" works ([`BASELINE.md`](./BASELINE.md)):

```js
const { buildBaselineEntries, matchBaseline } = require('@surea11y/core/baseline');

const baseline = buildBaselineEntries(result); // store this, e.g. as JSON in the repository
const later = scanHtml(PAGE.replace('<a href="/cart"></a>', '<a href="/cart">Cart</a><button></button>'));
const { newCount, knownCount, staleCount, newOccurrences } = matchBaseline(later, baseline);
// The unnamed link was fixed (stale), the unnamed button is new.
```

**Close calls.** `getMargins(result)` lists, for each measuring check, the element that came closest to its threshold while meeting it, so a tool can flag a contrast of 4.52:1 against 4.5:1 before it becomes a failure ([`margin`](./OUTPUT_SCHEMA.md#a-check-result-checksresultsi)).

```js
const closest = core.getMargins(scanHtml(PAGE.replace('#777', '#767676')));
```

**Frames.** A cross-frame result is a tree; `flattenCrossFrameResult(result)` lists every frame with its path, as the reporters read it, and a plain result as one entry ([Cross-frame result](./OUTPUT_SCHEMA.md#cross-frame-result-runa11ycoreacrossframes)).

```js
for (const { frame, result: frameResult, error } of core.flattenCrossFrameResult(result)) {
  // frame.path is [] for the page itself; a frame that didn't answer has `error`.
}
```

## 6. Letting your users extend it

- **Packs** bring an organisation's rules, stricter variants of core's rules, a standard or a checklist, and their messages, from a package of their own ([`PACKS.md`](./PACKS.md)). A tool passes them in `engineOptions.packs`, and into a page with `packScript`. `@surea11y/core/pack` has `packScript`, and `describePacks` for a picker.
- **Custom rules** (`engineOptions.customRules`) are one-off rules for one call ([`customRules`](./ENGINE_OPTIONS.md#customrules--runtime-registered-rules)).
- **Show what didn't run.** A pack or custom rule that is invalid, or that the selection leaves out, is listed in `skippedPacks` or `skippedCustomRules` with the reason, and the scan runs without it. Show those lists to your users: otherwise a rule they wrote reads as one that passed.

```js
const checked = scanHtml(PAGE, {
  customRules: [{ id: 'shop-cart-link', meta: { title: 'The cart link says what it is' } }] // no runInPage
});
const skipped = checked.skippedCustomRules; // [{ id: 'shop-cart-link', reason: '...' }]
```

## 7. A checklist for a new tool

- Store `engine.version`, `schemaVersion`, `wcagVersion`, `wcagLevel`, `profile`, `packs` and `locale.resolved` with every result ([section 1](#1-what-you-can-rely-on)).
- Check that `engine.profile` is there when you asked for a profile.
- Treat `contextMatch.elementCount === 0` as "not scanned".
- Show `cantTell` as "needs review", with its uncertainty, its `howToCheck` steps and its lean, and a partly checked criterion as such; never fold either into a pass.
- Don't count `occurrences.length` without looking at the outcome: a pass or `notApplicable` can carry an occurrence that describes the scan.
- Show `skippedPacks` and `skippedCustomRules`.
- Keep what the engine found apart from what your tool, or a model, adds to it.
- Pass `strictOptions: true` for options your users write.
- Name the conformance target (`runOnly.wcag`, a profile, or `wcagVersion` and `wcagLevel`) rather than leaving it to defaults.
- Pin `timestamp` in snapshot tests; leave `profileRules` off when you diff results.
- Match findings by identity, not by selector.
- Use the ready-made reporters where they fit.
- Build on the supported exports and entry points only ([`API_STABILITY.md`](./API_STABILITY.md)).
