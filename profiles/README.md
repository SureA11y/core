# Profiles

The engine's rules are written against WCAG. A standard that only renumbers WCAG's criteria, as EN 301 549 does, needs nothing more than a table: it lives in `src/coverage/` with an entry in the registry, `src/coverage/standards.js`.

A standard with verdicts of its own is a **profile**: one folder here holding everything that belongs to that standard and nothing else. The engine knows a profile only through the entry it exports, so the folder can be read, reviewed and changed on its own, and could become a package of its own later.

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
    docs/             # Like docs/: RULE_CATALOG.md (generated) and RULE_EXAMPLES.md for its rules
    scripts/          # Generators for the tables and the docs, each with --check
      data/           # Like scripts/data/: the records of its rules (finding-ids.json,
                      # fixture-markers.json, rule-examples-coverage.json), generated
    tests/            # The profile's own tests; scripts/run-tests.js runs them with the rest
      rules/          # automatic/ and manual/, like tests/engine-checks/: a test per rule
      fixtures/       # The rules' scenario pages, like tests/fixtures/, and their index
                      # (INDEX.md, index.json, index.html), generated
```

None is built in yet: `index.js` lists none. `tests/fixtures/profiles/sample/` is a working example, with two versions, a mapped table, rules of its own and a variant of a core rule; `tests/helpers/sampleEngine.js` builds it into a copy of the engine, and `tests/sample-profile/` tests what core does with it.

The build (`scripts/build-core.js`) compiles a profile's rules into the engine with core's, and the validators read them too: `scripts/lib/rule-dirs.js` lists every rules folder. The generated docs and records are written per source (`ruleSources()` there): core's describe core's rules only, and a profile's go in its own folder, in the same places under it as core's are under the repository root. `npm run docs:rule-catalog`, `fixtures:index`, `fixtures:markers`, `rule-examples:coverage` and `finding-ids` write both, and their checks compare both, so a profile's rules never change core's files. The WCAG coverage report (`npm run coverage`) reads core's rules only. The build also merges a profile's dictionaries into core's, one per locale (`scripts/lib/dictionaries.js`), and fails on a key both define, so a profile can add messages but never change core's. The i18n commands (`npm run i18n:sync`, `i18n:check`, `i18n:report`) cover every dictionary folder, each for the locales it has, and `i18n:new` adds a locale to core's or, with `--profile`, to one profile's.

## Adding a profile

```sh
npm run profile:new -- <key> --name "<Name>" [--locales en,es]
```

writes `profiles/<key>/` and adds it to `profiles/index.js`. The result is an empty but working standard: it builds, passes its own tests and the boundary check, and its profile, `<key>-1.0`, runs WCAG 2.2 A and AA. Filling it in is editing tables and adding rules:

- `requirements.js`: the standard's requirements per version, each with its title and the WCAG criteria it corresponds to;
- `rule-map.js`: which requirements each rule checks, core's rules or the profile's own, with the reason;
- `rules/automatic/`, `rules/manual/`: rules for requirements no core rule checks, tagged `<key>`; where a requirement is a core rule with other thresholds, a variant of it rather than a copy ([`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md#rule-variants)), each with a test in `tests/rules/` and a scenario page in `tests/fixtures/` (read from the test as `../../fixtures`);
- `i18n/en.json`: their messages, then `npm run i18n:sync`. The files in `i18n/` are the profile's languages: `profile:new` writes one per core locale, or those `--locales en,es` names; `npm run i18n:new -- <locale> --profile <key>` adds one, and deleting a file drops one, whose messages then show in English;
- `docs/RULE_EXAMPLES.md`: an example pair per rule. `npm run docs:rule-catalog`, `fixtures:index`, `fixtures:markers`, `rule-examples:coverage` and `finding-ids` then write the profile's catalog, fixture index and records in its folder. Until the profile has a rule of its own they write nothing for it.

From those tables `index.js` gets what each result names, one rollup per requirement, and the checks the build runs on the tables, from `ruleMappedStandard()` in `src/profile-kit.js`: the code is core's and tested there, so a fix reaches every profile made this way. It is internal for now, not exported, like a rule's settings: both serve the profiles in this repository, and would be published for a profile that lives outside it. The profile's own `README.md` lists the same steps. Each version in `VERSIONS` names the WCAG version it is built on (`wcagVersion`, 2.2 to start with): its profile runs that version's A and AA rules (`wcagTags` from `@surea11y/core/wcag`), and the build refuses a requirement that names a criterion that WCAG version does not have. More versions, or another WCAG base, are a change to `VERSIONS` in `requirements.js` and `profiles` in `index.js`. A standard narrower than WCAG, or one replacing a WCAG check with its own, adds `exclude: { rules, criteria }` to a profile in `index.js`.

A profile written by hand needs the same: an `index.js` exporting `standard`, and `rulesDir` and `i18nDir` if it has rules; an entry in `profiles/index.js`; and its tests under `tests/`. The comment at the top of `src/coverage/standards.js` describes every field of `standard`. A standard whose mapping is richer than the kit's (tests grouped into criteria, related to WCAG many to many, with documented exceptions, say) writes its own functions, which is the room a hand-written profile has.

## What a profile may use

A profile depends on core only through what core already publishes, so it never breaks when core's internals change, and it could become a package of its own. `scripts/lib/profile-contract.js` states the contract and `tests/profile-boundary.test.js` checks every profile against it:

- **Its entry.** `index.js` exports only `standard`, `rulesDir` and `i18nDir`, and both folders sit inside the profile. `standard` follows ENTRY SHAPE in `src/coverage/standards.js`.
- **Its own files.** The entry and its tables (`*.js` at the profile's root) require only each other, Node built-ins, WCAG's criteria per version (`src/wcag.js`, published as `@surea11y/core/wcag`) and the mapping kit (`src/profile-kit.js`, internal for now: see below), neither of which loads engine code: nothing else from `src/` or `scripts/`.
- **Its rules.** A rule follows the custom-rule contract, which semver covers ([`docs/API_STABILITY.md`](../docs/API_STABILITY.md)):
  - it requires nothing, since `runInPage` is serialized into the page; or it is a variant of a core rule (`from`), which has no code of its own;
  - it reads only the `ctx` fields [`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md) section 8.2 lists: `document`, `window`, `root`, `rule`, `config`, `standard`, `helpers`, `engineOptions`, `inputs` and `contextSelector`. A rule whose behaviour differs between versions of its standard reads `ctx.standard`;
  - it calls only the helpers [`docs/RULE_HELPERS.md`](../docs/RULE_HELPERS.md) documents. A helper a profile needs that is not documented there is a change to core's public API: document it there first;
  - it carries the standard's `ruleTag`, so no WCAG scan runs it.
- **Its tests and scripts.** From core, they require only the package's entry points (`src/index.js`, `src/core.js`, `src/report.js`, `src/wcag.js` and the others in `package.json` `exports`, plus `src/profile-kit.js`) and the shared test harness (`tests/helpers/`). npm packages and Node built-ins are fine.
- **Other profiles.** A profile maps core's rules and its own, and derives variants from them, never from another profile's rules: the build refuses it (`validateProfileIndependence` in `src/coverage/standards.js`). A rule two standards need belongs in core.
- **Its dictionaries.** They hold only keys of its own rules (each rule's `meta.i18n` prefix) and of its entry (`report.noteKey`). The build refuses a key core also defines.

A profile's tests read core only through what it publishes: inside this repository they require its entry points (above) and the shared harness in `tests/helpers/` by relative path, as the scaffold does, and the browser bundle through `require.resolve('@surea11y/core/browser')`, as a profile outside the repository would. Nothing else outside the profile; `tests/profile-boundary.test.js` checks it. A behaviour core guarantees for every profile, such as a variant leaving its base rule's results unchanged, is tested in core, against the sample profile.

The other direction holds too: core reaches a profile only through `profiles/index.js`, and core's tests never read a profile's files. The generated `src/core.js`, which requires every rule, is the one exception. `tests/profile-boundary.test.js` checks both directions.

What a standard makes of core's rules, which of its requirements a core rule checks and how it counts in its rollups, is the profile's to test; core's rule tests name no profile's standard. Core guarantees in turn that a profile chooses which rules run and never changes what they decide: `tests/profile-outcomes.test.js` runs every rule's scenario page under every profile, and `tests/sample-profile/profile-outcomes.test.js` under the sample's.
