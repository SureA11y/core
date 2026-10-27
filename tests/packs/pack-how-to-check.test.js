'use strict';

/**
 * How to check (docs/OUTPUT_SCHEMA.md#how-to-check) for packs: a variant's
 * check result names its base (variantOf), and its undecided findings get the
 * base rule's steps where it has none of its own; a pack rule gives steps in
 * its meta.review, in English, checked as core's are.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const main = require('../../src/index.js');
const { definePack, checkPack } = require('../../src/pack.js');
const { applyHowToCheck } = require('../../src/how-to-check-core.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const REVIEW = Object.fromEntries(
  ['en', 'fr'].map((l) => [l, require(`../../src/i18n/review/${l}.json`)])
);

// Light grey text in the banner's logo: contrast-minimum fails it; a variant
// with logoText: 'ask' asks about it (LOGO_TEXT_BELOW_THRESHOLD).
const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  '<header><p class="logo" style="color:#aaa;background:#fff">Acme</p></header>' +
  '<main><p>x</p></main></body></html>';

const ASK = { steps: ['Look at the panel.'], passWhen: 'It is fine.', failWhen: 'It is not.' };

const acme = (over = {}) =>
  definePack({
    name: '@acme/review',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [
      {
        id: 'acme-ask',
        meta: {
          title: 'Ask',
          i18n: { titleKey: 'acmeAsk_title', descriptionKey: 'acmeAsk_description' },
          review: { ACME_ASK: ASK }
        },
        runInPage(ctx) {
          return {
            outcome: 'cantTell',
            occurrences: [
              { __node: ctx.document.body, data: { details: { reasonCode: 'ACME_ASK' } } }
            ]
          };
        }
      }
    ],
    variants: [
      {
        id: 'acme-contrast',
        from: 'contrast-minimum',
        config: { logoText: 'ask' },
        meta: {
          title: 'Logo text is asked about',
          i18n: { titleKey: 'acmeContrast_title', descriptionKey: 'acmeContrast_description' },
          ...over.variantMeta
        }
      }
    ]
  });

function scan(run, engineOptions) {
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    return run(null, null, engineOptions, ['acme-ask', 'acme-contrast']);
  } finally {
    dom.window.close();
  }
}
const first = (result, id) => result.checksResults.find((c) => c.ruleId === id).occurrences[0];

test('a variant names its base, and its finding gets the base rule’s steps, translated', () => {
  const pack = acme();
  const en = scan(main.runDomRulesInPage, { packs: [pack] });
  const variant = en.checksResults.find((c) => c.ruleId === 'acme-contrast');
  assert.equal(variant.variantOf, 'contrast-minimum');
  assert.equal(variant.i18n.variantOfTitleKey, 'contrastMinimum_title');
  assert.equal(first(en, 'acme-contrast').data.details.reasonCode, 'LOGO_TEXT_BELOW_THRESHOLD');
  assert.deepEqual(
    first(en, 'acme-contrast').howToCheck,
    main.howToCheckFor('contrast-minimum', 'LOGO_TEXT_BELOW_THRESHOLD')
  );
  const fr = scan(main.runDomRulesInPage, { packs: [pack], locale: 'fr' });
  assert.deepEqual(
    first(fr, 'acme-contrast').howToCheck,
    main.howToCheckFor('contrast-minimum', 'LOGO_TEXT_BELOW_THRESHOLD', 'fr')
  );
  assert.deepEqual(
    main.howToCheckFor('acme-contrast', 'LOGO_TEXT_BELOW_THRESHOLD', 'fr', { packs: [pack] }),
    first(fr, 'acme-contrast').howToCheck
  );
  // A rule that is no variant has no variantOf, and can't claim one.
  const plain = runa11yCoreOnHtml(PAGE, {
    runOnly: ['acme-claims'],
    engineOptions: {
      customRules: [
        {
          id: 'acme-claims',
          runInPage: () => ({ outcome: 'pass', occurrences: [], variantOf: 'contrast-minimum' })
        }
      ]
    },
    entryPointParity: false
  });
  assert.equal(plain.checksResults[0].variantOf, undefined);
  assert.equal(
    runa11yCoreOnHtml(PAGE, { runOnly: ['contrast-minimum'] }).checksResults[0].variantOf,
    undefined
  );
});

test('a pack rule’s finding gets the steps of its meta.review, in English, given the packs', () => {
  const pack = acme();
  for (const locale of ['en', 'fr']) {
    const r = scan(main.runDomRulesInPage, { packs: [pack], locale });
    assert.deepEqual(first(r, 'acme-ask').howToCheck, ASK, locale);
  }
  assert.deepEqual(main.howToCheckFor('acme-ask', 'ACME_ASK', 'fr', { packs: [pack] }), ASK);
  assert.equal(main.howToCheckFor('acme-ask', 'ACME_ASK', 'fr'), null);
  // A result from a page (runa11yCoreInPage) comes without them: addHowToCheck
  // adds the variant's from core's steps, and the pack rule's given the packs.
  const runtime = require('../../src/pack.js').preparePacks([pack]).runtime;
  const raw = scan(runtime.runDomRulesInPage, { packs: [pack] });
  assert.equal(first(raw, 'acme-ask').howToCheck, undefined);
  assert.equal(first(main.addHowToCheck(raw), 'acme-ask').howToCheck, undefined);
  assert.ok(first(main.addHowToCheck(raw), 'acme-contrast').howToCheck);
  const added = main.addHowToCheck(raw, { packs: [pack] });
  assert.deepEqual(first(added, 'acme-ask').howToCheck, ASK);
  // The browser-safe path gives the same.
  assert.deepEqual(applyHowToCheck(raw, REVIEW, { packs: [pack] }), added);
});

test('a variant’s own steps for a code come before its base’s', () => {
  const own = { steps: ['Ask the brand team.'], passWhen: 'A logo.', failWhen: 'Not a logo.' };
  const pack = acme({ variantMeta: { review: { LOGO_TEXT_BELOW_THRESHOLD: own } } });
  assert.deepEqual(checkPack(pack), []);
  const r = scan(main.runDomRulesInPage, { packs: [pack] });
  assert.deepEqual(first(r, 'acme-contrast').howToCheck, own);
});

test('a pack rule’s meta.review is checked as a core rule’s is', () => {
  const withReview = (review, meta = {}) =>
    checkPack({
      name: 'p',
      version: '1.0.0',
      namespace: 'q',
      core: '*',
      rules: [
        {
          id: 'q-x',
          meta: { i18n: { titleKey: 'qX_title' }, review, ...meta },
          runInPage: () => ({ outcome: 'cantTell', data: { details: { reasonCode: 'Q_X' } } })
        }
      ]
    }).join('\n');
  assert.equal(withReview({ Q_X: ASK }), '');
  assert.match(withReview([]), /meta\.review must be an object/);
  // Codes are checked against those the rule declares, when it declares
  // them; otherwise only the shape is.
  assert.equal(withReview({ Q_Y: ASK }), '');
  assert.equal(withReview({ Q_Y: ASK }, { reasonCodes: ['Q_Y'] }), '');
  assert.equal(withReview({ Q_X: ASK }, { reasonCodes: ['Q_Y'] }), '');
  assert.match(
    withReview({ Q_Z: ASK }, { reasonCodes: ['Q_Y'] }),
    /"Q_Z" is not a reason code of this rule/
  );
  assert.match(withReview({ Q_X: { ...ASK, steps: [] } }), /steps must list 1 to 6 steps/);
  assert.match(withReview({ Q_X: { ...ASK, steps: Array(7).fill('a') } }), /1 to 6 steps/);
  assert.match(withReview({ Q_X: { ...ASK, passWhen: '' } }), /passWhen must be a non-empty/);
  assert.match(withReview({ Q_X: { ...ASK, failWhen: 1 } }), /failWhen must be a non-empty/);
  assert.match(withReview({ Q_X: ASK }, { i18n: {} }), /needs meta\.i18n\.titleKey/);
});

test('a pack rule whose codes come from a helper outside runInPage gives steps for them', () => {
  const pack = definePack({
    name: '@acme/helper-codes',
    version: '1.0.0',
    namespace: 'acme',
    core: '*',
    rules: [
      {
        id: 'acme-helper',
        meta: {
          title: 'Helper',
          i18n: { titleKey: 'acmeHelper_title', descriptionKey: 'acmeHelper_description' },
          reasonCodes: ['ACME_FROM_HELPER'],
          review: { ACME_FROM_HELPER: ASK }
        },
        // The code is built, as a helper would return it.
        runInPage(ctx) {
          const code = ['ACME', 'FROM', 'HELPER'].join('_');
          return {
            outcome: 'cantTell',
            occurrences: [{ __node: ctx.document.body, data: { details: { reasonCode: code } } }]
          };
        }
      }
    ]
  });
  assert.deepEqual(checkPack(pack), []);
  const dom = new JSDOM(PAGE, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const r = main.runDomRulesInPage(null, null, { packs: [pack] }, ['acme-helper']);
    assert.deepEqual(r.checksResults[0].occurrences[0].howToCheck, ASK);
  } finally {
    dom.window.close();
  }
});

test('the HTML report shows a pack rule’s own steps when given the packs', () => {
  const { renderHtmlReport } = require('../../src/report.js');
  const pack = acme();
  const runtime = require('../../src/pack.js').preparePacks([pack]).runtime;
  const raw = scan(runtime.runDomRulesInPage, { packs: [pack] });
  assert.equal(first(raw, 'acme-ask').howToCheck, undefined);
  const STEP = /<li>Look at the panel\.<\/li>/;
  assert.doesNotMatch(renderHtmlReport(raw), STEP);
  assert.match(renderHtmlReport(raw, { packs: [pack] }), STEP);
  // A variant's finding has its base rule's steps either way.
  assert.match(renderHtmlReport(raw), /<li>Find the text the report names/);
});
