# Rule catalog: ACME

The rules of the ACME profile, which a scan runs under its profile or when asked for by tag. Core's rules, and the WCAG rollups, are in core's [`RULE_CATALOG.md`](../../../docs/RULE_CATALOG.md).

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header. Run `node scripts/generate-rule-catalog.js` after `npm run build` to regenerate this file whenever rules change. Do not hand-edit.

**2 rules total: 2 automatic (can return `fail`), 0 manual (advisory/judgment-required, capped at `cantTell`). 0 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

See [`OUTPUT_SCHEMA.md`](../../../docs/OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](../../../docs/WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim.

## Automatic rules (2), can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`acme-contrast-uniform`](#acme-contrast-uniform) | All text reaches a contrast ratio of 4.5:1 | — | — | high | serious |
| [`acme-statement-link`](#acme-statement-link) | Pages link to the accessibility statement | — | — | high | moderate |

## Manual rules (0), advisory, capped at `cantTell`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|

## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition (when it returns `notApplicable`), and "Expectation" is the condition it decides once it does apply.

### `acme-contrast-uniform`

**All text reaches a contrast ratio of 4.5:1**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that visible text, large text included, has a contrast ratio of at least 4.5:1, when contrast is computable from CSS.

**Applies to.** The same text as contrast-minimum: visible text whose background and foreground are computable.

**Expectation.** Every computable text node reaches 4.5:1, whatever its size. WCAG 1.4.3 asks only 3:1 of large text; ACME does not make that exception.

### `acme-statement-link`

**Pages link to the accessibility statement**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the page links to the accessibility statement, by link text or URL, and under ACME 2.0 from its footer.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable.

**Expectation.** The page has a link to the accessibility statement: a link whose text contains one of the accepted texts, or whose URL path contains one of the accepted paths. Under ACME 2.0 (profile acme-2.0) the link must also sit in the page's footer (a contentinfo landmark); under 1.0 it may be anywhere.
