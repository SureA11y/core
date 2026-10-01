/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check doctype-position
 * @atomic true
 * @summary A declared doctype must come before the <html> tag
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that declares a doctype (RGAA
 *   8.1.3: « possédant une déclaration de type de document »). A page whose
 *   source has none is notApplicable: doctype-present fails it under 8.1.1.
 *   A run narrowed by contextSelector, or by engineOptions.fragment, is
 *   notApplicable.
 * @expectation
 *   RGAA 8.1.3: the doctype comes before the <html> tag in the source.
 *   - A doctype in the DOM passes: the HTML parser keeps one only when it
 *     comes before <html>, so the DOM settles it with no other input.
 *   - With no doctype in the DOM, the source as the server sent it is
 *     needed, through the `page.source` probe: `{ url, start }`, start
 *     being the first 2,000 characters of the response body (the engine cuts
 *     longer probe strings). Comments are skipped. A doctype that comes
 *     after <html> fails (DOCTYPE_AFTER_HTML); a source with <html> and no
 *     doctype is notApplicable; a start that shows neither is asked about
 *     (SOURCE_TOO_SHORT).
 *   - With no doctype in the DOM and no probe, the rule asks
 *     (SOURCE_MISSING): the doctype may be missing or misplaced.
 * @implementation-notes
 * - A probe whose url is another page than the one scanned is ignored.
 * - doctype-present reads the same probe, so a misplaced doctype fails
 *   8.1.3 here and is present for 8.1.1, not failed twice.
 * - Opt-in (tag `rgaa`): WCAG does not require a doctype.
 */

const id = 'doctype-position';

const meta = {
  title: 'The doctype comes before the <html> tag',
  description:
    'Checks that a declared doctype comes before the <html> tag in the source, reading the page source given as the page.source probe when the parser has dropped it (RGAA 8.1.3).',
  i18n: {
    titleKey: 'doctypePosition_title',
    descriptionKey: 'doctypePosition_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  if (document.doctype) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const probes =
    ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;
  const source =
    probes && probes['page.source'] && typeof probes['page.source'] === 'object'
      ? probes['page.source']
      : null;
  function pageUrl(u) {
    try {
      const url = new URL(String(u), document.baseURI);
      url.hash = '';
      return url.href;
    } catch {
      return String(u || '');
    }
  }
  const usable =
    source &&
    typeof source.start === 'string' &&
    (!source.url || pageUrl(source.url) === pageUrl(document.URL));

  const MESSAGES = {
    DOCTYPE_AFTER_HTML: {
      key: 'fail_afterHtml',
      summary: 'The page source declares its doctype after the <html> tag, so browsers ignore it.',
      hint: 'Move the doctype to the very start of the page, before the <html> tag: <!DOCTYPE html> (RGAA 8.1.3).'
    },
    SOURCE_MISSING: {
      key: 'cantTell_sourceMissing',
      summary:
        'The page has no doctype once parsed. Without its source, whether one is missing or written after the <html> tag could not be told.',
      hint: 'Look at the page source as the server sends it, or pass its start as the page.source probe: a doctype must come before the <html> tag (RGAA 8.1.3).',
      needed: 'Whether the page source declares a doctype, and where.'
    },
    SOURCE_TOO_SHORT: {
      key: 'cantTell_sourceTooShort',
      summary:
        'The start of the page source given shows neither a doctype nor the <html> tag, so where the doctype sits could not be told.',
      hint: 'Look at the page source as the server sends it: a doctype must come before the <html> tag (RGAA 8.1.3).',
      needed: 'Whether the page source declares a doctype before the <html> tag.'
    }
  };

  function report(reasonCode) {
    const msg = MESSAGES[reasonCode];
    const occ = helpers.reportOccurrence(document.documentElement, {
      selector: 'html',
      html: '<html>',
      summary: msg.summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `doctypePosition_summary_${msg.key}`,
        hintKey: `doctypePosition_hint_${msg.key}`,
        params: {}
      },
      ...(msg.needed
        ? {
            uncertainty: {
              code: 'out-of-scope',
              needed: msg.needed,
              evidence: { reasonCode }
            }
          }
        : {}),
      data: {
        details: { reasonCode },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
    return {
      ruleId: rule.ruleId,
      outcome: msg.needed ? 'cantTell' : 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences: [occ]
    };
  }

  if (!usable) return report('SOURCE_MISSING');

  // Comments may come before either tag; their text is not markup.
  const text = source.start
    .replace(/^\uFEFF/, '')
    .replace(/<!--[\s\S]*?(-->|$)/g, (m) => ' '.repeat(m.length));
  const doctypeAt = text.search(/<!doctype[\s>]/i);
  const htmlAt = text.search(/<html[\s>/]/i);

  if (doctypeAt !== -1 && (htmlAt === -1 || doctypeAt < htmlAt)) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  if (doctypeAt !== -1) return report('DOCTYPE_AFTER_HTML');
  if (htmlAt !== -1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return report('SOURCE_TOO_SHORT');
}

module.exports = { id, meta, runInPage, applicability };
