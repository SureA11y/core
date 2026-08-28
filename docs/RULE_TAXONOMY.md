# RULE_TAXONOMY.md — Canonical Rule Taxonomy (repo-derived)

This document describes how rules in this repository are classified.
It reflects **what already exists in the rules and tests**, not theory.

---

## 1. Primary taxonomy axes

### 1.1 Automation / Decision Kind
Encoded by: `meta.type`

- `automatic`
    - Rule **decides deterministically**, with no heuristics and no guessing
    - Allowed outcomes: `pass`, `fail`, `notApplicable`, `cantTell`
    - `cantTell` is the primary path in two distinct cases, and a defensive
      fallback in a third:
        - the rule decides that a real violation exists, but the violation does
          not on its own establish that the mapped criterion fails — an ARIA
          author requirement the exposed name, role and value survive
          (`aria-valid-attr`, `aria-braille-equivalent`,
          `aria-conditional-attr`), or the graded tier of a rule that fails
          elsewhere (`aria-required-attr`, `aria-roles-valid`)
        - the rule decides deterministically but claims no Success Criterion at
          all (`aria-allowed-role`, tagged `best-practice`)
        - a computability gate the rule cannot resolve, or an internal-failure
          safety net (`contrast-minimum.js`/`contrast-enhanced.js`/
          `contrast-computable.js`/`target-size-minimum.js`)
- `manual`
    - Rule signals **human review required**: it cannot decide at all
    - Allowed outcomes: `cantTell`, `notApplicable`

Manual rules MUST NOT make normative failure decisions. The dividing line
between the two types is whether the rule can decide, not which outcome it
reports: an automatic rule that reports `cantTell` has decided, and is saying
what it found; a manual rule reports `cantTell` because the question is not
decidable from markup.

---

### 1.2 Intent
Encoded by: **rule id suffix**

Illustrative intents (from the image-alternatives family used as the running example in §2, not an exhaustive list — the ruleset's 130 rules use dozens of distinct suffixes; `docs/RULE_CATALOG.md` is the generated, always-current list):

- `present`
    - Verifies that a required **mechanism exists**
    - Typically automatic
- `quality`
    - Verifies appropriateness, correctness, or meaningfulness
    - Always manual
- `decorative`
    - Verifies correct treatment of purely decorative content
    - Always manual

Intent determines whether a rule can be automatic.

---

### 1.3 Target Family
Encoded by: **rule id prefix**

Illustrative families, from the image-alternatives cluster (WCAG 1.1.1) used as the running example in §2 — not an exhaustive list. The ruleset's 130 rules span dozens of families (`aria-*`, `contrast-*`, `dialog-*`, `iframe-*`, `label-*`, `link-*`, `list-*`, `landmark-*`, and more); see `docs/RULE_CATALOG.md` for the generated, always-current list:

- `img`
- `area`
- `input-image`
- `canvas`
- `embed`
- `object`
- `svg`
- `svg-image`
- `video-poster`

Each family defines:
- which elements are queried
- which helpers are applicable
- which mechanisms are valid

Rules MUST NOT mix families.

---

### 1.4 Target Set (Tree Scope)
Encoded by: `data.visibilityFilter.targetSet`

Values used by this ruleset:
- `acc` (accessibility tree) — most rules
- `dom` (raw DOM/CSS visibility, no accessibility-tree computation) — e.g. `label-in-name.js`

Rules log eligibility against whichever tree scope they target using:
- `helpers.isAccTreeEligible` / `helpers.isDomVisibleEligible`
- `helpers.getEligibilityInfo(..., { targetSet: "acc" | "dom" })`

This is a semantic constraint, not logging noise.

---

### 1.5 Mechanism Type
Implicitly encoded via helper usage and coverage facets.

Examples:
- attribute-based (`alt`, `poster`)
- IDREF-based (`aria-labelledby`, `aria-describedby`)
- fallback content (`<object>` contents)
- computed accessible name / description
- element-specific mechanisms (e.g. `<canvas>` alternatives)

Different mechanisms require separate rules or facets.

---

### 1.6 WCAG Mapping
Encoded by:
- `meta.wcagSc`
- `meta.normativeMappings`
- optional `meta.informativeReferences`

Multiple rules may map to the same SC.
This is required for atomicity.

---

### 1.7 Coverage Facets
Encoded by: `meta.coverage.facetsBySc`

A **facet** represents one atomic coverage slice of a Success Criterion.

Rules MUST:
- declare at least one facet per SC
- not share facets with rules that make a different decision
- keep facet naming consistent within a family

Facets are used for coverage accounting, not reporting.

---

## 2. Canonical rule family grid (example)

For image alternatives (WCAG 1.1.1):

| Rule ID | Family | Intent | Type |
|------|-------|-------|------|
| img-alt-present | img | present | automatic |
| img-alt-quality | img | quality | manual |
| img-alt-decorative | img | decorative | manual |

Other families follow the same grid where applicable.

---

## 3. Atomicity rule (hard constraint)

If two checks differ by **any** of the following, they MUST be separate rules:

- normative vs review decision
- intent (present / quality / decorative)
- target family
- mechanism type
- outcome domain
- coverage facet

This constraint is already enforced by the existing ruleset.
