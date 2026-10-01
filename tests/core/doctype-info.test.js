'use strict';

/**
 * helpers.getDoctypeInfo(): the document's doctype, classified by HTML
 * version, for rules whose verdict depends on it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

const DOCTYPES = [
  ['<!doctype html>', 'html5'],
  ['<!DOCTYPE HTML>', 'html5'],
  ['<!DOCTYPE html SYSTEM "about:legacy-compat">', 'html5'],
  [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    'html4'
  ],
  [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
    'html4'
  ],
  ['<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">', 'html4'],
  ['<!DOCTYPE html PUBLIC "-//IETF//DTD HTML 2.0//EN">', 'html4'],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/html401-rdfa11-1.dtd">',
    'html4'
  ],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    'xhtml10'
  ],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    'xhtml10'
  ],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    'xhtml11'
  ],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.1//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd">',
    'xhtml11'
  ],
  [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 plus MathML 2.0 plus SVG 1.1//EN" "http://www.w3.org/2002/04/xhtml-math-svg/xhtml-math-svg.dtd">',
    'xhtml11'
  ],
  ['<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN">', 'xhtml11'],
  ['<!DOCTYPE html PUBLIC "-//FOO//DTD X//EN">', 'other'],
  ['<!DOCTYPE html SYSTEM "http://example.test/x.dtd">', 'other'],
  [
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    'other'
  ],
  ['', 'none']
];

function infoOf(doctype) {
  const dom = new JSDOM(`${doctype}<html><head><title>t</title></head><body></body></html>`);
  const { window } = dom;
  return createDomHelpers({
    window,
    document: window.document,
    root: window.document
  }).getDoctypeInfo();
}

test('getDoctypeInfo classifies each doctype', () => {
  for (const [doctype, kind] of DOCTYPES) {
    assert.equal(infoOf(doctype).kind, kind, doctype || '(none)');
  }
});

test('getDoctypeInfo returns the doctype values as declared', () => {
  const info = infoOf(
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
  );
  assert.deepEqual(info, {
    kind: 'xhtml11',
    name: 'html',
    publicId: '-//W3C//DTD XHTML 1.1//EN',
    systemId: 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'
  });
  assert.deepEqual(infoOf(''), { kind: 'none', name: '', publicId: '', systemId: '' });
});
