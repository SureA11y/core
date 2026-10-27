'use strict';

/**
 * jsdom 26, which Jest's jsdom environment (jest-environment-jsdom 30) ships,
 * leaves computed values it doesn't resolve as they are: an element with no
 * opacity set computes it as "" rather than "1", and unstyled text computes
 * its color as the keyword "canvastext" rather than rgb(0, 0, 0). Read
 * literally, "" made every text an ANCESTOR_OPACITY question (opacity 0),
 * and "canvastext" a FOREGROUND_UNPARSABLE one. jsdom 29 resolves both, so
 * this window gives its computed styles jsdom 26's way. jsdom 26 also gives
 * a link no color of its own (it takes its parent's, where a browser draws
 * it blue), a button "buttontext" on "buttonface", a text field's color its
 * sheet's "initial", and no text a -webkit-text-fill-color.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('./helpers/runDomRulesOnHtml.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1>' +
  '<p>Plain text</p><p style="color:#999">Grey text</p><p style="opacity:0.3">Faded</p>' +
  '</main></body></html>';

// computed styles as jsdom 26 gives them
function asJsdom26(dom) {
  const { window } = dom;
  const getComputedStyle = window.getComputedStyle.bind(window);
  const as26 = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    const name = !pseudo && el && el.localName;
    return new Proxy(cs, {
      get(target, prop) {
        const value = Reflect.get(target, prop, target);
        if (prop === 'opacity' && value === '1') return '';
        if (prop === 'webkitTextFillColor' || prop === '-webkit-text-fill-color') return '';
        if (prop === 'color' && name === 'a' && el.hasAttribute('href') && el.parentElement)
          return as26(el.parentElement).color;
        if (prop === 'color' && value === 'rgb(0, 0, 0)') {
          if (name === 'button') return 'buttontext';
          if (name === 'input' || name === 'textarea') return 'initial';
          return 'canvastext';
        }
        if (prop === 'backgroundColor' && name === 'button' && value === 'rgba(0, 0, 0, 0)')
          return 'buttonface';
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  };
  window.getComputedStyle = as26;
  return dom;
}

function scan(dom) {
  const result = runa11yCoreOnDom(dom, {
    runOnly: ['contrast-minimum', 'contrast-computable'],
    entryPointParity: false
  });
  const of = (id) => result.checksResults.find((c) => c.ruleId === id);
  return {
    computable: of('contrast-computable'),
    failing: of('contrast-minimum').occurrences.map((o) => o.selector)
  };
}

test('an opacity and a text color jsdom 26 leaves unresolved are read as their initial values', () => {
  const dom = asJsdom26(createDom(PAGE));
  const p = dom.window.document.querySelector('p');
  assert.equal(dom.window.getComputedStyle(p).opacity, '');
  assert.equal(dom.window.getComputedStyle(p).color, 'canvastext');

  const old = scan(dom);
  const now = scan(createDom(PAGE));
  // No question about the plain text's opacity or color...
  assert.equal(
    old.computable.outcome,
    'pass',
    JSON.stringify(old.computable.occurrences.map((o) => o.data.details))
  );
  // ...and the same findings as where jsdom resolves them.
  assert.deepEqual(old.failing, now.failing);
  assert.deepEqual(old.failing, [
    'html > body > main > p:nth-of-type(2)',
    'html > body > main > p:nth-of-type(3)'
  ]);
});

// A link on a dark paragraph that sets no color of its own is drawn blue
// by a browser, and fails; a button and a text field are drawn in their
// system colors.
const CONTROLS =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1>' +
  '<p style="background:#000;color:#fff">Read <a href="#more">more about it</a> here</p>' +
  '<form><label>Name <input value="Ada"></label><textarea>Notes</textarea>' +
  '<button>Send it now</button></form></main></body></html>';

test('a link, a button and a text field jsdom 26 leaves uncoloured are read as a browser draws them', () => {
  const dom = asJsdom26(createDom(CONTROLS));
  const doc = dom.window.document;
  assert.equal(dom.window.getComputedStyle(doc.querySelector('a')).color, 'rgb(255, 255, 255)');
  assert.equal(
    dom.window.getComputedStyle(doc.querySelector('button')).backgroundColor,
    'buttonface'
  );
  assert.equal(dom.window.getComputedStyle(doc.querySelector('input')).color, 'initial');

  const old = scan(dom);
  const now = scan(createDom(CONTROLS));
  assert.equal(
    old.computable.outcome,
    'pass',
    JSON.stringify(old.computable.occurrences.map((o) => o.data.details))
  );
  assert.deepEqual(old.failing, now.failing);
  assert.deepEqual(old.failing, ['html > body > main > p > a']);
});
