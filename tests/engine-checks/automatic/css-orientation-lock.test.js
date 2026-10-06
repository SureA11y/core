'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'css-orientation-lock';

test(`${RULE_ID}: notApplicable when there are no stylesheets`, () => {
  const html = `<!doctype html><html><body><p>No styles.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a stylesheet exists but no orientation-lock pattern`, () => {
  const html = `<!doctype html><html><head><style>body { color: red; }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when an orientation media query has no rotate transform`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: portrait) { body { padding: 4px; } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when an orientation media query rotates the page`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ORIENTATION_MEDIA_ROTATE_TRANSFORM');
});

test(`${RULE_ID}: fail when the rotation is -90deg (still a lock, negative angle)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(-90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when the rotation is 270deg (still a lock)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(270deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when a rotate() in an orientation media query is a small decorative angle (45deg), not a page lock`, () => {
  // A decorative arrow-icon rotate(45deg) sitting inside an
  // @media (orientation:portrait) block (one of several OR'd responsive
  // conditions) must not be flagged as an orientation-lock hack. Only
  // rotations near 90/270 degrees are a lock.
  const html = `<!doctype html><html><head><style>@media (orientation: portrait) { .icon:after { transform: rotate(45deg); } }</style></head><body><span class="icon"></span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the rotation is 92.5deg, near but not exactly 90 (ACT b33eff's own failed example; exact-modulo equality misses this)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: rotate(92.5deg); } }</style></head><body>Page Content</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when the rotation is 1.5708rad (converts to 90.0000210...deg, never exactly 90 due to floating point; ACT b33eff's own failed example)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: portrait) { html { transform: rotate(1.5708rad); } }</style></head><body>Page Content</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when a matrix3d() is a pure -90deg Z rotation (ACT b33eff's own failed example)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: matrix3d(0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); } }</style></head><body>Page Content</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when a 2D matrix() is a pure 90deg rotation`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: matrix(0, 1, -1, 0, 0, 0); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when rotate3d() rotates purely around the Z axis by 90deg`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: rotate3d(0, 0, 1, 90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when matrix3d() also carries translation (not a pure rotation, not decomposed)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: matrix3d(0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 10, 0, 0, 1); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when matrix() carries scale, not a pure rotation`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: matrix(0, 2, -2, 0, 0, 0); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when rotate3d() rotates around a non-Z axis`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: rotate3d(1, 0, 0, 90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the rotation is 180deg (a flip, not an orientation lock)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(180deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the rotation is expressed in a non-degree unit (0.25turn = 90deg)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(0.25turn); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

function styled(css, body) {
  return `<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID}: an orientation block that hides main behind a "rotate your device" message is asked about (F100)`, () => {
  const html = styled(
    '.msg{display:none} @media (orientation: portrait){ main{display:none} .msg{display:block} }',
    '<p class="msg">Tournez votre appareil</p><main id="m"><h1>Tarifs</h1><p>Contenu</p></main>'
  );
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.strictEqual(occ.data.details.reasonCode, 'ORIENTATION_MEDIA_HIDES_CONTENT');
    assert.strictEqual(occ.data.details.selectorText, 'main');
    assert.ok(occ.html.includes('id="m"'));
    assert.strictEqual(occ.uncertainty.code, 'judgement-required');
    assert.strictEqual(occ.i18n.summaryKey, 'cssOrientationLock_summary_cantTell_hidesContent');
  }
});

test(`${RULE_ID}: hiding body, a wrapper of main, or most of the text of a page without main is asked about`, () => {
  for (const [css, body] of [
    ['@media (orientation: landscape){ body{visibility:hidden} }', '<p>Texte</p>'],
    [
      '@media (orientation: portrait){ #app{display:none} }',
      '<div id="app"><main><p>Contenu</p></main></div>'
    ],
    [
      '@media (orientation: portrait){ .page{display:none} }',
      '<header>Logo</header><div class="page"><h1>Tarifs</h1><p>Une longue description du contenu de la page.</p></div>'
    ]
  ]) {
    const result = runa11yCoreOnHtml(styled(css, body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: a main landmark named by a fallback list or upper case (role="foo main", role="MAIN") counts as the page content`, () => {
  for (const role of ['foo main', 'MAIN']) {
    const html = styled(
      '@media (orientation: portrait){ .w{display:none} }',
      `<div class="w" role="${role}">Tarifs</div><div>Une longue description qui ne fait pas partie du contenu principal de la page.</div>`
    );
    const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.strictEqual(
      rule.occurrences[0].data.details.reasonCode,
      'ORIENTATION_MEDIA_HIDES_CONTENT'
    );
  }
});

test(`${RULE_ID}: an orientation block hiding a small part of the page still passes`, () => {
  const html = styled(
    '@media (orientation: portrait){ .aside{display:none} }',
    '<main><h1>Tarifs</h1><p>Contenu principal de la page.</p></main><div class="aside">Pub</div>'
  );
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: a rotation lock still fails, with the hidden-content question kept beside it`, () => {
  const html = styled(
    '@media (orientation: portrait){ html{transform:rotate(90deg)} main{display:none} }',
    '<main><p>Contenu</p></main>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepStrictEqual(
    rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]),
    [
      ['fail', 'ORIENTATION_MEDIA_ROTATE_TRANSFORM'],
      ['cantTell', 'ORIENTATION_MEDIA_HIDES_CONTENT']
    ]
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'CSS must not lock the page to a single orientation');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/css-orientation-lock-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'css-orientation-lock-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`css-orientation-lock: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['css-orientation-lock'],
    contextSelector: 'body'
  });
  assertRule(result, 'css-orientation-lock', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`css-orientation-lock: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { html { transform: rotate(90deg); } }</style></head><body></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['css-orientation-lock'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'css-orientation-lock', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: cantTell, not pass, when a stylesheet cannot be read`, () => {
  // A cross-origin stylesheet throws on `.cssRules`; a lock could be declared
  // inside it, so the scan cannot claim the page is clean.
  const dom = createDom(
    `<!doctype html><html><head><style>p { color: #222; }</style></head><body><p>Text.</p></body></html>`
  );

  const readable = dom.window.document.styleSheets[0];
  const unreadable = {
    get cssRules() {
      throw new dom.window.DOMException('cross-origin', 'SecurityError');
    }
  };
  Object.defineProperty(dom.window.document, 'styleSheets', {
    configurable: true,
    get: () => [readable, unreadable]
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'STYLESHEETS_NOT_READABLE');
  assert.strictEqual(rule.occurrences[0].data.details.unreadableSheetCount, 1);
});

test(`${RULE_ID}: an unreadable stylesheet does not mask a lock found in a readable one`, () => {
  const dom = createDom(
    `<!doctype html><html><head><style>
      @media (orientation: portrait) { .page { transform: rotate(90deg); } }
    </style></head><body><div class="page">Text.</div></body></html>`
  );

  const readable = dom.window.document.styleSheets[0];
  const unreadable = {
    get cssRules() {
      throw new dom.window.DOMException('cross-origin', 'SecurityError');
    }
  };
  Object.defineProperty(dom.window.document, 'styleSheets', {
    configurable: true,
    get: () => [readable, unreadable]
  });

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});
