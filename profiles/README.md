# Profiles

The engine's rules are written against WCAG. A standard that only renumbers WCAG's criteria, as EN 301 549 does, needs nothing more than a table: it lives in `src/coverage/` with an entry in the registry, `src/coverage/standards.js`.

A standard with verdicts of its own, as RGAA has, is a **profile**: one folder here holding everything that belongs to that standard and nothing else. The engine knows a profile only through the entry it exports, so the folder can be read, reviewed and changed on its own, and could become a package of its own later.

## What a profile holds

```text
profiles/
  index.js            # The built-in profiles, in registry order
  <name>/
    index.js          # Exports { standard, rulesDir, i18nDir }: the registry entry (see ENTRY
                      # SHAPE in src/coverage/standards.js), the folder of the profile's own
                      # rules and the folder of their dictionaries
    *.js              # The standard's tables and the functions the entry uses
    rules/            # automatic/ and manual/, like src/checks/: rules for the standard's own requirements
    i18n/             # <locale>.json, like src/i18n/: the messages of those rules
    data/             # The published source the tables are generated from, with its provenance
    scripts/          # Generators for the tables and the docs, each with --check
    tests/            # The profile's own tests; scripts/run-tests.js runs them with the rest
      rules/          # automatic/ and manual/, like tests/engine-checks/: a test per rule
      fixtures/       # The rules' scenario pages, like tests/fixtures/
```

`profiles/rgaa/` is the example:

- `map.js`: RGAA's themes, criteria and tests, generated from `data/` by `scripts/generate-map.js` (`npm run rgaa-map`).
- `rule-map.js`: the RGAA tests each rule checks, with the reason for each.
- `mappings.js`: the entries and the per-criterion rollups built from those two tables, and the checks the build runs on them.
- `index.js`: the registry entry, with the `rgaa-4.1.2` profile and the `rgaa` rule tag.
- `rules/`: the opt-in rules for requirements RGAA makes and WCAG does not, all tagged `rgaa`, one of them (`contrast-minimum-rgaa`) a variant of core's `contrast-minimum` (see [`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md#rules-for-another-standards-own-requirements)).
- `i18n/`: their messages in every locale, and the note the HTML report shows above RGAA's rollups (`report.noteKey`).
- `scripts/generate-mapping-doc.js`: writes [`docs/RGAA_MAPPING.md`](../docs/RGAA_MAPPING.md) (`npm run rgaa-mapping-doc`).

`src/rgaa.js` stays the public entry point (`@surea11y/core/rgaa`) and reads its tables from here.

The build (`scripts/build-core.js`) compiles a profile's rules into the engine with core's, and the validators and generated docs read them too: `scripts/lib/rule-dirs.js` lists every rules folder. The build also merges a profile's dictionaries into core's, one per locale (`scripts/lib/dictionaries.js`), and fails on a key both define, so a profile can add messages but never change core's. The i18n commands (`npm run i18n:sync`, `i18n:check`, `i18n:new`, `i18n:report`) cover every dictionary folder.

## Adding a profile

```sh
npm run profile:new -- <key> --name "<Name>"
```

writes `profiles/<key>/` and adds it to `profiles/index.js`. The result is an empty but working standard: it builds, passes its own tests and the boundary check, and its profile, `<key>-1.0`, runs WCAG 2.2 A and AA. Filling it in is editing tables and adding rules:

- `requirements.js`: the standard's requirements per version, each with its title and the WCAG criteria it corresponds to;
- `rule-map.js`: which requirements each rule checks, core's rules or the profile's own, with the reason;
- `rules/automatic/`, `rules/manual/`: rules for requirements no core rule checks, tagged `<key>`; where a requirement is a core rule with other thresholds, a variant of it rather than a copy ([`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md#rule-variants)), each with a test in `tests/rules/` and a scenario page in `tests/fixtures/` (read from the test as `../../fixtures`);
- `i18n/en.json`: their messages, then `npm run i18n:sync`.

From those tables `mappings.js` builds what each result names, one rollup per requirement, and the checks the build runs on the tables. The profile's own `README.md` lists the same steps. More versions, or another WCAG base, are a change to `VERSIONS` in `requirements.js` and `profiles` in `index.js`. A standard narrower than WCAG, or one replacing a WCAG check with its own, adds `exclude: { rules, criteria }` to a profile in `index.js`.

A profile written by hand needs the same: an `index.js` exporting `standard`, and `rulesDir` and `i18nDir` if it has rules; an entry in `profiles/index.js`; and its tests under `tests/`. The comment at the top of `src/coverage/standards.js` describes every field of `standard`. RGAA's mapping is richer than the scaffold's (`profiles/rgaa/mappings.js` relates tests to WCAG criteria and allows documented exceptions), which is the room a hand-written profile has.

## What a profile may use

A profile depends on core only through what core already publishes, so it never breaks when core's internals change, and it could become a package of its own. `scripts/lib/profile-contract.js` states the contract and `tests/profile-boundary.test.js` checks every profile against it:

- **Its entry.** `index.js` exports only `standard`, `rulesDir` and `i18nDir`, and both folders sit inside the profile. `standard` follows ENTRY SHAPE in `src/coverage/standards.js`.
- **Its own files.** The entry and its tables (`*.js` at the profile's root) require only each other and Node built-ins: nothing from `src/` or `scripts/`.
- **Its rules.** A rule follows the custom-rule contract, which semver covers ([`docs/API_STABILITY.md`](../docs/API_STABILITY.md)):
  - it requires nothing, since `runInPage` is serialized into the page; or it is a variant of a core rule (`from`), which has no code of its own;
  - it reads only the `ctx` fields [`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md) section 8.2 lists: `document`, `window`, `root`, `rule`, `config`, `standard`, `helpers`, `engineOptions`, `inputs` and `contextSelector`. A rule whose behaviour differs between versions of its standard reads `ctx.standard`;
  - it calls only the helpers [`docs/RULE_HELPERS.md`](../docs/RULE_HELPERS.md) documents. A helper a profile needs that is not documented there is a change to core's public API: document it there first;
  - it carries the standard's `ruleTag`, so no WCAG scan runs it.
- **Its tests and scripts.** From core, they require only the package's entry points (`src/index.js`, `src/core.js`, `src/report.js`, `src/rgaa.js` and the others in `package.json` `exports`), WCAG's reference tables (`src/coverage/wcag-facets.js`, `src/coverage/wcag-version-map.js`) and the shared test harness (`tests/helpers/`). npm packages and Node built-ins are fine.
- **Its dictionaries.** They hold only keys of its own rules (each rule's `meta.i18n` prefix) and of its entry (`report.noteKey`). The build refuses a key core also defines.

The other direction holds too: core reaches a profile only through `profiles/index.js`. The exceptions are `src/rgaa.js`, RGAA's public entry point (`@surea11y/core/rgaa`), which reads the profile's table and would move with the profile, and the generated `src/core.js`, which requires every rule.

A few of RGAA's tests read core files directly, which the check does not cover: `contrast-minimum-rgaa`'s test reads core's `tests/fixtures/contrast-all-scenarios.html`, `skip-link-present`'s compares its wording list with `src/checks/manual/skip-link-manual.js`, and `scripted-components-review`'s reads the generated bundles. In the other direction, core's media rules browser test reads `media-transcript-adjacent`'s scenario page. These would need a copy, or a published equivalent, if RGAA left this repository.
