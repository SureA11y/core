# Pack tooling and package shape — findings

**Setup:** Node 22.14, npm 11.17, TypeScript 5.9.3, ESLint 10.8, Playwright Chromium. `npm pack` of the checkout (231 files) was compared with the published 1.10.0. **[V]** marks a finding re-run and confirmed. PT-2 and PT-3 were re-run again during consolidation.

**Bottom line:** the normal consumer flow works for both kinds. Scaffolded packs installed from the tarball pass `npm test` (12/12), `npm run lint`, `npm run docs` and `npm run docs:check`. Against the published 1.10.0, no runtime export, bundle global or i18n file was removed or changed.

Probes are in `probes/`. `_scratch/`, which held the tarballs, scaffolded packs and node_modules, was deleted. To recreate it:
1. Run `npm pack --pack-destination _scratch` and extract the tarball to `_scratch/tar`.
2. Run `npm pack @surea11y/core@1.10.0` and extract it to `_scratch/pub/t`.
3. Scaffold a pack whose `@surea11y/core` dependency is `file:` the tarball.

| ID | Title | Category | Severity |
|---|---|---|---|
| PT-1 | A rule reading a module-scope variable passes the pack's tests and lint but fails in every browser | contract | high |
| PT-2 | `new` picks a namespace that is also a core tag (aria-, forms-, images-, keyboard-, contrast); the generated pack is skipped at scan time and its own tests fail | bug | high |
| PT-3 | `--title` is pasted unescaped into JS and JSON: `Bob's Policy` gives a pack that doesn't load; a crafted title runs code on require | bug / security | high |
| PT-4 | `pack.d.ts` types `ruleMappedStandard` `requirements` as `object[]`, but the scaffold passes an object (TS2740) | contract | medium |
| PT-5 | Unknown flags and `--k=v` are ignored silently: `--kind=standard` gives a checklist, `docs --chek` writes docs and exits 0 | ergonomics | medium |
| PT-6 | One example that never loads stops `docs` after 30 s with a raw Playwright stack naming no example, after some files were already rewritten | ergonomics | medium |
| PT-7 | `docs` records a throwing rule as `cantTell` and drops its error text | ergonomics | medium |
| PT-8 | `new` accepts package names npm rejects (spaces, capitals, `!`, leading `-`); a bad scope silently gives namespace `pack` | ergonomics | low |
| PT-9 | `checkPack()` returns `[]` for packs the scan then skips (namespace equal to a core tag; rule id equal to a core id) | contract | low |
| PT-10 | The types allow ESM named imports from `/browser` and `/eslint-plugin`, which fail at runtime | contract | low |
| PT-11 | `testing.d.ts` types `runOnly` as `object \| null`; a string, which the runtime accepts, fails to compile | contract | low |
| PT-12 | Lint rules `tree-scoped-ids` and `no-raw-role` miss `dom.getElementById(ctx.document, …)`, `helpers.dom.*` and computed or destructured reads | bug | low |
| PT-13 | Lint false positives on plain objects (`.children`, `.tagName`) and on `[role=x]` prose under other keys | ergonomics | low |
| PT-14 | Some TypeScript code that compiled against 1.10.0 no longer compiles (details below) | contract | low |
| PT-15 | Examples whose label has trailing text, or whose fence is ```` ```HTML ````, are skipped silently | doc | low |
| PT-16 | A bound or native `runInPage` passes in jsdom, but `packScript` emits a syntax error (same as PN-10) | bug | low |
| PT-17 | `docs` errors: raw stacks, an `undefined:` prefix, no `--no-examples` hint when Chromium is missing, partial writes | ergonomics | low |
| PT-18 | `scaffoldPack('')` (internal API) overwrites files in the current folder; the CLI guards against it | bug | low |
| PT-19 | The pack title is not escaped in the catalog's H1 and intro | doc | low |
| PT-20 | `docs --pack x.mjs` with `export default` is not unwrapped | feature | low |
| PT-21 | Before release: scaffolding from this checkout pins `^1.10.0`, which installs the published 1.10.0, which has no `./pack` or `./testing` | packaging | low |
| PT-22 | CLI inconsistencies: `--help` exits 0 but `-h` and `new --help` exit 1; extra positionals are ignored; `Next: cd my pack` is unquoted | ergonomics | low |

## Repros and locations

**PT-1** [V]
- **Repro:** move `GENERIC` out of `runInPage` in the scaffold's link rule.
- **Observed:**
  - `npm test` still passes 12/12, and lint is clean.
  - `probes/closure-in-browser.js` then gives `fail` in jsdom but `cantTell` in Chromium, with "GENERIC is not defined".
- **Cause:** `src/testing.js:136` runs pack scans only through `runDomRulesInPage`, so the rule never goes through the browser path.
- **Detection gap:**
  - No lint rule catches it.
  - Only `docs:check` does, and only when the rule has examples. Even then the message leaves out the error.
- **Docs:** RULE_AUTHORING.md §1.1 calls this a "recurring footgun".

**PT-2** [V]
- **Repro:** `new aria-rules`.
- **Observed:** 0/12 tests pass: "skipped: normative mappings… tagged aria".
- **Other names that fail the same way:**
  - `forms-policy`
  - `images-std`
  - `keyboard-checklist`
  - `--namespace contrast`
- **Cause:**
  - `namespaceOf` is at `src/pack-scaffold.js:38`.
  - The namespace check at `src/pack-scaffold.js:126` rejects only `wcag*`.
  - `checkPack` (`src/pack.js:144`) rejects only `a11ycore`.
- **Docs:** this breaks PACKS.md's "works as generated".
- **Related:** PN-1.

**PT-3** [V]
- **Cause:** `fill()` at `src/pack-scaffold.js:100`.
- **Templates affected:**
  - `templates/pack/checklist/index.js:19`
  - `templates/pack/standard/index.js:20`
  - `templates/pack/standard/i18n/en.json:12`
  - `templates/pack/standard/tests/profiles.test.js:62`
- **Code execution:** a title that closes the string ran `writeFileSync('PWNED')` when the pack was required. The person typing the title is the pack's own author, so the security severity is low. The broken pack for an ordinary apostrophe is the high-severity part.

**PT-4:** `src/pack.d.ts:137`. The runtime shape is `{[version]: {[id]: {title, wcagSc}}}` (`src/profile-kit.js:48`).

**PT-5:** `parseArgs` is at `bin/surea11y-pack.js:30-40`. A value flag also takes the next flag as its value, so `--name --kind` names the package `--kind`.

**PT-6:** `src/rule-docs.js:506` calls `setContent` with the default timeout and no try/catch per example.

**PT-7:** `src/rule-docs.js:517` keeps only `c.outcome`.

**PT-10:** `surea11y.browser.d.ts:21` and `src/eslint-plugin.d.ts:29` use `export =`. Node's CommonJS detection exposes only these names:
- `/browser`: only `default`.
- `/eslint-plugin`: only `NAMES` and `isUnsafeDomMember`.

**PT-12:** `src/eslint-plugin.js:96-103` and `156-162`.

**PT-14** (type compatibility with 1.10.0)
- **Required fields added:**
  - `RuleMeta.helpUrl` and `RuleMeta.tags`.
  - `ScannedFrame` / `UnreachableFrame`: `selector` and `title`.

  Code that builds result objects, such as reporter fixtures or the bindings' frame results, no longer compiles.
- **Changes that break reading code:**
  - `contributors[].severity` became optional.
  - `EngineErrorCode` gained a member, which breaks exhaustive switches.
  - `LegacyTagRunOnly.type` was widened.
- **Window augmentation:** the new `declare global Window.a11ycore` conflicts with a consumer's own declaration (TS2717).
- **Results:** default scan results also differ from 1.10.0: new `meta.helpUrl` and `tags`, mapping URLs, and some text and ratio values. Each of these is a documented Unreleased CHANGELOG entry (#142, #144, #164, #179). No outcome changed on the probe page.

**PT-15:** `src/rule-docs.js:454`.

**PT-18:** `fs.existsSync('')` is false, so the check that the folder is empty (`src/pack-scaffold.js:134`) is skipped.

**PT-19:** `src/rule-docs.js:343`.

## Held up

- **Package managers:**
  - pnpm's isolated linker with `hoist=false` works.
  - `npx -p file:<tgz> surea11y-pack new` works.
- **Tarball:** every relative `require()` in all 231 shipped files resolves.
- **Exports:** every `exports` subpath loads with both CommonJS `require` and ESM `import`, including `/i18n/*` and `/package.json`.
- **TypeScript:** a strict consumer of every subpath compiles under these settings. The only error is PT-4.
  - node16 (CommonJS and .mts)
  - bundler
  - node10
- **`new` refuses:**
  - a non-empty folder, so it never overwrites files;
  - an invalid namespace or kind;
  - a missing folder.
- **Injection:** namespace tokens can't inject code, and `$&` in values is not expanded.
- **`docs --check`:** exits 1 when something is stale or missing.
- **Engine:** reports async, throwing, undefined-returning and bad-outcome rules clearly.
- **`definePack`:** rejects a rule with no `runInPage`, and ids outside the namespace.
- **Lint:** core's own rules lint clean under `configs.recommended`.
- **Test helpers:** clear errors for an unknown rule id and an unknown `runOnly`.

## Missing tests

- The scaffold is tested against the repo, never against a packed tarball.
- A namespace equal to a core tag (PT-2).
- Titles with `'`, `"`, `\` or a newline (PT-3).
- A pack rule with a module-scope reference (PT-1).
- A TypeScript compile of the scaffold's standard (PT-4) and of a string `runOnly` (PT-11).
- CLI unknown flags, `--k=v`, missing values and help exit codes (PT-5, PT-22).
- `docs`:
  - an example that times out;
  - missing Chromium;
  - a throwing rule's error;
  - malformed labels and fences.

  (PT-6, PT-7, PT-15, PT-17)
- The lint patterns that slip through (PT-12).
- `checkPack` agreeing with what the scan skips (PT-9).
- ESM named imports matching the d.ts (PT-10).
- A d.ts compatibility check against the last release (PT-14).
