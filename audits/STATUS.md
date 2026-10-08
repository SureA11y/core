# Status of the October 2026 audit work

Where the work on the audit's findings stands, written so that another person or session can pick it up without the history of this one. The findings themselves, open and fixed, are in [`FINDINGS.md`](./FINDINGS.md); this page says what is in flight, what is decided, and how the work is done.

Last updated 2026-10-08.

## 1. Open now

### VS-14: contrast fails text scrolled out of view (High, regression) — not started

**Start here.** Reported in use and confirmed; see [`FINDINGS.md`](./FINDINGS.md#vs-14).

- An Angular Material autocomplete opened in an Angular Material dialog of limited height, its option list longer than the panel and scrolled with its overflow hidden. The contrast rules fail options further down the list, which can only be seen by scrolling them into the panel, where their contrast is sufficient.
- A regression from `b8b3d74` (2026-10-06, "Measure text against what is painted under it, in CSS's painting order"): the core before that commit reports no contrast failure on the page; from it on, it reports these options. Other engines don't report them.
- Suspected cause: since that commit the background is read from what is painted under the text's position, and a box that clips or scrolls its content (the panel, the dialog) is not taken into account, so text out of view is measured against what lies under where it would be, outside the box.
- Next: a reduced page with the same structure (a dialog of limited height, a scrolled option list with hidden overflow) to reproduce it in Chromium; then the fix, with a Chromium test of that page; and a check of the other places the painting-order background is used.

### Pull request for the follow-up: [#175](https://github.com/SureA11y/core/pull/175) — open

Branch `feat/audit-2026-10-follow-up`, from `main` at `29f76a1` (after #161). It closes #162 to #174:

| Item | Issue | Code commit, changelog commit | Full verification |
|---|---|---|---|
| `strictOptions`, and a warning for a mistyped option | #162 | `de13e2a`, `31f4d65` | passed |
| A custom rule id differing from a built-in only in case overrides it | #165 | `4fc9c0b`, `dacbfc3` | passed |
| Rules with no WCAG criterion link their RULE_CATALOG.md section (O-5b) | #164 | `3b50a12`, `9f6db35` | passed |
| `output.detail: 'findings'`, a compact result (O-12) | #163 | `038ae4c`, `065181c` | passed |
| Remove `src/explain/` (O-14) | #173 | `995b963`, `ecd02bf` | passed |
| link-in-text-block: separators between links are not text (VS-13) | #166 | `6bb6991`, `2a96d0d` | passed (the one fixture change is the new scenario) |
| profiles/README.md: what a profile's tests may require (C-20, docs) | #174 | `2eecd33`, `40fb492` | passed |
| html-xml-lang-mismatch: an `xml:lang` with no language (ST-6) | #167 | `31777e6`, `d70bb8a` | passed (combined run) |
| Contrast ratios rounded to 12 decimals (R-15) | #171 | `b8dc772`, `88cdd0d` | passed (combined run) |
| SARIF fingerprint as a SHA-256 digest (O-6) | #172 | `0be6984`, `ee8561c` | passed (combined run) |
| aria-hidden-focus on a page that reacts to focus (RB-8) | #168 | `c1200d4`, `14c2bfe` | passed (combined run) |
| auditorAssist on a dark color scheme (R-12) | #170 | `7b88958`, `89551de` | passed (combined run) |
| text-spacing: an excerpt that shows fewer lines (R-10, `line-clamp` half) | #169 | `124e1f3`, `87b3551` | passed (combined run) |

"Passed (combined run)": the last six commits were verified together, as described in section 4 but against `40fb492` (the commit before them) rather than one by one: no fixture outcome changed in Chromium or jsdom, all checks passed, and the suite failed only the known cross-origin test. The pull request's first CI run failed `tests/core/safe-dom.test.js`, because the R-12 commit removed its probe with `dom.call(probe, 'remove')`, a name not listed in `src/core/safe-dom.js`; it now uses `dom.removeChild`, folded into that commit, which changed the hashes of the last four commits.

Once merged: move the thirteen items in `FINDINGS.md` from section 1 (open) to section 3 (fixed), with `main`'s hashes (the pull requests are merged by rebase, so the hashes change: map them by commit subject), and a "how it was checked" paragraph each, as for the Low findings.

## 2. Decisions taken

- Done in #161 (merged): 36 of the 42 Low findings, and halves of ST-6 and R-10.
- In #175: the rest of the Low findings, as decided: VS-13, ST-6's `x-foo` half, RB-8, R-10's `line-clamp` half, R-12, R-15, O-6, O-14 (removed), O-5b (catalog links), and the features `strictOptions` (#162) and O-12 (#163).
- Custom rule ids: one that differs from a built-in's only in case overrides it, under the built-in's id, with a warning naming both spellings; one that differs from an earlier custom rule's only in case is skipped. Selection by id (`runOnly`) stays exact.
- `role="LIST"` in capitals: no change. Chromium resolves roles in any case, as the engine does.
- Paused, for later: C-20 (profiles as packages of their own, outside core; it needs run-time registration of a standard, its rules, variants and rollups) and C-13 (custom rules in the WCAG rollups, which C-20 would need too). The RGAA profile is being built inside core meanwhile; the profile boundary rules keep it movable to a package later.

## 3. How the work is done

These are the conventions this work has followed; keep them.

- **Commits.** Authored and signed off by Jorge Rumoroso (`git commit -s`). Never another author, and no mention of tools or assistants in commits, code, docs, issues or pull requests.
- **Two commits per item.** The code commit (the change, its tests, its docs), then a changelog commit, "Record …", whose body is "The changelog records the fix (#N)." or "… the change (#N)." for a feature. The changelog entry goes at the top of its section of `## [Unreleased]` in `CHANGELOG.md` (Added, Changed, Removed, Fixed), and ends with `(#N)` when there is an issue.
- **Issues.** One per item, in the format of #158 (bug: Problem, Examples, Spec, Fix (agreed), "Found in …") or #143 (feature: … Change (agreed)), labelled `bug` or `enhancement`, typed Bug, Feature or Task, assigned to rumoroso. Created a few minutes apart, not in a burst. The code commit ends with "Fixes #N".
- **Other engines.** Rules are compared with two other engines' results on the same pages, but they are never named anywhere: they are "Engine A" and "Engine B", or "other engines".
- **Judging.** By the specs (WCAG, ACT rules, WAI-ARIA, HTML, CSS), by what Chromium does (the accessibility tree over CDP, focus, the painted pixels), and by the other engines; not by one of them alone. A fix that is debatable is left for a decision rather than made.
- **Code.** Rules read the DOM through `ctx.helpers.dom`, and a name read with `dom.get` is listed in `src/core/safe-dom.js`. Match the surrounding style. Prettier applies to code and tests (`npm run format:check`), not to docs. Never edit or rewrite `main`.
- **Tests.** A Chromium test, `tests/engine-checks/*-chromium.test.js`, where the change touches rendering or the browser, and jsdom tests; each new test fails before its fix. Chromium tests find the browser through `CHROMIUM_EXECUTABLE_PATH`.
- **Pull requests.** Mirror `.github/PULL_REQUEST_TEMPLATE.md` and the style of #146 and #161, with a "Fixes #N" line per issue at the end. Base `main`; they are merged by rebase.

## 4. Verifying a commit

Before a commit is pushed, it is checked on its own, in a worktree of its own, against the commit before it:

1. **Fixtures in Chromium.** The 136 scenario pages under `tests/fixtures/` scanned with the bundle before and after the commit; every rule's outcome and occurrences compared. A change must be one the commit means to make.
2. **Fixtures in jsdom.** The same pages, with `src/core.js` before and after.
3. **Checks.** `lint`, `format:check`, `coverage:check`, `docs:rule-catalog:check`, `fixtures:check`, `fixtures:markers:check`, `i18n:check`, `validate:rules`, `rule-examples:coverage:check`.
4. **The suite.** `npm test`, with Chromium. One test fails in a container without Playwright's default browser build, "runa11yCoreAcrossFrames / a11yCoreEnableFrameResponder (real browser, real cross-origin)", and fails on `main` there too; anything else is a real failure.

One commit takes about 13 minutes. The scripts used for this lived in a temporary workspace and are not in the repository; the steps above are what they did.
