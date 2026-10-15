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
    forcedColors: 'none',
    fonts: 'loaded'
  });
  // Forced colors (Windows high contrast, or an emulated forced-colors:
  // active) are recorded, since the contrast rules then measure partly the
  // browser's colors (#227).
  const forced = { ...win, matchMedia: (q) => ({ matches: q === '(forced-colors: active)' }) };
  assert.equal(readRenderingEnvironment(forced, doc).forcedColors, 'active');
  assert.equal(readRenderingEnvironment(forced, doc).colorScheme, 'light');
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

// #227: without a layout nothing says whether forced colors were on, so
// engine.environment leaves the field out, and no contrast occurrence
// carries the forced-colors note.
test('a run with no layout records no forced colors, and its contrast occurrences no note', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      '<p style="color:#999;background:#fff">Opening hours</p></main></body></html>'
  );
  assert.equal('forcedColors' in result.engine.environment, false);
  const contrast = result.checksResults.filter((c) => /^contrast-/.test(c.ruleId));
  assert.equal(contrast.find((c) => c.ruleId === 'contrast-minimum').outcome, 'fail');
  for (const check of contrast) {
    for (const o of check.occurrences) {
      assert.equal(o.data.details.forcedColors, undefined, check.ruleId);
      assert.notEqual(o.i18n && o.i18n.hintKey, 'contrast_hint_forcedColors', check.ruleId);
    }
  }
});
