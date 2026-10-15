'use strict';

// The quality rules keep their phrase lists per language in plain objects,
// looked up by the page's own lang. A lang that names an inherited property
// ("constructor", "__proto__") found Object's members there: four rules
// stopped with "byLang[lang].has is not a function", and the alt-text rules
// lost their placeholder and redundant-prefix signals without a word. Such a
// lang is not a language tag (html-lang-attr-present and valid-lang fail it),
// so the rules read it as they read any language they have no list for.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

const RULES = [
  'form-control-label-quality',
  'heading-quality',
  'link-name-quality',
  'page-title-patterns',
  'img-alt-quality',
  'area-alt-quality',
  'input-image-alt-quality'
];

const page = (htmlLang, elementLang = '') =>
  `<!doctype html><html lang="${htmlLang}"><head><title>Cats and dogs</title></head><body><main>` +
  `<h1${elementLang ? ` lang="${elementLang}"` : ''}>Overview of cats</h1>` +
  '<label for="i">Your name</label><input id="i">' +
  `<a href="/x"${elementLang ? ` lang="${elementLang}"` : ''}>Cat food guide</a>` +
  '<img src="a.png" alt="image"><img src="b.png" alt="Image of a cat">' +
  '<map name="m"><area href="/a" alt="image" shape="rect" coords="0,0,1,1"></map><img src="m.png" alt="Map" usemap="#m">' +
  '<form><input type="image" src="go.png" alt="image"></form>' +
  '</main></body></html>';

function summarize(html) {
  const result = runa11yCoreOnHtml(html, { runOnly: RULES, entryPointParity: false });
  return result.checksResults.map((c) => ({
    ruleId: c.ruleId,
    outcome: c.outcome,
    error: c.error || null,
    occurrences: c.occurrences.map((o) => [o.selector, o.summary])
  }));
}

for (const lang of ['constructor', '__proto__']) {
  test(`lang="${lang}" on the page is read as a language with no phrase list`, () => {
    const got = summarize(page(lang));
    for (const c of got) assert.equal(c.error, null, `${c.ruleId}: ${JSON.stringify(c.error)}`);
    assert.deepEqual(got, summarize(page('xx')));
  });

  test(`lang="${lang}" on an element is read as a language with no phrase list`, () => {
    const got = summarize(page('en', lang));
    for (const c of got) assert.equal(c.error, null, `${c.ruleId}: ${JSON.stringify(c.error)}`);
    assert.deepEqual(got, summarize(page('en', 'xx')));
  });
}
