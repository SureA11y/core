'use strict';

// buildSelector checks a selector step by step, at constant cost, instead
// of matching the whole chain, which made the selector engine count each
// step's siblings again. Each selector must still name exactly its element.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

// Reports each element inside #box whose selector does not name it alone.
function wrongSelectors(body) {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="box">${body}</div></main></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['acme-selectors'],
    engineOptions: {
      customRules: [
        {
          id: 'acme-selectors',
          meta: { tags: ['best-practice'] },
          runInPage: (ctx) => {
            const box = ctx.document.getElementById('box');
            const occurrences = [];
            let count = 0;
            for (const el of box.querySelectorAll('*')) {
              count += 1;
              const sel = ctx.helpers.buildSelector(el);
              const found = ctx.document.querySelectorAll(sel);
              if (found.length !== 1 || found[0] !== el) occurrences.push({ summary: sel });
            }
            return { outcome: occurrences.length ? 'fail' : 'pass', occurrences, data: { count } };
          }
        }
      ]
    }
  });
  const check = result.checksResults[0];
  return { wrong: check.occurrences.map((o) => o.summary), count: check.data.count };
}

test('selectors name exactly their element among wide sibling lists', () => {
  const { wrong, count } = wrongSelectors(
    '<img src="x.png"><span></span>'.repeat(60) +
      '<ul>' +
      '<li>a</li>'.repeat(20) +
      '</ul><svg><g></g><g></g><g><g></g></g></svg>'
  );
  assert.equal(count, 120 + 1 + 20 + 5);
  assert.deepEqual(wrong, []);
});

// A selector is resolved against the whole document, so an id, test id, name
// or aria-label shared with a hidden, excluded or out-of-scope element is no
// anchor: "#a" found the hidden copy of a menu, not the reported element.
test("an anchor shared with an element the scan leaves out doesn't name the reported one", () => {
  const selectorOf = (body, options = {}) => {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'], ...options });
    const [occurrence] = result.checksResults[0].occurrences;
    const dom = new (require('jsdom').JSDOM)(html);
    const found = dom.window.document.querySelectorAll(occurrence.selector);
    return {
      selector: occurrence.selector,
      found: found.length,
      tag: found[0] && found[0].localName
    };
  };
  const cases = [
    ['<main><p id="a" hidden>x</p><img id="a" src="a.png"></main>', {}],
    [
      '<main><span class="ad" id="a">x</span><img id="a" src="a.png"></main>',
      { excludeSelectors: ['.ad'] }
    ],
    ['<p id="a">x</p><main><img id="a" src="a.png"></main>', { contextSelector: 'main' }],
    [
      '<main><p data-testid="t" style="display:none">x</p><img data-testid="t" src="a.png"></main>',
      {}
    ],
    [
      '<main><div hidden><img name="n" src="b.png" alt="b"></div><img name="n" src="a.png"></main>',
      {}
    ]
  ];
  for (const [body, options] of cases) {
    const { selector, found, tag } = selectorOf(body, options);
    assert.equal(found, 1, `${selector} for ${body}`);
    assert.equal(tag, 'img', `${selector} for ${body}`);
  }
  // A unique id is still the anchor.
  assert.equal(selectorOf('<main><img id="only" src="a.png"></main>').selector, '#only');
});
