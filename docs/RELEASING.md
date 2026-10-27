# Releasing

What a release of `@surea11y/core` goes through, in order. Every release is a pull request to `main` titled `Release x.y.z`; pushing the tag afterwards is what publishes it. What the version number promises is in [`API_STABILITY.md`](./API_STABILITY.md#release-cadence).

## 1. Prepare the branch

On a branch `release-x.y.z` from `main`:

- [ ] **Pick the version** by what the release changes, as [`API_STABILITY.md`](./API_STABILITY.md#release-cadence) defines it: patch for rule fixes and documentation, minor for additive work, major for a breaking change to a stable field.
- [ ] **Changelog:** the Unreleased section of [`CHANGELOG.md`](../CHANGELOG.md) becomes `[x.y.z] - <date>`, condensed to the changes a consumer meets, with related fixes merged into one entry each. Keep what an entry says about scan time: condensing must not drop that a release makes scans slower or faster.
- [ ] **Version:** `package.json` and `package-lock.json` at x.y.z (`npm version x.y.z --no-git-tag-version`), then `npm run build`, so `engine.version` reports it and the rules' help links point at the `vx.y.z` tag. `tests/engine-version.test.js` fails until the build carries it.
- [ ] **Lean measures:** after the version step, so the counts name this release's version, `npm run leans:measure` (it reads the ACT test cases over the network), then `npm run build`, and commit `scripts/data/lean-measures.json` and the build, so each lean's `measured` counts the leans this release gives. Say in the pull request about any lean it lists as right in fewer than 80% of its cases.
- [ ] **Finding identities:** `npm run finding-ids`, so the inventory is current, then `npm run finding-ids:release -- x.y.z`, and commit `scripts/data/released-finding-ids.json` ([Finding identity](./API_STABILITY.md#finding-identity)), with `src/baseline-moves.json`, from which it drops the identity moves of the minor release before ([`BASELINE.md`](./BASELINE.md#upgrading)). Say in the pull request whether any identity was retired.

## 2. Check and open the pull request

- [ ] `npm test`: every `:check` script and the full suite pass on the branch.
- [ ] Open `Release x.y.z` with the pull request template: what the release adds and changes, the version's kind and why, and the finding identities.

## 3. Publish

- [ ] Merge the pull request, then tag the merge on `main` and push the tag: `git tag vx.y.z && git push origin vx.y.z`.
- [ ] [`release.yml`](../.github/workflows/release.yml) runs on the tag. It checks that the tag matches `package.json`, runs lint and the full suite, checks that the committed build is what a clean build gives, and that W3C's ACT corpus gives no false positive, then publishes to npm with provenance. Any failure stops it before publishing: fix it on `main` and tag again.
