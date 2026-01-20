# Test Outcome Expectations & Stability Rules

**Purpose**  
Ensure that tests validate **engine architecture and contracts**, not incidental rule semantics, and prevent regressions when rules are reclassified as manual or advisory.

---

## A. Rule Outcome Expectations

- Do **not** assume `fail` outcomes by default.
- Only **normative, automatic rules** may be expected to produce `fail`.
- **Manual rules** must **never** be expected to produce `fail`.
- **Advisory / best-practice rules** must **never** be expected to produce `fail` under the accessibility policy.

### Outcome changes due to standards alignment are correct
If a rule changes from `fail` → `cantTell` due to FAIL integrity, related tests **must be updated**.  
Such test failures are expected and correct — **not regressions**.

---

## B. Engine-Mechanics Test Safety (Mandatory)

Tests validating **engine behavior** (not accessibility semantics) — including but not limited to:

- `runOnly`
- `includeRuleIds`
- `excludeRuleIds`
- `tag` filtering
- `determinism`
- `policy selection`

**MUST:**
- Use **stable, normative, automatic rules** as targets.
- Avoid **manual** or **advisory** rules entirely.

**MUST NOT:**
- Depend on advisory or manual rule outcomes.
- Encode assumptions about non-normative semantics.

---

## C. Canonical Rule IDs in Tests

- Tests must assert against the engine’s **canonical rule IDs** (e.g., `a11ycore-<rule-id>`).
- Mixed or legacy prefixes must **not** be hard-coded unless explicitly testing prefix-normalization behavior.

---

## D. Evidence Assertions

When asserting occurrences, rely only on stable evidence fields:

- `selector`
- `summary`
- `hint`
- minimal HTML snippet

Avoid asserting on full `outerHTML` or formatting-dependent strings unless absolutely required.

---

## ✅ Test Change Gate (Agent-Enforced Checklist)

Before modifying any test, the agent or contributor must complete and validate:

### 1. Rule Classification
Each affected rule is categorized as:
- Normative automatic
- Normative manual
- Advisory / best-practice

### 2. FAIL Integrity Validation
Any expected `fail` must be:
- a direct normative violation
- user-impacting
- objectively determinable

If not, the expectation must be changed to `cantTell`.

### 3. Engine-Mechanics Safety
- Filtering / engine tests use only normative automatic rules.
- No advisory or manual rules are used as test anchors.

### 4. Rule ID Consistency
- Assertions use canonical engine rule IDs.

### 5. Minimal Change Principle
- Tests are updated **only** to reflect intentional architectural or standards changes.

---

## 🔁 Rule Change Impact Protocol (Rules → Tests → Policy)

### Step 1 — Declare Change Type
Each change must be labeled as one or more:
- Rule logic change
- Outcome semantics change (`fail` ↔ `cantTell`)
- Metadata / documentation change
- Policy / normalization change
- Test-only refactor

### Step 2 — Map Affected Architecture Layers
Explicitly state which layers are impacted:
- **Rules:** deterministic evaluation
- **Policy:** allowed outcomes, coercion
- **Tests:** expectations, selection

### Step 3 — Impact Matrix (per rule)
For each affected rule, document:

| Field | Description |
|-------|--------------|
| **Rule ID** | Canonical rule identifier |
| **Category** | Normative automatic / manual / advisory |
| **Allowed outcomes** | Enumerated values |
| **Standards mapping changed?** | yes / no |
| **FAIL integrity impacted?** | yes / no |
| **Evidence shape changed?** | yes / no |
| **Tests impacted?** | yes / no |
| **Policy impacted?** | yes / no |

### Step 4 — Apply Changes in Order
1. Rule logic / metadata
2. Policy / normalization (if required)
3. Tests (outcomes, IDs, filtering targets)

### Step 5 — Regression Safeguards
Maintain:
- ✅ **no-runtime-throw rule contract test**
- ✅ **determinism test**
- ✅ **no advisory rule fails** under accessibility policy

---

## 📌 Recommended Target Rules for Engine-Mechanics Tests

Only the following **normative automatic rules** are approved as anchors for engine-mechanics tests (unless explicitly updated):

- `form-control-accessible-name`
- `img-alt-attr-present`
- `svg-role-img-name`

---

## 🧩 Rationale

This engine intentionally separates:
- **Normative violations** → automatic, failing
- **Manual verification** → `cantTell`
- **Advisory guidance** → non-failing

Tests must respect this separation to preserve **trust**, **correctness**, and **long-term stability**.

---

## 🧭 Alignment with Core Principles

- **Determinism:** identical input yields identical normalized output.
- **Atomicity:** one rule per normative requirement.
- **Transparency:** test expectations traceable to rule classification and policy.
- **FAIL Integrity:** no false fails, no inferred best-practice enforcement.
