/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Renders scan results as an EARL 1.0 report in JSON-LD (docs/EARL.md), the
 * format the W3C ACT Rules community group accepts as an implementation
 * report and the interchange format most accessibility tooling reads.
 *
 * The graph is grouped by TestSubject rather than being a flat list of
 * assertions: one entry per scanned URL, each carrying the assertions made
 * about it. That is what the ACT earl-context expects, and it is why this
 * takes an array of results as readily as one -- a report covering many pages
 * is the normal case, not an extension.
 *
 * Every rule that ran becomes an assertion, including `pass` and
 * `notApplicable`. That is the opposite of the SARIF and HTML reporters,
 * which carry violations only: an implementation report is a claim about what
 * the engine decided everywhere, and a rule that was silent because it found
 * nothing applicable is evidence, not noise.
 */

const EARL_CONTEXT = 'https://www.w3.org/WAI/content-assets/wcag-act-rules/earl-context.json';

// The engine's four outcomes onto EARL's vocabulary. `earl:untested` has no
// counterpart here: a rule that did not run produces no result to assert on.
const OUTCOME_TO_EARL = {
  pass: 'earl:passed',
  fail: 'earl:failed',
  cantTell: 'earl:cantTell',
  notApplicable: 'earl:inapplicable'
};

/**
 * A Success Criterion's own id, as WCAG publishes it: the slug of its title.
 * Derived rather than tabulated so a rule added with a new SC needs no second
 * edit here, and pinned by a test that lists every slug the catalog produces.
 */
function scSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[(),.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * `normativeMappings` also carries Understanding-document references and
 * non-WCAG standards, which share `standard: 'WCAG'` and a `requirement` with
 * the real thing. A Success Criterion is the entry that states a conformance
 * level and claims no other document type.
 */
function wcagCriteria(check) {
  const mappings = (check && check.meta && check.meta.normativeMappings) || [];
  const slugs = new Set();

  for (const m of mappings) {
    if (!m || m.standard !== 'WCAG' || m.type || !m.conformanceLevel) continue;
    const slug = scSlug(m.title);
    if (slug) slugs.add(`WCAG2:${slug}`);
  }

  return [...slugs].sort();
}

function assertionFor(check, assertor, mode) {
  const outcome = OUTCOME_TO_EARL[check.outcome];
  if (!outcome) return null;

  const test = { title: check.ruleId };
  const isPartOf = wcagCriteria(check);
  if (isPartOf.length) test.isPartOf = isPartOf;

  const assertion = {
    '@type': 'Assertion',
    test,
    result: { outcome }
  };

  if (assertor) assertion.assertedBy = assertor;
  if (mode) assertion.mode = mode;

  return assertion;
}

function normalizeAssertor(options) {
  if (options.assertor === null) return null;

  const supplied = options.assertor || {};
  const assertor = { '@type': 'Assertor', name: supplied.name || 'surea11y' };
  const revision = supplied.version || supplied.revision;
  if (revision) assertor.release = { '@type': 'Version', revision: String(revision) };
  return assertor;
}

/**
 * @param {object|object[]} results one scan result, or several to report together
 * @param {object} [options]
 * @param {object|null} [options.assertor] `{ name, version }`; null omits it
 * @param {string} [options.mode] an EARL test mode, e.g. `'earl:automatic'`
 * @returns {object} the JSON-LD document
 */
function renderEarlReport(results, options = {}) {
  const list = (Array.isArray(results) ? results : [results]).filter(
    (r) => r && typeof r === 'object'
  );

  const assertor = normalizeAssertor(options);
  const mode = typeof options.mode === 'string' && options.mode ? options.mode : null;

  // Several results for one URL merge into a single subject: a caller scanning
  // the same page under different engineOptions still describes one resource,
  // and the context has no way to express two subjects with the same source.
  const bySource = new Map();

  for (const result of list) {
    const source = typeof result.url === 'string' && result.url ? result.url : 'about:blank';
    const checks = Array.isArray(result.checksResults) ? result.checksResults : [];

    if (!bySource.has(source)) bySource.set(source, new Map());
    const assertions = bySource.get(source);

    for (const check of checks) {
      if (!check || typeof check.ruleId !== 'string') continue;
      const assertion = assertionFor(check, assertor, mode);
      if (assertion) assertions.set(check.ruleId, assertion);
    }
  }

  const graph = [...bySource.keys()]
    .sort()
    .map((source) => ({
      '@type': 'TestSubject',
      source,
      assertions: [...bySource.get(source).keys()]
        .sort()
        .map((ruleId) => bySource.get(source).get(ruleId))
    }))
    .filter((subject) => subject.assertions.length);

  return { '@context': EARL_CONTEXT, '@graph': graph };
}

module.exports = { renderEarlReport, EARL_CONTEXT, OUTCOME_TO_EARL, scSlug };
