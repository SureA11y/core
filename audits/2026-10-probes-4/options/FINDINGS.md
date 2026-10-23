# Stress test 4: options, packs and custom rules

Prefix **OP**. 7 confirmed bugs; none crashes a scan. Engine: 1.11.1 plus Unreleased, at `3af2008`, under jsdom. Scripts in this folder: `h.js` and `p.js` are shared helpers, `t1.js`–`t16.js` the probes (`node tN.js`); `verify-b1.js` re-runs OP-1 (re-run during consolidation: reproduces). The `cli/` packs the probe scaffolded are not kept.

OP-1 is the worst: 18 options of the wrong type are dropped with no warning though the docs promise one. OP-2 and OP-3 can make a pack's checks disappear; OP-2 is easy to hit by following the guide.

## Confirmed

### OP-1. Many options of the wrong type are ignored without the promised warning (medium)
ENGINE_OPTIONS.md:388: "**Always**, a value of the wrong type is warned about and read as not given". Without `strictOptions`, 18 options are dropped silently; under `strictOptions` they all throw, so the check finds them, but its result is thrown away.
```js
runDomRulesInPage(null, null, { output: { detail: 'finding' } });   // full output, no warning
runDomRulesInPage(null, null, { contrast: { mode: 'auditor' } });   // strictConformance, no warning
runDomRulesInPage(null, null, { locale: 5 });                       // no warning; engine.locale.requested says "en"
runDomRulesInPage(null, null, { excludeSelectors: 5 });             // nothing excluded, echoed as 5
```
- **Silent:** `locale`, `excludeSelectors`, `mappings`, `messages`, `policyContract`, `policy`, `output`, `contrast`, `rules` (non-object), `tags`, `tests`, `visibilityMode` (also echoed as given), `output.detail`, `contrast.mode`, `contrast.rootCanvasFallback` when not a string (documented to warn), `policy.allowedOutcomes` as a string, `pingWaitTime`, `frameWaitTime`.
- **Warn as documented:** `profile`, `timestamp`, `wcagLevel`, `wcagVersion`, `includeMode`, `optInRules`, the on/off options.
- **Cause:** `src/core/engine-options.js:268`, `if (p.kind === 'invalid' && !p.onOff && p.path !== '') continue;`, which assumes each option's own reading warns about another wrong type; most have none.
- **Fix:** warn for every `invalid` problem unless the option is on an explicit list of options that warn themselves.

### OP-2. A checklist pack whose namespace-tagged rule sets `meta.wcagSc` passes `definePack` and `checkPack`, then every scan skips it (medium)
```js
definePack({ name:'@aaa/p', version:'1.2.0', namespace:'aaa', core:'^1.11.1',
  profiles:{ 'aaa-p':{ tags:[] } },
  rules:[{ id:'aaa-r', meta:{ tags:['aaa'], wcagSc:['1.1.1'] }, runInPage:()=>({outcome:'pass'}) }] });
// definePack ok, checkPack [] → scan skippedPacks:
// "normative mappings: en301549 maps aaa-r, a rule of the standard tagged aaa: map a core rule or one of its own"
```
- Fine without `profiles`/`rollups`, or when the rule lacks the namespace tag.
- Through the scaffold: `surea11y-pack new acme-sc --name @acme/a11y-pack`, then `wcagSc: ['2.4.4']` in `rules/automatic/acme-link-text-specific.js`: the pack's own `npm test` warns the whole pack was skipped, naming EN 301 549, which the author never used.
- **The docs invite it:** PACKS.md §3 shows a namespace-tagged rule with `wcagSc: [] // the WCAG criteria it checks, if any`; ENGINE_OPTIONS.md says such a rule "counts only in that standard's own rollups".
- **Cause:** `src/coverage/standards.js:296-302` (`validateProfileIndependence`). EN 301 549's `mappingsFor` maps any rule from its `wcagSc`, and the checklist turns the namespace into a standard `ruleTag`.
- **Fix:** have EN 301 549 (and any WCAG-derived standard) skip rules owned by another standard's tag, or ignore `wcagSc` on them as the docs suggest; or report it in `definePack`/`checkPack` with a clear message and document it in PACKS.md §3.

### OP-3. `packScript` writes code that parses but isn't the rule's function (medium-low)
`functionExpression` (`src/pack.js:1089-1096`) only checks that the text parses. The method form `({ <src> })[fn.name]` can parse and evaluate to something else.
```js
const K='run'; const m={ [K+'X'](ctx){ return {outcome:'fail'}; } };
// runInPage: m.runX → in the page, registration throws "K is not defined": none of the script's packs registers
const o={ runInPage(ctx){ return {outcome:'fail',occurrences:[{__node:ctx.document.body}]}; } };
Object.defineProperty(o.runInPage,'name',{value:'other'});
// script holds  run: ({ runInPage(ctx){…} })["other"]  → undefined
// in the page: runOnly ['acme-r'] gives checksResults: [], no error, no warning; in Node: fail
```
- Also: a Symbol-keyed method (registration throws); a getter used as `runInPage` (rule missing).
- The docs say a function with no writable source makes the pack invalid and that the script "is checked to parse"; these get through.
- **Fix:** accept the method form only when `src` starts with `fn.name` as a plain identifier or string literal (optionally after `async`/`*`), and refuse computed keys; or evaluate the expression in an empty `vm` context and check it gives a function whose `toString()` equals `src`.

### OP-4. A variant's settings take NaN, ±Infinity, 0 and negatives (medium-low)
```js
variants:[{ id:'acme-cv', from:'contrast-minimum', config:{ normalTextRatio: NaN /* Infinity, 0, -1 */ }, meta:{…} }]
// text at 5.74:1: NaN/Infinity → pass (4.5 default used); 0/-1 → pass (nothing ever fails); 7 → fail
```
- `src/core/rule-variants.js:75-80` checks only `typeof`; settings whose default is `null` (`boldLargeMinPx`) take any type. The base rule (`src/checks/automatic/contrast-minimum.js:116`) quietly swaps a non-finite value for the default.
- **Fix:** require finite numbers (> 0 for ratios, or let a rule declare ranges) and report in `definePack`.

### OP-5. `surea11y-pack new` writes packs that are invalid as generated (low)
- `new t --title WCAG` (or `--kind standard --title "EN 301 549"`) exits 0; `checkPack` gives `[]`, but every scan skips the pack ("its standard is named "WCAG", as one of core's is") and `packScript` throws.
- `new t --name ' '` exits 0; the generated `index.js` throws on load. Only problems starting with `name "` become errors (`src/pack-scaffold.js:161-163`).
- `--title 'Policy __NAMESPACE__ __PACKAGE__'` writes "Policy t t-tok": `fill()` runs over the title `fillTitle()` inserted (`src/pack-scaffold.js:132-133`, `154`).
- `--name=a --name=b`: last wins, silently.
- **Fix:** run the full `checkPack` (standard-name clashes included) before writing, refuse any `name` problem, fill tokens before inserting the title.

### OP-6. Strict pack errors in Node have no `code: 'INVALID_ENGINE_OPTIONS'` (low)
```js
runDomRulesInPage(null, null, { strictOptions:true, packs:[definePack({...p, core:'^0.1.0'})] }); // TypeError, code undefined
```
- Also uncoded: a name string in the list, overlapping namespaces, a cached skipped pack. Coded: `packs` not a list, and the in-page "not run" path.
- **Where:** `src/pack.js:1004`, `1028`, `1046`, and `1033` ("passed twice"). **Fix:** set `err.code`.

### OP-7. The `strictOptions` warning is wrong for a Symbol and missing for a BigInt (low)
- `{strictOptions: Symbol()}` warns "must be true or false, not **undefined**"; `{strictOptions: 10n}` warns nothing (`JSON.stringify` throws inside a `try` that swallows it).
- **Where:** `src/core/engine-options.js:246-249`. **Fix:** use `describe(given)`.

## Plausible leads
- **OP-P1. A throwing Proxy or getter escapes as an uncoded error** in `engineOptions`, `contrast`, `output`, `policy`, `rules`, `messages`, `customRules.length`, and in a pack object (scans, `checkPack` and `describePacks` all throw the raw `PACK_OWNKEYS`), even under `strictOptions`. The caller's own exception propagating is defensible, but `describePacks` exists to list untrusted packs and should describe an unreadable one as a problem. `probes` as a Proxy is handled well.
- **OP-P2. `strictOptions` doesn't catch the CI mistakes that matter most.** An unknown `profile` (the scan then runs every rule), unknown `mappings` or `optInRules` tags, invalid CSS in `excludeSelectors` only warn under strict, while an unknown `rules[ruleId]` or a pack profile naming a missing rule throws. The docs say strict throws on a value "outside its set".
- **OP-P3. An `applicability` that returns a non-boolean** (undefined, 0, NaN, `'false'`) makes the rule apply with no note; a forgotten `return` runs it everywhere. A Promise already gets an `error` (`dom-runner.js` ~2141).
- **OP-P4. `contrast.rootCanvasFallback` accepts non-colours:** `'inherit'`, `'currentColor'` (measured as black), `'rgb(1,2,3,4,5)'`, `'rgb(1,2,3,)'` (lenient `parseCssColorToRgba`). `auditorAssist` only.
- **OP-P5. `packScript` refuses `</script` in rule code but not `<!--<script`**, which puts an inline script in the HTML "double-escaped" state so the real `</script>` no longer ends it. Matters only for `buildBrowserBundle` output inlined into HTML.
- **OP-P6. Holes in pack lists are handled inconsistently:** `rules: [ , ]` passes and runs while `rules: [null]` is invalid; a profile `rules: [ , 'x']` passes `definePack` but is skipped at scan time; under strict, `excludeSelectors: [ , , 'main']` passes because `every` skips holes.
- **OP-P7. Problems `definePack` could find statically are found only at scan time:** a variant without `meta.i18n.titleKey`, a profile `severity` naming no rule, a rollup `checksIds` naming no rule. PACKS.md tells authors to rely on `definePack`.

## Improvements
- **Perf:** `distance()` (`src/core/engine-options.js:131-148`) has no length cutoff: 10k unknown top-level keys add ~2.3 s, one 100k-character key ~1.6 s. Skip pairs whose lengths differ by more than 2.
- **Perf:** each new (equal but not identical) pack object takes ~140 ms to prepare; the cache is by identity. Document reusing pack objects, or key the cache by structure.
- `packScript([])` returns a 210 KB script registering nothing. Return `''` or throw.
- `engineOptions` as a `Map` or `Date`, or with options inherited through the prototype or a class getter, is read as `{}` silently. Warn.
- **Docs:** PACKS.md:257 and :232 say "a pack never passed through definePack" is skipped, but such packs run (reword to "an invalid pack never passed through definePack"); PACKS.md says `ctx.rule` has "its id", but the field is `ctx.rule.ruleId`; document OP-2's restriction or remove it.
- A custom rule id with trailing whitespace (`'img-alt-present '`) is trimmed and overrides the built-in; it is in `overriddenBuiltinIds`, but the warning doesn't say whitespace was trimmed.
- No time limit on a pack or custom rule; rules are synchronous, so a loop hangs the scan. Document it beside "load only packs you trust".

## Checked and holding up
- **Prototype pollution:** `__proto__`, `constructor`, `toString`, `hasOwnProperty` as locale, profile, `mappings`, `optInRules`, `rules` keys, `policy`/`policyContract`, message locales and keys, pack dictionaries, severity maps, profiles, overrides, probes, exclude, rollup `checksIds` and custom rule ids: no pollution, every rejection clean.
- **Garbage from pack and custom rules** is contained, and the result stays JSON- and `structuredClone`-safe: undefined, numbers, arrays, cyclic results, thrown Symbol/null/Proxy, Promise or thenable returns, `outcome: '__proto__'`, 5 MB data, data nested 100k deep, a throwing `toJSON`, DOM mutation (warned), a 300k-occurrence `fail` (2.4 s), 50k distinct elements (7 s).
- **No state leaks between scans:** caller objects are never mutated or frozen, helpers stay read-only through nested objects, results without packs are identical before and after scans with packs, results with packs are deterministic, and `[A,B]` equals `[B,A]`.
- `satisfiesRange` agrees with semver 7.8.5 on 55 ranges × 6 versions, except the documented refusals of the empty range and `||`.
- `packScript` data escaping holds against `</script>`, U+2028/U+2029, backticks and `${` in messages, titles, rollups, probes and rule data.
- The CLI's argument parsing: unknown command or flag, missing value, extra folder, `--`, `-h`, `--kind=`.
