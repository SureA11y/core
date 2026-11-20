'use strict';

// Fields that share one aria-labelledby target worked out its text again
// for each: 4,000 fields pointing at a 200-word label took 1.8 s in one
// rule in Chromium. The target's text is kept for the scan, per element and
// computation options, and read again by the next scan.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml.js');

function helpersFor(body) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  const helpers = createDomHelpers({ window, document, root: document, perfStats: true });
  return { helpers, document };
}

const WORDS = Array.from({ length: 50 }, (_, i) => `<span>word${i} </span>`).join('');
const SHARED =
  `<div id="big">${WORDS}</div>` +
  Array.from(
    { length: 30 },
    (_, i) => `<input id="f${i}" aria-labelledby="big l${i}"><span id="l${i}">Field ${i}</span>`
  ).join('');
const EXPECTED_BIG = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');

test('a shared aria-labelledby target is read once, and every field gets the same name', () => {
  const { helpers, document } = helpersFor(SHARED);
  for (let i = 0; i < 30; i++) {
    const info = helpers.getAriaLabelledByInfo(document.getElementById(`f${i}`), { helpers });
    assert.equal(info.value, `${EXPECTED_BIG} Field ${i}`);
    assert.equal(info.refsCount, 2);
  }
  const { counters } = helpers.getPerfStats();
  // "big" is worked out once and reused 29 times; each l{i} once.
  assert.equal(counters['idRefTargetText.hit'], 29);
  assert.equal(counters['idRefTargetText.miss'], 31);
});

test('the text is kept per computation options: one asked with hidden text is not the default one', () => {
  const body =
    '<div id="t">Shown <span style="display:none">Hidden</span></div>' +
    '<input id="f" aria-labelledby="t">';
  const { helpers, document } = helpersFor(body);
  const f = document.getElementById('f');
  const ctx = { helpers };
  const plain = helpers.getAriaLabelledByInfo(f, ctx).value;
  const withHidden = helpers.getAriaLabelledByInfo(f, ctx, { includeHidden: true }).value;
  assert.equal(plain, 'Shown');
  assert.equal(withHidden, 'Shown Hidden');
  // And in the other order, on a fresh page.
  const other = helpersFor(body);
  const g = other.document.getElementById('f');
  assert.equal(
    other.helpers.getAriaLabelledByInfo(g, { helpers: other.helpers }, { includeHidden: true })
      .value,
    'Shown Hidden'
  );
  assert.equal(other.helpers.getAriaLabelledByInfo(g, { helpers: other.helpers }).value, 'Shown');
  // Options holding an object (a node to skip) are worked out each time.
  assert.equal(helpers.getAriaLabelledByInfo(f, ctx, { skipNode: f }).value, 'Shown');
});

test('an id listed twice, and a target that names itself, read as without the cache', () => {
  const { helpers, document } = helpersFor(
    '<span id="p">Phone</span><input id="a" aria-labelledby="p p"><input id="b" aria-labelledby="p">' +
      '<a id="r" href="/x" aria-labelledby="r t">Read more</a><span id="t">about cats</span>'
  );
  const ctx = { helpers };
  assert.equal(helpers.getAriaLabelledByInfo(document.getElementById('b'), ctx).value, 'Phone');
  assert.equal(
    helpers.getAriaLabelledByInfo(document.getElementById('a'), ctx).value,
    'Phone Phone'
  );
  for (let i = 0; i < 2; i++) {
    assert.equal(
      helpers.getAriaLabelledByInfo(document.getElementById('r'), ctx).value,
      'Read more about cats'
    );
  }
});

test('a scan reads the target again: the text kept by the scan before is not reused', () => {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      '<button aria-labelledby="t">Send</button><span id="t">Send now</span>' +
      '</main></body></html>'
  );
  const scan = () =>
    runa11yCoreOnDom(dom, { runOnly: ['label-in-name'], entryPointParity: false }).checksResults[0]
      .outcome;
  assert.equal(scan(), 'pass');
  dom.window.document.getElementById('t').textContent = 'Go';
  assert.equal(scan(), 'fail');
});
