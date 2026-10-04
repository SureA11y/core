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
    // The set says loading while every face has loaded: what the faces say
    // is what counts.
    fonts: { status: 'loading', forEach: (fn) => [{ status: 'loaded' }].forEach(fn) }
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
    fonts: 'loaded'
  });
  const stillLoading = {
    ...doc,
    fonts: { forEach: (fn) => [{ status: 'loaded' }, { status: 'loading' }].forEach(fn) }
  };
  assert.equal(readRenderingEnvironment(win, stillLoading).fonts, 'loading');

  // An image still loading counts; one loaded lazily waits for the reader to
  // scroll, so it does not.
  const img = (complete, loading) => ({ complete, getAttribute: () => loading || null });
  const withImages = (imgs) => ({ ...doc, querySelectorAll: () => imgs });
  assert.equal(
    readRenderingEnvironment(win, withImages([img(true), img(false)])).images,
    'loading'
  );
  assert.equal(
    readRenderingEnvironment(win, withImages([img(true), img(false, 'lazy')])).images,
    'loaded'
  );
  assert.equal(readRenderingEnvironment(win, withImages([])).images, 'loaded');

  // What the page cannot tell is left out rather than guessed.
  const bare = { documentElement: doc.documentElement, createRange: doc.createRange };
  assert.deepEqual(readRenderingEnvironment({ innerWidth: 900, innerHeight: 700 }, bare), {
    layout: true,
    viewport: { width: 900, height: 700 }
  });
  assert.deepEqual(readRenderingEnvironment(null, doc), { layout: false });
});
