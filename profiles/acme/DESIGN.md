# ACME: a second profile to stress the profile model

RGAA is the profile the structure grew around, so it fits by construction. ACME is a made-up "company standard" written to stress that structure: each of its requirements touches something RGAA never needed. The aim is not a useful standard. It is a list of findings: what holds, what breaks, what is awkward, each with a proposed fix.

ACME must never ship. It is test-only (see [Where it lives](#where-it-lives)).

## The standard

**ACME Accessibility Standard (AAS)**, two versions:

| | AAS 1.0 | AAS 2.0 |
|---|---|---|
| Built on | WCAG 2.1 A and AA | WCAG 2.2 A and AA |
| Profiles | `acme-1.0` | `acme-2.0` |
| Messages | English, Spanish | English, Spanish |

### Part A: WCAG, renumbered

`AAS-A.<sc>` restates each WCAG A/AA criterion, as EN 301 549 does (`AAS-A.1.4.3` = WCAG 1.4.3). Its entries derive from a rule's WCAG criteria.

### Part B: ACME's own requirements

| Id | Requirement | How it is checked |
|---|---|---|
| AAS-B1 | Pointer targets are at least 44×44 CSS px (2.0); 24×24 (1.0) | Own rule `acme-target-size`, a stricter, versioned variant of core's `target-size-minimum` |
| AAS-B2 | All text, large text included, reaches 4.5:1 | Own rule `acme-contrast-uniform`, built on `helpers.contrast` |
| AAS-B3 | Every page links to the accessibility statement | Own rule `acme-statement-link`; the accepted link texts and URL pattern come from configuration |
| AAS-B4 | Headings are in order and the page has landmarks | Core's best-practice rules `heading-order` and `region`, mapped by id |
| AAS-B5 | Pages have a skip link | RGAA's opt-in rule `skip-link-present`, mapped by id |
| AAS-B6 | WCAG 3.3.8 does not apply (AAS 2.0 waives it for internal tools) | Core's rule for 3.3.8, `password-paste-enabled`, must not run under `acme-2.0` |

AAS-B gets one rollup per requirement, so B4 groups two core rules and B1 one ACME rule.

## What each part stresses

Each row is a hypothesis to confirm or refute by building it. "Expect" is my guess from reading the code today.

| # | Stress | Exercised by | Expect |
|---|---|---|---|
| 1 | **A profile outside `profiles/`.** The registry and the build know only what `profiles/index.js` lists, and that list ships. | Where ACME lives | Breaks. There is no way to add a profile that is not built in. This is the packaging question in small. |
| 2 | **Two versions of one profile.** A rule that behaves differently per version (44 vs 24 px). | AAS-B1 | Breaks. A rule cannot tell which profile or version is running it: `ctx` carries neither. Workarounds (two rules, or `ctx.config`) are awkward. |
| 3 | **A stricter variant of a core rule.** | AAS-B1 | Holds, at a cost. A rule cannot call another rule, and the target-size logic is not a helper, so it is copied (as `contrast-minimum-rgaa` copied `contrast-minimum`). |
| 4 | **A variant built only from documented helpers.** | AAS-B2 | Holds. The test that `helpers.contrast` is now fully documented, including `sharedCache`. |
| 5 | **Configuration for a profile.** Link texts and URL pattern differ per company. | AAS-B3 | Partly holds. `engineOptions.rules[ruleId]` reaches the rule as `ctx.config`, but there is no profile-level configuration, no default, and no documented schema. |
| 6 | **Mandatory best-practice rules.** | AAS-B4 | Holds. Mapping them by id makes `mappedRules` select them, as RGAA does for `heading-order`. |
| 7 | **Depending on another profile.** | AAS-B5 | Unclear. Naming `skip-link-present` by id may lift RGAA's opt-in gate, which would silently tie ACME to RGAA. Nothing declares the dependency or checks it. |
| 8 | **Waiving a WCAG criterion.** | AAS-B6 | Breaks. A profile can only add rules (tags plus mapped ids); it cannot exclude one. |
| 8b | **Superseding a core rule.** Under `acme-2.0`, core's `target-size-minimum` (24 px) runs next to `acme-target-size` (44 px), so one small target is reported twice, by two rules with two thresholds. | AAS-B1 | Breaks, same cause as 8: no way to say "this rule replaces that one in this profile". |
| 9 | **A hybrid mapping.** Part A derives entries from WCAG criteria, Part B maps rule by rule. | Parts A and B | Breaks or misreports. `ruleMapped` is one flag per standard, which decides how rollups name entries. ACME needs it per requirement. |
| 10 | **A profile with fewer languages.** | Messages | Holds, noisily. `i18n:sync` seeds de, fr and ja with English, so they count as untranslated forever. Nothing lets a profile declare its locales. |
| 11 | **Two profiles side by side.** | ACME and RGAA together | Mostly holds. Expected checks: `optInRules: 'all'` unlocks both; a WCAG profile runs neither; each report section stays separate; registry order is stable. |
| 12 | **A rule id defined twice.** A negative test: ACME defines a rule id RGAA already has. | Build | Breaks silently. The build rejects duplicate rollup ids but not duplicate rule ids across rule folders. |
| 13 | **A dictionary key defined twice.** A negative test. | Build | Holds. `scripts/lib/dictionaries.js` refuses it. |
| 14 | **The boundary check on a second profile.** | Everything | Holds, or shows which rules in the contract were written with RGAA in mind. |

## Where it lives

ACME must not ship, and must not run in a user's scan. Today the only way in is `profiles/index.js`, which ships (stress 1). Options:

- **A. A build option for extra profiles.** `examples/profiles/acme/` holds the profile; `SUREA11Y_EXTRA_PROFILES=examples/profiles/acme npm run build` builds an engine that includes it. A separate test command (and CI job) builds that way and runs ACME's tests; the normal build never sees it. This is the "build-time composition" option for packaging, tried out on a test profile first.
- **B. A runtime registration test.** ACME registers itself at run time (`engine.use(acme)`). This needs the runtime registration API first, which is the larger of the two packaging options.
- **C. Built in, hidden.** List ACME in `profiles/index.js` behind a test-only flag. Least work, but it ships and teaches nothing about packaging.

I recommend **A**. It is the smaller packaging option, it answers stress 1 for real, and it leaves B open.

## Plan

One stress point per commit, each recording its finding in the table below as it is learned:

1. The extra-profile build option (A) with an empty ACME: entry only, Part A mapping. Covers stress 1, 9, 11 and 14.
2. AAS-B4 and B5: mapped core and RGAA rules (6, 7).
3. AAS-B2: the contrast variant (4).
4. AAS-B1: the versioned target-size variant (2, 3).
5. AAS-B3: the configurable statement link (5).
6. AAS-B6: the waiver (8).
7. Messages in two languages (10), and the negative tests (12, 13).

Each step either fixes what it finds in core, if the fix is small and clearly right, or records it with a proposed fix for you to decide.

## Findings

| # | Finding | Severity | Proposed fix | Status |
|---|---|---|---|---|
| | *(filled in while building)* | | | |
