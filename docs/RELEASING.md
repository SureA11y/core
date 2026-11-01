# Releasing

What a release of `@surea11y/core` goes through, in order. Every release is a pull request titled `Release x.y.z`, to `main`, or to its release branch for [a patch from an earlier commit](#a-patch-from-an-earlier-commit); pushing the tag afterwards is what publishes it. What the version number promises is in [`API_STABILITY.md`](./API_STABILITY.md#release-cadence).

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

## A patch from an earlier commit

When `main` already holds work for the next minor release, fixes merged before it can still ship as a patch, from the last commit before that work. 1.14.2 was released this way.

- [ ] **Find the commit:** the last commit on `main` that has every fix to release and none of the minor release's work. If a fix landed after that work, a patch needs it cherry-picked onto the branch, with its tests.
- [ ] **Cut the line:** push `release/x.y.x` at that commit (`git push origin <commit>:refs/heads/release/x.y.x`), and make `release-x.y.z` from it.
- [ ] **Prepare** `release-x.y.z` as in step 1. The changelog's Unreleased section at that commit holds only what this release ships. Leave `src/baseline-moves.json` as it is: a patch keeps the minor release's moves.
- [ ] **Check and open** `Release x.y.z` as in step 2, into `release/x.y.x`, not `main`. [`test.yml`](../.github/workflows/test.yml) runs on pull requests into `release/**`.
- [ ] **Publish** as in step 3, but tag the merge on `release/x.y.x`: `git fetch origin release/x.y.x && git tag vx.y.z origin/release/x.y.x && git push origin vx.y.z`. A tag on `main` would publish the minor release's work too.
- [ ] **Bring it back into `main`** before the next minor release, on a branch from `main` that merges `origin/release/x.y.x`:
  - `CHANGELOG.md`: the released entries leave Unreleased for the `[x.y.z]` section, as released, between Unreleased and the release before. Git can merge it without a conflict and still put Unreleased's entries under `[x.y.z]`: check it by hand.
  - `package.json`, `package-lock.json`, `scripts/data/lean-measures.json` and `scripts/data/released-finding-ids.json` as released. The build is generated: take `main`'s and run `npm run build`.
  - `npm test`, then a pull request into `main`, merged with **Squash and merge**: `main` requires a linear history. Git then doesn't record the line as merged, so a later patch from it meets the same conflicts when it comes back.
