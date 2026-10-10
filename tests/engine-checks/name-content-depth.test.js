'use strict';

// A button or link whose content is nested deeper than the name computation
// reads (256 levels; Chrome gives no name from content 100 levels down) is
// asked about, not failed, and the scan no longer runs out of stack
// thousands of levels down. Shallow content is named as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../../src/testing.js');

function nested(tag, kind, levels) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${
      tag === 'a' ? '<a id="x" href="/go"></a>' : '<button id="x"></button>'
    }</main></body></html>`
  );
  const d = dom.window.document;
  let host = d.getElementById('x');
  for (let i = 0; i < levels; i++) {
    const el = d.createElement(kind === 'shadow' ? 'x-wrap' : 'span');
    if (kind === 'shadow' && i > 0) host.attachShadow({ mode: 'open' }).appendChild(el);
    else host.appendChild(el);
    host = el;
  }
  host.appendChild(d.createTextNode('Save'));
  const ruleId = tag === 'a' ? 'link-name-present' : 'button-name-present';
  return runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false }).checksResults[0];
}

test('content nested too deep is asked about, not failed or overflowing the stack', () => {
  for (const [tag, kind, levels] of [
    ['button', 'shadow', 2000],
    ['button', 'light', 3000],
    ['a', 'light', 3000]
  ]) {
    const check = nested(tag, kind, levels);
    const label = `${tag} ${kind} ${levels}`;
    assert.equal(check.outcome, 'cantTell', label);
    assert.equal(check.error, undefined, label);
    assert.equal(check.occurrences[0].data.details.reasonCode, 'name_contentTooDeep', label);
  }
});

test('content within the limit is named as before', () => {
  for (const [tag, kind] of [
    ['button', 'light'],
    ['button', 'shadow'],
    ['a', 'light']
  ]) {
    assert.equal(nested(tag, kind, 50).outcome, 'pass', `${tag} ${kind}`);
  }
});
