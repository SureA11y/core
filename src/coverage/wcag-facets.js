'use strict';

/**
 * WCAG coverage facets (non-normative)
 *
 * Purpose:
 * - Provide context for "how much" of a WCAG Success Criterion is covered by rules.
 * - Facets are NOT additional requirements; they are a structured breakdown of common test objectives
 *   described in WCAG Understanding / Techniques, used purely for reporting and prioritization.
 *
 * How to use:
 * - The coverage report script can combine:
 *   - rule meta (meta.wcagSc, meta.type, meta.tags)
 *   - and this facets map (per-SC facets + optional ruleId->facet mapping)
 *
 * Notes:
 * - Facet automation levels:
 *   - full: can be fully determined automatically (pass/fail/na) in many cases
 *   - partial: can be partially automated but often needs human judgment (cantTell)
 *   - manual: inherently requires human judgment per WCAG (cantTell by design)
 */

const FACETS = {
  '1.1.1': {
    title: 'Non-text Content',
    facets: [
      {
        id: 'text-alternative-mechanism',
        label: 'Non-text content provides a text alternative mechanism (e.g., alt/name/fallback present)',
        automation: 'full'
      },
      {
        id: 'functional-nontext-name',
        label: 'Functional non-text content conveys purpose via accessible name',
        automation: 'partial'
      },
      {
        id: 'decorative-null',
        label: 'Decorative non-text content is correctly null (ignored by AT)',
        automation: 'partial'
      },
      {
        id: 'technology-specific-nontext',
        label: 'Technology-specific non-text (svg/canvas/imagemap) has appropriate alternatives',
        automation: 'partial'
      },
      {
        id: 'equivalent-purpose',
        label: 'Text alternative is equivalent for the intended purpose',
        automation: 'manual'
      }
    ]
  },

  '1.3.1': {
    title: 'Info and Relationships',
    facets: [
      {
        id: 'programmatic-relationships',
        label: 'Information/relationships are programmatically determinable (e.g., label association)',
        automation: 'partial'
      }
    ]
  },

  '4.1.2': {
    title: 'Name, Role, Value',
    facets: [
      {
        id: 'accessible-name',
        label: 'UI components have an accessible name',
        automation: 'partial'
      }
    ]
  }
};

module.exports = { FACETS };
