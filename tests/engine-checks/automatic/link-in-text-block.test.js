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
  // mark of its own, and the link would pass. A translucent link color is
  // drawn over the image, so the colors can't be compared.
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; color: rgba(42, 42, 42, 0.6); }
    .bgimg { background-image: linear-gradient(90deg, #fff, #000); }
  </style></head><body><p class="bgimg">Read <a href="#" class="nodeco">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
});

test(`${RULE_ID}: two opaque text colors decide a link whose background can't be worked out`, () => {
  // The link-vs-text ratio needs no background: an image behind both, or
  // an ancestor fading both over one, leave it as it is.
  const html = `<!doctype html><html><head><style>
    p { color: #000000; }
    .nodeco { text-decoration: none; }
    .bgimg { background-image: linear-gradient(90deg, #fff, #eee); }
    .faded { opacity: 0.8; }
  </style></head><body>
    <p class="bgimg">Read <a id="img-close" href="#" class="nodeco" style="color:#333333">this guide</a> before you start.</p>
    <p class="bgimg">Read <a id="img-far" href="#" class="nodeco" style="color:#cc0000">this guide</a> before you start.</p>
    <div class="bgimg"><div class="faded"><p>Read <a id="op-close" href="#" class="nodeco" style="color:#333333">this guide</a> before you start.</p></div></div>
    <div class="bgimg"><div class="faded"><p>Read <a id="op-far" href="#" class="nodeco" style="color:#cc0000">this guide</a> before you start.</p></div></div>
    <p>Read <a id="root-close" href="#" class="nodeco" style="color:#333333">this guide</a> before you start.</p>
    <p>Read <a id="root-far" href="#" class="nodeco" style="color:#cc0000">this guide</a> before you start.</p>
    <p>Read <a id="root-alpha" href="#" class="nodeco" style="color:rgba(51,51,51,0.5)">this guide</a> before you start.</p>
  </body></html>`;
  const rule = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }).checksResults.find(
    (r) => r.ruleId === RULE_ID
  );
  assert.strictEqual(rule.outcome, 'fail');
  for (const id of ['img-close', 'op-close', 'root-close']) {
    const occ = occFor(rule, id);
    assert.strictEqual(occ.occurrenceOutcome, 'fail', id);
    assert.strictEqual(occ.data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION', id);
    assert.strictEqual(occ.data.details.colors.linkForegroundHex, '#333333', id);
  }
  // Below 3:1 before an ancestor's fading it fails, the fading only bringing
  // the colors closer, but that ratio is not the one drawn.
  const fadedClose = occFor(rule, 'op-close').data.details.metrics;
  assert.strictEqual(fadedClose.ratio, undefined);
  assert.ok(Math.abs(fadedClose.ratioBeforeOpacity - 1.66) < 0.01);
  for (const id of ['img-close', 'root-close']) {
    assert.ok(Math.abs(occFor(rule, id).data.details.metrics.ratio - 1.66) < 0.01, id);
    assert.strictEqual(occFor(rule, id).data.details.metrics.ratioBeforeOpacity, undefined, id);
  }
  // 3.57:1: told apart by color alone, as on any page.
  for (const id of ['img-far', 'root-far']) {
    assert.strictEqual(occFor(rule, id).data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY', id);
    assert.deepStrictEqual(occFor(rule, id).data.details.metrics, {
      ratio: occFor(rule, id).data.details.metrics.ratio,
      threshold: 3
    });
  }
  // Faded by an ancestor, 3.57:1 is the ratio before the fading, which can
  // only bring the colors closer: not given as the ratio drawn, nor as the
  // margin.
  const faded = occFor(rule, 'op-far');
  assert.strictEqual(faded.occurrenceOutcome, 'cantTell');
  assert.strictEqual(faded.data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  assert.strictEqual(faded.data.details.metrics.ratio, undefined);
  assert.strictEqual(faded.data.details.metrics.threshold, 3);
  assert.ok(Math.abs(faded.data.details.metrics.ratioBeforeOpacity - 3.567) < 0.01);
  assert.strictEqual(
    faded.i18n.summaryKey,
    'linkInTextBlock_summary_cantTell_contrastOnlyBeforeOpacity'
  );
  // A translucent color is drawn over the page's canvas, white here.
  const alpha = occFor(rule, 'root-alpha');
  assert.strictEqual(alpha.data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  assert.strictEqual(alpha.data.details.colors.linkForegroundHex, '#999999');
});

test(`${RULE_ID}: the same text-shadow or stroke on link and text fails below 3:1, and is asked about above`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #000000; }
    .nodeco { text-decoration: none; }
    .sh { text-shadow: 1px 1px 2px #888888; }
    .st { -webkit-text-stroke: 1px #888888; }
  </style></head><body>
    <p class="sh">Read <a id="sh-close" href="#" class="nodeco sh" style="color:#333333">this guide</a> before you start.</p>
    <p class="sh">Read <a id="sh-far" href="#" class="nodeco sh" style="color:#cc0000">this guide</a> before you start.</p>
    <p>Read <a id="sh-own" href="#" class="nodeco sh" style="color:#333333">this guide</a> before you start.</p>
    <p class="st">Read <a id="st-close" href="#" class="nodeco st" style="color:#333333">this guide</a> before you start.</p>
  </body></html>`;
  const rule = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }).checksResults.find(
    (r) => r.ruleId === RULE_ID
  );
  assert.strictEqual(rule.outcome, 'fail');
  for (const id of ['sh-close', 'st-close']) {
    assert.strictEqual(occFor(rule, id).occurrenceOutcome, 'fail', id);
    assert.strictEqual(occFor(rule, id).data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION', id);
  }
  assert.strictEqual(occFor(rule, 'sh-far').occurrenceOutcome, 'cantTell');
  assert.strictEqual(occFor(rule, 'sh-far').data.details.reasonCode, 'TEXT_SHADOW');
  // A shadow on the link alone may be what sets it apart.
  assert.strictEqual(occFor(rule, 'sh-own').occurrenceOutcome, 'cantTell');
  assert.strictEqual(occFor(rule, 'sh-own').data.details.reasonCode, 'TEXT_SHADOW');
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
    <p class="bgimg">Or <a href="#" id="blockedLink" class="nodeco" style="color:rgba(34,34,34,0.6)">this one</a> instead.</p>
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

  // Cases 04, 07b and 11 are cantTell-tier occurrences reported alongside
  // the confident fails rather than discarded by them.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 10, maxOccurrences: 10 });

  // Asked about, each leaning: 04 has no hover cue in the style sheet, 07b
  // is drawn in the text's own translucent color under the same image, 11
  // is underlined on hover and focus.
  const leans = { litb_case_04: 'fail', litb_case_07b: 'fail', litb_case_11: 'pass' };
  for (const [id, toward] of Object.entries(leans)) {
    const undecided = (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    );
    assert.ok(undecided, `Expected occurrence for id="${id}"`);
    assert.strictEqual(undecided.occurrenceOutcome, 'cantTell');
    assert.strictEqual(undecided.lean.toward, toward, id);
  }

  // 05b-05e: background-image layers that draw nothing seen are no visual cue.
  const expectedFailIds = [
    'litb_case_05',
    'litb_case_05b',
    'litb_case_05c',
    'litb_case_05d',
    'litb_case_05e',
    'litb_case_07',
    'litb_case_09'
  ];
  const expectedNoOccIds = [
    'litb_case_01',
    'litb_case_02',
    'litb_case_03',
    'litb_case_03b',
    'litb_case_06',
    'litb_case_08',
    'litb_case_10'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
    assert.strictEqual(occFor(rule, id).occurrenceOutcome, 'fail', id);
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

// A "|" or "·" between links is no text for them to sit in (#166): a row
// of links is navigation. Text with a letter or a digit still is.
test('link-in-text-block: separators alone are not surrounding text', () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title><style>a{color:#333;text-decoration:none} p{color:#222}</style></head><body><main>${body}</main></body></html>`;
  const outcome = (body) =>
    runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }).checksResults[0].outcome;
  assert.equal(
    outcome('<p><a href="/p">Privacy</a> | <a href="/t">Terms</a></p>'),
    'notApplicable'
  );
  assert.equal(
    outcome(
      '<p><a href="/a">A</a> · <a href="/b">B</a> / <a href="/c">C</a> – <a href="/d">D</a></p>'
    ),
    'notApplicable'
  );
  assert.notEqual(
    outcome('<p>Read our <a href="/p">privacy policy</a> first.</p>'),
    'notApplicable'
  );
  assert.notEqual(outcome('<p><a href="/p">Page</a> 2 of 3</p>'), 'notApplicable');
});

// Text in an inline element beside the link counts as text around it: a
// sentence split into spans. Text in another link, in an element drawn
// invisibly, in an inline-block, or in a flex row's items does not.
test('link-in-text-block: text in an inline sibling is surrounding text', () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title><style>a{color:#333;text-decoration:none} p{color:#222}</style></head><body><main>${body}</main></body></html>`;
  const outcome = (body) =>
    runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }).checksResults[0].outcome;
  const applies = [
    '<p><span>Please read our</span> <a href="/t">terms</a> <span>before you sign up</span></p>',
    '<p><span>Company Inc. ID 1617539</span> <a href="/a">Consumer Access</a> | <a href="/b">Licenses</a></p>',
    '<p><span><em>Please</em> read our</span><a href="/t">terms</a></p>'
  ];
  for (const body of applies) assert.notEqual(outcome(body), 'notApplicable', body);
  const not = [
    '<p><a href="/a">Privacy</a> | <span><a href="/b">Terms</a></span></p>',
    '<div style="display:flex"><span>Follow us</span><a href="/a">Twitter</a></div>',
    '<p><a href="/a">Read more</a><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">about cats</span></p>',
    '<p><span style="display:inline-block">Label</span><a href="/a">Go</a></p>',
    '<p><span role="link">Elsewhere</span> | <a href="/a">Go</a></p>'
  ];
  for (const body of not) assert.equal(outcome(body), 'notApplicable', body);
});

// The link is compared with the text it sits beside: a bold label in a span
// sets the plain link apart by weight, though their parent is not bold.
test('link-in-text-block: a link is compared with the inline text beside it', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title><style>a{color:#333;text-decoration:none} p{color:#222}</style></head><body><main>' +
    '<p><span style="font-weight:700">Play now</span> <a href="/g">View more</a></p></main></body></html>';
  const check = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }).checksResults[0];
  assert.equal(check.outcome, 'pass');
});

// A link that draws no text can't be told from the text around it by color:
// link-name-present reports it. Text in its shadow tree, or slotted into it,
// is drawn; a link with text is checked as before.
test('link-in-text-block: a link that draws no text is not applicable', () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff} p{color:#000}</style></head><body><main>${body}</main></body></html>`;
  const outcome = (body) =>
    runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }).checksResults[0].outcome;
  const A = 'href="#z" style="color:#000;text-decoration:none"';
  for (const inner of ['', '   ', '<span> </span>', '<!-- x -->']) {
    const body = `<p>Read the <a ${A}>${inner}</a> now and also more words here.</p>`;
    assert.equal(outcome(body), 'notApplicable', body);
  }
  assert.equal(
    outcome('<p>Read the <span role="link" tabindex="0" style="color:#000"></span> now.</p>'),
    'notApplicable'
  );
  // The same link with text relies on color alone.
  assert.equal(outcome(`<p>Read the <a ${A}>guide</a> now and also more words here.</p>`), 'fail');
});

test("link-in-text-block: text in a link's shadow tree, or slotted into it, is drawn", () => {
  const { JSDOM } = require('jsdom');
  const { runa11yCoreInPage } = require('../../../src/core.js');
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title><style>html{background:#fff} p{color:#000}</style></head><body><main>' +
      '<p>Read the <span id="own" role="link" tabindex="0" style="color:#000"></span> now.</p>' +
      '<p>Read the <span id="slotted" role="link" tabindex="0" style="color:#000">guide</span> now.</p>' +
      '<p>Read the <span id="empty" role="link" tabindex="0" style="color:#000">hidden</span> now.</p>' +
      '</main></body></html>',
    { url: 'https://example.test/', pretendToBeVisual: true }
  );
  const doc = dom.window.document;
  doc.getElementById('own').attachShadow({ mode: 'open' }).innerHTML = 'guide';
  doc.getElementById('slotted').attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
  // A shadow tree that slots nothing draws none of the light text.
  doc.getElementById('empty').attachShadow({ mode: 'open' }).innerHTML = '<b></b>';
  global.window = dom.window;
  global.document = doc;
  try {
    const check = runa11yCoreInPage('https://example.test/', null, {}, [RULE_ID]).checksResults[0];
    const ids = (check.occurrences || []).map((o) => (/id="(\w+)"/.exec(o.html) || [])[1]);
    assert.equal(check.outcome, 'fail');
    assert.deepEqual(ids.sort(), ['own', 'slotted']);
  } finally {
    dom.window.close();
  }
});

// ---- Leans ----

function occFor(rule, id) {
  const occ = (rule.occurrences || []).find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `an occurrence for id="${id}"`);
  return occ;
}

test(`${RULE_ID}: colors that can't be read in the page's color scheme are asked about, with no lean`, () => {
  // A prefers-color-scheme rule reaches the text, which jsdom doesn't apply:
  // its colours in the scheme the page is drawn in are unknown, so even the
  // same translucent colour on link and text leans nowhere. (A background
  // the link and the text share leans fail on that: the gradient case below.)
  const html = `<!doctype html><html><head><style>
    @media (prefers-color-scheme: light) { body { margin: 8px; } }
    p { color: rgba(0, 0, 0, 0.7); }
    a { text-decoration: none; }
  </style></head><body>
    <p>Read <a id="same" href="#" style="color:rgba(0,0,0,0.7)">this guide</a> before you start.</p>
    <p>Read <a id="other" href="#" style="color:rgba(51,51,51,0.7)">this guide</a> before you start.</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  for (const id of ['same', 'other']) {
    const occ = occFor(rule, id);
    assert.strictEqual(occ.data.details.reasonCode, 'COLOR_NOT_COMPUTABLE', id);
    assert.strictEqual(occ.lean, undefined, id);
  }
  // Without the rule the two are drawn on the page's canvas and measured:
  // in the same colour the link fails.
  const known = runa11yCoreOnHtml(html.replace(/@media[^\n]*\n/, ''), { runOnly: [RULE_ID] });
  assert.strictEqual(
    occFor(known.checksResults[0], 'same').data.details.reasonCode,
    'COLOR_ONLY_DIFFERENTIATION'
  );
});

test(`${RULE_ID}: a gradient behind link and text alike leans fail on the same color, and pass on a background of the link's own`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    div { background-image: linear-gradient(#ffffff, #eeeeee); }
    p { color: rgba(0, 0, 0, 0.8); }
    a { text-decoration: none; }
  </style></head><body><div>
    <p>Read <a id="same" href="#" style="color:rgba(0,0,0,0.8)">this guide</a> before you start.</p>
    <p style="background-color:#ffffff">Read <a id="marked" href="#" style="color:#000000; background-color:#ffff00; opacity:0.9">this guide</a> before you start.</p>
  </div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  const same = occFor(rule, 'same');
  assert.strictEqual(same.data.details.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(same.lean.toward, 'fail');
  assert.strictEqual(same.lean.i18n.whyKey, 'linkInTextBlock_lean_why_sameColor');
  assert.strictEqual(same.lean.i18n.cautionKey, 'linkInTextBlock_lean_caution_effect');
  const marked = occFor(rule, 'marked');
  assert.strictEqual(marked.data.details.reasonCode, 'ELEMENT_OPACITY');
  assert.strictEqual(marked.lean.toward, 'pass');
  assert.strictEqual(marked.lean.i18n.whyKey, 'linkInTextBlock_lean_why_ownBackground');
});

test(`${RULE_ID}: a filter on the link alone gets no lean`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #000000; }
    a { text-decoration: none; filter: invert(1); }
  </style></head><body><p>Read <a id="inv" href="#" style="color:#000000">this guide</a> before you start.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  const occ = occFor(rule, 'inv');
  assert.strictEqual(occ.data.details.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(occ.lean, undefined);
});

test(`${RULE_ID}: a link told apart by color alone leans by the hover and focus rules of the style sheets`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; color: #000000; }
    a { text-decoration: none; }
    a.both:hover, a.both:focus { text-decoration: underline; }
    a.hover:hover { text-decoration: underline; }
  </style></head><body>
    <p>Read <a id="none" href="#" style="color:#cc0000">this guide</a> before you start.</p>
    <p>Read <a id="both" class="both" href="#" style="color:#cc0000">this guide</a> before you start.</p>
    <p>Read <a id="hover" class="hover" href="#" style="color:#cc0000">this guide</a> before you start.</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  for (const o of rule.occurrences) {
    assert.strictEqual(o.data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  }
  assert.strictEqual(occFor(rule, 'none').lean.toward, 'fail');
  assert.strictEqual(occFor(rule, 'none').lean.i18n.whyKey, 'linkInTextBlock_lean_why_noHoverCue');
  assert.strictEqual(occFor(rule, 'both').lean.toward, 'pass');
  assert.strictEqual(
    occFor(rule, 'both').lean.i18n.whyKey,
    'linkInTextBlock_lean_why_hoverFocusCue'
  );
  // A hover cue without a focus one: no lean either way.
  assert.strictEqual(occFor(rule, 'hover').lean, undefined);
});

test(`${RULE_ID}: a highlight of its own on a page with no background is decided on the page's canvas`, () => {
  const para =
    '<p style="color:#000">Read the <a id="hl" href="/x" style="color:#000;text-decoration:none;background:#ff0">annual report</a> today.</p>';
  const page = (head, body = para) =>
    `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
  const scan = (html, contrast) =>
    runa11yCoreOnHtml(html, {
      runOnly: [RULE_ID],
      ...(contrast ? { engineOptions: { contrast } } : {})
    });

  // The canvas follows from the page's color scheme: white for a page that
  // declares none, where the yellow highlight sets the link apart.
  assertRule(scan(page('')), RULE_ID, 'pass', { maxOccurrences: 0 });
  // The dark canvas for a page drawn in dark.
  assertRule(scan(page('<meta name="color-scheme" content="dark">')), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
  const onDark = assertRule(
    scan(page('<meta name="color-scheme" content="dark">', para.replace('#ff0', '#121212'))),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.strictEqual(onDark.occurrences[0].data.details.colorScheme, undefined);

  // A canvas the run names decides it, in strict mode too: in the
  // highlight's color it marks nothing, and the link fails; in another
  // color, white included, the highlight sets the link apart.
  const same = assertRule(scan(page(''), { rootCanvasFallback: '#ffff00' }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(same.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assertRule(scan(page(''), { rootCanvasFallback: '#ffffff' }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
  assertRule(scan(page(''), { rootCanvasFallback: '#000' }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
  // One that isn't a usable color is the default: the page's own canvas.
  assertRule(scan(page(''), { rootCanvasFallback: 'banana' }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
  // The result echoes whether the canvas was named; passed back, the echo
  // of a default white is the default again.
  const echoOf = (contrast) => scan(page(''), contrast).checksResults[0].engineOptions.contrast;
  assert.deepStrictEqual(echoOf({ rootCanvasFallback: '#ffffff' }), {
    mode: 'strictConformance',
    rootCanvasFallback: '#ffffff',
    rootCanvasFallbackSet: true
  });
  const defaultEcho = echoOf(null);
  assert.deepStrictEqual(defaultEcho, {
    mode: 'strictConformance',
    rootCanvasFallback: '#ffffff',
    rootCanvasFallbackSet: false
  });
  assertRule(scan(page('', para.replace('#ff0', '#fff')), defaultEcho), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(echoOf({ rootCanvasFallback: 'banana' }).rootCanvasFallbackSet, false);

  // Where the colours can't be read in the page's scheme (jsdom applies no
  // prefers-color-scheme rule, and one reaches the text), it is asked
  // about, with no lean, whatever the canvas.
  const unknown = page(
    '<style>@media (prefers-color-scheme: light) { p { margin: 1em; } }</style>'
  );
  for (const contrast of [null, { rootCanvasFallback: '#ffffff' }, { mode: 'auditorAssist' }]) {
    const asked = occFor(scan(unknown, contrast).checksResults[0], 'hl');
    assert.strictEqual(asked.data.details.reasonCode, 'COLOR_NOT_COMPUTABLE');
    assert.strictEqual(asked.lean, undefined);
  }
  // auditorAssist on a known canvas decides it as any highlight.
  const onYellow = assertRule(
    scan(page(''), { mode: 'auditorAssist', rootCanvasFallback: '#ffff00' }),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.strictEqual(onYellow.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
});

// A page that supports light and dark: the highlight is compared with the
// canvas in each scheme, as the contrast rules measure text there.
test(`${RULE_ID}: a highlight is compared with the page's canvas in each color scheme it supports`, () => {
  const page = (css, highlight) =>
    `<!doctype html><html><head><style>:root{color-scheme:light dark} ${css}</style></head><body><p style="color:#000">Read the <a id="hl" href="/x" style="color:#000;text-decoration:none;background:${highlight}">annual report</a> today.</p></body></html>`;
  const scan = (html) => runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  // The dark canvas's own colour marks nothing there; on white it does.
  const dark = assertRule(scan(page('', '#121212')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(dark.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assert.strictEqual(dark.occurrences[0].data.details.colorScheme, 'dark');
  // On white, the scheme jsdom sees, it fails in that scheme.
  const light = assertRule(scan(page('', '#ffffff')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(light.occurrences[0].data.details.colorScheme, 'light');
  // Yellow stands out on both canvases.
  assertRule(scan(page('', '#ffff00')), RULE_ID, 'pass', { maxOccurrences: 0 });
  // A prefers-color-scheme rule reaching the link: the dark scheme isn't
  // measured, and the finding says which was.
  const themed = assertRule(
    scan(page('@media (prefers-color-scheme: dark) { a { color: #fff; } }', '#ffffff')),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.strictEqual(themed.occurrences[0].data.details.colorScheme, undefined);
  assert.deepStrictEqual(themed.occurrences[0].data.details.colorSchemesChecked, ['light']);
});

test(`${RULE_ID}: a paragraph's ::first-line is left out under a DOM emulator, which computes no pseudo-element styles`, () => {
  // In a browser, 1.52:1 from the first line's color asks about this link
  // (tests/engine-checks/contrast-first-line-chromium.test.js).
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; color: #000000; }
    p::first-line { color: #990000; }
    a { text-decoration: none; }
  </style></head><body><p>Read <a id="fl" href="#" style="color:#cc0000">this guide</a> before you start.</p></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(occFor(rule, 'fl').data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
});

test(`${RULE_ID}: under a DOM emulator, a link's color and fill are read from the page's rules`, () => {
  const scan = (css, body) =>
    runa11yCoreOnHtml(
      `<!doctype html><html><head><style>body{background:#fff} p{color:#000} a{text-decoration:none} .bgimg{background-image:linear-gradient(90deg,#fff,#eee)} ${css}</style></head><body>${body}</body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults[0].occurrences[0].data.details;

  // Decided from the two text colors over a gradient: a{color:#cc0000},
  // which jsdom ranks below its own link blue, is 3.57:1 from the text,
  // not 2.23:1.
  const far = scan('a{color:#cc0000}', '<p class="bgimg">Read <a href="#">this guide</a> now.</p>');
  assert.strictEqual(far.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  assert.strictEqual(far.colors.linkForegroundHex, '#cc0000');
  // A rule more specific than jsdom's link color was read right before too.
  const specific = scan(
    'a.x{color:#cc0000}',
    '<p class="bgimg">Read <a class="x" href="#">this guide</a> now.</p>'
  );
  assert.strictEqual(specific.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');

  // A fill the page sets to the color jsdom gives links paints the link in
  // it (2.23:1 from the text), on the link or inherited from the paragraph;
  // one that follows color, or none, leaves it in the page's color.
  const filled = scan(
    'a{color:#000} .f{-webkit-text-fill-color:#0000ee}',
    '<p>Read <a class="f" href="#">this guide</a> now.</p>'
  );
  assert.strictEqual(filled.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assert.strictEqual(filled.colors.linkForegroundHex, '#0000ee');
  const inherited = scan(
    'a{color:#000} p.f{-webkit-text-fill-color:#0000ee}',
    '<p class="f">Read <a href="#">this guide</a> now.</p>'
  );
  assert.strictEqual(inherited.colors.linkForegroundHex, '#0000ee');
  assert.strictEqual(inherited.metrics.ratio, 1);
  for (const css of ['a{color:#000} .f{-webkit-text-fill-color:currentcolor}', 'a{color:#000}']) {
    const own = scan(css, '<p>Read <a class="f" href="#">this guide</a> now.</p>');
    assert.strictEqual(own.colors.linkForegroundHex, '#000000', css);
    assert.strictEqual(own.metrics.ratio, 1, css);
  }
});

test(`${RULE_ID}: a link faded with its text by an ancestor leans pass on no hover and focus cue`, () => {
  // 3:1 or more before the fading may be less as drawn, which a cue on
  // hover and focus doesn't make up for; with no cue on hover it fails
  // either way, so that lean stands.
  const page = (css) =>
    `<!doctype html><html><head><style>
      p { color: #000000; } a { text-decoration: none; color: #cc0000; }
      .faded { opacity: 0.8; } ${css}
    </style></head><body>
      <div style="background-image:linear-gradient(#fff, #eee)"><div class="faded"><p>Read <a id="faded" href="#">this guide</a> before you start.</p></div></div>
      <p>Read <a id="plain" href="#">this guide</a> before you start.</p>
    </body></html>`;
  const scan = (css) =>
    runa11yCoreOnHtml(page(css), { runOnly: [RULE_ID] }).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
  const cued = scan('a:hover, a:focus { text-decoration: underline; }');
  assert.strictEqual(occFor(cued, 'faded').data.details.reasonCode, 'LINK_COLOR_CONTRAST_ONLY');
  assert.strictEqual(occFor(cued, 'faded').lean, undefined);
  assert.strictEqual(occFor(cued, 'plain').lean.toward, 'pass');
  const bare = scan('');
  assert.strictEqual(occFor(bare, 'faded').lean.toward, 'fail');
  assert.strictEqual(occFor(bare, 'plain').lean.toward, 'fail');
});
