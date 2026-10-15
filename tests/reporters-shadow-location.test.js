'use strict';

// A finding in a shadow tree has a selector that resolves inside its shadow
// root, and `shadowHostSelectors`, the hosts that lead to it. No reporter
// showed the hosts, so two components holding the same markup gave the same
// location, and the selector named an element of the page itself where one
// matched. The HTML report, SARIF, JUnit and baselines now show the hosts
// and the selector as one location, joined with " >>> ".

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../src/testing.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');
const { buildBaselineEntries } = require('../src/baseline.js');

function scan() {
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      '<img src="page.png"><div id="card"></div></main></body></html>'
  );
  const root = dom.window.document.getElementById('card').attachShadow({ mode: 'open' });
  root.innerHTML = '<img src="inside.png">';
  return runa11yCoreOnDom(dom, { runOnly: ['img-alt-present'], entryPointParity: false });
}

test('every reporter locates a shadow-tree finding through its host', () => {
  const result = scan();
  const occurrences = result.checksResults[0].occurrences;
  const inside = occurrences.find((o) => o.shadowHostSelectors);
  assert.ok(inside, 'one finding is in the shadow tree');
  const location = `${inside.shadowHostSelectors.join(' >>> ')} >>> ${inside.selector}`;

  const sarif = JSON.parse(renderSarifReport(result));
  const names = sarif.runs[0].results.flatMap((r) =>
    r.locations.flatMap((l) => (l.logicalLocations || []).map((x) => x.fullyQualifiedName))
  );
  assert.ok(names.includes(location), JSON.stringify(names));

  const escaped = location.replace(/>/g, '&gt;');
  assert.ok(renderJunitReport(result).includes(`selector: ${escaped}`));
  assert.ok(renderHtmlReport(result).includes(JSON.stringify(location)));

  const entries = buildBaselineEntries(result);
  assert.ok(
    entries.some((e) => e.selector === location),
    JSON.stringify(entries)
  );
  // A finding of the page itself shows its selector alone.
  const outside = occurrences.find((o) => !o.shadowHostSelectors);
  assert.ok(names.includes(outside.selector));
});
