# RULE_TEMPLATE.md — Copy/Paste Templates (repo-faithful)

---

## Automatic rule template

```js
'use strict';

const id = 'a11ycore-your-rule-id';

const meta = {
  title: 'Human title',
  description: 'English fallback description.',
  i18n: { titleKey: 'a11ycore_yourRule_title', descriptionKey: 'a11ycore_yourRule_description' },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  // informativeReferences: [ ... ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.1.1': ['facet-name'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const occurrences = [];
  let applicableCount = 0;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');

  for (const el of nodes) {
    const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const eligible = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    if (!eligible) continue;
    applicableCount += 1;

    const violates = false; // compute

    if (violates) {
      const selector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
      occurrences.push({
        selector,
        html,
        summary: 'Fallback summary.',
        hint: 'Fallback hint.',
        i18n: {
          summaryKey: 'a11ycore_yourRule_summary_fail',
          hintKey: 'a11ycore_yourRule_hint_fail',
          params: { element: (el.tagName || '').toLowerCase() }
        },
        data: { visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] } }
      });
    }
  }

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (occurrences.length) return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
```

## Manual rule note

Manual rules are identical except:
- `meta.type: 'manual'`
- outcomes: `cantTell` (when applicable) / `notApplicable`
