'use strict';

/**
 * Invariants over every rule at once, from the fifth round's suggestions
 * (audits/2026-10-stress-test-5.md, section 3, on audit/register):
 *
 * - A page whose names and values are the keys of Object.prototype
 *   (__proto__, constructor, toString…) is scanned as any other: no rule
 *   errs, and nothing reaches Object.prototype. A table indexed by a page
 *   value ({}[role]) finds an inherited function there (RB5-4, FZ-1).
 * - Every finding's selector, read in the shadow root its
 *   shadowHostSelectors lead to, finds exactly the element reported (RB5-9),
 *   as FZ-5's fix makes it in the light DOM.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../src/testing.js');

const KEYS = [
  '__proto__',
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'prototype',
  '__defineGetter__'
];

function protoPage(key) {
  const a = `${key}`;
  return `<!doctype html><html lang="${a}"><head><title>${a}</title></head><body>
<main id="${a}" class="${a}">
  <h1 lang="${a}" dir="${a}">Heading</h1>
  <div role="${a}" aria-${a}="x" aria-label="${a}" tabindex="0">widget</div>
  <div role="${a} button" aria-pressed="${a}" aria-checked="${a}" aria-level="${a}">b</div>
  <span id="l-${a}">label</span>
  <input id="${a}" name="${a}" type="${a}" autocomplete="${a}" aria-labelledby="${a} l-${a}" aria-describedby="${a}" list="${a}" aria-controls="${a}" aria-owns="${a}">
  <label for="${a}">Field</label>
  <select aria-activedescendant="${a}" aria-haspopup="${a}" aria-current="${a}" aria-live="${a}" aria-relevant="${a}"><option value="${a}">${a}</option></select>
  <table summary="${a}"><tr><th scope="${a}" id="h-${a}" headers="${a}">H</th></tr><tr><td headers="h-${a} ${a}">1</td></tr></table>
  <ul role="${a}"><li role="${a}">i</li></ul>
  <a href="#${a}" accesskey="${a}" target="${a}" rel="${a}">link</a>
  <img src="a.png" alt="${a}" usemap="#${a}"><map name="${a}"><area href="/x" alt="${a}" shape="${a}"></map>
  <x-${a.replace(/_/g, 'u').toLowerCase()} role="${a}">custom</x-${a.replace(/_/g, 'u').toLowerCase()}>
  <svg role="${a}" aria-roledescription="${a}"><title>${a}</title></svg>
  <video src="v.mp4" controls><track kind="${a}" srclang="${a}" src="t.vtt"></video>
  <meta name="viewport" content="${a}=1">
  <iframe title="${a}" sandbox="${a}" allow="${a}"></iframe>
  <p style="${a}: 1px">text</p>
  <form autocomplete="${a}"><button type="${a}" formmethod="${a}">Go</button></form>
</main></body></html>`;
}

test('a page whose names and values are Object.prototype keys is scanned without errors', () => {
  const before = Object.getOwnPropertyNames(Object.prototype).sort();
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const key of KEYS) {
      const dom = createDom(protoPage(key));
      const result = runa11yCoreOnDom(dom, {});
      const errors = result.checksResults
        .filter((c) => c.error)
        .map((c) => `${c.ruleId}: ${c.error}`);
      assert.deepEqual(errors, [], key);
      dom.window.close();
    }
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype).sort(), before);
  assert.equal({}.polluted, undefined);
});

// Components as a page builds them: nested shadow roots, slots, repeated
// structures, elements every rule can find something on.
function shadowDom() {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Page</h1>' +
      '<x-card id="c1"><span slot="title">One</span></x-card>' +
      '<x-card class="c"><span slot="title">Two</span></x-card>' +
      '<div><x-card><span slot="title">Three</span></x-card></div>' +
      '<x-shell></x-shell></main></body></html>'
  );
  const doc = dom.window.document;
  const card =
    '<section><h3><slot name="title"></slot></h3><img src="p.png"><p><img src="q.png"></p>' +
    '<button></button><a href="/buy"></a><input type="text"><div role="button">x</div>' +
    '<ul><li>a</li><div>b</div></ul><table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table></section>';
  for (const host of doc.querySelectorAll('x-card')) {
    host.attachShadow({ mode: 'open' }).innerHTML = card;
  }
  const shell = doc.querySelector('x-shell').attachShadow({ mode: 'open' });
  shell.innerHTML = '<nav><x-card></x-card><x-card></x-card></nav><div id="inner"></div>';
  for (const host of shell.querySelectorAll('x-card')) {
    host.attachShadow({ mode: 'open' }).innerHTML = card;
  }
  shell.getElementById('inner').attachShadow({ mode: 'open' }).innerHTML =
    '<img src="r.png"><button></button><span id="dup">a</span><span id="dup">b</span>';
  return dom;
}

test('every finding’s selector finds exactly its element, in the shadow root it names', () => {
  const dom = shadowDom();
  const result = runa11yCoreOnDom(dom, {});
  const doc = dom.window.document;
  let inShadow = 0;
  const problems = [];
  for (const check of result.checksResults) {
    for (const o of check.occurrences || []) {
      if (typeof o.selector !== 'string' || !o.selector) continue;
      let root = doc;
      let lost = false;
      for (const hostSelector of o.shadowHostSelectors || []) {
        const hosts = root.querySelectorAll(hostSelector);
        if (hosts.length !== 1 || !hosts[0].shadowRoot) {
          problems.push(`${check.ruleId}: host "${hostSelector}" finds ${hosts.length}`);
          lost = true;
          break;
        }
        root = hosts[0].shadowRoot;
      }
      if (lost) continue;
      if (root !== doc) inShadow++;
      const found = root.querySelectorAll(o.selector);
      if (found.length !== 1) {
        problems.push(`${check.ruleId}: "${o.selector}" finds ${found.length}`);
        continue;
      }
      // The snippet is the element's start tag, as the engine wrote it.
      const tag = found[0].localName;
      if (typeof o.html === 'string' && o.html && !o.html.startsWith(`<${tag}`)) {
        problems.push(
          `${check.ruleId}: "${o.selector}" finds a <${tag}>, the finding is ${o.html.slice(0, 40)}`
        );
      }
    }
  }
  assert.deepEqual(problems, []);
  assert.ok(inShadow > 20, `${inShadow} findings in shadow roots`);
});
