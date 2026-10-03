'use strict';

/**
 * What the rules that look for visually hidden content do with each form of
 * clip, so a rule that stops using helpers.isClipHidden, or a change to it,
 * shows up as a changed outcome. tests/core/is-clip-hidden.test.js covers the
 * helper itself.
 *
 * Hidden: the rect(1px, 1px, 1px, 1px) of WordPress's .screen-reader-text
 * and of GitHub's and Wikipedia's skip links, which the old test missed, on
 * the element or on a wrapper. Not hidden: a rect that leaves part of the box
 * visible, and a clip on a box that is not absolutely positioned, where clip
 * does nothing; the old test counted both as hidden. jsdom reads only the
 * comma form of rect().
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml');

// A wrapper hidden the way WordPress's .screen-reader-text hides it.
const clippedWrapper = (inner) =>
  `<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px)">${inner}</span>`;
const VISIBLE = {
  'a rect that leaves part of the box': 'position:absolute;clip:rect(0,300px,50px,0)',
  'clip on a box that is not positioned': 'clip:rect(0,0,0,0)'
};

function outcomeOf(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}
const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff">${body}</body></html>`;

test('contrast-minimum leaves out text clipped to nothing, and only that', () => {
  // #999 on white is 2.85:1, under 4.5:1.
  const LOW = 'color:#999999;background:#ffffff;font-size:16px';
  const fails = (body) =>
    outcomeOf(page(body), 'contrast-minimum').occurrences.some((o) => /id="t"/.test(o.html));

  assert.equal(fails(`<p id="t" style="${LOW}">Skip to content</p>`), true, 'control');
  assert.equal(
    fails(clippedWrapper(`<a id="t" href="#m" style="${LOW}">Skip to content</a>`)),
    false,
    'inside a wrapper clipped with rect(1px, 1px, 1px, 1px)'
  );
  assert.equal(
    fails(
      `<a id="t" href="#m" style="${LOW};position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px)">Skip to content</a>`
    ),
    false,
    'clipped with rect(1px, 1px, 1px, 1px) itself'
  );
  for (const [label, clip] of Object.entries(VISIBLE)) {
    assert.equal(fails(`<p id="t" style="${LOW};${clip}">Skip to content</p>`), true, label);
  }
});

test('css-hidden-focus asks about a control clipped to nothing, and only that', () => {
  const flagged = (style) => {
    const r = outcomeOf(page(`<button id="b" style="${style}">Menu</button>`), 'css-hidden-focus');
    return r.occurrences.find((o) => /id="b"/.test(o.html)) || null;
  };
  const hidden = flagged(
    'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px)'
  );
  assert.ok(hidden, 'rect(1px, 1px, 1px, 1px) hides it');
  assert.ok(hidden.summary.includes('It is clipped to nothing.'), hidden.summary);
  for (const [label, clip] of Object.entries(VISIBLE)) {
    assert.equal(flagged(clip), null, label);
  }
});

test('aria-hidden-focus says a focusable it reports is clipped only when it is', () => {
  const hints = (style) => {
    const r = outcomeOf(
      page(
        `<div aria-hidden="true"><a id="a" href="#m" style="${style}">Link</a></div><main id="m">x</main>`
      ),
      'aria-hidden-focus'
    );
    assert.equal(r.outcome, 'fail', style);
    return JSON.stringify(r.occurrences.map((o) => o.data.details));
  };
  assert.match(
    hints('position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px)'),
    /"clipped"/
  );
  for (const [label, clip] of Object.entries(VISIBLE)) {
    assert.doesNotMatch(hints(clip), /"clipped"/, label);
  }
});
