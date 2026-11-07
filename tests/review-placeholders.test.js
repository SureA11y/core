'use strict';

/**
 * Placeholders in the steps for an undecided finding ({{name|text}},
 * src/review-placeholders.js), and a standard's own steps for a core rule's
 * code (standard.review): a finding's howToCheck names what it found, and
 * reads in the words of the standard that asks about it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  fillHowToCheck,
  fillPlaceholders,
  placeholderNames,
  placeholderProblems,
  placeholderValues,
  MAX_VALUE_LENGTH
} = require('../src/review-placeholders.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { addHowToCheck, howToCheckFor } = require('../src/index.js');
const { definePack, ruleMappedStandard, checkPack } = require('../src/pack.js');
const { renderHtmlReport } = require('../src/report.js');

const ROOT = path.join(__dirname, '..');
const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

test('a placeholder reads as the value, or as its own text without one', () => {
  const text = 'Open the {{kind|popup}} of {{role|the element}}.';
  assert.equal(
    fillPlaceholders(text, { kind: 'menu', role: 'button' }),
    'Open the menu of button.'
  );
  assert.equal(fillPlaceholders(text, { kind: 'menu' }), 'Open the menu of the element.');
  assert.equal(fillPlaceholders(text, null), 'Open the popup of the element.');
  assert.equal(fillPlaceholders('No placeholder.', { a: 'b' }), 'No placeholder.');
  assert.deepEqual(placeholderNames(text), ['kind', 'role']);
});

test("a finding's values: its details and its params, one line each, not too long", () => {
  const values = placeholderValues({
    i18n: { params: { attr: 'aria-controls', long: 'x'.repeat(500) } },
    data: {
      details: {
        reasonCode: 'CODE',
        attr: 'ignored, params win',
        roles: ['menu', 'dialog'],
        count: 3,
        on: false,
        multi: 'a\n  b',
        nested: { no: 1 },
        empty: ''
      }
    }
  });
  assert.equal(values.attr, 'aria-controls');
  assert.equal(values.roles, 'menu, dialog');
  assert.equal(values.count, '3');
  assert.equal(values.on, 'false');
  assert.equal(values.multi, 'a b');
  assert.equal(values.long.length, MAX_VALUE_LENGTH);
  assert.ok(values.long.endsWith('…'));
  for (const absent of ['reasonCode', 'nested', 'empty']) assert.ok(!(absent in values), absent);
});

test('a placeholder must say how it reads without a value', () => {
  assert.deepEqual(placeholderProblems('Fine {{a|text}}.'), []);
  assert.equal(placeholderProblems('Bare {{a}}.').length, 1);
  assert.equal(placeholderProblems('Empty {{a| }}.').length, 1);
  assert.equal(placeholderProblems('Stray {brace}.').length, 1);
  assert.deepEqual(fillHowToCheck({ steps: ['{{a|x}}'], passWhen: 'p', failWhen: 'f' }, {}), {
    steps: ['x'],
    passWhen: 'p',
    failWhen: 'f'
  });
});

test("core's steps: every placeholder has its text, and every locale names the English ones", () => {
  const dir = path.join(ROOT, 'src/i18n/procedures');
  const read = (l) => JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'));
  const en = read('en');
  for (const l of ['en', 'de', 'es', 'fr', 'ja']) {
    const dict = read(l);
    for (const [key, text] of Object.entries(dict)) {
      if (!key.includes('_review_')) continue;
      assert.deepEqual(placeholderProblems(text), [], `${l} ${key}`);
      assert.deepEqual(
        placeholderNames(text).sort(),
        placeholderNames(en[key]).sort(),
        `${l} ${key} names other placeholders than English`
      );
    }
  }
});

// A pack rule that asks about each element with data-ask, and steps that
// name its value.
const askRule = {
  id: 'acme-ask',
  meta: {
    title: 'Asks',
    description: 'Asks about each element with data-ask.',
    i18n: { titleKey: 'acmeAsk_title', descriptionKey: 'acmeAsk_description' },
    tags: ['acme', 'best-practice'],
    wcagSc: [],
    defaultSeverity: 'minor',
    type: 'automatic',
    defaultConfidence: 'high',
    reasonCodes: ['ACME_ASK'],
    review: {
      ACME_ASK: {
        steps: ['Find the element whose data-ask is {{ask|a value}}, a {{tag|element}}.'],
        passWhen: '{{ask|The value}} is right.',
        failWhen: '{{ask|The value}} is wrong, which fails Acme 1.'
      }
    }
  },
  runInPage(ctx) {
    const { helpers, rule } = ctx;
    const occurrences = helpers.queryAll('[data-ask]').map((el) =>
      helpers.reportOccurrence(el, {
        summary: 'Asked.',
        i18n: { summaryKey: 'acmeAsk_summary', params: { ask: el.getAttribute('data-ask') } },
        data: { details: { reasonCode: 'ACME_ASK', tag: el.localName } }
      })
    );
    return {
      ruleId: rule.ruleId,
      outcome: occurrences.length ? 'cantTell' : 'notApplicable',
      severity: 'minor',
      occurrences
    };
  }
};
const askPack = definePack({
  name: 'acme-ask',
  version: '1.0.0',
  namespace: 'acme',
  core: '*',
  rules: [askRule],
  dictionaries: {
    en: {
      acmeAsk_title: 'Asks',
      acmeAsk_description: 'Asks about each element with data-ask.',
      acmeAsk_summary: 'Asked.'
    }
  }
});
const ask = (body) => {
  const raw = runa11yCoreOnHtml(page(body), {
    engineOptions: { packs: [askPack] },
    runOnly: ['acme-ask']
  });
  return addHowToCheck(raw, { packs: [askPack] });
};

test("a finding's steps name what it found", () => {
  const how = ask('<p data-ask="menu">x</p>').checksResults[0].occurrences[0].howToCheck;
  assert.deepEqual(how, {
    steps: ['Find the element whose data-ask is menu, a p.'],
    passWhen: 'menu is right.',
    failWhen: 'menu is wrong, which fails Acme 1.'
  });
});

test('steps read for a code alone read as each placeholder’s text, or the values given', () => {
  assert.deepEqual(howToCheckFor('acme-ask', 'ACME_ASK', 'en', { packs: [askPack] }), {
    steps: ['Find the element whose data-ask is a value, a element.'],
    passWhen: 'The value is right.',
    failWhen: 'The value is wrong, which fails Acme 1.'
  });
  const given = howToCheckFor('acme-ask', 'ACME_ASK', 'en', {
    packs: [askPack],
    values: { ask: 'grid' }
  });
  assert.equal(given.passWhen, 'grid is right.');
});

test('the HTML report escapes a value from the page', () => {
  const r = ask('<p data-ask="&lt;b&gt;x&lt;/b&gt;">x</p>');
  assert.match(r.checksResults[0].occurrences[0].howToCheck.steps[0], /is <b>x<\/b>,/);
  const html = renderHtmlReport(r);
  assert.ok(!html.includes('is <b>x</b>,'));
  assert.ok(html.includes('is &lt;b&gt;x&lt;/b&gt;,'));
});

test('definePack refuses a pack rule’s placeholder without its text', () => {
  const bad = {
    ...askRule,
    meta: {
      ...askRule.meta,
      review: { ACME_ASK: { steps: ['{{ask}}'], passWhen: 'p', failWhen: 'f' } }
    }
  };
  assert.match(
    checkPack({ name: 'b', version: '1.0.0', namespace: 'acme', core: '*', rules: [bad] }).join(
      '\n'
    ),
    /needs the text it reads as without a value/
  );
});

const HASPOPUP = page(
  '<button aria-haspopup="menu" aria-controls="pop" aria-expanded="true">Options</button>' +
    '<div id="pop" role="dialog" aria-label="Options"><button>Close</button></div>'
);

// A standard that judges aria-valid-attr-value by its codes, with its own
// steps for the haspopup question.
function attrsPack(review) {
  const std = ruleMappedStandard({
    standard: 'Attr Standard',
    tag: 'attrs',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { A1: { title: 'Values are valid', wcagSc: [] } } },
    ruleMap: {
      '1.0': {
        'aria-valid-attr-value': {
          requirements: ['A1'],
          reasonCodes: {
            ARIA_ACTIVEDESCENDANT_OUTSIDE: { outcome: 'fail' },
            ARIA_ATTR_VALUE_INVALID: { outcome: 'fail' },
            ARIA_ATTR_VALUE_TARGET_ABSENT: { outcome: 'cantTell' },
            ARIA_HASPOPUP_ROLE_MISMATCH: { outcome: 'cantTell' },
            ARIA_POSINSET_EXCEEDS_SETSIZE: { outcome: 'fail' },
            ARIA_VALUENOW_OUT_OF_RANGE: { outcome: 'fail' },
            ARIA_VALUE_RANGE_INVERTED: { outcome: 'fail' }
          }
        }
      }
    }
  });
  return {
    name: 'attrs-pack',
    version: '1.0.0',
    namespace: 'attrs',
    core: '*',
    standard: {
      key: 'attrs',
      standard: 'Attr Standard',
      versions: ['1.0'],
      profiles: { 'attrs-1.0': { version: '1.0', tags: ['attrs'], mappedRules: true } },
      ruleTag: 'attrs',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      review
    }
  };
}

const OWN = {
  'aria-valid-attr-value': {
    ARIA_HASPOPUP_ROLE_MISMATCH: {
      steps: ['Open the popup, which aria-haspopup says is a {{expectedRole|menu}}.'],
      passWhen: 'It is a {{expectedRole|menu}}.',
      failWhen: 'It is a {{popupRole|dialog}}, which fails Attr Standard A1.'
    }
  }
};

test("a standard's own steps answer the questions only its profiles ask", () => {
  const pack = definePack(attrsPack(OWN));
  const scanAs = (profile) =>
    addHowToCheck(runa11yCoreOnHtml(HASPOPUP, { engineOptions: { packs: [pack], profile } }), {
      packs: [pack]
    });
  const howIn = (r) =>
    r.checksResults
      .find((c) => c.ruleId === 'aria-valid-attr-value')
      .occurrences.find((o) => o.data.details.reasonCode === 'ARIA_HASPOPUP_ROLE_MISMATCH')
      .howToCheck;

  const own = howIn(scanAs('attrs-1.0'));
  assert.deepEqual(own, {
    steps: ['Open the popup, which aria-haspopup says is a menu.'],
    passWhen: 'It is a menu.',
    failWhen: 'It is a dialog, which fails Attr Standard A1.'
  });
  // WCAG asks too: core's steps, which name its criterion.
  assert.match(howIn(scanAs('wcag22-aa')).failWhen, /WCAG 4\.1\.2/);
  assert.match(howIn(scanAs(['wcag22-aa', 'attrs-1.0'])).failWhen, /WCAG 4\.1\.2/);
});

test('definePack refuses standard steps it cannot use', () => {
  const problems = (review) => checkPack(attrsPack(review)).join('\n');
  assert.equal(problems(OWN), '');
  assert.match(problems([]), /standard\.review must be/);
  assert.match(
    problems({ 'no-such-rule': { X: OWN['aria-valid-attr-value'].ARIA_HASPOPUP_ROLE_MISMATCH } }),
    /no core rule of that id/
  );
  assert.match(
    problems({
      'aria-valid-attr-value': {
        ARIA_NOT_A_CODE: OWN['aria-valid-attr-value'].ARIA_HASPOPUP_ROLE_MISMATCH
      }
    }),
    /not a code aria-valid-attr-value gives steps for/
  );
  assert.match(
    problems({
      'aria-valid-attr-value': {
        ARIA_HASPOPUP_ROLE_MISMATCH: { steps: ['{{role}}'], passWhen: 'p', failWhen: 'f' }
      }
    }),
    /needs the text it reads as without a value/
  );
  assert.match(
    problems({
      'aria-valid-attr-value': {
        ARIA_HASPOPUP_ROLE_MISMATCH: { steps: [], passWhen: 'p', failWhen: 'f' }
      }
    }),
    /1 to 6 steps/
  );
});

// The French of OWN, under the keys a pack's dictionary translates a
// standard's steps with.
const STEM = 'attrs_standardReview_aria-valid-attr-value_ARIA_HASPOPUP_ROLE_MISMATCH_';
const FRENCH = {
  [`${STEM}step1`]:
    'Ouvrez le menu contextuel, qu’aria-haspopup dit être un {{expectedRole|menu}}.',
  [`${STEM}pass`]: 'C’est un {{expectedRole|menu}}.',
  [`${STEM}fail`]: 'C’est un {{popupRole|dialog}}, ce qui enfreint l’exigence A1 d’Attr Standard.'
};
const translatedPack = (fr) => ({ ...attrsPack(OWN), dictionaries: { en: {}, fr } });
const ownSteps = (pack, locale) =>
  addHowToCheck(
    runa11yCoreOnHtml(HASPOPUP, {
      engineOptions: { packs: [pack], profile: 'attrs-1.0', ...(locale ? { locale } : {}) }
    }),
    { packs: [pack] }
  )
    .checksResults.find((c) => c.ruleId === 'aria-valid-attr-value')
    .occurrences.find((o) => o.data.details.reasonCode === 'ARIA_HASPOPUP_ROLE_MISMATCH')
    .howToCheck;

test("a standard's own steps are read in the scan's locale where its pack translates them", () => {
  const pack = definePack(translatedPack(FRENCH));
  assert.deepEqual(ownSteps(pack, 'fr'), {
    steps: ['Ouvrez le menu contextuel, qu’aria-haspopup dit être un menu.'],
    passWhen: 'C’est un menu.',
    failWhen: 'C’est un dialog, ce qui enfreint l’exigence A1 d’Attr Standard.'
  });
  // fr-CA reads fr; English stays English.
  assert.match(ownSteps(pack, 'fr-CA').passWhen, /^C’est un menu\.$/);
  assert.equal(ownSteps(pack, 'en').passWhen, 'It is a menu.');
  assert.equal(ownSteps(pack).passWhen, 'It is a menu.');
  // Asked again in another locale, as a report in that language does.
  const raw = runa11yCoreOnHtml(HASPOPUP, {
    engineOptions: { packs: [pack], profile: 'attrs-1.0' }
  });
  const again = addHowToCheck(addHowToCheck(raw, { packs: [pack] }), {
    packs: [pack],
    locale: 'fr'
  });
  const how = again.checksResults
    .find((c) => c.ruleId === 'aria-valid-attr-value')
    .occurrences.find(
      (o) => o.data.details.reasonCode === 'ARIA_HASPOPUP_ROLE_MISMATCH'
    ).howToCheck;
  assert.equal(how.passWhen, 'C’est un menu.');
});

test("a standard's steps a locale doesn't translate are read in English, as a whole", () => {
  // No dictionary for the locale, no key for the entry, or only part of it.
  const none = definePack(translatedPack({ attrs_other: 'x' }));
  assert.equal(ownSteps(none, 'fr').passWhen, 'It is a menu.');
  assert.equal(ownSteps(definePack(translatedPack(FRENCH)), 'de').passWhen, 'It is a menu.');
  // A pack that translates part of the entry is refused (below); read
  // anyway, the entry is in English, not half French.
  const { [`${STEM}fail`]: _, ...part } = FRENCH;
  const raw = runa11yCoreOnHtml(HASPOPUP, {
    engineOptions: { packs: [none], profile: 'attrs-1.0', locale: 'fr' }
  });
  const how = addHowToCheck(raw, { packs: [translatedPack(part)] })
    .checksResults.find((c) => c.ruleId === 'aria-valid-attr-value')
    .occurrences.find(
      (o) => o.data.details.reasonCode === 'ARIA_HASPOPUP_ROLE_MISMATCH'
    ).howToCheck;
  assert.deepEqual(how, {
    steps: ['Open the popup, which aria-haspopup says is a menu.'],
    passWhen: 'It is a menu.',
    failWhen: 'It is a dialog, which fails Attr Standard A1.'
  });
});

test("checkPack reports a standard's steps translated in part, or under keys it doesn't have", () => {
  const problems = (fr, en = {}) =>
    checkPack({ ...attrsPack(OWN), dictionaries: { en, fr } }).join('\n');
  assert.equal(problems(FRENCH), '');
  const { [`${STEM}fail`]: _, ...part } = FRENCH;
  assert.match(
    problems(part),
    /translates only part of standard\.review\.aria-valid-attr-value\.ARIA_HASPOPUP_ROLE_MISMATCH.*lacks fail/
  );
  assert.match(problems({ ...FRENCH, [`${STEM}step2`]: 'Deux.' }), /has no step 2/);
  assert.match(
    problems({ 'attrs_standardReview_aria-valid-attr-value_ARIA_ATTR_VALUE_INVALID_pass': 'x' }),
    /standard\.review has no "ARIA_ATTR_VALUE_INVALID" for "aria-valid-attr-value"/
  );
  assert.match(
    problems({ 'attrs_standardReview_link-name-present_X_pass': 'x' }),
    /has no "X" for "link-name-present"/
  );
  assert.match(problems({ ...FRENCH, [`${STEM}after`]: 'x' }), /ends in _step<n>, _pass or _fail/);
  assert.match(problems({}, FRENCH), /English steps are its standard\.review/);
  assert.match(
    problems({ ...FRENCH, [`${STEM}pass`]: 'C’est un {{role|menu}}.' }),
    /must name the placeholders its English names/
  );
  // definePack refuses the same.
  assert.throws(() => definePack({ ...attrsPack(OWN), dictionaries: { fr: part } }), /only part/);
});
