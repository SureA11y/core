/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check title-placeholder-identical
 * @atomic true
 * @summary A form field's title and placeholder, when both are present, are identical
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <input> and <textarea> fields that carry both a non-empty
 *   title and a non-empty placeholder. Only these fields show a
 *   placeholder; the attribute does nothing elsewhere. A hidden field, or a
 *   page with no such field, is notApplicable.
 * @expectation
 *   RGAA's glossary entry "Étiquette de champ de formulaire" says that a
 *   placeholder « est susceptible d'être restitué à la place de l'attribut
 *   title » and that « lorsque ces deux attributs title et placeholder sont
 *   présents, ils doivent être identiques ». A field whose two values are
 *   the same once whitespace is collapsed passes.
 * @implementation-notes
 * - Asks (cantTell) rather than failing when the two differ: the glossary
 *   states the requirement, but no RGAA test names it. The question is
 *   filed under 11.2.2 (is the title relevant), the test that judges a
 *   title used as a label.
 * - The comparison is exact apart from whitespace: case and punctuation
 *   count, since the glossary asks for identical values.
 * - Opt-in (tag `rgaa`): WCAG has no such requirement.
 */

const id = 'title-placeholder-identical';

const meta = {
  title: "A form field's title and placeholder are identical",
  description:
    'Asks about form fields whose title and placeholder are both present but differ: RGAA\'s glossary entry "Étiquette de champ de formulaire" requires them to be identical.',
  i18n: {
    titleKey: 'titlePlaceholderIdentical_title',
    descriptionKey: 'titlePlaceholderIdentical_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  // Input types that show a placeholder (HTML: text, search, url, tel,
  // email, password, number; an unknown or missing type is text).
  const NO_PLACEHOLDER_TYPES = new Set([
    'hidden',
    'checkbox',
    'radio',
    'file',
    'submit',
    'reset',
    'button',
    'image',
    'range',
    'color',
    'date',
    'datetime-local',
    'month',
    'time',
    'week'
  ]);

  const SELECTOR = 'input[title][placeholder], textarea[title][placeholder]';
  let nodes;
  try {
    nodes = helpers.queryAllSmart ? helpers.queryAllSmart(SELECTOR) : helpers.queryAll(SELECTOR);
  } catch {
    nodes = [];
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (tagOf(el) === 'input') {
      const type = clean(dom.getAttribute(el, 'type')).toLowerCase();
      if (NO_PLACEHOLDER_TYPES.has(type)) continue;
    }
    const title = clean(dom.getAttribute(el, 'title'));
    const placeholder = clean(dom.getAttribute(el, 'placeholder'));
    if (!title || !placeholder) continue;
    applicableCount += 1;
    if (title === placeholder) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        occurrenceOutcome: 'cantTell',
        summary: 'The title and the placeholder of this form field differ.',
        hint: 'A screen reader may read the placeholder instead of the title. Give both attributes the same text, or remove the one that is not needed.',
        i18n: {
          summaryKey: 'titlePlaceholderIdentical_summary_cantTell',
          hintKey: 'titlePlaceholderIdentical_hint_cantTell',
          params: { title, placeholder }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Which RGAA test the audit records this under; the glossary requires the two values to be identical.',
          evidence: { title, placeholder }
        },
        data: {
          details: { reasonCode: 'TITLE_PLACEHOLDER_DIFFER', title, placeholder }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
