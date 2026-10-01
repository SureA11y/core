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
- `rules/`: the opt-in rules for requirements RGAA makes and WCAG does not, all tagged `rgaa` (see [`docs/RULE_AUTHORING.md`](../docs/RULE_AUTHORING.md#rules-for-another-standards-own-requirements)).
- `i18n/`: their messages in every locale, and the note the HTML report shows above RGAA's rollups (`report.noteKey`).
- `scripts/generate-mapping-doc.js`: writes [`docs/RGAA_MAPPING.md`](../docs/RGAA_MAPPING.md) (`npm run rgaa-mapping-doc`).

`src/rgaa.js` stays the public entry point (`@surea11y/core/rgaa`) and reads its tables from here.

The build (`scripts/build-core.js`) compiles a profile's rules into the engine with core's, and the validators and generated docs read them too: `scripts/lib/rule-dirs.js` lists every rules folder. The build also merges a profile's dictionaries into core's, one per locale (`scripts/lib/dictionaries.js`), and fails on a key both define, so a profile can add messages but never change core's. The i18n commands (`npm run i18n:sync`, `i18n:check`, `i18n:new`, `i18n:report`) cover every dictionary folder.

## Adding a profile

1. Create `profiles/<name>/` with an `index.js` that exports `{ standard }`, the registry entry, and `rulesDir` and `i18nDir` if it has rules of its own. The comment at the top of `src/coverage/standards.js` describes every field, and [`docs/WCAG_CONFORMANCE.md`](../docs/WCAG_CONFORMANCE.md#adding-another-standard) the steps.
2. Add it to `profiles/index.js`.
3. Put its tests in `profiles/<name>/tests/`: a test per rule in `tests/rules/automatic/` or `tests/rules/manual/`, reading its scenario page from `tests/fixtures/` as core's rule tests do (`../../fixtures`).

## Work in progress

Next: a check that a profile uses only what the engine publishes for profiles, and a written contract for what that is.
