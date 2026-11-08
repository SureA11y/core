'use strict';

// For each header, table-th-has-data-cells copied the rest of its row and
// the cells below it in its column, so a table with a header in each row
// cost rows x rows: 16,000 rows took 4.8 s in Chromium. What lies after and
// below each cell is now read in one pass over the table. Counted rather
// than timed, so the test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../../src/testing.js');

const RULE_ID = 'table-th-has-data-cells';

// A table of headers over one row of data: for each header the rule looked
// at every cell below it, to tell a corner of headers from a header with
// cells to describe.
const page = (rows) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><table>' +
  Array.from({ length: rows }, (_, i) => `<tr><th>Row ${i}</th><th>Head ${i}</th></tr>`).join('') +
  '<tr><td>1</td><td>2</td></tr></table></main></body></html>';

// How often the rule reads a cell's tag, which it does to tell a header from
// a data cell.
function tagReads(rows) {
  const dom = new JSDOM(page(rows));
  const proto = dom.window.Element.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'localName');
  let reads = 0;
  Object.defineProperty(proto, 'localName', {
    ...desc,
    get() {
      if (this.tagName === 'TH') reads++;
      return desc.get.call(this);
    }
  });
  const rule = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false })
    .checksResults[0];
  return { reads, rule };
}

test(`${RULE_ID} reads each cell once, however many rows have a header`, () => {
  const small = tagReads(50);
  const large = tagReads(200);
  // Four times the rows, four times the reads: linear, not quadratic.
  assert.ok(large.reads <= small.reads * 4 + 50, `${small.reads} then ${large.reads}`);
  // Each header has the data row below it.
  assert.equal(small.rule.outcome, 'pass');
  assert.equal(large.rule.outcome, 'pass');
});
