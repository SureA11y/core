'use strict';

/**
 * In jsdom, `input.labels` and `label.control` walk the whole document on
 * every call, so one rule calling them per control made a scan of a
 * form-heavy page take seconds (400 switches with labels: 8.4s, against
 * 0.8s without). The engine resolves label association through
 * helpers.getAssociatedLabelElements and getLabelControl instead; this
 * guards against a rule or helper going back to the native getters.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');

test('a full scan, opt-in rules included, never reads the native .labels or .control getters', () => {
  let body = '';
  for (let i = 0; i < 5; i += 1) {
    body +=
      `<label for="s${i}">Setting ${i}</label><input id="s${i}" type="checkbox" role="switch">` +
      `<label role="button">Wrap ${i} <input type="radio" name="r"></label>` +
      `<label for="t${i}" style="color:#888">Name ${i}</label><input id="t${i}" type="text" disabled>` +
      `<button><input type="image" alt="Go" id="i${i}"></button><label for="i${i}">Image ${i}</label>`;
  }
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
  );
  const counts = { labels: 0, control: 0 };
  const w = dom.window;
  for (const [proto, prop] of [
    [w.HTMLInputElement.prototype, 'labels'],
    [w.HTMLSelectElement.prototype, 'labels'],
    [w.HTMLTextAreaElement.prototype, 'labels'],
    [w.HTMLButtonElement.prototype, 'labels'],
    [w.HTMLLabelElement.prototype, 'control']
  ]) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    assert.ok(desc && desc.get, `jsdom defines ${prop} as a getter`);
    Object.defineProperty(proto, prop, {
      configurable: true,
      get() {
        counts[prop] += 1;
        return desc.get.call(this);
      }
    });
  }

  // optInRules: 'all' runs a standard's own rules too (a profile's), which a
  // default scan leaves out.
  const result = runa11yCoreOnDom(dom, { engineOptions: { optInRules: 'all' } });
  assert.ok(result.checksResults.length > 100, 'every rule ran');
  assert.deepEqual(counts, { labels: 0, control: 0 });
});
