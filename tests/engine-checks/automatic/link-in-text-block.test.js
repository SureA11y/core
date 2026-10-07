'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-in-text-block';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no links at all`, () => {
  const html = `<!doctype html><html><body><p>No links here.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only link is standalone (not surrounded by text)`, () => {
  const html = `<!doctype html><html><body><ul><li><a href="#">standalone</a></li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the in-text link is underlined`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    a { text-decoration: underline; }
  </style></head><body><p>Read <a href="#">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a color-only link has an insufficient contrast difference from surrounding text`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .weak { color: #2a2a2a; }
  </style></head><body><p>Read <a href="#" id="weakLink" class="nodeco weak">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assert.ok(rule.occurrences[0].data.details.metrics.ratio < 3);
});

test(`${RULE_ID}: cantTell when color is the only cue, even at >= 3:1 (G183 also needs hover and focus cues)`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .strong { color: #969696; }
  </style></head><body><p>Read <a href="#" id="a" class="nodeco strong">this link</a> for more.</p></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.ok(hasOccurrenceForId(rule, 'a'));
    assert.strictEqual(occ.data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
    assert.ok(occ.data.details.metrics.ratio >= 3);
    assert.strictEqual(occ.uncertainty.code, 'runtime-dependent');
    assert.strictEqual(occ.i18n.summaryKey, 'linkInTextBlock_summary_cantTell_contrastOnly');
  }
});

test(`${RULE_ID}: a same-colored link marked by a border, shadow, outline, background or icon passes`, () => {
  const base = `body { background: #ffffff; } p { color: #222222; } .nodeco { text-decoration: none; color: #222222; }`;
  for (const [css, inner] of [
    ['.m { border-bottom: 1px solid; }', 'la suite'],
    ['.m { box-shadow: 0 1px 0 #222222; }', 'la suite'],
    ['.m { outline: 1px dotted #222222; }', 'la suite'],
    ['.m { background-color: #ffff99; }', 'la suite'],
    ['.m { background-image: url(ext.svg); }', 'la suite'],
    ['.m::after { content: " \\2197"; }', 'la suite'],
    ['', 'la suite <img src="ext.png" alt="">'],
    ['', 'la suite <svg width="8" height="8" aria-hidden="true"><path d="M0 0h8v8z"/></svg>']
  ]) {
    const html = `<!doctype html><html><head><style>${base} ${css}</style></head><body><p>Lire <a href="/x" class="nodeco m">${inner}</a> ici.</p></body></html>`;
    for (const engineOptions of [{}]) {
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
    }
  }
});

test(`${RULE_ID}: a zero-width border or an empty ::after is not a cue`, () => {
  const base = `body { background: #ffffff; } p { color: #222222; } .nodeco { text-decoration: none; color: #2a2a2a; }`;
  for (const css of [
    '.m { border-bottom: 0 solid; }',
    '.m::after { content: ""; }',
    '.m:hover::after { content: "x"; }'
  ]) {
    const html = `<!doctype html><html><head><style>${base} ${css}</style></head><body><p>Lire <a href="/x" class="nodeco m">la suite</a> ici.</p></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
  }
});

test(`${RULE_ID}: an empty ::after that paints a line, and a chip or <sup> inside the link, are cues (#107)`, () => {
  const base = `body { background: #ffffff; } p { color: #222222; } .nodeco { text-decoration: none; color: #2a2a2a; position: relative; }`;
  for (const [css, inner] of [
    [
      '.m::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background-color: #2a2a2a; }',
      'la suite'
    ],
    [
      '.m::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; border-bottom: 1px solid #2a2a2a; }',
      'la suite'
    ],
    ['', '<code style="background-color: #dddddd">fetch()</code>'],
    ['', '<sup>1</sup>']
  ]) {
    const html = `<!doctype html><html><head><style>${base} ${css}</style></head><body><p>Lire <a href="/x" class="nodeco m">${inner}</a> ici.</p></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: role="link" elements are in scope and get no default underline`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
  </style></head><body>
    <p>Lire <span role="link" tabindex="0" id="weak" style="color:#2a2a2a">la suite</span> ici.</p>
    <p>Lire <span role="link" tabindex="0" id="red" style="color:#dd0000">la suite</span> ici.</p>
  </body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  const byId = (id) =>
    rule.occurrences.find((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
  assert.strictEqual(byId('weak').data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assert.strictEqual(byId('red').data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  assert.strictEqual(byId('red').occurrenceOutcome, 'cantTell');
});

test(`${RULE_ID}: cantTell, not pass, when contrast is not confidently computable (background-image blocker)`, () => {
  // The image is behind the whole paragraph: on the link alone it would be a
  // mark of its own, and the link would pass.
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; color: #2a2a2a; }
    .bgimg { background-image: linear-gradient(90deg, #fff, #000); }
  </style></head><body><p class="bgimg">Read <a href="#" class="nodeco">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.notStrictEqual(rule.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
});

test(`${RULE_ID}: an unevaluable link does not mask a proven failure elsewhere`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .weak { color: #2a2a2a; }
    .bgimg { background-image: linear-gradient(90deg, #fff, #000); }
  </style></head><body>
    <p>Read <a href="#" id="weakLink" class="nodeco weak">this link</a> for more.</p>
    <p class="bgimg">Or <a href="#" id="blockedLink" class="nodeco">this one</a> instead.</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'weakLink'));
});

test(`${RULE_ID}: underline declared via the text-decoration shorthand resolves under a DOM emulator`, () => {
  // The computed values cannot tell these two stylesheets apart under jsdom;
  // the rule resolves the declaration from the CSSOM instead.
  const underlined = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    a { color: #2a2a2a; text-decoration: underline; }
  </style></head><body><p>Read <a href="#">this link</a> for more.</p></body></html>`;
  assertRule(runa11yCoreOnHtml(underlined, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  const notUnderlined = underlined.replace('text-decoration: underline', 'text-decoration: none');
  assertRule(runa11yCoreOnHtml(notUnderlined, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1
  });
});

test(`${RULE_ID}: a :hover underline does not count as the resting-state cue`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    a { color: #2a2a2a; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style></head><body><p>Read <a href="#">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: inline style outranks a stylesheet declaration`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    a { color: #2a2a2a; text-decoration: none; }
  </style></head><body><p>Read <a href="#" style="text-decoration: underline">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .weak { color: #2a2a2a; }
  </style></head><body><p>Read <a href="#" class="nodeco weak">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-in-text-block-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-in-text-block-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  // Cases 04 and 07 are cantTell-tier occurrences reported alongside the
  // confident fails rather than discarded by them.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });

  for (const id of ['litb_case_04', 'litb_case_07']) {
    const undecided = (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    );
    assert.ok(undecided, `Expected occurrence for id="${id}"`);
    assert.strictEqual(undecided.occurrenceOutcome, 'cantTell');
  }

  const expectedFailIds = ['litb_case_05', 'litb_case_09'];
  const expectedNoOccIds = [
    'litb_case_01',
    'litb_case_02',
    'litb_case_03',
    'litb_case_06',
    'litb_case_08'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('link-in-text-block: whether a parent has text is read once, not once per link', () => {
  // A parent with thousands of sibling links and no text of its own: each
  // link scanned every sibling, so 8,000 links took 34s under jsdom. The
  // engine's own reads of the siblings' nodeType now grow with the links,
  // not their square. jsdom reads them too, matching selectors for computed
  // styles, so only reads made directly from outside node_modules count.
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');
  const N = 400;
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${'<a href="/">l</a>'.repeat(N)}</main></body></html>`
  );
  const main = dom.window.document.querySelector('main');
  const proto = dom.window.Node.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'nodeType');
  let reads = 0;
  Object.defineProperty(proto, 'nodeType', {
    configurable: true,
    get() {
      if (this.parentNode === main) {
        const caller = String(new Error().stack).split('\n')[2] || '';
        if (!caller.includes('node_modules')) reads++;
      }
      return desc.get.call(this);
    }
  });
  try {
    const result = runa11yCoreOnDom(dom, {
      runOnly: ['link-in-text-block'],
      entryPointParity: false
    });
    assert.equal(result.checksResults[0].outcome, 'notApplicable');
  } finally {
    Object.defineProperty(proto, 'nodeType', desc);
  }
  assert.ok(reads < N * 20, `${reads} nodeType reads for ${N} links`);
});

test(`${RULE_ID}: the role attribute is a fallback list read in any case (#91)`, () => {
  // role="foo link" and role="LINK" are links; role="button link" is a button.
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .weak { color: #2a2a2a; }
  </style></head><body>
    <p>Read <span role="foo link" tabindex="0" id="fallback" class="weak">this</span> now.</p>
    <p>Read <span role="LINK" tabindex="0" id="upper" class="weak">that</span> now.</p>
    <p>Read <span role="button link" tabindex="0" id="button" class="weak">other</span> now.</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'fallback'));
  assert.ok(hasOccurrenceForId(rule, 'upper'));
  assert.ok(!hasOccurrenceForId(rule, 'button'));
});
