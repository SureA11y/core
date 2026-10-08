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
