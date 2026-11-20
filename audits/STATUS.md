# Status of the audit work

Where the work on the audit's findings stands, written so that another person or session can pick it up without the history of this one. The findings themselves, open and fixed, are in [`FINDINGS.md`](./FINDINGS.md); this page says what is in flight, what is decided, and how the work is done.

Last updated 2026-11-20, on `main` at `78354cc4` (1.17.0 plus the unreleased 1.18.0 work).

## 1. Open now

Nothing is in flight: no pull request from the audit work is open. Seven rounds have run; their findings are fixed or decided, as recorded in [`FINDINGS.md`](./FINDINGS.md) §3:
- **Rounds 1 and 2:** fixed in #77 to #186 (the sections of §3 below the third round).
- **Round 3:** fixed in #191 to #194, merged 2026-10-10.
- **Round 4:** fixed in #212 to #241, merged 2026-10-15; re-checked by round 5.
- **Round 5:** fixed in #289 to #295 and #299, merged 2026-10-23 to 2026-10-24, released in 1.14.0; re-checked on `92e54df6` on 2026-10-27.
- **Round 6** (the unreleased 1.18.0 work, at `23e0a387`): fixed in #406 and #407, merged 2026-11-20, unreleased; every open item of the register re-checked on `c1bb82de` the same day. RF-16's last part fixed by #408.
- **Round 7** (at `ec664338`): 38 findings, all fixed in #411, merged 2026-11-20, with R4:OP-P1.
- **The leftovers of rounds 4 and 5**, and the four questions that waited on a decision: fixed and decided in #412, merged 2026-11-20.
- **The safe features of `FINDINGS.md` §2** (R5:AP-7's `checkPack` report, invariants over every rule, pixel checks of native controls): done in #413, merged 2026-11-20, with a shadow-root selector fix the invariants found.
- **target-size-minimum's speed** on long pages: done in #414, merged 2026-11-20.

What is left: no finding to fix and no question to decide (`FINDINGS.md` §1). The features of `FINDINGS.md` §2 remain, the sixth round's three among them (R6:CE-4 to CE-6).

**Next step:** decide which of the remaining features of `FINDINGS.md` §2 to take: those left change what a scan does (a 1.4.4 clipping check, a first-heading best practice, a time budget, speed work on contrast-computable and label-in-name, reporter changes, a shared event-path helper, profiles without forking core). Before the next round, merge `main` into this branch (README, "Before running an audit").

**Before 1.18.0 is used by the packs:** `pack-rgaa`, `pack-raweb` and `pack-en301549` declare `~1.17.0`, so each needs a release to accept it; `pack-rgaa`'s test of the experimental APIs it uses ("the profile serves article 47…") needs updating then, as it uses none any more. With #411, two more package tests need a one-line update: `pack-wai-aria`'s "an unnamed grid: a question for WCAG, a failure of WAI-ARIA" (the check now fails under the WAI-ARIA profile alone, R7:IF-7) and `pack-rgaa`'s "RGAA 9.3 and WCAG 1.3.1 both ask about `<li>` items in a role="list"" (WCAG 1.3.1 is now `passedInPart`, R7:AN-6). With #412, one more: `pack-rgaa`'s "9.3 asks about a plain `<li>` in a list with a widget role" expects `listitem-parent-valid` to fail, where it now asks (R5 list lead, decided); RGAA 9.3's outcome is unchanged.

**Not recorded here.** Two pieces of audit work ran on `main` between the fifth and sixth rounds, and their reports were never brought to this branch: a stress test of scans of several profiles, fixed in `86d60598` and `2ddfc07a` (2026-11-03), and an audit of the rules' messages, fixed in #385 and #386 (2026-11-11). Their fixes are in `main`, and the sixth round ran on top of them; only their reports and probes are missing from the register.

## 2. Decisions taken

- Rounds 1 and 2: as recorded in `FINDINGS.md` §3 and §4. C-20 (profiles as packages outside core) is paused; packs (#189) now cover much of it.
- Round 3: all its decisions taken on 2026-10-10 ([outcomes §2.30](./2026-10-stress-test-3-outcomes.md)).
- Round 4: its five decisions acted on in #214.
- Round 5: the two-label field asked about; a light fill with a light outline fails; a hidden error message shown elsewhere asked about; key handling attached on first focus asked about; large text by the size drawn; a drop-down select measured against both the colour Chromium paints and its computed one; a field named only by `aria-placeholder` fails.
- `valid-lang` and the private-use range `qaa`–`qtz`: kept as a `fail` on 2026-10-05, reversed on 2026-10-25 (#303) to follow ACT.
- Round 6, all on 2026-11-19: excluded areas are context for rules that judge the whole page (no findings in them, their content still read); every experimental API due at 1.18.0 made stable after its fixes, `skip-link`'s `details.lean` and the `standard.review` keys included, as `pack-rgaa` uses both; requirement-level laws kept experimental until 1.20.0 and honoured by the scan; invalid `aria-level` values follow WAI-ARIA's default where Chromium exposes 1.
- Round 7, all on 2026-11-20: `reflow-horizontal-scroll` becomes a manual rule that asks and never fails, a region filling the viewport is the page, and `opacity: 0` is hidden; `p-as-heading` drops `BOLD_SHORT_DIV` and `BOLD_LEAD_LINE`, keeping `BOLD_SHORT_PARAGRAPH`; a pack's profile scanned alone keeps the pack's verdict; an invalid `aria-checked` on a native checkbox or radio is asked about.
- After round 7, on 2026-11-20: `strictOptions` refuses unknown `mappings` and `optInRules` tags and invalid `excludeSelectors` CSS; an `<li>` in a list whose role replaces list is asked about, leaning fail; an input whose `list` names no datalist is a textbox, as Chromium exposes it; `focus-not-removed-by-script` keeps its criteria, without 3.2.1; ids, tags and profile names match case in ASCII only.
- R6:CE-6: no lean for a small table of plain text with no `<th>` (2026-11-20).
- Nothing is waiting on a decision.

## 3. How the work is done

These are the conventions this work has followed; keep them.

- **Commits.** Authored and signed off by Jorge Rumoroso (`git commit -s`). Never another author, and no mention of tools or assistants in commits, code, docs, issues or pull requests.
- **Two commits per item.** The code commit (the change, its tests, its docs), then a changelog commit, "Record …", whose body is "The changelog records the fix (#N)." or "… the change (#N)." for a feature. The changelog entry goes at the top of its section of `## [Unreleased]` in `CHANGELOG.md` (Added, Changed, Removed, Fixed), and ends with `(#N)` when there is an issue.
- **Issues.** One per item, in the format of #158 (bug: Problem, Examples, Spec, Fix (agreed), "Found in …") or #143 (feature: … Change (agreed)), labelled `bug` or `enhancement`, typed Bug, Feature or Task, assigned to rumoroso. Created a few minutes apart, not in a burst. The code commit ends with "Fixes #N".
- **Judging.** By the specs (WCAG, ACT rules, WAI-ARIA, HTML, CSS) and by what Chromium does (the accessibility tree over CDP, focus, the painted pixels); not by one of them alone. A fix that is debatable is left for a decision rather than made.
- **Code.** Rules read the DOM through `ctx.helpers.dom`, and a name read with `dom.get` is listed in `src/core/safe-dom.js`. Match the surrounding style. Prettier applies to code and tests (`npm run format:check`), not to docs. Never edit or rewrite `main`.
- **Tests.** A Chromium test, `tests/engine-checks/*-chromium.test.js`, where the change touches rendering or the browser, and jsdom tests; each new test fails before its fix. Chromium tests find the browser through `CHROMIUM_EXECUTABLE_PATH`.
- **Pull requests.** Mirror `.github/PULL_REQUEST_TEMPLATE.md` and the style of #146 and #161, with a "Fixes #N" line per issue at the end. Base `main`; they are merged by rebase.
- **Rounds 6 and 7 did not follow two of these.** Their findings were fixed in a few pull requests (#406, #407; #411 for round 7 and #412 for the leftovers, each in one at the owner's request) with no issue per item and no separate "Record …" changelog commits: the changelog entries went in with each fix. The other conventions held.

## 4. Verifying a commit

Before a commit is pushed, it is checked on its own, in a worktree of its own, against the commit before it:

1. **Fixtures in Chromium.** The 136 scenario pages under `tests/fixtures/` scanned with the bundle before and after the commit; every rule's outcome and occurrences compared. A change must be one the commit means to make.
2. **Fixtures in jsdom.** The same pages, with `src/core.js` before and after.
3. **Checks.** `lint`, `format:check`, `coverage:check`, `docs:rule-catalog:check`, `fixtures:check`, `fixtures:markers:check`, `i18n:check`, `validate:rules`, `rule-examples:coverage:check`.
4. **The suite.** `npm test`, with Chromium. One test fails in a container without Playwright's default browser build, "runa11yCoreAcrossFrames / a11yCoreEnableFrameResponder (real browser, real cross-origin)", and fails on `main` there too; anything else is a real failure.

One commit takes about 13 minutes. The scripts used for this lived in a temporary workspace and are not in the repository; the steps above are what they did.
