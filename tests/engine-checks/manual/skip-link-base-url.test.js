'use strict';

// skip-link and bypass-blocks-present follow a link as the browser does:
// its href resolved against the document's base URL. Under <base href="/">,
// "#content" on /products/42 leads to /#content, another page, so it is no
// skip link; a full URL of the page with a fragment stays on the page, so it
// is one (round 9, R9-5).

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const URL_OF_PAGE = 'https://shop.example/products/42';
const nav = Array.from({ length: 12 }, (_, i) => `<a href="/n${i}">Nav ${i}</a>`).join(' ');
// No main landmark and no heading: the skip link is the page's only way
// past its navigation.
const page = (head, href) =>
  `<!doctype html><html lang="en"><head><title>b</title>${head}</head><body><header><a href="${href}">Skip to content</a><nav aria-label="Main">${nav}</nav></header><div id="content"><p>Body text here.</p></div></body></html>`;

function outcomes(html) {
  const r = runa11yCoreOnHtml(html, {
    url: URL_OF_PAGE,
    runOnly: ['skip-link', 'bypass-blocks-present']
  });
  const out = {};
  for (const c of r.checksResults) out[c.ruleId] = c.outcome;
  return out;
}

const CASES = [
  ['"#content" with no <base>', '', '#content', true],
  ['"#content" under <base href="/">', '<base href="/">', '#content', false],
  [
    '"#content" under a <base> on another site',
    '<base href="https://cdn.example/">',
    '#content',
    false
  ],
  [
    '"#content" under a <base> that is the page itself',
    `<base href="${URL_OF_PAGE}">`,
    '#content',
    true
  ],
  ['the full URL of the page with a fragment', '', `${URL_OF_PAGE}#content`, true],
  [
    'the full URL of the page under <base href="/">',
    '<base href="/">',
    `${URL_OF_PAGE}#content`,
    true
  ],
  ['a path to the page with a fragment', '', '/products/42#content', true],
  ['another page with the fragment', '', '/products/43#content', false]
];

for (const [description, head, href, samePage] of CASES) {
  test(`skip-link and bypass-blocks-present: ${description}`, () => {
    assert.deepEqual(
      outcomes(page(head, href)),
      samePage
        ? { 'skip-link': 'pass', 'bypass-blocks-present': 'pass' }
        : { 'skip-link': 'notApplicable', 'bypass-blocks-present': 'cantTell' }
    );
  });
}
