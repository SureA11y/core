'use strict';

/**
 * engine.environment without a layout. The browser side (viewport, colour
 * scheme, fonts) is tested in Chromium, in
 * engine-checks/automatic/text-spacing-content-loss-chromium.test.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml');
const { readRenderingEnvironment } = require('../src/core/dom-runner');

test('a run with no layout says so, and nothing else about the rendering', () => {
  const result = runa11yCoreOnHtml('<!doctype html><html lang="en"><body><p>Hi</p></body></html>');
  // jsdom reports a 1024x768 window, but nothing was laid out in it.
  assert.deepEqual(result.engine.environment, { layout: false });
});

test('the conditions are read from the page, field by field', () => {
  const doc = {
    documentElement: { getClientRects: () => [{}] },
    createRange: () => ({}),
    fonts: { status: 'loading' }
  };
  const win = {
    innerWidth: 900,
    innerHeight: 700,
    devicePixelRatio: 1.5,
    matchMedia: (q) => ({ matches: q === '(prefers-color-scheme: dark)' })
  };
  assert.deepEqual(readRenderingEnvironment(win, doc), {
    layout: true,
    viewport: { width: 900, height: 700 },
    devicePixelRatio: 1.5,
    colorScheme: 'dark',
    fonts: 'loading'
  });

  // What the page cannot tell is left out rather than guessed.
  const bare = { documentElement: doc.documentElement, createRange: doc.createRange };
  assert.deepEqual(readRenderingEnvironment({ innerWidth: 900, innerHeight: 700 }, bare), {
    layout: true,
    viewport: { width: 900, height: 700 }
  });
  assert.deepEqual(readRenderingEnvironment(null, doc), { layout: false });
});
