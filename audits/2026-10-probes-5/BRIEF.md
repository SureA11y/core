# Fifth stress test: brief for every probe

Target: `main` at `c528af08` (1.13.1 plus everything unreleased), checked out in `/home/user/core`, already installed and built (`src/core.js`, `surea11y.browser.js` are current). **Do not edit anything outside `audits/2026-10-probes-5/<your-area>/`.** Never rebuild, never `npm install` in the repo, never commit, never push.

## Goal

Break the engine. Most effort on what is new since the fourth round (`git log 3af2008..c528af08`, and `## [Unreleased]` plus `## [1.13.0]`/`[1.12.x]` in `CHANGELOG.md`), without ignoring the rest. Every suspected wrong result is judged against the specs, with WCAG as the source of truth.

## Tools

- **Chromium:** load `/home/user/core/surea11y.browser.js` into the page with `page.addScriptTag`, then call `window.a11ycore.runa11yCoreInPageAsync(location.href, null, engineOptions, runOnly)`. Serve pages over http (a small `node:http` server) so that origins are sane. Use `page.addInitScript` for `listenerHookScript()` / `liveRegionHookScript()` / the internals hook (get their source from `require('/home/user/core/src/index.js')`) so they run before page scripts.
- **jsdom:** `require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js')(html, …)`, returns the scan result. See `tests/helpers/runDomRulesOnHtml.js` for its options.
- **Chromium accessibility tree** (ground truth for names/roles as exposed): through Playwright CDP `Accessibility.getFullAXTree`, or `scripts/ax-tree-differential.js` (read it first).
- **Playwright** is `require('/home/user/core/node_modules/playwright')`; launch with `executablePath: '/opt/pw-browsers/chromium'`. Never run `playwright install`.
- The machine has 4 cores and other probes run at the same time: keep at most 2 browsers open, close them, and don't trust wall-clock timings under 3× differences without re-running.
- Spec sources: try w3.org / whatwg.org first; if blocked, read the specs' GitHub source (w3c/wcag, w3c/aria, w3c/html-aam, w3c/accname, w3c/html-aria, whatwg/html, act-rules/act-rules.github.io) from raw.githubusercontent.com. Quote the text you rely on.

## Judging (from the audit README)

1. The spec decides (WCAG 2.2 + Understanding, WAI-ARIA 1.2/1.3, accname, HTML-AAM, ARIA in HTML, HTML, CSS, ACT rules). Quote it.
2. Then the engine's own docs (`docs/*.md`, CHANGELOG, the rule's own description) and decisions already taken.
3. Chromium behaviour is supporting evidence only.

Verdicts: *Bug* (contradicts a spec or its own docs), *Inconsistency*, *Gap* (a clear violation missed), *Debatable*, *Not a bug*, *Feature*.
Severity: *High* = wrong `fail` on common correct markup; *Medium* = wrong `fail` on less common markup, a common miss, or a broken integrator contract; *Low* = rare, cosmetic, docs.

The engine reserves `fail` for certain violations and uses `cantTell` for questions; a `cantTell` where a clear `fail` is due is a (lesser) gap, a `fail` where the spec allows the markup is the worst kind of bug.

## What to deliver

In `audits/2026-10-probes-5/<area>/`:
- the probe scripts (small, one per idea; no outputs over 100 KB; no copies of the repo);
- `FINDINGS.md`: one entry per confirmed finding, id `<PREFIX>-n`, each with: minimal HTML/JS repro (re-run at least twice), "In plain words", what the engine says vs what it should say, the spec text quoted (with source), the engine's own docs if relevant, cause as `file:line` in `src/` when found, verdict, severity. Then a "Leads" section (suspected, not confirmed, or needs a decision), and a "What held up" section (what you tried hard to break and couldn't, with rough counts).

Your final message: a compact summary of the confirmed findings (id, one line, verdict, severity), the leads, and what held up. Do not paste the whole FINDINGS.md.
