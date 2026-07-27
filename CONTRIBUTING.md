# Contributing

This document describes the standard the project holds itself to — the same one any change, from anyone, is expected to meet.

## Before you start

- Internalize the engine's non-negotiables — every change is expected to preserve them: `fail` is reserved for deterministic, high-confidence, normative violations; output is deterministic (same input, same result, always); every rule is atomic (one normative decision per rule).
- Read [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) in full before touching any rule — in particular §1.1's free-variable footgun. It's the single most common way to accidentally ship a silently-broken rule (the build succeeds; the rule just always returns `cantTell` with an unhelpful-looking `error`).
- Check [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) before proposing something that might already be a deliberate, reasoned non-goal.

## Adding or changing a rule

Follow [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) literally — it's derived from the actual rule modules and build pipeline, not aspirational. In short, every rule needs:

1. The exact module contract (`id`, `meta`, `runInPage(ctx)`, nothing else exported).
2. A scenario fixture (`tests/fixtures/<rule-slug>-all-scenarios.html`) covering every branch the rule's logic distinguishes, plus a fixture-coverage test. **This is not optional polish** — see `docs/RULE_AUTHORING.md` §11. A rule shipped without one is treated the same as a rule shipped without tests.
3. Correct `meta.wcagSc`/`normativeMappings`/`coverage.facetsBySc` if the rule maps to a WCAG Success Criterion — run `npm run coverage` afterward to confirm the facet-coverage report picks it up.

After adding/changing a rule:

```sh
npm run build              # regenerate src/core.js
npm test                   # full suite must be green
npm run coverage           # if the rule touches WCAG facet coverage
npm run fixtures:index     # if you added/changed a fixture
npm run docs:rule-catalog  # regenerate docs/RULE_CATALOG.md
```

## Fixing a bug

Prefer finding the root cause over a narrow patch — this codebase's own convention is to verify against a primary source (the WAI-ARIA spec, HTML-AAM, direct probing of real browser/AT behavior) before changing rule logic, not to guess. If a false positive or false negative is confirmed, add a fixture case and a regression test that would have caught it.

## Commit and PR conventions

- Keep commits focused — one logical change per commit, with a message explaining *why*, not just *what* (the diff already shows what).
- Run the full test suite (`npm test`) before opening a PR; it must be green.
- If your change affects a rule's documented scope relative to other engines, update that rule's implementation notes accordingly so the scope decision stays traceable.

## Code style

No enforced linter/formatter is configured yet — match the surrounding file's style (this codebase favors explicit, defensive, no-throw helper functions; see any existing rule in `src/checks/` for the prevailing pattern).
