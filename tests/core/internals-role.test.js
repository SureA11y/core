'use strict';

// A custom element can give itself a role through ElementInternals
// (this.attachInternals().role = 'button') with no role attribute. HTML makes
// it the element's default role, so the rules that apply to a role whatever
// gave it check such an element as they check a native one, and the rules
// ACT scopes to the role attribute leave it out (#228).

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

// A page of <x-el> elements, each giving itself `role` (and, when given,
// `label` as its name) through its internals. The element has an open
// shadow root, so the scan reads its content as empty rather than closed.
function scan(body, ruleId, setup) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
  );
  const w = dom.window;
  w.customElements.define(
    'x-el',
    class extends w.HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._internals = this.attachInternals();
        const role = this.getAttribute('data-role');
        if (role) this._internals.role = role;
        const label = this.getAttribute('data-label');
        if (label) this._internals.ariaLabel = label;
      }
    }
  );
  if (setup) setup(w);
  const result = runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false });
  return result.checksResults.find((r) => r.ruleId === ruleId);
}

const NAME_RULES = [
  ['button-name-present', 'button'],
  ['binary-control-name-present', 'checkbox'],
  ['binary-control-name-present', 'switch'],
  ['combobox-name-present', 'combobox'],
  ['dialog-name-present', 'dialog'],
  ['link-name-present', 'link'],
  ['listbox-name-present', 'listbox'],
  ['menuitem-name-present', 'menuitemcheckbox'],
  ['meter-name-present', 'meter'],
  ['option-name-present', 'option'],
  ['progressbar-name-present', 'progressbar'],
  ['searchbox-name-present', 'searchbox'],
  ['slider-name-present', 'slider'],
  ['spinbutton-name-present', 'spinbutton'],
  ['tab-name-present', 'tab'],
  ['textbox-name-present', 'textbox'],
  ['tooltip-name-present', 'tooltip'],
  ['treeitem-name-present', 'treeitem'],
  ['aria-role-name-present', 'tree'],
  ['role-img-text-alternative-present', 'img'],
  ['empty-heading', 'heading']
];

for (const [ruleId, role] of NAME_RULES) {
  test(`${ruleId}: a custom element whose internals make it a ${role} needs a name`, () => {
    const unnamed = scan(`<x-el data-role="${role}"></x-el>`, ruleId);
    assert.equal(unnamed.outcome, 'fail', JSON.stringify(unnamed.outcome));
    const named = scan(`<x-el data-role="${role}" data-label="Settings"></x-el>`, ruleId);
    assert.equal(named.outcome, 'pass');
  });
}

test('landmark-role-name-present asks about a region its internals leave unnamed', () => {
  // The rule asks, as it does for role="region": an unnamed region is no
  // landmark, which may or may not matter.
  const unnamed = scan('<x-el data-role="region"></x-el>', 'landmark-role-name-present');
  assert.equal(unnamed.outcome, 'cantTell');
  const named = scan(
    '<x-el data-role="region" data-label="News"></x-el>',
    'landmark-role-name-present'
  );
  assert.equal(named.outcome, 'pass');
});

test('the role attribute overrides the role internals give', () => {
  // role="presentation" leaves no button to name.
  const r = scan('<x-el role="presentation" data-role="button"></x-el>', 'button-name-present');
  assert.equal(r.outcome, 'notApplicable');
  // A role attribute naming no known role leaves the internals role.
  const s = scan('<x-el role="foo" data-role="button"></x-el>', 'button-name-present');
  assert.equal(s.outcome, 'fail');
});

test('a role internals give that names no known role is no role', () => {
  const r = scan('<x-el data-role="bogus"></x-el>', 'button-name-present');
  assert.equal(r.outcome, 'notApplicable');
});

test('without readable internals, a custom element has no role, as before', () => {
  // The component keeps its internals in a private field: no hook, no role.
  const r = scan('<y-el></y-el>', 'button-name-present', (w) => {
    w.customElements.define(
      'y-el',
      class extends w.HTMLElement {
        #internals = this.attachInternals();
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.#internals.role = 'button';
        }
      }
    );
  });
  assert.equal(r.outcome, 'notApplicable');
});

test('the rules ACT scopes to the role attribute leave the internals role out', () => {
  // aria-required-attr applies to an explicit checkbox; this one is a
  // checkbox by default, as an <input type="checkbox"> is.
  const r = scan('<x-el data-role="checkbox" data-label="Subscribe"></x-el>', 'aria-required-attr');
  assert.equal(r.outcome, 'notApplicable');
});

// A page of <x-plain> elements: no shadow root, so their light content is
// their content, each taking `data-role` and `data-level` through its
// internals.
function scanPlain(body, ruleId, { inMain = true } = {}) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${inMain ? `<main>${body}</main>` : body}</body></html>`
  );
  const w = dom.window;
  w.customElements.define(
    'x-plain',
    class extends w.HTMLElement {
      constructor() {
        super();
        this._internals = this.attachInternals();
        const role = this.getAttribute('data-role');
        if (role) this._internals.role = role;
        const level = this.getAttribute('data-level');
        if (level) this._internals.ariaLevel = level;
      }
    }
  );
  const result = runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false });
  return result.checksResults.find((r) => r.ruleId === ruleId);
}

test('aria-allowed-attr judges a custom element by the role its internals give', () => {
  const checkbox = '<x-plain data-role="checkbox" aria-checked="true">Subscribe</x-plain>';
  assert.equal(scanPlain(checkbox, 'aria-allowed-attr').outcome, 'pass');
  const button = '<x-plain data-role="button" aria-checked="true">Subscribe</x-plain>';
  assert.equal(scanPlain(button, 'aria-allowed-attr').outcome, 'fail');
});

test('aria-prohibited-attr does not read a custom element with a role as roleless', () => {
  const named = '<x-plain data-role="button" aria-label="Save"></x-plain>';
  assert.equal(scanPlain(named, 'aria-prohibited-attr').outcome, 'notApplicable');
  // With no role at all, the label is still prohibited, as before.
  assert.equal(
    scanPlain('<x-plain aria-label="Save"></x-plain>', 'aria-prohibited-attr').outcome,
    'fail'
  );
});

test('a button by its internals has presentational children, and no nested control', () => {
  const body = '<x-plain data-role="button" tabindex="0"><a href="#more">More</a></x-plain>';
  assert.equal(scanPlain(body, 'presentational-children-focusable-absent').outcome, 'fail');
  assert.equal(scanPlain(body, 'nested-interactive-controls-absent').outcome, 'fail');
});

test('a role from internals is the context and the owned element of ARIA structure rules', () => {
  const parent = '<x-plain data-role="listbox"><div role="option">Red</div></x-plain>';
  assert.equal(scanPlain(parent, 'aria-required-parent').outcome, 'pass');
  const noParent = '<x-plain><div role="option">Red</div></x-plain>';
  assert.equal(scanPlain(noParent, 'aria-required-parent').outcome, 'fail');
  const children = '<div role="list"><x-plain data-role="listitem">Red</x-plain></div>';
  assert.equal(scanPlain(children, 'aria-required-children').outcome, 'pass');
});

test('label-in-name checks a control by its internals', () => {
  const body = '<x-plain data-role="button" aria-label="Go">Submit</x-plain>';
  assert.equal(scanPlain(body, 'label-in-name').outcome, 'fail');
});

test('landmarks, headings and links by their internals count in the manual rules', () => {
  const main = '<x-plain data-role="main"><h1>News</h1></x-plain>';
  assert.equal(scanPlain(main, 'landmark-one-main', { inMain: false }).outcome, 'pass');
  assert.equal(scanPlain(main, 'bypass-blocks-present', { inMain: false }).outcome, 'pass');
  const h1 = '<x-plain data-role="heading" data-level="1">News</x-plain>';
  assert.equal(scanPlain(h1, 'page-has-heading-one').outcome, 'pass');
  const skipped = '<h1>News</h1><x-plain data-role="heading" data-level="4">Sport</x-plain>';
  assert.equal(scanPlain(skipped, 'heading-order').outcome, 'cantTell');
  const link = '<x-plain data-role="link" tabindex="0">Click here</x-plain>';
  assert.equal(scanPlain(link, 'link-name-quality').outcome, 'cantTell');
});

test('elements found by their internals come in tree order', () => {
  const r = scan(
    '<button id="a"></button><x-el id="b" data-role="button"></x-el><button id="c"></button>',
    'button-name-present'
  );
  assert.deepEqual(
    r.occurrences.map((o) => o.selector),
    ['#a', '#b', '#c']
  );
});

test("one rule's own excludeSelectors don't hide an element from the others", () => {
  // aria-prohibited-attr finds these elements first, with #a excluded for it
  // alone; button-name-present, run after it, still finds #a.
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><x-el id="a" data-role="button"></x-el><x-el id="b" data-role="button"></x-el></main></body></html>'
  );
  const w = dom.window;
  w.customElements.define(
    'x-el',
    class extends w.HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._internals = this.attachInternals();
        this._internals.role = this.getAttribute('data-role');
      }
    }
  );
  const result = runa11yCoreOnDom(dom, {
    runOnly: ['aria-prohibited-attr', 'button-name-present'],
    entryPointParity: false,
    engineOptions: { rules: { 'aria-prohibited-attr': { excludeSelectors: ['#a'] } } }
  });
  const r = result.checksResults.find((x) => x.ruleId === 'button-name-present');
  assert.deepEqual(
    r.occurrences.map((o) => o.selector),
    ['#a', '#b']
  );
});
