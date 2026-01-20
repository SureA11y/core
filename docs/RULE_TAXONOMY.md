# RULE_TAXONOMY.md — Canonical Rule Taxonomy (repo-derived)

This document describes how rules in this repository are classified.
It reflects **what already exists in the rules and tests**, not theory.

---

## 1. Primary taxonomy axes

### 1.1 Automation / Decision Kind
Encoded by: `meta.type`

- `automatic`
    - Rule makes a **normative decision**
    - Allowed outcomes: `pass`, `fail`, `notApplicable`
- `manual`
    - Rule signals **human review required**
    - Allowed outcomes: `cantTell`, `notApplicable`

Manual rules MUST NOT make normative failure decisions.

---

### 1.2 Intent
Encoded by: **rule id suffix**

Current intents:

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

Current families include:

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

Current value used by this ruleset:
- `acc` (accessibility tree)

Rules explicitly log eligibility against the accessibility tree using:
- `helpers.isAccTreeEligible`
- `helpers.getEligibilityInfo(..., { targetSet: "acc" })`

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
| a11ycore-img-alt-present | img | present | automatic |
| a11ycore-img-alt-quality | img | quality | manual |
| a11ycore-img-alt-decorative | img | decorative | manual |

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
