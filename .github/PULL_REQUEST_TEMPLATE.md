## What does this change and why

<!-- Explain the "why", not just the "what" — the diff already shows what changed. -->

## Type of change

- [ ] Bug fix (rule outcome correction)
- [ ] New rule
- [ ] Rule deprecation (see `docs/API_STABILITY.md`'s deprecation policy)
- [ ] Documentation
- [ ] Engine/runtime change (not rule-specific)
- [ ] Other

## Checklist

- [ ] Read `docs/RULE_AUTHORING.md` in full before touching any rule (in particular §1.1's free-variable footgun — a rule with a module-scope reference builds successfully but silently always returns `cantTell` at runtime).
- [ ] If a rule was added or changed: added/updated a scenario fixture (`tests/fixtures/<rule-slug>-all-scenarios.html`) covering every branch the rule distinguishes — not optional polish, see `docs/RULE_AUTHORING.md` §11.
- [ ] If the rule maps to a WCAG Success Criterion: set `meta.wcagSc`/`normativeMappings`/`coverage.facetsBySc` correctly and ran `npm run coverage` to confirm the facet report picks it up.
- [ ] `npm run build` — regenerated `src/core.js` (and `surea11y.browser.js`, its locale side files and `surea11y.report.js`).
- [ ] `npm test` — full suite green.
- [ ] `npm run fixtures:index` — if a fixture was added or changed.
- [ ] `npm run docs:rule-catalog` — if a rule's `meta` or its `@applicability`/`@expectation`/`@reason-codes` header prose changed (regenerates `docs/RULE_CATALOG.md`).
- [ ] If a rule was added, or gives a new reason code: its `@reason-codes` lists every code it gives, with its outcome, meaning and basis (`docs/RULE_AUTHORING.md` §10.1); each `cantTell` code has its steps in `src/procedures`, under the facet it tests (§8.6, then `npm run procedures`); and `npm run finding-ids` updated `scripts/data/finding-ids.json`.
- [ ] If a reason code was split by cause, or given to a rule that had none: the move is in `src/baseline-moves.json`, and the `CHANGELOG.md` entry says which findings move (`docs/BASELINE.md#upgrading`).
- [ ] If this is a bug fix: root cause verified against a primary source (WAI-ARIA spec, HTML-AAM, direct probing of real browser/AT behavior) rather than guessed, and a regression test was added that would have caught it.
- [ ] If this changes the shape of a scan result: checked `docs/API_STABILITY.md` for whether it's a patch/minor/major change.

## Related issue(s)

<!-- Closes #... -->
