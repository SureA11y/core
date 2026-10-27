# Status of the October 2026 audit work

Where the work on the audit's findings stands, written so that another person or session can pick it up without the history of this one. The findings themselves, open and fixed, are in [`FINDINGS.md`](./FINDINGS.md); this page says what is in flight, what is decided, and how the work is done.

Last updated 2026-10-27, on `main` at `92e54df6` (1.14.0 plus five commits).

## 1. Open now

Nothing is in flight: no pull request from the audit work is open. Five rounds have run; their findings are fixed or decided, as recorded in [`FINDINGS.md`](./FINDINGS.md) §3:
- **Rounds 1 and 2:** fixed in #77 to #186 (the sections of §3 below the third round).
- **Round 3:** fixed in #191 to #194, merged 2026-10-10.
- **Round 4:** fixed in #212 to #241, merged 2026-10-15; re-checked by round 5.
- **Round 5:** fixed in #289 to #295 and #299, merged 2026-10-23 to 2026-10-24, released in 1.14.0; re-checked on `92e54df6` on 2026-10-27.

What is left (`FINDINGS.md` §1), all Low:
- three parts of fifth-round findings: generated text moved off the page by `text-indent` (R5:VI-12), a key listener added from another realm (R5:KH-5), an unknown key given to the console's `run()` (R5:AP-4);
- the fourth round's option and selection leads (R4:OP-P1, P3 to P6, the strict-mode whitespace and the Kelvin sign).

**Next step:** take the decisions of `FINDINGS.md` §1 ("Waiting on a decision"), then fix the Low items on branches from `main`, one issue each. Before the next round, merge `main` into this branch (README, "Before running an audit").

## 2. Decisions taken

- Rounds 1 and 2: as recorded in `FINDINGS.md` §3 and §4. C-20 (profiles as packages outside core) is paused; packs (#189) now cover much of it.
- Round 3: all its decisions taken on 2026-10-10 ([outcomes §2.30](./2026-10-stress-test-3-outcomes.md)).
- Round 4: its five decisions acted on in #214.
- Round 5: the two-label field asked about; a light fill with a light outline fails; a hidden error message shown elsewhere asked about; key handling attached on first focus asked about; large text by the size drawn; a drop-down select measured against both the colour Chromium paints and its computed one; a field named only by `aria-placeholder` fails.
- `valid-lang` and the private-use range `qaa`–`qtz`: kept as a `fail` on 2026-10-05, reversed on 2026-10-25 (#303) to follow ACT.
- Still open: four questions, in `FINDINGS.md` §1.

## 3. How the work is done

These are the conventions this work has followed; keep them.

- **Commits.** Authored and signed off by Jorge Rumoroso (`git commit -s`). Never another author, and no mention of tools or assistants in commits, code, docs, issues or pull requests.
- **Two commits per item.** The code commit (the change, its tests, its docs), then a changelog commit, "Record …", whose body is "The changelog records the fix (#N)." or "… the change (#N)." for a feature. The changelog entry goes at the top of its section of `## [Unreleased]` in `CHANGELOG.md` (Added, Changed, Removed, Fixed), and ends with `(#N)` when there is an issue.
- **Issues.** One per item, in the format of #158 (bug: Problem, Examples, Spec, Fix (agreed), "Found in …") or #143 (feature: … Change (agreed)), labelled `bug` or `enhancement`, typed Bug, Feature or Task, assigned to rumoroso. Created a few minutes apart, not in a burst. The code commit ends with "Fixes #N".
- **Judging.** By the specs (WCAG, ACT rules, WAI-ARIA, HTML, CSS) and by what Chromium does (the accessibility tree over CDP, focus, the painted pixels); not by one of them alone. A fix that is debatable is left for a decision rather than made.
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
