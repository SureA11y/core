# Contributing

This document describes the standard the project holds itself to — the same one any change, from anyone, is expected to meet.

## Before you start

- Internalize the engine's non-negotiables — every change is expected to preserve them: `fail` is reserved for deterministic, high-confidence, normative violations; output is deterministic (same input, same result, always); every rule is atomic (one normative decision per rule).
- Read [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) in full before touching any rule — in particular §1.1's free-variable footgun. It's the single most common way to accidentally ship a silently-broken rule (the build succeeds; the rule just always returns `cantTell` with an unhelpful-looking `error`).
- Check [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) before proposing something that might already be a deliberate, reasoned non-goal.

## Adding or changing a rule

Follow [`docs/RULE_AUTHORING.md`](./docs/RULE_AUTHORING.md) literally — it's derived from the actual rule modules and build pipeline, not aspirational. In short, every rule needs:

1. The module contract: `id`, `meta`, `runInPage(ctx)`, plus an optional `applicability(ctx)`. Nothing else — a helper you need inside `runInPage` goes inside it, since the function is serialized and runs with no access to this module's scope.
2. A scenario fixture (`tests/fixtures/<rule-slug>-all-scenarios.html`) covering every branch the rule's logic distinguishes, plus a fixture-coverage test. **This is not optional polish** — see `docs/RULE_AUTHORING.md` §11. A rule shipped without one is treated the same as a rule shipped without tests.
3. Correct `meta.wcagSc`/`normativeMappings`/`coverage.facetsBySc` if the rule maps to a WCAG Success Criterion — run `npm run coverage` afterward to confirm the facet-coverage report picks it up.

After adding/changing a rule:

```sh
npm run build              # regenerate src/core.js
npm run validate:rules     # rule module contract (exports, meta, no free variables in runInPage) -- also run by `npm test`, standalone for a quicker signal
npm test                   # full suite must be green (~1.5 min: format, build, rule contracts, then the tests)
npm run coverage           # if the rule touches WCAG facet coverage
npm run test:coverage      # code line/branch coverage (Node's built-in test runner) -- not the same thing as `coverage` above
npm run fixtures:index     # if you added/changed a fixture
npm run docs:rule-catalog  # regenerate docs/RULE_CATALOG.md
```

`coverage`, `fixtures:index` and `docs:rule-catalog` write generated files that are
committed, so run them and commit the result rather than leaving the tree stale.
`npm run coverage:check` and `npm run fixtures:check` report the same drift without
writing, which is the form to reach for if you just want to know. CI runs both.

Note on coverage: `tests/node-runtime-parity.test.js` runs every rule's own fixture through `runDomRulesInPage` (the Node/require-based entry point), separately from the `runa11yCoreInPage` self-contained-bundle path nearly every other test uses (see that file's own header comment for why both exist and why coverage needs both) — don't remove it thinking it's a duplicate of the per-rule fixture-coverage test.

## Fixing a bug

Prefer finding the root cause over a narrow patch — this codebase's own convention is to verify against a primary source (the WAI-ARIA spec, HTML-AAM, direct probing of real browser/AT behavior) before changing rule logic, not to guess. If a false positive or false negative is confirmed, add a fixture case and a regression test that would have caught it.

## Contributing a translation

No code changes needed. Run `npm run i18n:new <locale>` to scaffold `src/i18n/<locale>.json`, fill in the strings, and check progress with `npm run i18n:report`. If you add or rename a key in `en.json`, run `npm run i18n:sync` so every other locale picks it up. Full workflow and terminology guidance in [`docs/I18N.md`](./docs/I18N.md#contributing-a-translation).

## Commit and PR conventions

- Keep commits focused — one logical change per commit, with a message explaining *why*, not just *what* (the diff already shows what).
- Keep the message tight: a sentence or two on the cause and the fix. If several files changed for the same reason, one short line per file is enough — don't walk through the mechanism the diff already shows.
- Write the explanation in your own words each time rather than reusing the same phrasing commit after commit (e.g. always citing a source the same way, always closing with the same test-count line). Bugs differ; say what's different about this one.
- Run the full test suite (`npm test`) before opening a PR; it must be green.
- If your change affects a rule's documented scope, update that rule's implementation notes accordingly so the scope decision stays traceable.

## Sign-off

Contributions are accepted under the [Developer Certificate of Origin](https://developercertificate.org/) — a short statement that you wrote the patch, or otherwise have the right to submit it under this project's license. Sign off with `-s`:

```sh
git commit -s -m "..."
```

which appends a `Signed-off-by:` line from your git `user.name` and `user.email`. Please use a real name.

There is no CLA. The engine is MPL-2.0 and stays that way, so there are no rights to reassign — the DCO records the same assurance without asking you to give anything up.

## Code style

ESLint and Prettier are enforced in CI (`npm run lint`, `npm run format:check`). Run `npm run format` to auto-format and `npm run lint:fix` to auto-fix what's fixable before opening a PR. Beyond what the tooling enforces, this codebase favors explicit, defensive, no-throw helper functions — see any existing rule in `src/checks/` for the prevailing pattern.

Two things worth knowing about the config (`eslint.config.js`):
- `no-empty` allows empty `catch {}` blocks: this codebase swallows errors from optional/defensive helper calls on purpose, see `RULE_AUTHORING.md`.
- `src/core/dom-runner.js` and `src/core/frame-scan.js` reference shared runtime helper names as intentional free variables (they're inlined into `src/core.js` at build time — see each file's own header comment); this is declared via a `/* global ... */` directive at the top of each file, not suppressed globally.
