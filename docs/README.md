# 📦 a11y-core — Modular DOM Rules Engine

Lightweight DOM-based accessibility engine that runs inside the real browser DOM via `page.evaluate`.

## Features
- Modular (one file per rule)
- Auto-discovered rules
- Safe result normalization
- Rich metadata (category, type, defaultConfidence)
- Stable API surface
- Configurable per-rule behavior

## Folder Layout
```
src/
  index.js
  a11yCore-core.js        # generated
  rules/                  # author rules here
scripts/
  build-a11yCore-core.js  # code generator
```

## Rule API
```js
module.exports = {
  id,
  meta,
  runInPage
};
```

### meta fields
```
title
description
helpUrl
tags
wcagSc
defaultSeverity
category
type
defaultConfidence
```

### runInPage(ctx)
Runs in the browser. Returns:
```js
{
  ruleId,
  outcome,
  severity,
  confidence?,
  occurrences
}
```

## Build Rules
```
npm run build
```

## Public API
```js
const {
  ENGINE_TAG,
  getRulesCatalog,
  getRulesForRunOnly,
  getRuleDefById,
  runa11yCoreInPage
} = require('a11y-core');
```

## Noise Control Examples
```js
const autoHigh = r.rules.filter(x => x.type==='automatic' && x.confidence==='high');
const noManual = r.rules.filter(x => x.type!=='manual');
```

## Next
- Add new rules
- WCAG coverage
- CI test harness
