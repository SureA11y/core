# Audits

This branch, `audit/2026-10-stress-test-outcomes`, is where the engine is stress-tested and where the results are kept. It is **never merged** into `main`: `main` flows into it, nothing flows back.

- **The code on this branch is `main`'s code.** Everything outside `audits/` comes from `main` unchanged, apart from three things the branch adds:
  - one line in `eslint.config.js` that leaves the probe scripts out of lint;
  - `.github/workflows/audit-branch-guard.yml` and `tests/audit-branch-guard.test.js`, the merge guard below.
- **Everything the branch adds lives in `audits/`.** Keeping it there is what lets `main` merge in without conflicts.
- **A pull request from this branch always fails, on purpose.** Two guards make sure it is never merged by mistake, and each says why:
  - the *Audit branch guard* workflow fails any pull request opened from this branch (or from a branch made from it), unless it targets another `audit/` branch. The reason is in the job summary and in an error annotation on the pull request;
  - `tests/audit-branch-guard.test.js` makes `npm test` fail in GitHub Actions unless the run is for an `audit/` branch. So `main`'s own *Test* workflow also goes red on such a pull request, and would go red on `main` if this branch were ever merged anyway. Locally the test passes, so the suite still runs here.

  These checks are only as strong as `main`'s branch protection: for a red check to block the merge button, the *Test* checks must be required on `main`.
- **No fix is ever made here.** A finding is fixed on its own branch from `main`, through a normal PR. Once that is merged, the next update of this branch brings it in, and the register records it.

## What is here

| Path | What it is |
|---|---|
| [`FINDINGS.md`](./FINDINGS.md) | **The register: the one document to work from.** Every finding still open, deduplicated across audits and verified on a named `main` commit; every finding fixed, with where and when; every finding closed without a fix, with the reason. |
| `YYYY-MM-stress-test*.md` | One report per audit round: the evidence behind each finding (full repro, spec quotes, comparison with other engines, cause). Written once, then left as it was. |
| `YYYY-MM-stress-test-outcomes.md` | The log of a round's follow-up work (first round only; from now on that history goes in `FINDINGS.md`). |
| `YYYY-MM-probes*/` | The throwaway scripts behind a round, one folder per area. Not linted, not run in CI. |

## Before running an audit

1. **Bring the branch up to date with `main`.** This is always the first step.
   ```sh
   git fetch origin
   git checkout audit/2026-10-stress-test-outcomes
   git merge origin/main
   ```
   The merge must not change anything outside `audits/` except what came from `main`. Check with `git diff --stat origin/main -- . ':!audits' ':!eslint.config.js' ':!.github/workflows/audit-branch-guard.yml' ':!tests/audit-branch-guard.test.js'`, which must print nothing.
2. **Install and build:** `npm ci`, then `npm run build`. Rules run from the built `src/core.js` and `surea11y.browser.js`, so an unbuilt tree tests stale code.
3. **Check the baseline is green:** `npm test`. A failure here belongs to `main`, not to the audit; note it and don't start until you know whether it affects what you are about to test.
4. **Record the commit:** `git rev-parse --short origin/main`. Every report and every register update names the `main` commit it was checked against.
5. **Have a browser.** The layout, contrast, target-size and text-spacing rules need real rendering. The probes use Playwright with Chromium; in the cloud environment it is at `/opt/pw-browsers/chromium` (pass it as `executablePath`; don't run `playwright install`).

## Running an audit

**Split the work by area**, so each area gets depth. The areas used so far:

| Area | Typical environment |
|---|---|
| Accessible names and ARIA rules | jsdom (`tests/helpers/runa11yCoreOnHtml.js`) |
| Contrast, layout and visual rules | Chromium, with screenshots and pixel sampling for ground truth |
| Structure and document rules | jsdom |
| Options, selection and scoping (the API) | jsdom and Chromium |
| Reporters and translations | real scan results fed to every reporter; SARIF checked against the official schema; HTML rendered in Chromium |
| Robustness and scale | jsdom and Chromium, very large and odd documents, timing as N grows |

**Re-check what is already known.** Every round also re-runs every **open** item in `FINDINGS.md` on the new commit, and moves anything that no longer reproduces to *Fixed* (with the commit that fixed it, found with `git log` or `git bisect`).

**Judge each finding in this order:**

1. **The specification decides**: WCAG 2.2 and its Understanding documents, WAI-ARIA, accname, HTML-AAM, SVG-AAM, ARIA in HTML, the HTML Standard, the relevant CSS specs, the ACT rules, and SARIF / JUnit / EARL for the reporters. Quote the spec's own text. When the W3C sites are unreachable, most specs can be read from their GitHub source repositories.
2. **Then the engine's own docs and earlier decisions** (the register's *Closed without a fix* section lists decisions already taken; don't reopen one without new evidence).
3. **Browser behaviour is supporting evidence only.** Where a browser and a spec disagree, say so; the spec wins.
4. **What others do** is shown for comparison, never as a reason on its own. Run the same example through other widely used open-source engines in the same page, and report them as **Engine A** and **Engine B**, without naming them.

**Every finding needs**, before it goes into a report:
- a minimal example that reproduces it on the recorded commit, re-run by someone other than the probe that found it (otherwise mark it *(not re-run)*);
- an "In plain words" line a non-specialist can follow;
- what the engine says, and what it should say;
- the spec text or the doc it contradicts;
- the cause, as `file:line`, when found;
- a verdict and a severity, as below.

**Verdicts.** *Bug*: contradicts a spec the engine follows, or its own docs. *Inconsistency*: the spec leaves room, but the engine contradicts a decision it made elsewhere. *Gap*: a clear violation is missed. *Debatable*: a defensible reading supports the current behaviour; needs a decision. *Not a bug*: checked and found right. *Feature*: a missing capability nobody promised.

**Severity.** *High*: a wrong `fail` on common, correct markup (the engine reserves `fail` for certain violations, so this is the worst kind). *Medium*: a wrong `fail` on less common markup, a common miss, or a broken contract for integrators. *Low*: rare markup, cosmetic, or docs.

## After an audit

1. Write the round's report as `audits/YYYY-MM-stress-test-N.md`, and put its probes in `audits/YYYY-MM-probes-N/` (scripts only: no outputs over 100 KB, no copies of the repo).
2. Update `FINDINGS.md`:
   - add new findings to *Open*, merging any that repeat an open one (keep the oldest id, and list every report it appeared in);
   - move fixed ones to *Fixed*;
   - move ones decided against to *Closed without a fix*, with the reason;
   - update the commit and date at the top.
3. Commit only under `audits/` (the guard files aside), and push this branch. Never open a pull request from it.

## When a finding is fixed on `main`

Nothing changes here until the branch is next updated. At that point, the item moves from *Open* to *Fixed* in `FINDINGS.md`, with the commit, the PR, the release that shipped it (or *unreleased*) and the date. The entry stays there for good, so the register is also the history of what was fixed.
