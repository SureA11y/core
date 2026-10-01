# Profiles

The engine's rules are written against WCAG. A standard that only renumbers WCAG's criteria, as EN 301 549 does, needs nothing more than a table: it lives in `src/coverage/` with an entry in the registry, `src/coverage/standards.js`.

A standard with verdicts of its own, as RGAA has, is a **profile**: one folder here holding everything that belongs to that standard and nothing else. The engine knows a profile only through the entry it exports, so the folder can be read, reviewed and changed on its own, and could become a package of its own later.

## What a profile holds

```text
profiles/
  index.js            # The built-in profiles, in registry order
  <name>/
    index.js          # Exports { standard }: the registry entry (see ENTRY SHAPE in src/coverage/standards.js)
    *.js              # The standard's tables and the functions the entry uses
    data/             # The published source the tables are generated from, with its provenance
    scripts/          # Generators for the tables and the docs, each with --check
    tests/            # The profile's own tests; scripts/run-tests.js runs them with the rest
```

`profiles/rgaa/` is the example:

- `map.js`: RGAA's themes, criteria and tests, generated from `data/` by `scripts/generate-map.js` (`npm run rgaa-map`).
- `rule-map.js`: the RGAA tests each rule checks, with the reason for each.
- `mappings.js`: the entries and the per-criterion rollups built from those two tables, and the checks the build runs on them.
- `index.js`: the registry entry, with the `rgaa-4.1.2` profile and the `rgaa` rule tag.
- `scripts/generate-mapping-doc.js`: writes [`docs/RGAA_MAPPING.md`](../docs/RGAA_MAPPING.md) (`npm run rgaa-mapping-doc`).

`src/rgaa.js` stays the public entry point (`@surea11y/core/rgaa`) and reads its tables from here.

## Adding a profile

1. Create `profiles/<name>/` with an `index.js` that exports `{ standard }`, the registry entry. The comment at the top of `src/coverage/standards.js` describes every field, and [`docs/WCAG_CONFORMANCE.md`](../docs/WCAG_CONFORMANCE.md#adding-another-standard) the steps.
2. Add it to `profiles/index.js`.
3. Put its tests in `profiles/<name>/tests/`.

## Work in progress

The RGAA rules (tagged `rgaa`), their tests and fixtures, and RGAA's dictionary entries still live with the rest of the engine, under `src/checks/`, `tests/` and `src/i18n/`. They move here next, along with a check that a profile uses only what the engine publishes for profiles.
