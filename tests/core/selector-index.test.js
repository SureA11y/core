'use strict';

// Under jsdom, the color of text in a link is worked out from the page's
// rules (jsdom ranks the browser's link color differently), and each link
// was matched against every rule that sets a color: on a page with 2,000
// such rules, link-in-text-block cost links x rules. The rules are now
// indexed by what their selector needs of the element and its ancestors,
// so a link is matched only against those that could apply. Counted rather
// than timed, so the test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

const RULES = ['link-in-text-block', 'contrast-minimum'];

const page = (links, rules) =>
  '<!doctype html><html lang="en"><head><title>t</title><style>' +
  'a { text-decoration: none; color: #3366cc } body { color: #202122 }' +
  Array.from(
    { length: rules },
    (_, i) => `.color${i} a, #id${i}, div.text${i} { color: #900 }`
  ).join('') +
  '.text3 a { color: #202122 }' +
  '</style></head><body><main>' +
  Array.from(
    { length: links },
    (_, i) => `<p class="text${i}">Text before <a href="/${i}">link ${i}</a> after.</p>`
  ).join('') +
  '</main></body></html>';

function scan(links, rules) {
  const dom = new JSDOM(page(links, rules));
  const proto = dom.window.Element.prototype;
  const matches = proto.matches;
  let ruleMatches = 0;
  proto.matches = function (selector) {
    if (/^(\.color\d+ a|#id\d+|div\.text\d+)$/.test(String(selector))) ruleMatches++;
    return matches.call(this, selector);
  };
  const result = runa11yCoreOnDom(dom, { runOnly: RULES, entryPointParity: false });
  return { ruleMatches, result };
}

test('a link is matched only against the color rules that could apply to it', () => {
  const few = scan(10, 200);
  const many = scan(40, 200);
  // Linear in the links: each link meets a few rules, not all 600 parts.
  assert.ok(
    many.ruleMatches <= few.ruleMatches * 4 + 50,
    `${few.ruleMatches} then ${many.ruleMatches}`
  );
  assert.ok(many.ruleMatches < 40 * 50, `${many.ruleMatches} matches`);
  // The rules that do apply still decide: the link in .text3, colored like
  // the text around it, fails; the others are told apart at 3:1 or more.
  const litb = many.result.checksResults.find((r) => r.ruleId === 'link-in-text-block');
  const failing = litb.occurrences.filter(
    (o) => o.data.details.reasonCode === 'COLOR_ONLY_DIFFERENTIATION'
  );
  assert.deepEqual(
    failing.map((o) => o.html.match(/href="([^"]+)"/)[1]),
    ['/3']
  );
});

// selectorIndex may only leave out a selector that can't match: every
// element a selector matches has it among its candidates, in any mode.
test('selectorIndex never leaves out a selector that matches', () => {
  const { createDomHelpers } = require('../../src/core/dom-helpers.js');
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const tags = ['a', 'p', 'span', 'div', 'A', 'svg', 'rect', 'foreignObject', 'em'];
  const names = ['a', 'b', 'A', 'x-y', 'é', 'Foo'];
  const compound = () => {
    let s = rnd() < 0.6 ? pick(tags) : rnd() < 0.5 ? '*' : '';
    for (let i = Math.floor(rnd() * 3); i > 0; i--) {
      s += pick([
        '.' + pick(names),
        '#' + pick(names),
        ':hover',
        ':first-child',
        ':not(.' + pick(names) + ')',
        ':is(.' + pick(names) + ', p)',
        '[class~=' + pick(names) + ']',
        '.\\61',
        '[lang|=en]',
        ':where(#' + pick(names) + ')'
      ]);
    }
    return s || pick(tags);
  };
  const selector = () => {
    let s = compound();
    for (let i = Math.floor(rnd() * 3); i > 0; i--)
      s = compound() + pick([' ', ' > ', ' + ', ' ~ ']) + s;
    return s;
  };
  const element = (depth) => {
    const tag = pick(['p', 'span', 'div', 'a', 'em', 'svg']);
    if (tag === 'svg')
      return `<svg class="${pick(names)}"><rect id="${pick(names)}"/><foreignObject/></svg>`;
    const attrs =
      (rnd() < 0.6 ? ` class="${pick(names)} ${rnd() < 0.3 ? pick(names) : ''}"` : '') +
      (rnd() < 0.3 ? ` id="${pick(names)}"` : '');
    let inner = 'x';
    for (let i = depth > 3 ? 0 : Math.floor(rnd() * 3); i > 0; i--) inner += element(depth + 1);
    return `<${tag}${attrs}>${inner}</${tag}>`;
  };
  let checked = 0;
  for (let page = 0; page < 40; page++) {
    const body = Array.from({ length: 4 }, () => element(0)).join('');
    const html = (page % 4 ? '<!doctype html>' : '') + `<html><body>${body}</body></html>`;
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const helpers = createDomHelpers({ window, document, root: document });
    const parts = Array.from({ length: 30 }, selector);
    const index = helpers.selectorIndex(parts);
    for (const el of document.querySelectorAll('*')) {
      const candidates = index.candidates(el);
      assert.deepEqual(
        candidates,
        [...candidates].sort((a, b) => a - b)
      );
      parts.forEach((part, i) => {
        let matched;
        try {
          matched = el.matches(part);
        } catch {
          matched = true; // a selector that doesn't parse is always a candidate
        }
        if (matched) {
          checked++;
          assert.ok(candidates.includes(i), `${part} matches <${el.localName}> in page ${page}`);
        }
      });
    }
  }
  assert.ok(checked > 500, `${checked} matches checked`);
});
