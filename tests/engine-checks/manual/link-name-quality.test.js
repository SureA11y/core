'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-name-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no links with a name`, () => {
  const html = `<!doctype html><html><body><a href="/x"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the link text is a known generic phrase`, () => {
  const html = `<!doctype html><html><body><a href="/x">Click here</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'GENERIC_LINK_TEXT');
  assert.equal(rule.occurrences[0].data.details.normalizedName, 'click here');
});

test(`${RULE_ID}: a link role in a fallback list or upper case (role="foo link", role="LINK") is a link, a link token after a real role is not`, () => {
  for (const role of ['foo link', 'LINK']) {
    const html = `<!doctype html><html><body><span role="${role}" tabindex="0">Click here</span></body></html>`;
    const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'GENERIC_LINK_TEXT');
  }
  const html = `<!doctype html><html><body><span role="button link" tabindex="0">Click here</span></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: normalizes whitespace, case, and trailing punctuation before matching`, () => {
  const html = `<!doctype html><html><body><a href="/x">  MORE.  </a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the generic phrase is only a substring of a longer, specific name`, () => {
  const html = `<!doctype html><html><body><a href="/x">Read more about our privacy policy</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the link text is specific and descriptive`, () => {
  const html = `<!doctype html><html><body><a href="/x">Download the 2026 pricing guide</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the generic name comes from a wrapped img alt (name-from-content)`, () => {
  const html = `<!doctype html><html><body><a href="/x"><img alt="here" src="x.png"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a href="/x">Click here</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Link text should be descriptive, not generic');
});

test(`${RULE_ID}: cantTell when a bare format name has no adjacent context`, () => {
  const html = `<!doctype html><html><body>
    <ul>
      <li><a href="/book.html">HTML</a></li>
      <li><a href="/book.epub">EPUB</a></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'AMBIGUOUS_FORMAT_NAME');
});

test(`${RULE_ID}: not flagged when an outer list item names the subject of a nested format-name list`, () => {
  const html = `<!doctype html><html><body>
    <ul>
      <li>
        Ulysses
        <ul>
          <li><a href="/book.html">HTML</a></li>
          <li><a href="/book.epub">EPUB</a></li>
        </ul>
      </li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: not flagged when a preceding table header names the row subject`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr><th colspan="2">Ulysses</th></tr>
      <tr><td><a href="/book.html">HTML</a></td><td><a href="/book.epub">EPUB</a></td></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a table header present in the link's own row does not excuse a generic-phrase link elsewhere in that row`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr><th colspan="3">Books</th></tr>
      <tr><td>Ulysses</td><td><a href="/x">Download</a></td><td>1.61MB</td></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'GENERIC_LINK_TEXT');
});

test(`${RULE_ID}: not flagged when the enclosing paragraph names the subject before a generic phrase`, () => {
  const html = `<!doctype html><html><body>
    <p>Download the 2026 pricing guide in <a href="/x">HTML</a></p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: not flagged when aria-describedby resolves to real text`, () => {
  const html = `<!doctype html><html><body>
    <h2 id="rule">Button has accessible name</h2>
    <a href="/x" aria-describedby="rule">More</a>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a link's content names it ahead of its title`, () => {
  const headline = `<!doctype html><html lang="fr"><body>
    <a href="/x" title="Lire la suite ">Les décès en 2025 : un niveau historiquement bas</a>
  </body></html>`;
  assertRule(runa11yCoreOnHtml(headline, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });

  const generic = `<!doctype html><html><body>
    <a href="/x" title="Read more about the 2025 annual report">Read more</a>
  </body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(generic, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.normalizedName, 'read more');

  const titleOnly = `<!doctype html><html><body><a href="/x" title="Read more"></a></body></html>`;
  assertRule(runa11yCoreOnHtml(titleOnly, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: a title does not name a link whose content is a non-breaking space`, () => {
  const html = `<!doctype html><html><body><a href="/x" title="Read more">&nbsp;</a></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-name-quality-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-name-quality-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFlaggedIds = [
    'lnq_case_01',
    'lnq_case_02',
    'lnq_case_03',
    'lnq_case_04',
    'lnq_case_09',
    'lnq_case_10',
    'lnq_case_13',
    'lnq_case_14',
    'lnq_case_15'
  ];
  const expectedNoOccIds = [
    'lnq_case_05',
    'lnq_case_06',
    'lnq_case_07',
    'lnq_case_08',
    'lnq_case_11',
    'lnq_case_12'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
  const leanOf = (id) =>
    rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).lean?.toward || null;
  assert.equal(leanOf('lnq_case_13'), 'pass');
  assert.equal(leanOf('lnq_case_14'), 'fail');
  assert.equal(leanOf('lnq_case_15'), 'fail');
  assert.equal(leanOf('lnq_case_02'), null);
});

// The text of a list item's, paragraph's or cell's inline elements is the
// link's context, as the item's own text is; a nested list's, hidden text
// and another link's text are not.
test(`${RULE_ID}: text in an inline element of the list item, paragraph or cell is context`, () => {
  for (const body of [
    '<ul><li><strong>Ulysses</strong> <a href="/u">Read more</a></li></ul>',
    '<p><em>The 2026 pricing guide</em>: <a href="/g">Download</a></p>',
    '<table><tr><td><span><b>Annual report</b></span> <a href="/r.pdf">PDF</a></td></tr></table>'
  ]) {
    const html = `<!doctype html><html lang="en"><body>${body}</body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  for (const body of [
    '<ul><li><span hidden>Ulysses</span> <a href="/u">Read more</a></li></ul>',
    '<ul><li><a href="/a.pdf">PDF</a> <a href="/a.html">HTML</a></li></ul>',
    '<ul><li><a href="/u">Read more</a><ul><li>Ulysses</li></ul></li></ul>'
  ]) {
    const html = `<!doctype html><html lang="en"><body>${body}</body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1
    });
  }
});

test(`${RULE_ID}: a bare format name beside a link naming the document leans pass`, () => {
  const html = `<!doctype html><html lang="en"><body>
    <ul><li><a href="/r">Annual report</a> (<a href="/r.pdf">PDF</a>)</li></ul>
  </body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const { lean } = rule.occurrences[0];
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'AMBIGUOUS_FORMAT_NAME');
  assert.equal(lean.toward, 'pass');
  assert.equal(lean.i18n.whyKey, 'linkNameQuality_lean_why_formatBesideName');

  // Beside another bare format name, nothing names the document.
  const bare = `<!doctype html><html lang="en"><body>
    <ul><li><a href="/r.html">HTML</a> (<a href="/r.pdf">PDF</a>)</li></ul>
  </body></html>`;
  const plain = assertRule(runa11yCoreOnHtml(bare, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 2
  });
  assert.ok(plain.occurrences.every((o) => !o.lean));
});

test(`${RULE_ID}: the same generic name to different places under one heading leans fail`, () => {
  const run = (body) =>
    runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
      runOnly: [RULE_ID]
    });
  const rule = assertRule(
    run('<h2>News</h2><div><a href="/a">Read more</a></div><div><a href="/b">Read more</a></div>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  for (const o of rule.occurrences) {
    assert.equal(o.data.details.reasonCode, 'GENERIC_LINK_TEXT');
    assert.equal(o.lean.toward, 'fail');
    assert.equal(o.lean.i18n.whyKey, 'linkNameQuality_lean_why_repeated');
  }
  // Each under a heading of its own, to the same place, beside a sentence,
  // in a table or in a named region: no lean.
  for (const body of [
    '<h2>A</h2><div><a href="/a">Read more</a></div><h2>B</h2><div><a href="/b">Read more</a></div>',
    '<div><a href="/a">Read more</a></div><div><a href="/a">Read more</a></div>',
    '<div>The annual report is out. <a href="/a">Read more</a></div><div><a href="/b">Read more</a></div>',
    '<table><tr><td>A</td><td><div><a href="/a">Read more</a></div></td></tr><tr><td>B</td><td><div><a href="/b">Read more</a></div></td></tr></table>',
    '<section aria-label="A"><a href="/a">Read more</a></section><section aria-label="B"><a href="/b">Read more</a></section>'
  ]) {
    const r = assertRule(run(body), RULE_ID, 'cantTell', { minOccurrences: 1 });
    const own = r.occurrences.filter((o) => o.html.includes('href="/a"'));
    assert.ok(own.length && own.every((o) => !o.lean), body);
  }
});

// Every link asked for its parent's text and its group's places, and every
// heading for whether the link followed it, so a page of identical links
// took 1.6 s at 4,000 links in Chromium, and 40 s with a heading over each
// pair. Counted rather than timed, so the test doesn't flake under load:
// the node reads and position comparisons grow with the page.
test(`${RULE_ID}: the work grows linearly with identical links and headings, with the same leans`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../../src/testing.js');
  const scan = (body) => {
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
    );
    const nodeProto = dom.window.Node.prototype;
    const nodeType = Object.getOwnPropertyDescriptor(nodeProto, 'nodeType');
    const compare = nodeProto.compareDocumentPosition;
    let work = 0;
    Object.defineProperty(nodeProto, 'nodeType', {
      configurable: true,
      get() {
        work++;
        return nodeType.get.call(this);
      }
    });
    nodeProto.compareDocumentPosition = function (...args) {
      work++;
      return compare.apply(this, args);
    };
    const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
    return { rule: result.checksResults.find((c) => c.ruleId === RULE_ID), work };
  };
  const pages = {
    flat: (n) => Array.from({ length: n }, (_, i) => `<a href="/${i}">Read more</a> `).join(''),
    headed: (n) =>
      Array.from(
        { length: n / 2 },
        (_, i) =>
          `<h2>Section ${i}</h2><div><a href="/${i}">Read more</a></div><div><a href="/x${i}">Read more</a></div>`
      ).join('')
  };
  for (const [name, page] of Object.entries(pages)) {
    const small = scan(page(100));
    const large = scan(page(200));
    assert.ok(
      large.work <= small.work * 2.5,
      `${name}: ${small.work} for 100, ${large.work} for 200`
    );
    assert.equal(large.rule.occurrences.length, 200, name);
    assert.ok(
      large.rule.occurrences.every((o) => o.lean && o.lean.toward === 'fail'),
      `${name}: each link shares its name with another going elsewhere`
    );
  }
});

// The heading a link sits under is found among the headings in tree order;
// a link inside a heading has that heading, and scan roots given out of
// document order are read as before, heading by heading.
test(`${RULE_ID}: the nearest heading, with a link inside a heading and roots out of order`, () => {
  const html =
    '<!doctype html><html lang="en"><body>' +
    '<section id="one"><h2>A</h2><div><a href="/a">Read more</a></div><div><a href="/b">Read more</a></div>' +
    '<h2><a href="/c">Read more</a></h2><div><a href="/d">Read more</a></div></section>' +
    '<section id="two"><h2>B</h2><div><a href="/e">Read more</a></div><div><a href="/e">Read more</a></div></section>' +
    '</body></html>';
  const leans = (result) =>
    Object.fromEntries(
      result.checksResults
        .find((c) => c.ruleId === RULE_ID)
        .occurrences.map((o) => [/href="([^"]+)"/.exec(o.html)[1], o.lean ? o.lean.toward : null])
    );
  // Under A, /a and /b go to different places; under the heading holding
  // /c, /c and /d do; under B both links go to /e.
  const expected = { '/a': 'fail', '/b': 'fail', '/c': 'fail', '/d': 'fail', '/e': null };
  assert.deepEqual(leans(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] })), expected);
  assert.deepEqual(
    leans(runa11yCoreOnHtml(html, { runOnly: [RULE_ID], contextSelector: ['#two', '#one'] })),
    expected
  );
});

// details.linkKind says what the link is made of (helpers.getLinkKind): an
// <a> in SVG is svg; an <area>, or content of images only, is image; text and
// an image is composite; anything else is text. Hidden content doesn't count;
// aria-hidden content is drawn, and does.
test('link-name-quality: each finding says what its link is made of (linkKind)', () => {
  const cases = [
    ['text', '<a id="x" href="/a">Read more</a>'],
    ['text', '<a id="x" href="/a" aria-label="Read more"></a>'],
    ['text', '<a id="x" href="/a"><span hidden><img src="i.png" alt=""></span>Read more</a>'],
    ['image', '<a id="x" href="/a"><img src="i.png" alt="Read more"></a>'],
    ['image', '<a id="x" href="/a"><img src="i.png" alt="Read"> <img src="j.png" alt="more"></a>'],
    [
      'image',
      '<a id="x" href="/a" aria-label="Read more"><svg viewBox="0 0 1 1"><text>Go</text></svg></a>'
    ],
    ['image', '<a id="x" href="/a"><span role="img" aria-label="Read more">*</span></a>'],
    ['image', '<a id="x" href="/a" aria-label="Read more"><canvas></canvas></a>'],
    ['image', '<a id="x" href="/a" aria-label="Read more"><object data="o.svg"></object></a>'],
    [
      'image',
      '<img src="m.png" usemap="#m" alt="Map"><map name="m"><area id="x" href="/a" alt="Read more" shape="rect" coords="0,0,1,1"></map>'
    ],
    ['composite', '<a id="x" href="/a"><img src="i.png" alt="">Read more</a>'],
    [
      'composite',
      '<a id="x" href="/a"><span aria-hidden="true">Read</span><img src="i.png" alt="more"></a>'
    ],
    ['svg', '<svg><a id="x" href="/a"><text>Read more</text></a></svg>']
  ];
  for (const [kind, link] of cases) {
    const html = `<!doctype html><html lang="en"><body><main><p>${link}</p></main></body></html>`;
    const rule = assertRule(
      runa11yCoreOnHtml(html, { runOnly: ['link-name-quality'] }),
      'link-name-quality',
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.strictEqual(rule.occurrences[0].data.details.linkKind, kind, link);
  }
});
