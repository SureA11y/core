'use strict';

/**
 * The reporters read their option values as the engine reads its own: an
 * on/off option given as a command line or an environment variable spells it
 * ('true', 'false', '1', '0', 1, 0) is read as that, with a warning, and a
 * number title is written as text. Nothing 1.17 rendered throws, except a
 * value that can't be read (a BigInt, an object) and anything but the right
 * type under the reporter's strictOptions.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderHtmlReport } = require('../src/report.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>Page title</title></head>' +
  '<body><main><img src="a.png"></main></body></html>';
const result = runa11yCoreOnHtml(HTML, {
  runOnly: ['img-alt-present', 'button-name-present']
});

function warned(fn) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = warn;
  }
}

const skippedNotApplicable = (xml) => /button-name-present/.test(xml);

test('includeNotApplicable reads "true", "1" and 1 as true and "false", "0" and 0 as false, with a warning', () => {
  assert.equal(skippedNotApplicable(renderJunitReport(result)), false);
  for (const v of ['true', 'TRUE', '1', 1]) {
    const { value, warnings } = warned(() =>
      renderJunitReport(result, { includeNotApplicable: v })
    );
    assert.equal(skippedNotApplicable(value), true, String(v));
    assert.equal(warnings.length, 1, String(v));
    assert.match(
      warnings[0],
      /renderJunitReport: includeNotApplicable should be true or false; read .* as true/
    );
  }
  for (const v of ['false', '0', 0]) {
    const { value, warnings } = warned(() =>
      renderJunitReport(result, { includeNotApplicable: v })
    );
    assert.equal(skippedNotApplicable(value), false, String(v));
    assert.equal(warnings.length, 1, String(v));
  }
});

test('an on/off value that reads as neither is ignored with a warning', () => {
  const { value, warnings } = warned(() =>
    renderJunitReport(result, { includeNotApplicable: 'yes' })
  );
  assert.equal(skippedNotApplicable(value), false);
  assert.match(warnings[0], /includeNotApplicable must be true or false, not "yes"; ignored/);
});

test('manualChecks "false" leaves the manual checks out, as false does', () => {
  const off = renderHtmlReport(result, { manualChecks: false });
  const { value, warnings } = warned(() => renderHtmlReport(result, { manualChecks: 'false' }));
  assert.equal(value.includes('manual-checks-heading'), off.includes('manual-checks-heading'));
  assert.equal(value.includes('manual-checks-heading'), false);
  assert.equal(warnings.length, 1);
  assert.ok(renderHtmlReport(result, { manualChecks: 'true' }).includes('manual-checks-heading'));
});

test('a number title is written as text, with a warning', () => {
  const { value, warnings } = warned(() => renderHtmlReport(result, { title: 123 }));
  assert.match(value, /<title>123<\/title>|<h1[^>]*>123</);
  assert.match(warnings[0], /renderHtmlReport: title should be a string; read 123 as text/);
  assert.ok(renderHtmlReport(result, { title: null }).length > 0);
});

test('the SARIF switches read the same forms', () => {
  const { value, warnings } = warned(() =>
    renderSarifReport(result, { leanFailWcagOnly: 'true', allowProfilesNotRun: 0 })
  );
  assert.ok(JSON.parse(value).runs.length);
  assert.equal(warnings.length, 2);
});

test('a value that cannot be read throws a TypeError naming it', () => {
  assert.throws(() => renderJunitReport(result, { includeNotApplicable: 1n }), {
    name: 'TypeError',
    message: /includeNotApplicable must be true or false, not 1n/
  });
  assert.throws(() => renderHtmlReport(result, { manualChecks: {} }), TypeError);
  assert.throws(() => renderHtmlReport(result, { manualChecks: Object.create(null) }), TypeError);
  assert.throws(() => renderHtmlReport(result, { title: { text: 'x' } }), {
    name: 'TypeError',
    message: /title must be a string, not \{"text":"x"\}/
  });
  assert.throws(() => renderHtmlReport(result, { title: 5n }), TypeError);
  assert.throws(() => renderSarifReport(result, { leanFailWcagOnly: [] }), TypeError);
});

test('under strictOptions, anything but the right type throws', () => {
  for (const strictOptions of [true, 'true', '1', 1]) {
    assert.throws(
      () => renderJunitReport(result, { includeNotApplicable: 'true', strictOptions }),
      TypeError
    );
    assert.throws(() => renderHtmlReport(result, { title: 123, strictOptions }), TypeError);
    assert.throws(
      () => renderSarifReport(result, { allowProfilesNotRun: 1, strictOptions }),
      TypeError
    );
  }
  const { warnings } = warned(() => {
    renderJunitReport(result, { includeNotApplicable: true, strictOptions: true });
    renderHtmlReport(result, { title: 'T', manualChecks: false, strictOptions: true });
  });
  assert.deepEqual(warnings, []);
});
