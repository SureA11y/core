'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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

test(`${RULE_ID}: fail when the rotation is 92.5deg — near but not exactly 90 (ACT b33eff's own failed example; exact-modulo equality misses this)`, () => {
  const html = `<!doctype html><html><head><style>@media (orientation: landscape) { body { transform: rotate(92.5deg); } }</style></head><body>Page Content</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail when the rotation is 1.5708rad — converts to 90.0000210...deg, never exactly 90 due to floating point (ACT b33eff's own failed example)`, () => {
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
