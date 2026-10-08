# Status of the October 2026 audit work

Where the work on the audit's findings stands, written so that another person or session can pick it up without the history of this one. The findings themselves, open and fixed, are in [`FINDINGS.md`](./FINDINGS.md); this page says what is in flight, what is decided, and how the work is done.

Last updated 2026-10-08.

## 1. Open now

C-13's first part, custom rules counting toward the WCAG rollups of the criteria they map to: [#179](https://github.com/SureA11y/core/issues/179), in progress on branch `feat/custom-rules-in-rollups`. Otherwise nothing: VS-14, the contrast regression reported in use, and VS-15, the same mistake in target-size-minimum, found while fixing it, are fixed in [#178](https://github.com/SureA11y/core/pull/178) (merged 2026-10-08, closing #176 and #177); see [`FINDINGS.md`](./FINDINGS.md#vs-14). Paused: C-20's packages and C-13 (section 2).

### The follow-up, #175: merged

The follow-up, pull request [#175](https://github.com/SureA11y/core/pull/175), is merged (2026-10-08, by rebase) and closed #162 to #174; its thirteen items are in `FINDINGS.md` §3, with `main`'s hashes and how each was checked. Every Low finding of the audit is fixed.

## 2. Decisions taken

- Done in #161 (merged): 36 of the 42 Low findings, and halves of ST-6 and R-10.
- Done in #175 (merged): the rest of the Low findings, as decided: VS-13, ST-6's `x-foo` half, RB-8, R-10's `line-clamp` half, R-12, R-15, O-6, O-14 (removed), O-5b (catalog links), and the features `strictOptions` (#162) and O-12 (#163).
- Done in #178 (merged): VS-14, and VS-15 as decided: a box a reader scrolls (`overflow: auto` or `scroll`) no longer cuts a target, which is measured as scrolled into it, no larger than the box; `hidden`, `clip` and `contain: paint` still cut. For contrast, text out of view is measured as scrolled into any box clipping its overflow, `hidden` included, since carousels scroll it from script.
- Custom rule ids: one that differs from a built-in's only in case overrides it, under the built-in's id, with a warning naming both spellings; one that differs from an earlier custom rule's only in case is skipped. Selection by id (`runOnly`) stays exact.
- `role="LIST"` in capitals: no change. Chromium resolves roles in any case, as the engine does.
- C-13 split (2026-10-08): its first part, custom rules counting toward the WCAG rollups of the criteria they map to, is taken (#179): a custom rule that ran counts as a built-in does, an override counts where its own mapping says, and the rollup names its custom rules. Its second part, custom composites, and custom rules in a standard's own rollups, moved to C-20.
- Paused, for later: C-20 (profiles as packages of their own, outside core; it needs run-time registration of a standard, its rules, variants and rollups, and, from C-13, custom composites). The RGAA profile is being built inside core meanwhile; the profile boundary rules keep it movable to a package later.

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
