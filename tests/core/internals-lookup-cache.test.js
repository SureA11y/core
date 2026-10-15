'use strict';

// A custom element's internals are looked up once per scan and reused by
// every rule that asks about its name or states, and looked up again by the
// next scan, since the page may have changed in between (#239).

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

const COUNT = 40;

function page() {
  const items = Array.from(
    { length: COUNT },
    (_, i) => `<x-check role="checkbox" id="c${i}"></x-check>`
  );
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${items.join('')}</main></body></html>`
  );
  const w = dom.window;
  // Count how often the engine reads an element's internals: once per
  // element and scan, not once per rule that asks.
  let lookups = 0;
  w.customElements.define(
    'x-check',
    class extends w.HTMLElement {
      constructor() {
        super();
        this.attached = this.attachInternals();
        this.attached.ariaChecked = 'false';
      }
      get _internals() {
        lookups++;
        return this.attached;
      }
    }
  );
  // And how often it asks the registry for the element's definition.
  let definitions = 0;
  const get = w.customElements.get.bind(w.customElements);
  w.customElements.get = (name) => {
    if (name === 'x-check') definitions++;
    return get(name);
  };
  return {
    dom,
    definitions: () => definitions,
    lookups: () => lookups,
    reset: () => (lookups = 0)
  };
}

const RULES = ['binary-control-name-present', 'aria-required-attr', 'aria-allowed-attr'];

test('each element is looked up once per scan, however many rules ask', () => {
  const p = page();
  const result = runa11yCoreOnDom(p.dom, { runOnly: RULES, entryPointParity: false });
  // The names are unread (no aria-label on the internals), the state is read.
  assert.equal(result.checksResults.find((r) => r.ruleId === 'aria-required-attr').outcome, 'pass');
  assert.ok(p.lookups() <= COUNT, `${p.lookups()} lookups for ${COUNT} elements`);
  // The definition is asked for once per name, by the internals lookup and
  // by name computation alike.
  assert.equal(p.definitions(), 1);
});

test('the next scan looks the internals up again', () => {
  const p = page();
  const first = runa11yCoreOnDom(p.dom, { runOnly: ['binary-control-name-present'] });
  assert.equal(first.checksResults[0].outcome, 'fail');
  // Name every checkbox through its internals between the two scans.
  for (const el of p.dom.window.document.querySelectorAll('x-check')) {
    el.attached.ariaLabel = 'Subscribe';
  }
  const second = runa11yCoreOnDom(p.dom, { runOnly: ['binary-control-name-present'] });
  assert.equal(second.checksResults[0].outcome, 'pass');
});
