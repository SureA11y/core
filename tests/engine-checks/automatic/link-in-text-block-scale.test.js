'use strict';

// link-in-text-block read every rule of every style sheet again for each
// link it judged: once for the :hover and :focus rules that might give the
// link a cue, and once for the rules that might underline it. 4,000 links
// under 2,000 rules took 13.5 s in Chromium. The sheets are now read once
// per run. Counted rather than timed, so the test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../../src/testing.js');

const RULE_ID = 'link-in-text-block';

const page = (links, rules) =>
  '<!doctype html><html lang="en"><head><title>t</title><style>' +
  'a { text-decoration: none; color: #3366cc } body { color: #202122 }' +
  Array.from(
    { length: rules },
    (_, i) => `.hover${i} a:hover, .focus${i}:focus { color: red }`
  ).join('') +
  '</style></head><body><main>' +
  Array.from(
    { length: links },
    (_, i) => `<p>Text before <a href="/${i}">link ${i}</a> after.</p>`
  ).join('') +
  '</main></body></html>';

// Runs the rule on a page, counting the reads of a style sheet's rules and
// the matches() calls against the page's own :hover and :focus selectors.
function countReads(links, rules) {
  const dom = new JSDOM(page(links, rules));
  const { window } = dom;
  let sheetReads = 0;
  let stateMatches = 0;
  const desc = Object.getOwnPropertyDescriptor(window.CSSStyleSheet.prototype, 'cssRules');
  Object.defineProperty(window.CSSStyleSheet.prototype, 'cssRules', {
    ...desc,
    get() {
      sheetReads++;
      return desc.get.call(this);
    }
  });
  const matches = window.Element.prototype.matches;
  window.Element.prototype.matches = function (selector) {
    // With the state taken out, as the rule matches them.
    if (/^\.(hover\d+ a|focus\d+)$/.test(String(selector))) stateMatches++;
    return matches.call(this, selector);
  };
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  return { sheetReads, stateMatches, rule };
}

test(`${RULE_ID} reads the style sheets once per run, however many links it judges`, () => {
  const few = countReads(10, 50);
  const many = countReads(80, 50);
  // Each link leans on color alone, so each was looked at for a hover cue.
  assert.equal(many.rule.occurrences.length, 80);
  assert.ok(
    many.rule.occurrences.every((o) => o.data.details.reasonCode === 'LINK_COLOR_CONTRAST_ONLY')
  );
  assert.equal(many.sheetReads, few.sheetReads);
  // A selector giving no cue is matched once, to learn that it parses.
  assert.equal(many.stateMatches, few.stateMatches);
  assert.ok(many.stateMatches <= 100, `${many.stateMatches} matches`);
});

test(`${RULE_ID} still finds a hover and a focus cue from the sheets read once`, () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title><style>' +
    'a { text-decoration: none; color: #3366cc } body { color: #202122 }' +
    '.cue a:hover { text-decoration: underline } .cue a:focus { outline: 2px solid }' +
    '</style></head><body><main>' +
    '<p class="cue">Text <a href="/1" id="cued">cued</a> after.</p>' +
    '<p>Text <a href="/2" id="plain">plain</a> after.</p>' +
    '<p class="cue">Text <a href="/3" id="cued2">cued too</a> after.</p>' +
    '</main></body></html>';
  const result = runa11yCoreOnDom(new JSDOM(html), { runOnly: [RULE_ID], entryPointParity: false });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  const leanOf = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).lean.toward;
  assert.equal(leanOf('cued'), 'pass');
  assert.equal(leanOf('cued2'), 'pass');
  assert.equal(leanOf('plain'), 'fail');
});

// jsdom runs out of stack reading the computed style of an element a few
// thousand levels deep: the read itself throws. Stood in for here by a
// style that throws on every read, as building such a page takes minutes.
test(`${RULE_ID} asks about a link whose style throws, and still judges the others`, () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title><style>' +
    'a { text-decoration: none; color: #3366cc } body { color: #202122 }' +
    '</style></head><body><main>' +
    '<p class="deep">Text <a href="/1" id="deep">deep</a> after.</p>' +
    '<p>Text <a href="/2" id="ok">fine</a> after.</p>' +
    '</main></body></html>';
  const dom = new JSDOM(html);
  const { window } = dom;
  const getComputedStyle = window.getComputedStyle.bind(window);
  const throwing = new Proxy(
    {},
    {
      get() {
        throw new RangeError('Maximum call stack size exceeded');
      }
    }
  );
  window.getComputedStyle = (el, pseudo) =>
    el && el.closest && el.closest('.deep') ? throwing : getComputedStyle(el, pseudo);
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], entryPointParity: false });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.equal(rule.error, undefined);
  const codeOf = (id) =>
    rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).data.details.reasonCode;
  assert.equal(codeOf('deep'), 'ENGINE_EXCEPTION');
  assert.equal(codeOf('ok'), 'LINK_COLOR_CONTRAST_ONLY');
});
