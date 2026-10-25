'use strict';

/**
 * howToCheck: how a person answers an undecided finding (docs/OUTPUT_SCHEMA.md,
 * "How to check"). Every reason code a rule's header lists as cantTell has
 * steps in the rule's meta.review, and the engine copies them onto each
 * cantTell finding, in the scan's locale, and onto no decided one.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../src/report.js');
const { addHowToCheck, howToCheckFor } = require('../src/index.js');

const ROOT = path.join(__dirname, '..');
const RULE_FILES = ['automatic', 'manual']
  .flatMap((d) =>
    fs.readdirSync(path.join(ROOT, 'src/checks', d)).map((f) => path.join(ROOT, 'src/checks', d, f))
  )
  .concat([path.join(ROOT, 'src/checks/manual-review.js')])
  .filter((f) => f.endsWith('.js'));

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

test('every reason code a rule header lists as cantTell has steps in meta.review', () => {
  const missing = [];
  let codes = 0;
  for (const file of RULE_FILES) {
    const src = fs.readFileSync(file, 'utf8');
    const mod = require(file);
    const review = (mod.meta && mod.meta.review) || {};
    for (const m of src.matchAll(/^ \* {3}- `([A-Z0-9_]+)` \(([^)]*)\)/gm)) {
      if (!/cantTell/.test(m[2])) continue;
      codes += 1;
      if (!review[m[1]]) missing.push(`${mod.id} ${m[1]}`);
    }
  }
  assert.ok(codes > 150, `only ${codes} cantTell codes found`);
  assert.deepEqual(missing, []);
});

const NO_HEADERS = `<main><table>${'<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>'.repeat(4)}</table></main>`;

test('every locale has every step of src/i18n/review/en.json', () => {
  const read = (l) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/review', `${l}.json`), 'utf8'));
  const en = Object.keys(read('en')).sort();
  assert.ok(en.length > 900);
  for (const l of ['de', 'es', 'fr', 'ja']) assert.deepEqual(Object.keys(read(l)).sort(), en, l);
});

// runa11yCoreOnHtml, like runa11yCoreInPage, returns the engine's result; the
// steps are added after it, as a binding does.
const scan = (html, opts) => addHowToCheck(runa11yCoreOnHtml(html, opts));

test('a cantTell finding carries its code’s steps, translated', () => {
  const en = scan(page(NO_HEADERS), { runOnly: ['td-has-header'] }).checksResults[0];
  const how = en.occurrences[0].howToCheck;
  assert.equal(en.outcome, 'cantTell');
  assert.equal(how.steps[0], 'Look at the table the report names on screen.');
  assert.match(how.failWhen, /1\.3\.1/);
  assert.ok(how.passWhen);
  const de = scan(page(NO_HEADERS), {
    runOnly: ['td-has-header'],
    engineOptions: { locale: 'de' }
  }).checksResults[0].occurrences[0].howToCheck;
  assert.equal(de.steps.length, how.steps.length);
  assert.notEqual(de.steps[0], how.steps[0]);
});

test('a decided finding has no steps', () => {
  const rule = scan(page('<main><a href="/x" onfocus="this.blur()">X</a></main>'), {
    runOnly: ['focus-not-removed-by-script']
  }).checksResults[0];
  assert.equal(rule.outcome, 'fail');
  assert.equal(rule.occurrences[0].howToCheck, undefined);
});

test('the HTML report shows the steps under a card that needs review', () => {
  const result = scan(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  const html = renderHtmlReport(result);
  assert.match(
    html,
    /<details class="card-how"><summary>How to check<\/summary><ol><li>Look at the table/
  );
  assert.match(html, /Passes: /);
  assert.match(html, /Fails: The table holds data/);
});

test('the engine leaves the steps out; addHowToCheck returns a copy with them', () => {
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  assert.equal(raw.checksResults[0].occurrences[0].howToCheck, undefined);
  const added = addHowToCheck(raw);
  assert.ok(added.checksResults[0].occurrences[0].howToCheck);
  assert.equal(raw.checksResults[0].occurrences[0].howToCheck, undefined);
  const tree = addHowToCheck({ topFrame: raw, frames: [{ url: 'x', topFrame: raw, frames: [] }] });
  assert.ok(tree.frames[0].topFrame.checksResults[0].occurrences[0].howToCheck);
});

test('howToCheckFor reads a locale, falls back to its base and to English', () => {
  const en = howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS');
  const fr = howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'fr-CA');
  const xx = howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'xx');
  assert.equal(xx.steps[0], en.steps[0]);
  assert.notEqual(fr.steps[0], en.steps[0]);
  assert.equal(howToCheckFor('td-has-header', 'NOT_A_CODE'), null);
  assert.equal(howToCheckFor('no-such-rule', 'TD_TABLE_NO_HEADERS'), null);
});
