'use strict';

/**
 * helpers.isClipHidden: whether a clip leaves nothing of a box visible. It
 * backs the `clipped` visibility hint and the rules that look for visually
 * hidden content, so it has to be exact both ways: a clip that hides
 * everything is hidden, one that leaves part of the box is not.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createDomHelpers } = require('../../src/core/dom-helpers.js');

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const helpers = createDomHelpers({ window, document: window.document, root: window.document });
const hidden = (style) => helpers.isClipHidden(style);
const abs = (clip) => ({ position: 'absolute', clip });

test('an empty clip rect hides an absolutely positioned box', () => {
  for (const clip of [
    'rect(0px, 0px, 0px, 0px)',
    'rect(0 0 0 0)',
    'rect(0,0,0,0)',
    // WordPress's .screen-reader-text.
    'rect(1px, 1px, 1px, 1px)',
    'rect(5px, 2px, 9px, 4px)'
  ]) {
    assert.equal(hidden(abs(clip)), true, clip);
  }
  assert.equal(hidden({ position: 'fixed', clip: 'rect(0 0 0 0)' }), true);
});

test('a clip rect that leaves an area, or does not apply, hides nothing', () => {
  for (const clip of ['rect(0px, 100px, 50px, 0px)', 'rect(auto, auto, auto, auto)', 'auto', '']) {
    assert.equal(hidden(abs(clip)), false, clip);
  }
  // clip applies only to absolutely positioned boxes.
  for (const position of ['static', 'relative', 'sticky', '']) {
    assert.equal(hidden({ position, clip: 'rect(0 0 0 0)' }), false, position);
  }
});

test('a clip-path whose insets meet hides the box', () => {
  for (const clipPath of [
    'inset(50%)',
    'inset(100%)',
    'inset(60%)',
    'inset(50% 50%)',
    'inset(0 50% 0 50%)',
    'inset(50% 0)',
    'inset(50% round 4px)',
    // GitHub's .sr-only: zero insets with a unit.
    'inset(0px 100% 100% 0px)',
    'circle(0)',
    'circle(0px at 50% 50%)',
    'ellipse(0 0)'
  ]) {
    assert.equal(hidden({ position: 'static', clipPath }), true, clipPath);
  }
  // A declared value spelt as a property name, as css-hidden-focus reads them.
  assert.equal(hidden({ 'clip-path': 'inset(50%)' }), true);
});

test('a clip-path that leaves part of the box, or cannot be decided, hides nothing', () => {
  for (const clipPath of [
    'none',
    '',
    // Half the box stays visible.
    'inset(0 50% 0 0)',
    'inset(25%)',
    'inset(10px)',
    'circle(10px)',
    'polygon(0 0, 100% 0, 100% 100%)'
  ]) {
    assert.equal(hidden({ position: 'static', clipPath }), false, clipPath);
  }
  assert.equal(hidden(null), false);
});

test('the clipped visibility hint follows it', () => {
  const { window: w } = new JSDOM(`<!doctype html><html><body>
    <span id="wp" style="position:absolute;clip:rect(1px,1px,1px,1px)">a</span>
    <span id="part" style="position:absolute;clip:rect(0,100px,50px,0)">b</span>
    <span id="static" style="clip:rect(0,0,0,0)">c</span>
    <span id="half" style="clip-path:inset(0 50% 0 0)">d</span>
    <span id="inset" style="clip-path:inset(50%)">e</span>
  </body></html>`);
  const h = createDomHelpers({ window: w, document: w.document, root: w.document });
  const clipped = (id) =>
    h.getVisibilityHintsInfo(w.document.getElementById(id)).hints.includes('clipped');
  assert.deepEqual(['wp', 'part', 'static', 'half', 'inset'].map(clipped), [
    true,
    false,
    false,
    false,
    true
  ]);
});
