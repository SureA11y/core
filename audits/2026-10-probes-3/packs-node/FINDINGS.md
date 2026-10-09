# Packs in Node — findings

Probes are in this folder: run each with `node <file>` from here. `08-memory.js` and `08b-memory-nopack.js` need `node --expose-gc`. The 1.10.0 comparison probes (`13c`, `13d`, `13e`) need the published package unpacked in `_old/package`; that folder was deleted after the run. `99-confirm.js` re-runs each repro in a fresh process. It printed CONFIRMED for all of them except PN-24, which was seen once.

PN-1 and PN-2 were re-run again separately during consolidation.

| ID | Title | Severity | Category |
|---|---|---|---|
| PN-1 | A checklist namespace or standard `ruleTag` that is a core tag (`best-practice`, `landmarks`, `tables`) silently removes core rules from every default scan (27 / 11 / 3 rules) | high | bug |
| PN-2 | The engine cache ignores `strictOptions`: an invalid pack seen once without strict mode no longer throws under strict mode or in `packScript` | high | bug |
| PN-3 | Cache key collision: `packs: ['3']` or `[1]` runs the pack object that got internal id 3 or 1 | medium | bug |
| PN-4 | A pack object changed after its first scan keeps its stale engine, even when the change makes it invalid | medium | contract / doc |
| PN-5 | `packs: pack` (not in a list), a string or `{}` is ignored without a warning | medium | ergonomics |
| PN-6 | A pack's own rules without the namespace tag don't run under its own profiles, though PACKS.md:141 says they do | medium | doc / contract |
| PN-7 | A profile `exclude` of the wrong shape is accepted and excludes nothing | medium | bug |
| PN-8 | `satisfiesRange` misreads hyphen and `\|\|` ranges, so the `skippedPacks` reason can be wrong | medium | bug |
| PN-9 | PACKS.md:184 says placeholders are `{name}`; only `{{name}}` is filled | medium | doc |
| PN-10 | `packScript` writes a script that doesn't parse for valid rule shapes | medium | bug |
| PN-11 | The namespace isn't enforced on profile names, standard keys, ruleTags or a standard's rollup ids; a namespace can prefix core rule ids (`img`, `p`) | medium | contract |
| PN-12 | A throwing getter or a Proxy in a pack makes a non-strict scan throw instead of skipping the pack | low | bug |
| PN-13 | `describePacks` throws on `standard: {}`, which `checkPack` accepts | low | bug |
| PN-14 | Dictionary keys `constructor`, `hasOwnProperty`, `__proto__` get a misleading "defined in both function Object()…" reason | low | bug |
| PN-15 | `checkPack` accepts ids `p-` and `p- x y`, duplicate ids, `meta: 'x'`, `1.0.0garbage`, names containing `@` | low | ergonomics |
| PN-16 | `skippedPacks` keeps input order while `engine.packs` is sorted | low | contract |
| PN-17 | Unclear skip reasons (`s.mappingsFor is not a function`, `reading 'title'`, `titleKey must end in _title`) | low | ergonomics |
| PN-18 | `customRules` with a pack rule's id lists it in `overriddenBuiltinIds` | low | contract |
| PN-19 | A profile or rollup can't name another pack's rule; the referring pack is skipped | low | contract / doc |
| PN-20 | A checklist `title` can be a core standard name (`EN 301 549`, `WCAG`) | low | contract |
| PN-21 | Prerelease core `1.11.0-rc.1` satisfies `^1.11.0`, which npm semver does not | low | bug |
| PN-22 | `packs: []` and `packs: null` are echoed in each check's `engineOptions`; `packs: [x]` is not | low | contract |
| PN-23 | A standard profile's `version` isn't checked against the standard's `versions` | low | ergonomics |
| PN-24 | PACKS.md:100 shows `helpers.reportOccurrence(el, …)` as a standalone statement; called that way it reports nothing | low | doc |

## Details

**PN-1** (high, bug) [V]. Repro: `03-ns-tag-hijack.js`, `03b-ns-tag-sweep.js`, `12-standard.js`.

```js
{ name: '@x/bp', version: '1.0.0', namespace: 'best-practice', core: '*',
  profiles: { 'best-practice-p': { tags: ['wcag2a'] } } }
```

- **Observed:** a default scan goes from 134 rules to 107, with no warning and no `skippedPacks` entry. The 27 rules dropped include `region`, `heading-order`, `landmark-one-main` and `skip-link`. Namespace `landmarks` drops 11 rules and `tables` drops 3. A standard pack with `ruleTag: 'best-practice'` does the same.
- **Other core tags:** they are rejected only by accident, through the EN 301 549 independence check. The skip reason is 1–12 KB long and never mentions the namespace.
- **Expected:** reject any namespace or ruleTag equal to a tag a core rule carries.
- **Where:** `src/pack.js:143` (namespace check), `src/pack.js:380` (`ruleTag: key`), `src/core/prepare-catalog.js:54` (the ruleTag check only rejects `wcag*`).

**PN-2** (high, bug) [V]. Repro: `07-cache.js`, `07b-cache-packscript.js`.

- **Observed:** a non-strict scan with an invalid pack is cached with the pack skipped. Later calls with the same object get that cached engine:
  - `runDomRulesInPage(..., { packs: [bad], strictOptions: true })` doesn't throw.
  - `packScript([bad])` doesn't throw. It returns a script that registers key `""` with `packs: []`.
- **Cause:** the cache key holds object ids only, and the lookup runs before validation.
- **Expected:** strict calls throw whenever the cached engine has skipped packs, or `strict` becomes part of the key.
- **Where:** `src/pack.js:621-627`.

**PN-3** (medium, bug) [V]. Repro: `07-cache.js`.

- **Observed:** the key is `typeof p === 'object' ? idOf(p) : String(p)`, so object id 3 and the string `'3'` collide.
- **Effect:** a string entry, which is invalid in Node, silently runs an unrelated pack, even under strict mode.
- **Where:** `src/pack.js:621`.

**PN-4** (medium, contract / doc) [V]. Repro: `07-cache.js`.

- **Observed:** after the first scan, none of these has any effect:
  - pushing rules;
  - replacing `runInPage`;
  - bumping `version`;
  - setting `core: '^99.0.0'`.
- The scan keeps reporting the old `name@version`.
- **Docs:** ENGINE_OPTIONS.md:476 and PACKS.md:210 say the engine is kept for the same objects, but not that changes to them are ignored.
- **Expected:** one of:
  - document that packs are immutable;
  - freeze them in `definePack`;
  - fingerprint them.

**PN-5** (medium, ergonomics) [V]. Repro: `13b-single-pack-not-array.js`, `13-no-pack-identity.js`.

- **Observed:** these are all ignored with no warning:
  - `{ packs: pack }`, in scans and in `getChecksCatalog`;
  - `{ packs: 'acme' }`;
  - `{ packs: {} }`.
- Only `strictOptions` makes them throw.
- **Where:** `src/index.js:19`, `src/core/engine-options.js:93`.

**PN-6** (medium, doc / contract) [V]. Repro: `11-rollups.js` (without `TAG`), `17-catalog-selection.js`.

- **Observed:** a rule tagged `links` (no namespace tag) runs in a plain scan, but not under the pack's own profile `{ tags: ['wcag2a'] }`.
- With `tags: []`, a checklist whose rules carry only WCAG tags runs nothing. Every rollup then comes back `cantTell` (missingChild).
- **Where:** `src/pack.js:373` (only the namespace tag is added), `docs/PACKS.md:141`.

**PN-7** (medium, bug) [V]. Repro: `02-prepare.js`.

- **Observed:** `exclude: { rules: 'img-alt-present' }` and `exclude: 'region'` both pass validation, and the rule still runs and fails.
- **Where:** `src/pack.js:196-211` (no `exclude` check), `src/coverage/standards.js:111-114` (`normalizeExclude` turns a non-array into `[]`).

**PN-8** (medium, bug) [V]. Repro: `10-semver.js`.

- **Hyphen ranges, against core 1.10.0:** `'1.0.0 - 2.0.0'` returns `false`. The skip reason says "it supports core 1.0.0 - 2.0.0, and this is core 1.10.0".
- **Hyphen ranges, against core 1.0.0:** the same range returns `null`, because `every` short-circuits before reaching the `-` term.
- **`||`:** `'||'` returns `false` instead of "not a range", and `'^1.10.0 ||'` is accepted.
- **Common npm forms rejected as "not a range":**
  - `1.x`, `^1`, `~1.10`;
  - `>=2`, `<2`, `>= 1.0.0`;
  - any prerelease.
- **Case:** `x` is accepted but `X` is not.
- **Where:** `src/pack.js:77-116`.

**PN-9** (medium, doc) [V]. Repro: `14-i18n.js`.

- **Observed:** a dictionary entry `"Summary {name}"` renders literally, while `"Summary {{name}}"` renders `Summary N`.
- I18N.md:168 has the right syntax. The mistake is at `docs/PACKS.md:184`.

**PN-10** (medium, bug) [V]. Repro: `15-packscript.js`.

- **Observed:** the generated script throws `SyntaxError` for rule shapes that work in Node, which breaks every pack in that script:
  - `(ctx, o = String(1)) => …` and `(ctx, s = ')') => …`: the arrow regex `\([^)]*\)` stops at the first `)`;
  - a bound function: its source is `[native code]`.
- **Also:** a getter used as `runInPage` gives `impl.run === undefined`.
- **Where:** `src/pack.js:678-686`.

**PN-11** (medium, contract) [V]. Repro: `01-validation.js`, `02-prepare.js`, `12-standard.js`.

- **Accepted although PACKS.md:60 says every id starts with the namespace:**
  - profile names `zzz-1` and `a11y-strict`;
  - standard keys `other` and `constructor`;
  - standard rollup ids such as `zz-1.0-1` for namespace `p`.
- **Namespaces that prefix core ids** (`img`, `aria`, `p`) are accepted. A later core minor that adds `img-foo` would break a pack with namespace `img`, against the semver promise in PACKS.md:240.
- **Shared namespaces:** two packs with the same namespace both run when their ids don't overlap. Namespaces `a` and `a-b` can both own `a-b-x`.
- **Where:** `src/pack.js:139-145`, `src/pack.js:194-213`.

**PN-12** (low, bug) [V]. Repro: `02-prepare.js`.

- **Observed:** a throwing getter or a Proxy in a pack makes a non-strict scan throw instead of skipping the pack.
- **Cause:** `checkPack` runs outside any try (`src/pack.js:632`).

**PN-13** (low, bug) [V]. Repro: `12-standard.js`.

- **Observed:** `describePacks` throws `TypeError` (`standard.versions.slice`) on `standard: {}`, which `checkPack` accepts.
- `versions: '1.0'` is echoed back as a string.
- **Where:** `src/pack.js:317-340`.

**PN-14** (low, bug) [V]. Repro: `02-prepare.js`.

- **Observed:** dictionary keys `constructor`, `hasOwnProperty` and `__proto__` get a misleading skip reason, because `mergeDictionaries` uses `key in merged`, which follows the prototype.
- No pollution occurs.
- **Where:** `src/core/prepare-catalog.js:488`.

**PN-15** (low, ergonomics) [V]. Repro: `01-validation.js`, `02-prepare.js`.

- **`checkPack` accepts:**
  - ids with spaces or an empty suffix; they run and end up in results;
  - duplicate ids, which are only caught later, in preparation;
  - `meta: 'x'`;
  - a garbage version suffix;
  - `name: 'a@1.0.0'`, reported as `a@1.0.0@1.0.0`.
- A string `readBy` is ignored silently.
- Locales with two subtags (`zh-Hant-TW`) are rejected.

**PN-16** (low, contract) [V]. Repro: `06-order.js`.

- **Observed:** for packs given in either order, rules, rollups and `engine.packs` are deep-equal, but `skippedPacks` is not.
- Names sort by code unit, so `B` comes before `a`.
- **Where:** `src/pack.js:647-649`.

**PN-17** (low, ergonomics) [V]. Repro: `02-prepare.js`, `05-overrides-order.js`, `12-standard.js`.

| Input | Skip reason |
|---|---|
| `standard: {}` | `s.mappingsFor is not a function` |
| Unknown requirement in the rule map | `Cannot read properties of undefined (reading 'title')` |
| Variant with no `i18n` | `titleKey must end in _title` |
| Variant of the pack's own override | `contrast-minimum declares no settings` (it is the override that declares none) |

**PN-18** (low, contract) [V]. Repro: `05-overrides-order.js`.

- **Observed:** a `customRules` rule with a pack rule's id lands in `overriddenBuiltinIds`, though it isn't built in.
- `customRules` also beats a pack override of a core rule. That precedence isn't documented.

**PN-19** (low, contract / doc) [V]. Repro: `05-overrides-order.js`.

- **Observed:** each pack is first prepared alone with core. A reference to another pack's rule therefore skips the referring pack ("references unknown testId"), even when both packs are passed.
- The docs don't say this.

**PN-20** (low, contract) [V]. Repro: `18-checklist-title.js`.

- **`title: 'EN 301 549'`:** `result.standards` has two "EN 301 549" entries, and the HTML report heads the checklist "EN 301 549 rollup".
- **`title: 'WCAG'`:** the report shows two "WCAG rollup" sections.

**PN-21** (low, bug) [V]. Repro: `10-semver.js`.

- **Observed:** `parseVersion` drops prerelease tags, so core `1.11.0-rc.1` satisfies `^1.11.0`, which npm semver does not.

**PN-22** (low, contract) [V]. Repro: `13-no-pack-identity.js`.

- **Observed:** `packs: undefined` and no option give identical results. `packs: []` differs only in that echo.
- The existing test compares `main` with `core` using the same options, so it can't catch this.

**PN-23** (low, ergonomics) [V]. Repro: `12-standard.js`.

- **Observed:** a standard profile with `version: '9.9'` is accepted and applied. `mappedRules` selects nothing for it, and no rollups appear.

**PN-24** (low, doc). Repro: `04-runinpage.js` ("reportsViaHelper"). Seen once, not re-run.

- **Observed:** `reportOccurrence` returns an occurrence, which the rule must push into `occurrences`.
- Called on its own, as PACKS.md:100 shows, the rule reports one generic "failed for the page without naming an element" occurrence instead.

## Held up

- **Validation:**
  - Bad namespaces are rejected: empty, uppercase, unicode, `__proto__`, `toString`, `wcag*`, `a11ycore`.
  - Bad field types are rejected, and so are unknown top-level fields.
  - Override errors are caught, and a duplicate core id is skipped.
  - Profile and standard-key collisions with core (`wcag22-aa`, `en301549`) are skipped.
  - A bad severity or type is skipped, and so is a cyclic `rule.data`.
  - Unknown `exclude.rules` and `exclude.criteria` are skipped.
- **Prototype pollution:** `__proto__` keys coming through `JSON.parse` pollute nothing. Checked in profiles, severity, `exclude`, rollups, probes, meta and i18n.
- **Rules that misbehave:** throwing, async, `undefined`, `null`, number, bad-outcome and garbage-occurrence rules all end as `cantTell` with an error, or as a `fail` with placeholders. The scan always completes. 20,000 occurrences take 190 ms.
- **Order:**
  - `[A, B]` and `[B, A]` give deep-equal results, apart from PN-16.
  - Two packs overriding the same core rule throw.
  - `runOnly` works with the overridden id, with the legacy `a11ycore-` prefix and with a checklist rollup id.
- **Rollups:**
  - fail beats cantTell, which beats pass;
  - all members not applicable gives `notApplicable`;
  - a member that didn't run gives `cantTell`;
  - profile severity reaches the rollups.
- **Size:** 5,000 rules prepare in 280 ms and scan in about 350 ms. `packScript` takes 50 ms and produces 3.8 MB.
- **Memory:**
  - 1,000 prepares with a fresh pack object each time level off at +8 MB, which is the 16-entry cache.
  - Scans grow memory by about 1.5 MB each, with or without packs and in bare jsdom alike, so the growth comes from the jsdom test setup.
- **Skipped packs leave the scan unchanged:** results and catalogs equal those of a scan with no packs, apart from `engine.packs` and `skippedPacks`. Checked with the default profile, `wcag22-aa`, `en301549-v3.2.1`, `mappings` and `fr`.
- **No-pack scans compared with published 1.10.0:**
  - All 137 fixtures were checked. Nothing pack-related shows up, and no result keys were added or removed.
  - Every difference matches an Unreleased CHANGELOG entry: `meta.tags` and `helpUrl` (#142, #164), mapping URLs, the `aria-hidden-focus` remap (#116), and rule fixes (#121, #148, #156, #168).
- **i18n:**
  - A pack can't overwrite a core key in a locale core ships.
  - `messages` overrides pack keys.
  - Sublocales fall back (`de-AT` to `de`).
  - A locale only the pack has reports `partial-dictionary`.
  - A pack can supply core keys for a locale core lacks (`pt`), which translates core rules. That is plausibly intended, but it conflicts with PACKS.md:190 ("Keys must be the pack's own").

## Missing tests

- PN-1: a namespace or ruleTag equal to a core tag.
- PN-2: strict mode and `packScript` after a non-strict call with the same invalid pack.
- PN-3, PN-4: cache keys with string or number entries, and a pack changed after a scan.
- PN-5: `packs` given as one object, a string or `{}`.
- PN-6: a rule without the namespace tag under the pack's own profile.
- PN-7: the shape of `exclude`.
- PN-8, PN-21: `satisfiesRange` with hyphen, `||`, partial and prerelease ranges.
- PN-9: a message with `{{placeholder}}` params.
- PN-10: `packScript` output parses for every rule-function shape.
- PN-11: namespace enforcement on profiles, keys, ruleTags and rollups.
- PN-13: `describePacks` on a minimal standard.
- PN-16, PN-22: order with skipped packs, and `packs: []` compared with no option.
- PN-18, PN-19: `customRules` precedence over packs, and references across packs.
- Rollups whose members a profile excludes or never selects.
