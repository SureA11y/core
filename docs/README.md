# 📦 a11y-core — Deterministic DOM Rules Engine (v1)

A lightweight, **standards-aligned** accessibility rules engine that runs **inside the real browser DOM** (e.g. via Puppeteer `page.evaluate`).

This project is designed to be a **reference-grade core**:
- **Atomic rules** (one normative decision per rule)
- **Deterministic output** (normalization + strict outcome taxonomy)
- **Standards-traceable results** (normative mappings + versioned rule metadata)
- **Full i18n** (localized output + stable i18n tokens preserved)
- **Safe-by-default** (engine normalizes malformed outputs and surfaces rule errors)

> This package is the *core engine*. Reporting, scoring, CI formatting, and UX are intentionally out of scope for v1.

---

## Features

- Modular (one file per rule)
- Auto-discovered + bundled at build time (`src/core.js` is generated)
- In-page runner is self-contained (safe for `page.evaluate`)
- Result payload is self-describing (includes localized rule title/description + standards trace metadata)
- Policy separation (enforce outcome constraints without changing rule logic)
- Opt-in Shadow DOM traversal
- Locale fallback to English (`en`)

---

## Folder Layout

```
src/
  index.js
  core.js                 # GENERATED (do not edit)
  rules/                  # author rules here (one rule per file)
  i18n/                   # locale dictionaries: en.js, fr.js, ...
scripts/
  build-core.js           # code generator
schemas/
  engine-options.schema.json
  policy-contract.schema.json
docs/
  RULES_AUTHORING.md
  TEST_OUTCOME_STABILITY.md
```

---

## Public API

```js
const {
  ENGINE_TAG,
  SCHEMA_VERSION,

  // catalogs
  getChecksCatalog,
  getChecksForRunOnly,
  getCheckDefById,

  // runners
  runDomRulesInPage,      // Node/runtime runner
  runa11yCoreInPage,      // self-contained for page.evaluate

  // policy
  POLICY_CONTRACTS,
  resolvePolicy
} = require('a11y-core');
```

- `ENGINE_TAG` is the ruleId prefix (currently `a11ycore`)
- `SCHEMA_VERSION` is the result schema version (currently `1.0.0`)

---

## Rule Module Contract

Each rule module exports:

```js
module.exports = {
  id: "kebab-case-id",
  meta: { /* build-time normalized */ },
  runInPage(ctx) { /* runs inside page */ },

  // optional:
  applicability?(ctx) { /* boolean or { applicable, reason? } */ },
  data: { /* optional JSON-serializable, non-normative */ }
};
```

### `runInPage(ctx)` constraints

`runInPage(ctx)` is **stringified** and executed in the browser context. It must not reference outer-scope variables (including `id`, `meta`, or Node imports).

Allowed:
- `ctx.*` (document/window/root/helpers/rule/config/engineTag/contextSelector)
- DOM APIs
- local variables

---

## Outcomes, Policy, and Normalization

Rules return one of:

- `pass` — requirement satisfied
- `fail` — objective, user-impacting, **normative** violation (no heuristics)
- `cantTell` — manual verification required (equivalence/intent/quality)
- `notApplicable` — rule does not apply in the scanned scope

**Policies** resolve once per run and can:
- restrict allowed outcomes / confidence values
- coerce manual `fail` → `cantTell` (default behavior for `a11y` policy)

Rules may include a non-normative `data` payload (e.g., `fixes`, `usefulFor`, `notes`) to help consumers, but it must not change conformance meaning.

---

## Engine Options (v1)

```js
const engineOptions = {
  locale: "fr",                 // default: "en" (fallback to en)
  includeShadowDom: true,       // default: false
  excludeSelectors: ["#cookie", ".overlay"],

  // optional policy control
  policyContract: "a11y",       // "a11y" | "generic" | inline contract object
  policy: {                     // optional overrides
    coerceManualFailToCantTell: true
  },

  // per-rule configuration
  rules: {
    "a11ycore-img-alt-attr-present": { /* rule-specific config */ }
  }
};
```

---

## Build

`src/core.js` is generated from `src/rules/**` and `src/i18n/**`.

```bash
node scripts/build-core.js
node --test
```

Recommended:

```json
{
  "scripts": {
    "pretest": "node scripts/build-core.js",
    "test": "node --test"
  }
}
```

---

## Docs

- Authoring: `docs/RULES_AUTHORING.md`
- Test stability: `docs/TEST_OUTCOME_STABILITY.md`
- Schemas: `schemas/*.schema.json`
