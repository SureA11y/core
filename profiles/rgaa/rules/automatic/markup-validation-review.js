/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check markup-validation-review
 * @atomic true
 * @summary The generated source code must pass the W3C validator
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every page: RGAA 8.2 asks, for every page, whether its
 *   generated source code is valid for its document type.
 * @expectation
 *   RGAA 8.2.1, step 1 runs the W3C validator (Nu HTML Checker, « activer
 *   l'option W3C Nu markup checker ») on « le code source généré », the
 *   page after its scripts have run, and checks five conditions: tags,
 *   attributes and values follow the writing rules; tags are nested,
 *   opened and closed correctly; id values are unique; no attribute
 *   appears twice on one element.
 *   The caller can give the validator's report as the `validator.report`
 *   probe: `{ url, source: 'generated' | 'original', messages }`, where
 *   `messages` are the Nu checker's JSON messages as it outputs them.
 *   - A report on the generated source with an error fails, one finding
 *     per error with its line and message (VALIDATOR_ERROR). Messages
 *     about CSS (starting "CSS:") and warnings are left out: 8.2.1's
 *     conditions are about the HTML.
 *   - A report on the generated source with no error passes, unless it
 *     holds 200 messages or more, the most the engine reads from a probe,
 *     which is asked about (REPORT_TRUNCATED).
 *   - A report saying the validator could not check the page is asked
 *     about (VALIDATOR_FAILED).
 *   - A report on the original source is asked about, never passed or
 *     failed: its errors may be ones the parser repairs, which RGAA's
 *     method does not count, and a clean one says nothing of what scripts
 *     add (ORIGINAL_SOURCE). A report without `source` counts as one on
 *     the original source.
 *   - Without a report, or with one for another page or for a narrowed
 *     scan, the page is asked about (pageReview): the HTML parser repairs
 *     unclosed and misnested tags, drops repeated attributes and moves
 *     misplaced elements before the engine sees the page, so the DOM
 *     cannot show most of what 8.2.1 checks.
 * @implementation-notes
 * - The rules that report 8.2.1 failures from the DOM (duplicate-id,
 *   aria-role-conformance, aria-attribute-conformance and the other
 *   validity rules) cover only part of the test, so without a report this
 *   question keeps 8.2 from rolling up to pass.
 * - A finding is reported on <html>, with the validator's extract as its
 *   markup: a line in the generated source names no element of the DOM.
 * - Opt-in (tag `rgaa`): the question belongs to RGAA's criterion 8.2.
 */

const id = 'markup-validation-review';

const meta = {
  title: 'The generated source code passes the W3C validator',
  description:
    'Reads the W3C validator report on the generated source, given as the validator.report probe, and fails the errors it lists; without a report it asks a person to run the validator (RGAA 8.2.1).',
  i18n: {
    titleKey: 'markupValidationReview_title',
    descriptionKey: 'markupValidationReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const roots = Array.isArray(ctx.root) ? ctx.root : ctx.root ? [ctx.root] : [];
  const scanRoot =
    roots.find((r) => r && r.nodeType === 1) || (document && document.documentElement);
  if (!scanRoot) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const MAX_ERRORS = 50;
  const PROBE_CAP = 200; // the most items the engine keeps in a probe array

  function pageUrl(u) {
    try {
      const url = new URL(String(u), document.baseURI);
      url.hash = '';
      return url.href;
    } catch {
      return String(u || '');
    }
  }
  const probes =
    ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;
  const report =
    probes && probes['validator.report'] && typeof probes['validator.report'] === 'object'
      ? probes['validator.report']
      : null;
  const wholeDocument = helpers.isWholeDocumentScope ? helpers.isWholeDocumentScope() : true;
  const usable =
    wholeDocument &&
    report &&
    Array.isArray(report.messages) &&
    (!report.url || pageUrl(report.url) === pageUrl(document.URL));

  const html = document.documentElement || scanRoot;
  const text = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();

  function ask(reasonCode, key, summary, hint, params, uncertaintyCode, needed, extra) {
    return helpers.reportOccurrence(reasonCode === 'pageReview' ? scanRoot : html, {
      ...(reasonCode === 'pageReview' ? {} : { selector: 'html' }),
      summary,
      hint,
      i18n: {
        summaryKey: `markupValidationReview_summary_cantTell_${key}`,
        hintKey:
          reasonCode === 'pageReview'
            ? 'markupValidationReview_hint_cantTell_page'
            : 'markupValidationReview_hint_cantTell_report',
        params
      },
      uncertainty: { code: uncertaintyCode, needed, evidence: { reasonCode } },
      data: {
        details: { reasonCode, ...extra },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
  }
  const REPORT_HINT =
    "Validate the generated source of the page, the page after its scripts have run, with the W3C Nu HTML Checker, and pass its messages as the validator.report probe with source: 'generated' (RGAA 8.2.1).";
  const cantTell = (occ) => ({
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [occ]
  });

  if (!usable) {
    return cantTell(
      ask(
        'pageReview',
        'page',
        'Run the W3C validator on the generated source code of this page: the engine cannot see unclosed or misnested tags, repeated attributes and other errors the browser repairs.',
        'Validate the generated source (for example with the W3C Nu HTML Checker) and check that tags, attributes and values follow the writing rules, tags are nested, opened and closed correctly, id values are unique and no attribute appears twice on one element (RGAA 8.2.1).',
        {},
        'out-of-scope',
        'The W3C validator report on the generated source of the page.',
        {}
      )
    );
  }

  const messages = report.messages.filter((m) => m && typeof m === 'object');
  const failed = messages.find((m) => m.type === 'non-document-error');
  if (failed) {
    const message = text(failed.message);
    return cantTell(
      ask(
        'VALIDATOR_FAILED',
        'validatorFailed',
        `The validator could not check the page: ${message}`,
        REPORT_HINT,
        { message },
        'not-computable',
        'A validator report on the generated source of the page.',
        { message }
      )
    );
  }

  // Errors about the HTML: CSS messages and warnings are left out.
  const errors = messages.filter((m) => m.type === 'error' && !/^CSS:/i.test(text(m.message)));

  if (report.source !== 'generated') {
    const first = errors[0];
    const params = {
      count: String(errors.length),
      line: first && first.lastLine != null ? String(first.lastLine) : '',
      message: first ? text(first.message) : ''
    };
    return cantTell(
      errors.length
        ? ask(
            'ORIGINAL_SOURCE',
            'originalErrors',
            `The W3C validator reports ${params.count} errors in the original source, the first at line ${params.line}: ${params.message}. RGAA 8.2.1 validates the generated source, where the browser may have repaired them.`,
            REPORT_HINT,
            params,
            'runtime-dependent',
            'Whether the generated source of the page has these errors.',
            { errorCount: errors.length }
          )
        : ask(
            'ORIGINAL_SOURCE',
            'originalClean',
            'The W3C validator reports no error in the original source. RGAA 8.2.1 validates the generated source, which scripts may change.',
            REPORT_HINT,
            {},
            'runtime-dependent',
            'Whether the generated source of the page has errors.',
            { errorCount: 0 }
          )
    );
  }

  if (errors.length) {
    const occurrences = errors.slice(0, MAX_ERRORS).map((m) => {
      const message = text(m.message);
      const line = m.lastLine != null ? String(m.lastLine) : '';
      const extract = text(m.extract).slice(0, 200);
      return helpers.reportOccurrence(html, {
        selector: 'html',
        html: extract || '<html>',
        summary: `The W3C validator reports an error in the generated source, line ${line}: ${message}`,
        hint: 'Correct the markup so that it follows the HTML writing rules: tags, attributes and values written as HTML allows, tags nested, opened and closed correctly, unique id values and no attribute twice on one element (RGAA 8.2.1).',
        i18n: {
          summaryKey: 'markupValidationReview_summary_fail_error',
          hintKey: 'markupValidationReview_hint_fail_error',
          params: { line, message }
        },
        data: {
          details: {
            reasonCode: 'VALIDATOR_ERROR',
            message,
            line: m.lastLine != null ? m.lastLine : null,
            column: m.lastColumn != null ? m.lastColumn : null,
            errorCount: errors.length
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      });
    });
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  if (report.messages.length >= PROBE_CAP) {
    return cantTell(
      ask(
        'REPORT_TRUNCATED',
        'truncated',
        `The validator report has ${PROBE_CAP} messages or more and the engine reads the first ${PROBE_CAP}, none of them an error, so the rest could not be checked.`,
        REPORT_HINT,
        { cap: String(PROBE_CAP) },
        'not-computable',
        'Whether the messages after the first ones include an error.',
        { messageCount: report.messages.length }
      )
    );
  }

  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
