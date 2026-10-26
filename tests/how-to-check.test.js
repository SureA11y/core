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

test('a binding’s frames result gains the steps on every frame’s result', () => {
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  const unreachable = { url: 'https://other.example/', error: 'cross-origin' };
  const out = addHowToCheck({ topFrame: raw, frames: [raw, unreachable] });
  assert.ok(out.topFrame.checksResults[0].occurrences[0].howToCheck);
  assert.ok(out.frames[0].checksResults[0].occurrences[0].howToCheck);
  assert.equal(out.frames[0].url, raw.url);
  assert.deepEqual(out.frames[1], unreachable);
  assert.equal(raw.checksResults[0].occurrences[0].howToCheck, undefined);
});

// @surea11y/core/how-to-check reads the steps from the review dictionaries
// alone, keyed by the rule's titleKey prefix and the reason code, so the
// English dictionary has to be each rule's meta.review word for word.
test('src/i18n/review/en.json is every rule’s meta.review, word for word, and nothing else', () => {
  const read = (l) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/review', `${l}.json`), 'utf8'));
  const expected = {};
  const prefixes = new Map();
  for (const file of RULE_FILES) {
    const mod = require(file);
    if (!mod.meta || !mod.meta.review) continue;
    const prefix = mod.meta.i18n.titleKey.replace(/_title$/, '');
    assert.ok(!prefixes.has(prefix), `${mod.id} shares its prefix with ${prefixes.get(prefix)}`);
    prefixes.set(prefix, mod.id);
    for (const [code, entry] of Object.entries(mod.meta.review)) {
      const key = `${prefix}_review_${code}_`;
      entry.steps.forEach((s, i) => (expected[`${key}step${i + 1}`] = s));
      expected[`${key}pass`] = entry.passWhen;
      expected[`${key}fail`] = entry.failWhen;
    }
  }
  assert.ok(prefixes.size > 80);
  assert.deepEqual(read('en'), expected);
});

const { applyHowToCheck, howToCheckFrom } = require('../src/how-to-check-core.js');
const REVIEW = Object.fromEntries(
  ['en', 'fr', 'de', 'es', 'ja'].map((l) => [l, require(`../src/i18n/review/${l}.json`)])
);

test('applyHowToCheck gives what addHowToCheck gives, from the dictionaries passed', () => {
  for (const locale of ['en', 'fr', 'ja', 'es-MX']) {
    const raw = runa11yCoreOnHtml(page(NO_HEADERS), {
      runOnly: ['td-has-header', 'heading-order'],
      engineOptions: { locale }
    });
    assert.deepEqual(applyHowToCheck(raw, REVIEW), addHowToCheck(raw), locale);
  }
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), {
    runOnly: ['td-has-header'],
    engineOptions: { locale: 'fr' }
  });
  const tree = { topFrame: raw, frames: [raw, { url: 'x', error: 'detached' }] };
  assert.deepEqual(applyHowToCheck(tree, REVIEW), addHowToCheck(tree));
  // English alone: a French scan's steps fall back to it.
  const enOnly = applyHowToCheck(raw, { en: REVIEW.en });
  assert.equal(
    enOnly.checksResults[0].occurrences[0].howToCheck.steps[0],
    'Look at the table the report names on screen.'
  );
  // A function from a locale to its dictionary reads the same.
  assert.deepEqual(
    applyHowToCheck(raw, (l) => REVIEW[l]),
    applyHowToCheck(raw, REVIEW)
  );
  // No dictionaries, no steps, and the result as it was.
  assert.deepEqual(applyHowToCheck(raw, {}), raw);
});

test('options.locale gives the steps in another locale, those a result already has included', () => {
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  const en = addHowToCheck(raw);
  const stepsOf = (r) => r.checksResults[0].occurrences[0].howToCheck;
  const fr = addHowToCheck(en, { locale: 'fr' });
  assert.deepEqual(stepsOf(fr), howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'fr'));
  assert.notEqual(stepsOf(fr).steps[0], stepsOf(en).steps[0]);
  // Without it, steps already there are kept; the result given is not changed.
  assert.deepEqual(addHowToCheck(fr), fr);
  assert.deepEqual(stepsOf(en), howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'en'));
  // A list is read most wanted first; a locale core has no dictionary for
  // passes to the next, and English is the last resort.
  assert.deepEqual(
    stepsOf(addHowToCheck(raw, { locale: ['xx', 'de'] })),
    stepsOf(addHowToCheck(raw, { locale: 'de' }))
  );
  assert.deepEqual(stepsOf(addHowToCheck(fr, { locale: 'xx' })), stepsOf(en));
  // The browser-safe entry reads it the same way, every frame included.
  const tree = { topFrame: en, frames: [en, { url: 'x', error: 'detached' }] };
  assert.deepEqual(
    applyHowToCheck(tree, REVIEW, { locale: 'ja' }),
    addHowToCheck(tree, { locale: 'ja' })
  );
  // An empty locale is no locale.
  assert.deepEqual(addHowToCheck(fr, { locale: ' ' }), fr);
});

test('howToCheckFrom reads a locale chain, falls back to English, and knows no other key', () => {
  const en = howToCheckFrom(REVIEW, 'tdHasHeader', 'TD_TABLE_NO_HEADERS');
  assert.deepEqual(en, howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS'));
  assert.deepEqual(
    howToCheckFrom(REVIEW, 'tdHasHeader', 'TD_TABLE_NO_HEADERS', 'fr-CA'),
    howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'fr-CA')
  );
  assert.deepEqual(
    howToCheckFrom(REVIEW, 'tdHasHeader', 'TD_TABLE_NO_HEADERS', ['xx', 'de']),
    howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'de')
  );
  assert.deepEqual(howToCheckFrom({ FR: REVIEW.fr }, 'tdHasHeader', 'TD_TABLE_NO_HEADERS', 'fr'), {
    ...howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'fr')
  });
  assert.equal(howToCheckFrom(REVIEW, 'tdHasHeader', 'NOT_A_CODE'), null);
  assert.equal(howToCheckFrom(REVIEW, 'noSuchRule', 'TD_TABLE_NO_HEADERS'), null);
});

test('the HTML report adds the steps to a result that comes without them', () => {
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  assert.equal(raw.checksResults[0].occurrences[0].howToCheck, undefined);
  const html = renderHtmlReport(raw);
  assert.match(
    html,
    /<details class="card-how"><summary>How to check<\/summary><ol><li>Look at the table/
  );
  assert.equal(raw.checksResults[0].occurrences[0].howToCheck, undefined);
  // Each frame of a frames result too.
  const frames = renderHtmlReport({ topFrame: raw, frames: [raw] });
  assert.equal(frames.match(/<details class="card-how">/g).length, 2);
  // Steps the result already carries are the ones shown.
  const own = addHowToCheck(raw);
  own.checksResults[0].occurrences[0].howToCheck = {
    steps: ['Own step.'],
    passWhen: 'p',
    failWhen: 'f'
  };
  assert.match(renderHtmlReport(own), /<ol><li>Own step\.<\/li><\/ol>/);
});

test('without engineOptions on a check, the steps follow engine.locale', () => {
  const raw = runa11yCoreOnHtml(page(NO_HEADERS), {
    runOnly: ['td-has-header'],
    engineOptions: { locale: 'fr' }
  });
  assert.equal(raw.engine.locale.resolved, 'fr');
  const fr = howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS', 'fr');
  const bare = (engine) => ({
    ...raw,
    engine,
    checksResults: raw.checksResults.map(
      ({ engineOptions, ...check }) => (void engineOptions, check)
    )
  });
  const first = (r) => addHowToCheck(r).checksResults[0].occurrences[0].howToCheck;
  assert.deepEqual(first(bare(raw.engine)), fr);
  assert.deepEqual(first(bare({ ...raw.engine, locale: 'fr' })), fr);
  assert.deepEqual(
    first(bare({ ...raw.engine, locale: null })),
    howToCheckFor('td-has-header', 'TD_TABLE_NO_HEADERS')
  );
});

test('a custom rule’s finding gets no steps, even one replacing a core rule with its titleKey', () => {
  const rule = (id) => ({
    id,
    meta: { i18n: { titleKey: 'tdHasHeader_title' } },
    runInPage: (ctx) => ({
      outcome: 'cantTell',
      occurrences: [
        {
          __node: ctx.document.body,
          summary: 'x',
          data: { details: { reasonCode: 'TD_TABLE_NO_HEADERS' } }
        }
      ]
    })
  });
  const warn = console.warn;
  console.warn = () => {};
  let raw;
  try {
    raw = runa11yCoreOnHtml(page(NO_HEADERS), {
      runOnly: ['td-has-header', 'acme-table'],
      engineOptions: { customRules: [rule('td-has-header'), rule('acme-table')] },
      entryPointParity: false
    });
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(raw.overriddenBuiltinIds, ['td-has-header']);
  const out = addHowToCheck(raw);
  const by = (id) => out.checksResults.find((c) => c.ruleId === id);
  for (const id of ['td-has-header', 'acme-table']) {
    assert.equal(by(id).outcome, 'cantTell', id);
    assert.equal(by(id).occurrences[0].howToCheck, undefined, id);
  }
  // A pack's override is listed in overriddenBuiltinIds alone.
  const packOverride = {
    ...raw,
    checksResults: raw.checksResults.map(({ engineOptions, ...c }) => (void engineOptions, c))
  };
  assert.equal(
    addHowToCheck(packOverride).checksResults.find((c) => c.ruleId === 'td-has-header')
      .occurrences[0].howToCheck,
    undefined
  );
  // The core rule itself, in a scan without the override, still gets them.
  const core = scan(page(NO_HEADERS), { runOnly: ['td-has-header'] });
  assert.ok(core.checksResults[0].occurrences[0].howToCheck);
});
