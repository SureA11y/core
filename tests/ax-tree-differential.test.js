'use strict';

// scripts/ax-tree-differential.js compares the engine's view of each element
// with Chromium's accessibility tree. The comparison itself needs no
// browser: these cover what counts as a disagreement, so a change to it
// can't quietly hide one or start reporting noise.

const test = require('node:test');
const assert = require('node:assert/strict');

const { compare, compareAll } = require('../scripts/ax-tree-differential.js');

const ALL = ['hidden', 'role', 'name'];

function engineEl(over) {
  return {
    i: 0,
    tag: 'button',
    eligible: true,
    reasons: [],
    rendered: true,
    role: 'button',
    roleSource: 'native',
    name: 'Save',
    html: '<button>Save</button>',
    ...over
  };
}

function chromeNode(over) {
  return { role: 'button', name: 'Save', ignored: false, ignoredReasons: [], ...over };
}

test('agreement reports nothing, whitespace aside', () => {
  const diffs = compare(
    [engineEl({ name: ' Save  now ' })],
    new Map([[0, chromeNode({ name: 'Save now' })]]),
    ALL
  );
  assert.deepEqual(diffs, []);
});

test('a name the engine and Chromium compute differently is reported', () => {
  const [d] = compare([engineEl({ name: 'CV' })], new Map([[0, chromeNode({ name: '' })]]), ALL);
  assert.equal(d.kind, 'name');
  assert.equal(d.signature, 'name (Chromium empty): button <button>');
  assert.equal(d.engine, 'CV');
});

test('an element Chromium leaves out of its tree is hidden only when it has no box', () => {
  const pruned = compare([engineEl({ tag: 'span', role: null })], new Map(), ALL);
  assert.deepEqual(pruned, [], 'a rendered element Chromium prunes is not a disagreement');
  const [d] = compare([engineEl({ rendered: false })], new Map(), ALL);
  assert.equal(d.kind, 'hidden');
  assert.match(d.signature, /Chromium absent, no box, engine exposed/);
});

test('a node Chromium ignores without a reason counts as hidden', () => {
  const diffs = compare(
    [engineEl({ eligible: false, reasons: ['ariaHidden'] })],
    new Map([[0, chromeNode({ ignored: true, ignoredReasons: [] })]]),
    ALL
  );
  assert.deepEqual(diffs, []);
});

test('a node Chromium ignores as uninteresting is not hidden', () => {
  const [d] = compare(
    [engineEl({ eligible: false, reasons: ['hiddenAttr'] })],
    new Map([[0, chromeNode({ ignored: true, ignoredReasons: ['uninteresting'] })]]),
    ALL
  );
  assert.equal(d.kind, 'hidden');
});

test('roles: Chromium names are mapped, known pairs and role-less elements are left alone', () => {
  const img = compare(
    [engineEl({ tag: 'img', role: 'img', name: 'Logo' })],
    new Map([[0, chromeNode({ role: 'image', name: 'Logo' })]]),
    ALL
  );
  assert.deepEqual(img, []);
  const generic = compare(
    [engineEl({ tag: 'div', role: null, name: '' })],
    new Map([[0, chromeNode({ role: 'generic', name: '' })]]),
    ALL
  );
  assert.deepEqual(generic, []);
  const [d] = compare(
    [engineEl({ tag: 'th', role: 'columnheader', name: 'North' })],
    new Map([[0, chromeNode({ role: 'rowheader', name: 'North' })]]),
    ALL
  );
  assert.equal(d.signature, 'role (native): Chromium rowheader, engine columnheader <th>');
});

test('--kinds narrows what is compared', () => {
  const diffs = compare(
    [engineEl({ name: 'CV', role: 'link' })],
    new Map([[0, chromeNode({ name: '' })]]),
    ['role']
  );
  assert.deepEqual(
    diffs.map((d) => d.kind),
    ['role']
  );
});

test('media and rows are not compared by name', () => {
  const diffs = compare(
    [
      engineEl({ i: 0, tag: 'video', role: 'application', name: '' }),
      engineEl({ i: 1, tag: 'tr', role: 'row', name: 'a b' })
    ],
    new Map([
      [0, chromeNode({ role: 'Video', name: 'Unable to play media.' })],
      [1, chromeNode({ role: 'row', name: '' })]
    ]),
    ['name']
  );
  assert.deepEqual(diffs, []);
});

test('known differences are set aside with their id, and left out of the leads', () => {
  const engine = [
    engineEl({ i: 0, tag: 'area', role: 'link', rendered: false }),
    engineEl({
      i: 1,
      tag: 'h1',
      role: 'heading',
      eligible: false,
      reasons: ['ariaHidden'],
      bodyAriaHidden: true
    }),
    engineEl({ i: 2, tag: 'table', role: 'table', name: 'Sales 2025', captionAriaLabel: true }),
    engineEl({ i: 3, tag: 'button', name: 'CV' })
  ];
  const chrome = new Map([
    [1, chromeNode({ role: 'heading' })],
    [2, chromeNode({ role: 'table', name: 'Sales' })],
    [3, chromeNode({ name: '' })]
  ]);
  const all = compareAll(engine, chrome, ALL);
  assert.deepEqual(
    all.map((d) => d.known),
    ['area-node', 'body-aria-hidden', 'caption-aria-label', null]
  );
  const leads = compare(engine, chrome, ALL);
  assert.deepEqual(
    leads.map((d) => d.tag),
    ['button']
  );
});

test('a table whose caption has no aria-label is still compared by name', () => {
  const [d] = compare(
    [engineEl({ tag: 'table', role: 'table', name: 'Sales 2025', captionAriaLabel: false })],
    new Map([[0, chromeNode({ role: 'table', name: 'Sales' })]]),
    ALL
  );
  assert.equal(d.kind, 'name');
});

test('known: an aria-placeholder-only custom textbox and an <input type="image"> with no usable alt', () => {
  const all = compareAll(
    [
      engineEl({
        i: 0,
        tag: 'div',
        role: 'textbox',
        name: '',
        html: '<div role="textbox" aria-placeholder="Add a date"></div>'
      }),
      engineEl({
        i: 1,
        tag: 'input',
        role: 'button',
        name: '',
        html: '<input type="image" alt="" src="x.png">'
      }),
      engineEl({
        i: 2,
        tag: 'input',
        role: 'button',
        name: '',
        html: '<input type="image" src="x.png">'
      })
    ],
    new Map([
      [0, chromeNode({ role: 'textbox', name: 'Add a date' })],
      [1, chromeNode({ role: 'button', name: 'Submit' })],
      [2, chromeNode({ role: 'button', name: 'Submit' })]
    ]),
    ALL
  );
  assert.deepEqual(
    all.map((d) => d.known),
    ['aria-placeholder-custom', 'input-image-default-name', 'input-image-default-name']
  );
});
