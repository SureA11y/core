# Packs in the browser and the reporters — findings

- **Setup:** branch `audit/2026-10-stress-test-3` at `eaa5d3f1` (core 1.10.0 in `package.json`), Node 22.14.0, Playwright 1.62.1 with its Chromium.
- **Running a probe:** `node <probe>.js` from this folder.
  - `lib.js` holds the shared helpers: a page served at `https://example.test/` by route, the root bundle, `packScript`, and a jsdom scan through `src/index.js`.
  - `10b` and `10c` read what `10a` writes into `out/`.
  - `out/*.txt` hold the outputs of the confirming run.
- **[V]:** re-run and seen again. Every finding below is [V]. PB-5 and PB-14 were also checked again during consolidation.

| ID | Title | Severity | Category |
|---|---|---|---|
| PB-1 | Packs registered by separate `packScript` calls can't be combined, and a subset can't be named; the scan runs without them | medium | contract |
| PB-2 | `packs: ['__proto__'/'constructor'/'toString']` throws a TypeError once any pack is registered | low | bug |
| PB-3 | No check that the page bundle matches the core that made the pack script; rules or whole packs silently drop | medium | contract |
| PB-4 | `packScript` writes code that doesn't parse for some valid functions; the whole pack is then missing in the page (same root as PN-10) | medium | bug |
| PB-5 | A line break in a pack name or version ends the script's comment, and the rest runs as code | medium | security |
| PB-6 | `</script>` in a rule's source breaks `buildBrowserBundle` output inlined in a `<script>` element; what follows runs | medium | security |
| PB-7 | A rule that isn't self-contained passes in Node and in `@surea11y/core/testing`, but is `cantTell` in a page (same as PT-1) | medium | ergonomics |
| PB-8 | Occurrence data that isn't JSON-safe (circular, BigInt) is returned as it is, so `JSON.stringify(result)` throws | medium | bug |
| PB-9 | `ctx.helpers` is shared and writable: one pack rule can turn later core failures into `notApplicable` | medium | contract |
| PB-10 | No time limit: a pack rule with an infinite loop hangs the page for good | low | contract |
| PB-11 | No cap on occurrences: 100k from one rule gives a 15 MB result and a 95 MB SARIF log | low | perf |
| PB-12 | Without a usable `standards` array, a pack standard's rollups render as "WCAG S1", and its SARIF tags and JUnit properties disappear | medium | bug |
| PB-13 | A compact result (`output.detail: 'findings'`) of a pack scan loses titles and the pack standard's mappings in every reporter | medium | bug |
| PB-14 | A checklist's items reach neither SARIF nor JUnit, although the docs say they do | medium | doc |
| PB-15 | Collisions between packs aren't caught: two checklists with one title share a section; a rollup id can equal another pack's rule id | low | contract |
| PB-16 | Rule ids are checked only for their prefix (NUL, bidi characters and HTML are accepted); a NUL in an id lets a baseline entry match another rule | low | contract |
| PB-17 | In a page, named packs that weren't applied leave no trace in the result, and the warning is misleading | low | ergonomics |
| PB-18 | A page's own `__surea11yPacks` (frozen, a string, a getter, or a cross-origin frame with that name) breaks registration or makes every pack scan throw | low | bug |
| PB-19 | The in-page pack path depends on the page's `Object.assign`; core's path without packs doesn't | low | bug |
| PB-20 | No reporter names `engine.packs`, `skippedPacks` or `overriddenBuiltinIds` | medium | feature |
| PB-21 | The documented `addScriptTag({content})` route fails under a nonce CSP or Trusted Types | low | doc |
| PB-22 | The HTML report keeps NUL and bidi override characters from pack texts as they are | low | security |
| PB-23 | A rollup whose `checksIds` isn't an array makes `renderHtmlReport` throw; a repeated `standards` entry renders its section twice | low | bug |
| PB-24 | The pack script carries core's whole catalog: 210 KB for a one-rule pack | low | perf |

## PB-1: Separately registered packs can't be combined, and a subset can't be named

- **Repro:** `01-inject-order.js`, cases d3, e, f2, f3 and f4.
- **How registration works:** the registry key is the sorted, comma-joined names of one `packScript` call.
- **Cases that silently run no pack:**
  - `packScript([A])` then `packScript([B])`, with the scan naming `[A,B]`;
  - `packScript([A,B])`, with the scan naming only `A`;
  - a name given twice;
  - v1 and v2 of one pack registered separately and both named.
- **What happens instead:** no `engine.packs` and an "unregistered" warning; under `strictOptions` they throw.
- **What works:** naming `[B,A]` after `packScript([A,B])`.
- **Expected:** the docs (PACKS.md §8, ENGINE_OPTIONS "In a page") don't say the names must be exactly one call's set. Either the page combines registered packs, or the docs and the warning say so.
- **Code:** `scripts/build-core.js:1883-1893` (generated as `src/core.js:76064`), `src/pack.js:718-720`, `src/pack.js:728`.

## PB-2: Inherited property names as pack names throw

- **Repro:** `01-inject-order.js`, cases g.
- **Observed:**
  - With any pack registered, `packs: ['__proto__' | 'constructor' | 'toString' | 'hasOwnProperty']` throws `TypeError: Cannot convert undefined or null to object`.
  - The lookup returns `Object.prototype` or a function and reads it as a registry entry.
  - With no pack registered, the same names warn correctly.
- **Code:** `scripts/build-core.js:1892`, where there is no own-property check, then `packCatalog` at `:1869-1872`.

## PB-3: No check that the page bundle matches the script's core

- **Repro:** `02-version-skew.js`.
- **Case 1, the released 1.10.0 bundle with a pack script from this tree:**
  - The scan silently runs without the pack, even under `strictOptions`.
  - There is no warning and no `engine.packs`.
- **Case 2, a script referencing a built-in implementation the bundle lacks:**
  - `contrast-minimum` and the pack's variant of it vanish from `checksResults`: 134 results instead of 136.
  - The WCAG 1.4.3 rollup vanishes too.
  - There is no warning, and `engine.packs` still lists the pack.
- **Expected:** the script records its core version, and the runner refuses or warns on a mismatch or a missing implementation.
- **Code:** `src/pack.js:698-735` (no version embedded), `scripts/build-core.js:1871-1873` (`builtIn.impls[impl]` used unchecked).

## PB-4: `packScript` writes code that doesn't parse for some valid functions

- **Repro:** `08-packscript-text.js` case c; `09-closure-parity.js` second case.
- **Cause:** `functionExpression` treats a source as an arrow function only when it matches `\([^)]*\)`.
- **Shapes that break:**
  - `(ctx = String()) => …` and `(ctx /* ) */) => …`, which are written as `({ (ctx = String()) => … })[""]`;
  - bound and native functions, which become `(function () { [native code] })`.
- **Effect:**
  - The script doesn't parse.
  - `addScriptTag` doesn't reject; Chromium only reports a pageerror.
  - Nothing registers, and the scan warns "register them" (PB-17).
  - In Node the same pack runs (`fail`).
- **Expected:** `packScript` writes working code or throws. At a minimum it checks that its own output parses (`new Function(script)`).
- **Code:** `src/pack.js:678-685`.

## PB-5: A line break in a pack's name or version runs as code

- **Repro:** `08-packscript-text.js` case a.
- **Cause:** line 1 of the script is `// Packs for @surea11y/core in a page: ${engine.packs.join(', ')}.`.
- **Values that ran code** (each set `window.__injected` on injection):
  - the name `x\nwindow.__injected="name";//`;
  - the same name with U+2028 instead of `\n`;
  - the version `1.0.0\nwindow.__injected="version";//`.
- **Why they get through:**
  - `checkPack` accepts any non-empty name.
  - `parseVersion` (`/^v?(\d+)\.(\d+)\.(\d+)/`) checks only a prefix, so `1.0.0<script>…` and `1.0.0\n…` count as versions and appear in `engine.packs`.
- **Expected:** names and versions are written as data (JSON), and a version must be a whole version.
- **Code:** `src/pack.js:722`, `src/pack.js:63-65`, `src/pack.js:136-139`.

## PB-6: `</script>` in a rule's source breaks an inlined bundle

- **Repro:** `08-packscript-text.js` case b.
- **Setup:** `buildBrowserBundle({packs})` placed in a `<script>` element, with a rule whose source contains `</script><script>…</script>`.
- **Observed:**
  - `a11ycore` is never defined ("Invalid or unexpected token"), and no pack registers.
  - The `<script>` inside the rule's source ran (`window.__injected === 'inline'`).
  - The catalog data is escaped (`scriptJson`), but function sources are not.
  - Core's own bundle contains no `</script`.
- **Expected:** the bundle can be inlined as core's can (escape `<\/` in sources), or the restriction is documented.
- **Code:** `src/pack.js:687`, `src/pack.js:700-709`, `src/pack.js:742-747`.

## PB-7: A rule that isn't self-contained passes in Node and fails in a page

- **Repro:** `09-closure-parity.js` first case. Same issue as PT-1.
- **Observed:**
  - A rule that reads a module-level `const GENERIC` gives `fail` in Node. That is how `@surea11y/core/testing` runs a pack's tests: with the function object, not serialized.
  - In Chromium, after `packScript`, it gives `cantTell` with `"GENERIC is not defined"`.
  - Neither `packScript` nor the lint rules look for free variables.
- **Expected:** the pack's tests, `packScript` or a lint rule catch this. PACKS.md does say rule code must be self-contained.
- **Code:** `src/pack.js:698-718`, `src/testing.js`.

## PB-8: Occurrence data that isn't JSON-safe is returned as it is

- **Repro:** `06-hostile-rules.js`, cases "circular data.details" and "function/Symbol/BigInt/DOM".
- **Values that make `JSON.stringify(result)` throw:** a circular object or a BigInt in `occurrence.data.details` stays in the result, in Node and in the page.
- **Values that are silently changed:**
  - a DOM element becomes `{}` in Node and `"ref: <Node>"` via Playwright;
  - a `Map` becomes `{}`;
  - functions and Symbols vanish.
- **Probes vs rules:** probes are sanitized; rule output is not.
- **Expected:** rule output made JSON-safe as probes are, or the rule reported as an error.
- **Code:** occurrence handling in `src/core/dom-runner.js`, which has no equivalent of `sanitizeProbeValue` (`src/core/dom-runner.js:1095`). The path is shared with `customRules`.

## PB-9: One pack rule can change what every later rule sees

- **Repro:** `06-hostile-rules.js`, cases "replaces shared helpers" and "mutates the DOM".
- **Replacing helpers:**
  - A rule that sets `ctx.helpers.queryAllSmart = () => []` and `reportOccurrence = () => {}` turns `img-alt-present` and `link-name-present` from `fail` into `notApplicable` in the same scan, in Node and Chromium.
  - The next scan without the pack is back to `fail`.
- **Changing the page:**
  - A rule that removes the images before core's rules run changes `img-alt-present` from 2 occurrences to 1.
  - The DOM stays changed after the scan.
- **Expected:** helpers that one rule can't replace for others (frozen, or one object per rule), and a stated rule that rules don't change the page.
- **Code:** `src/core/dom-runner.js:1062` (`sharedHelpers`), `src/core/dom-runner.js:1507`.

## PB-10: No time limit on a pack rule

- **Repro:** `06b-hang-and-volume.js` case a.
- **Observed:**
  - With a rule `for(;;){}`, `page.evaluate` had not returned after 8 s.
  - The page didn't answer `evaluate(() => 1)` 3 s later.
  - This can't be interrupted from inside the page, and the docs don't mention it.
- **Expected:** document it, with the host-side remedy: a timeout around `evaluate`, then closing the page.

## PB-11: No cap on occurrences

- **Repro:** `06b-hang-and-volume.js` with `N=25000/50000/100000`; `06c-occurrence-scaling.js`.
- **Result size:** 100,000 occurrences on one element are all kept, giving 15.4 MB of JSON. Returning it through `page.evaluate` took 15.6 s.
- **The in-page scan itself is linear:** 46 ms for 40k occurrences on one element, 197 ms for 40k distinct elements.
- **Reporter output sizes:**

| Reporter | Size | Time |
|---|---|---|
| SARIF | 94.6 MB | 1.4 s |
| HTML | 19 MB | |
| JUnit | 6.7 MB | |
| Baseline | 8.1 MB | |

- **Expected:** a cap per rule with a note that it was reached, or duplicates on one element folded.

## PB-12: Without a usable `standards` array, pack rollups render as WCAG criteria

- **Repro:** `10a-store-pack-results.js`, then `10b-render-stored.js`.
- **Control:** stored Chromium results, rendered in a process with no pack, match the scan as long as `standards` is intact.
- **When `standards` is unusable, `standardsOf` falls back to the built-in registry.** Unusable means any of these:
  - missing;
  - an object, a string or `[]`;
  - entries without a string `key` or `standard`;
  - the standard renamed.
- **What the reporters then show:**
  - **HTML:** the "WCAG rollup" table shows "WCAG S1/S5/S6/S8" and "WCAG acme-item".
  - **SARIF:** every `sample-S*` tag is lost.
  - **JUnit:** the `sample` properties are lost.
  - Nothing says the block was unreadable.
- **Same label elsewhere:** a rollup whose `meta.standard` names a standard that isn't listed also gets "WCAG S1".
- **Expected:** a mapping to another standard is never labelled WCAG, and an unreadable block is reported (or standards are read from the rollups' `meta.standard`).
- **Code:** `src/scan-result.js:201-205`, and `src/report.js:371-373`, which takes the label from `normativeMappings[0].requirement` without checking its standard.

## PB-13: Compact pack results lose titles and mappings in the reporters

- **Repro:** `10a` writes `10-sample-compact*.json`; `10c-compact-without-pack.js` reads them.
- **Setup:** `output.detail: 'findings'` with profile `sample-1.0`. `expandCompactResult` reads each pass and notApplicable back using core's catalog only.
- **Pack rules:**
  - They come back titled by their id, with no mappings.
  - In SARIF, `sample-title-length [accessibility,automatic]` replaces `Page titles are short [… sample-S5, sample]`.
- **Core rules mapped to the pack standard lose those mappings:**
  - `area-alt-present`: S2
  - `aria-hidden-body`: S8
  - `heading-order`: S4
  - `img-alt-decorative`: S3
- **No way around it:** the pack's profile is ignored without a warning, and the reporters take no `packs` option.
- **Expected:** ENGINE_OPTIONS.md:330 says "the reporters read it as a full result".
- **Code:** `src/scan-result.js:110-140`.

## PB-14: Checklist items reach neither SARIF nor JUnit

- **Repro:** `10b` with `10-checklist.json`. Neither output contains `acme-item`.
- **Observed:**
  - `rulesResults` has `acme-item: fail`, and the HTML report shows it.
  - SARIF has only the namespace tag `acme`, on the rule tagged with it.
  - Neither output has an item tag, an item property or the item's outcome.
- **Expected:** what the docs promise:
  - PACKS.md §5: "SARIF and JUnit tag them".
  - ENGINE_OPTIONS.md:509 and the comment at `src/pack.js:353-359`: "their SARIF tags and JUnit properties".
- **Cause:** the checklist's `mappingsFor` returns `[]` (`src/pack.js:381`), and `src/junit.js` `frameSuites` groups composites only by WCAG criterion.

## PB-15: Collisions between two packs aren't caught

- **Repro:** `11-two-packs-and-baselines.js`, cases a and d2.
- **Same title:**
  - Two checklists both titled "Policy" put two entries with the same name in `standards`.
  - The HTML report shows one section holding both packs' items, because reporters match standards by name.
- **Same id:**
  - A rollup `zz-item` and another pack's rule `zz-item` (the same namespace is allowed) both run under `optInRules: ['zz']`.
  - `checksResults` and `rulesResults` then share that id.
- **Expected:** these throw at prepare time, as a duplicate key or profile name does.
- **Code:** `src/report.js:698`, `src/scan-result.js:222`, `src/core/prepare-catalog.js:49-73`.

## PB-16: Rule ids are checked only for their prefix

- **Repro:**
  - `11` case f;
  - `12-en301549.js` (`ee-own-sc`);
  - an inline id loop: ids with `<img onerror>`, spaces, NUL, U+202E and 5,000 characters all ran.
- **Where ids end up:** SARIF `ruleId`, JUnit names and baseline keys.
- **Baseline matching:**
  - With the id `dd-k\u0000R`, the baseline entry `{ruleId:'dd-k', reasonCode:'R\u0000DEFAULT'}` matches its finding, because `\u0000` is the key separator.
  - An object `reasonCode` is stored raw in baseline entries.
  - `reasonCode: 0` becomes `DEFAULT`.
- **Criteria:** `wcagSc: ['9.9.9']` is accepted and produces the SARIF tag `wcag-9.9.9`.
- **Expected:**
  - ids limited to the characters core's own ids use;
  - `reasonCode` a string;
  - `wcagSc` a real criterion.
- **Code:** `src/pack.js:179-185`, `src/baseline.js:101-106`.

## PB-17: In a page, unapplied packs leave no trace in the result

- **Repro:** `01`, `04-iframes.js` case b, `09`.
- **Observed:**
  - When named packs aren't applied, the result has no marker. A Node scan lists them in `skippedPacks`.
  - Only `console.warn` reports it.
  - The warning says "register them in the page", even when they are registered under another set.
- **Expected:** a field on the result, and a warning that lists the names asked for and the sets registered.
- **Code:** `src/core/dom-runner.js:931-944`.

## PB-18: A page's own `__surea11yPacks` breaks registration

- **Repro:** `03-hostile-pages.js` cases 08, 09, 10 and 13.

| What the page has at `__surea11yPacks` | Effect |
|---|---|
| A string, or a frozen object | The pack script throws, and the scan falls back |
| A getter-only property | The registration is lost silently |
| `<iframe name="__surea11yPacks">` on another origin, reached through window named access | The pack script throws `SecurityError`, and so does every scan naming packs |
| An element with `id="__surea11yPacks"` | Works, by accident |

- **Expected:** a registry the page can't take over (a symbol, or a property the bundle defines), and a fallback instead of a throw.
- **Code:** `src/pack.js:726`, `scripts/build-core.js:1889-1893`.

## PB-19: The in-page pack path depends on the page's `Object.assign`

- **Repro:** `03b-patched-builtins-no-packs.js`.
- **Observed:**
  - With `Object.assign = t => t`, a scan without packs works (134 results), while naming a pack throws a TypeError.
  - Patching `Array.prototype.map` or replacing `Map` breaks core with or without packs, so those aren't specific to packs.
- **Code:** `src/pack.js:728`, `scripts/build-core.js:1869-1880`, `scripts/build-core.js:1940`.

## PB-20: No reporter names the packs

- **Repro:** `15-reports-name-packs.js`.
- **Setup:** the scan used `@g/pack@3.1.4`, which overrides `img-alt-present`, plus a pack skipped for its core range.
- **Observed:**
  - None of HTML, SARIF, JUnit or EARL mentions `engine.packs`, `skippedPacks` or `overriddenBuiltinIds`.
  - The override reports under core's id and title.
  - EARL's assertor release is core's version only.
- **Expected:** packs and their versions in each report's run information (SARIF `tool.extensions`, JUnit properties, the HTML meta bar), and skipped packs visible.
- **Code:** `src/report.js:183` (meta bar), `src/sarif.js`, `src/junit.js:386`, `src/earl.js:116-128`.

## PB-21: The documented injection route fails under a strict CSP or Trusted Types

- **Repro:** `03-hostile-pages.js` cases 20–26.
- **Blocked:** under `script-src 'nonce-abc'` or `require-trusted-types-for 'script'`, `addScriptTag({content})` is blocked for both the bundle and the pack script. That is the route the docs show.
- **Works:** `page.evaluate(script)` and `bypassCSP: true`. The script needs no `eval`.
- **Gap:** the docs' "runs where a CSP forbids eval" holds only for pages that allow inline scripts, and the in-repo test uses only `'unsafe-inline'`.
- **Expected:** the docs name the route that works on strict pages.

## PB-22: NUL and bidi controls are kept in the HTML report

- **Repro:** `07-reporters-hostile-text.js`.
- **What held:** no payload ran. Every pack text is escaped, and a `javascript:` help URL is dropped.
- **What didn't:** the HTML keeps raw U+0000 and U+202E from rule titles and summaries, so the displayed text can be reordered.
- **Other reporters:** SARIF keeps `\u0000`, which is valid JSON. JUnit strips both.
- **Expected:** control characters removed, and bidi controls isolated or removed in the HTML.
- **Code:** `src/report.js:122-127` (`esc`).

## PB-23: Malformed rollup data makes the HTML report throw

- **Repro:** `10b-render-stored.js`.
- **Observed:**
  - A string `data.details.checksIds` makes `renderHtmlReport` throw "checksIds.join is not a function". The other reporters are fine.
  - A standard listed twice in `standards` renders its section twice.
- **Code:** `src/report.js:403`, `src/report.js:458`, `src/report.js:701-706`.

## PB-24: The pack script carries core's whole catalog

- **Repro:** `14-per-scan-overhead.js`.
- **Size:** a one-rule pack script is 210 KB: `checkDefs` is 178 KB and composites 22 KB. It duplicates what the 1.02 MB bundle already holds, and it is injected per frame.
- **Time:** per-scan overhead is negligible, 0.52 ms with or without the pack.
- **Code:** `src/pack.js:718-731`.

## Held up

- **Injection order:**
  - pack before or after the bundle;
  - the same pack twice;
  - two versions registered, each one named;
  - names given in another order.
- **Repeated scans:**
  - the registry entry is not changed by a scan;
  - no new globals after 30 scans and 30 re-injections;
  - the heap stays flat at 10 MB over 200 scans with DOM churn (`13`).
- **Hostile but tolerated pages:**
  - AMD `define`, and CommonJS `module`/`exports`;
  - a patched `JSON.stringify`;
  - a registry entry planted by the page;
  - the pack's name set on `Object.prototype`;
  - a page-set `a11ycore`;
  - an element with `id="__surea11yPacks"`.
- **Strict pages:** nonce CSP, `script-src 'self'` and Trusted Types all work when the scripts are injected with `page.evaluate`. No `eval` or `new Function` is needed.
- **Frames:** with the script injected per frame, the pack runs in same-origin, cross-origin and srcdoc frames. A frame without the script warns.
- **Parity:**
  - jsdom: results and warnings are deep-equal over 12 option sets (`05b`).
  - Chromium vs Node: the only differences are in layout rules, the same as the no-pack control. The `standards` block and `engine.packs` match (`05`).
  - EN 301 549 clauses on pack rules and overrides match too (`12`).
- **Badly behaved rules** are handled the same way in both runtimes:
  - throwing or async rules;
  - undefined, string or unknown outcomes;
  - non-array occurrences;
  - a detached node, or `window` as the node.
- **Reporter output validity:**
  - SARIF with hostile texts is valid against 2.1.0.
  - JUnit stays well-formed with NUL, control characters, U+FFFE, a lone surrogate and `]]>`.
  - EARL round-trips through JSON.
- **Baselines:** entries and SARIF fingerprints are stable across a pack version bump and a rule reorder (0 new, 2 known, 0 stale).
- **Stored JSON:** with the `standards` block intact, results render without the pack exactly as with it. `null` entries and an unknown extra standard in the block are ignored.
- **Duplicate ids:** two packs defining one rule id throw, naming both.

## Missing tests

- Pack registration:
  - separate `packScript` calls;
  - naming a subset of a registered set;
  - a name given twice;
  - inherited property names as names.

  (PB-1, PB-2)
- A pack script paired with a bundle of another version (PB-3).
- `functionExpression` with defaults, comments in parameters, bound and native functions, plus an "output parses" check (PB-4).
- Names or versions with line terminators, and an inlined bundle with `</script>` in a rule (PB-5, PB-6).
- A rule with a module-level variable, run in a page (PB-7).
- Rules returning circular or BigInt data, and rules mutating `ctx.helpers` (PB-8, PB-9).
- Chromium under a nonce CSP and under Trusted Types (PB-21).
- Reporters given a missing or malformed `standards` field, or a compact pack result (PB-12, PB-13).
- Checklist items in SARIF and JUnit (PB-14).
- Two checklists with one title, and a rollup id equal to a rule id (PB-15).
- Reporters naming packs (PB-20).
- Any reporter test fed by a pack scan run in Chromium.
