# ACME

ACME as a profile of the engine. Created by `npm run profile:new`; see [`profiles/README.md`](../README.md) for what a profile is and what it may use.

## What to fill in

1. **Its requirements**, per version, in `requirements.js`: each requirement's number, title and the WCAG criteria it corresponds to.
2. **Which rules check them**, in `rule-map.js`: any core rule, or one of the profile's own, with the reason.
3. **Its own rules**, for requirements no core rule checks, in `rules/automatic/` or `rules/manual/`. Each one follows [`docs/RULE_AUTHORING.md`](../../docs/RULE_AUTHORING.md), carries the tag `acme` (which makes it run only under this standard), and has a test in `tests/rules/` with its scenario page in `tests/fixtures/`.
4. **Their messages** in `i18n/en.json`, then `npm run i18n:sync` for the other locales.
5. **Its versions and profiles**, if it has more than 1.0: `VERSIONS` in `requirements.js` and `profiles` in `index.js`.

`npm run build && npm test` builds the engine with it and runs its tests with everyone else's. `tests/profile-boundary.test.js` checks it uses only what core publishes.
