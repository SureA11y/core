'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

// Direct-require convention (see tests/core/aria-helpers.test.js): exercises
// the real module's name/description/eligibility computation functions
// directly, rather than only transitively through rule-level fixtures --
// these are the shared "kernel" primitives nearly every rule goes through,
// so a gap here is a gap behind dozens of rules at once.
function helpersFor(html, opts) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  const helpers = createDomHelpers(Object.assign({ window, document, root: document }, opts));
  return { helpers, document, window };
}

function byId(document, id) {
  return document.getElementById(id);
}

// ===== getContentNameInfo: image-descendant alt/title/aria/label precedence =====
//
// Regression coverage for a bug found while extending this suite: image-like
// descendants (img/area/input[type=image]) resolved their contribution via
// the general getAccessibleNameInfo, which falls back to title/native-label
// unconditionally -- so title silently outranked a real, present alt
// attribute, and a deliberately empty alt="" (a "this is decorative, name
// nothing" marker) was overridden by title too. Fixed to use getAriaNameInfo
// (aria only) ahead of alt, with alt's own present/absent distinction
// (getTextAlternativeInfo) deciding whether title is a legitimate fallback.

test('getContentNameInfo: a real alt attribute outranks an unrelated title on the same image', () => {
  const { helpers, document } = helpersFor(
    '<button id="b"><img src="x.png" alt="Real Alt Text" title="Some tooltip"></button>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Real Alt Text');
  assert.ok(info.flags.includes('descendant-alt-used'));
});

test('getContentNameInfo: alt="" (explicit decorative marker) contributes nothing, even with a title present', () => {
  const { helpers, document } = helpersFor(
    '<a id="link" href="/home"><img src="logo.png" alt="" title="Acme homepage"></a>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'link'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.value, '');
});

test('getContentNameInfo: title is used as a fallback only when alt is structurally absent (not merely empty)', () => {
  const { helpers, document } = helpersFor(
    '<button id="b"><img src="x.png" title="Missing-alt tooltip"></button>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Missing-alt tooltip');
  assert.ok(info.flags.includes('descendant-name-used:image-title-fallback'));
});

test('getContentNameInfo: aria-label on an image descendant outranks both alt and title', () => {
  const { helpers, document } = helpersFor(
    '<button id="b"><img src="x.png" alt="Alt text" title="Tooltip" aria-label="Close"></button>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.value, 'Close');
  assert.ok(info.flags.includes('descendant-name-used:image-aria'));
});

test('getContentNameInfo: aria-labelledby on an image descendant resolves through the referenced element, even when the image itself has alt=""', () => {
  const { helpers, document } = helpersFor(
    '<a id="link" href="/p"><img src="logo.png" alt="" aria-labelledby="ttl"></a><h2 id="ttl">Product Title</h2>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'link'), { helpers });
  assert.equal(info.value, 'Product Title');
});

test('getContentNameInfo: a native <label> still names a labelable input[type=image] descendant ahead of its alt', () => {
  const { helpers, document } = helpersFor(
    '<label for="imgin">Search</label><span id="wrap"><input type="image" id="imgin" src="s.png" alt="Search alt"></span>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Search');
  assert.ok(info.flags.includes('descendant-name-used:image-label'));
});

test('getContentNameInfo: input[type=image] with no label falls back to its alt, not a bare title', () => {
  const { helpers, document } = helpersFor(
    '<span id="wrap"><input type="image" id="imgin" src="s.png" alt="Search alt" title="Tooltip"></span>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Search alt');
  assert.ok(info.flags.includes('descendant-alt-used'));
});

test('getContentNameInfo: neither alt, title, nor aria present on an image descendant contributes nothing (not an error)', () => {
  const { helpers, document } = helpersFor('<button id="b"><img src="x.png"></button>');
  const info = helpers.getContentNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.value, '');
});

test('getContentNameInfo: a descendant with its own accessible name (e.g. aria-label) is used instead of walking into its children', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><span aria-label="Icon label"><span>hidden-from-name text</span></span></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Icon label');
});

test('getContentNameInfo: plain text nodes across multiple children are joined with a single space', () => {
  const { helpers, document } = helpersFor('<div id="wrap">Hello <strong>World</strong>  !</div>');
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Hello World !');
});

test('getContentNameInfo: a non-element node (e.g. document) returns present:false rather than throwing', () => {
  const { helpers, document } = helpersFor('<div id="wrap"></div>');
  const info = helpers.getContentNameInfo(document, { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'unsupported');
});

// ===== getAccessibleNameInfo =====

test('getAccessibleNameInfo: aria-labelledby wins over aria-label when both are present', () => {
  const { helpers, document } = helpersFor(
    '<button id="b" aria-label="Label text" aria-labelledby="ref">X</button><span id="ref">Labelledby text</span>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.value, 'Labelledby text');
  assert.equal(info.mechanism, 'aria-labelledby');
});

test('getAccessibleNameInfo: falls back to aria-label when aria-labelledby points at nothing', () => {
  const { helpers, document } = helpersFor(
    '<button id="b" aria-label="Label text" aria-labelledby="missing-id">X</button>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'b'), { helpers });
  assert.equal(info.value, 'Label text');
  assert.equal(info.mechanism, 'aria-label');
});

test('getAccessibleNameInfo: native <label for> associates by id even without wrapping', () => {
  const { helpers, document } = helpersFor('<label for="x">Full Name</label><input id="x">');
  const info = helpers.getAccessibleNameInfo(byId(document, 'x'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Full Name');
  assert.equal(info.mechanism, 'label');
});

test('getAccessibleNameInfo: an empty wrapping <label> does not produce a name and falls through to title', () => {
  const { helpers, document } = helpersFor('<label><input id="x" title="Fallback title"></label>');
  const info = helpers.getAccessibleNameInfo(byId(document, 'x'), { helpers });
  assert.equal(info.value, 'Fallback title');
  assert.equal(info.mechanism, 'title');
  assert.ok(info.flags.includes('title-used'));
});

test('getAccessibleNameInfo: title is the last-resort mechanism when nothing else is present', () => {
  const { helpers, document } = helpersFor('<div id="d" title="Tooltip only"></div>');
  const info = helpers.getAccessibleNameInfo(byId(document, 'd'), { helpers });
  assert.equal(info.value, 'Tooltip only');
  assert.equal(info.mechanism, 'title');
});

test('getAccessibleNameInfo: a non-element returns present:false with mechanism "unsupported"', () => {
  const { helpers } = helpersFor('<div></div>');
  const info = helpers.getAccessibleNameInfo(null, { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'unsupported');
});

test('getAccessibleNameInfo: no name source at all returns present:false, mechanism "none"', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  const info = helpers.getAccessibleNameInfo(byId(document, 'd'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'none');
});

// ===== getAccessibleDescriptionInfo =====

test('getAccessibleDescriptionInfo: resolves aria-describedby through the referenced element', () => {
  const { helpers, document } = helpersFor(
    '<input id="x" aria-describedby="hint"><span id="hint">Extra help text</span>'
  );
  const info = helpers.getAccessibleDescriptionInfo(byId(document, 'x'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Extra help text');
  assert.equal(info.mechanism, 'aria-describedby');
});

test('getAccessibleDescriptionInfo: title is not used as a description unless opts.allowTitle is set', () => {
  const { helpers, document } = helpersFor('<input id="x" title="Tooltip">');
  const withoutOpt = helpers.getAccessibleDescriptionInfo(byId(document, 'x'), { helpers });
  assert.equal(withoutOpt.present, false);

  const withOpt = helpers.getAccessibleDescriptionInfo(byId(document, 'x'), { helpers }, { allowTitle: true });
  assert.equal(withOpt.present, true);
  assert.equal(withOpt.value, 'Tooltip');
  assert.equal(withOpt.mechanism, 'title');
});

test('getAccessibleDescriptionInfo: aria-describedby pointing only at empty/missing ids flags "empty" and yields no description', () => {
  const { helpers, document } = helpersFor('<input id="x" aria-describedby="nope">');
  const info = helpers.getAccessibleDescriptionInfo(byId(document, 'x'), { helpers });
  assert.equal(info.present, false);
  assert.ok(info.flags.includes('empty'));
});

// ===== getTextAlternativeInfo =====

test('getTextAlternativeInfo: img with a non-empty alt is present with mechanism "alt"', () => {
  const { helpers, document } = helpersFor('<img id="i" src="x.png" alt="A photo">');
  const info = helpers.getTextAlternativeInfo(byId(document, 'i'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'A photo');
  assert.equal(info.mechanism, 'alt');
  assert.equal(info.requiredMechanism, 'alt');
});

test('getTextAlternativeInfo: img with alt="" is present (structurally) but with an empty value, flagged alt-empty', () => {
  const { helpers, document } = helpersFor('<img id="i" src="x.png" alt="">');
  const info = helpers.getTextAlternativeInfo(byId(document, 'i'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, '');
  assert.ok(info.flags.includes('alt-empty'));
});

test('getTextAlternativeInfo: img with no alt attribute at all is NOT present, but still surfaces a fallback accessible-name value and flags alt-missing', () => {
  const { helpers, document } = helpersFor('<img id="i" src="x.png" title="Fallback">');
  const info = helpers.getTextAlternativeInfo(byId(document, 'i'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.value, 'Fallback');
  assert.equal(info.mechanism, 'accessible-name');
  assert.ok(info.flags.includes('alt-missing'));
  assert.ok(info.flags.includes('name-present-but-alt-missing'));
});

test('getTextAlternativeInfo: canvas with meaningful fallback text content is present with mechanism "canvas-fallback"', () => {
  const { helpers, document } = helpersFor('<canvas id="c">Your browser does not support canvas</canvas>');
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.mechanism, 'canvas-fallback');
});

test('getTextAlternativeInfo: canvas with an aria-label falls-alternative and no text fallback still resolves via aria', () => {
  const { helpers, document } = helpersFor('<canvas id="c" aria-label="Chart of sales"></canvas>');
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Chart of sales');
  assert.equal(info.requiredMechanism, 'fallback-or-name');
});

test('getTextAlternativeInfo: canvas with neither fallback content nor a name is not present', () => {
  const { helpers, document } = helpersFor('<canvas id="c"></canvas>');
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.requiredMechanism, 'fallback-or-name');
});

test('getTextAlternativeInfo: an unsupported element (e.g. a plain div) reports mechanism "unsupported"', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  const info = helpers.getTextAlternativeInfo(byId(document, 'd'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'unsupported');
  assert.ok(info.flags.includes('unsupported-element'));
});

// ===== resolveIdRefs / getTextFromIdRefs =====

test('resolveIdRefs: an empty/whitespace-only idref string returns an empty result flagged "empty"', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.resolveIdRefs('   ', {}), { refs: [], missing: [], flags: ['empty']});
});

test('resolveIdRefs: resolves multiple space-separated ids, tracking missing ones separately from found ones', () => {
  const { helpers, document } = helpersFor('<span id="a">A</span><span id="c">C</span>');
  const r = helpers.resolveIdRefs('a b c', {});
  assert.equal(r.refs.length, 2);
  assert.deepEqual(r.missing, ['b']);
  assert.ok(r.flags.includes('idref-missing'));
});

test('resolveIdRefs: a repeated id token dedupes to one ref and is flagged "deduped"', () => {
  const { helpers } = helpersFor('<span id="a">A</span>');
  const r = helpers.resolveIdRefs('a a', {});
  assert.equal(r.refs.length, 1);
  assert.ok(r.flags.includes('deduped'));
});

test('resolveIdRefs: opts.maxRefs truncates deterministically and flags "truncated"', () => {
  const { helpers } = helpersFor('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
  const r = helpers.resolveIdRefs('a b c', {}, { maxRefs: 2 });
  assert.equal(r.refs.length, 2);
  assert.ok(r.flags.includes('truncated'));
});

test('getTextFromIdRefs: joins each referenced element\'s own computed text alternative with a space', () => {
  const { helpers } = helpersFor(
    '<span id="a">Hello</span><span id="b"><img src="x.png" alt="World"></span>'
  );
  const t = helpers.getTextFromIdRefs('a b', {});
  assert.equal(t.text, 'Hello World');
  assert.equal(t.refsCount, 2);
});

test('getTextFromIdRefs: a referenced element that resolves to empty text is flagged "resolved-empty-text"', () => {
  const { helpers } = helpersFor('<span id="a"></span>');
  const t = helpers.getTextFromIdRefs('a', {});
  assert.equal(t.text, '');
  assert.ok(t.flags.includes('resolved-empty-text'));
});

// ===== getRoleInfo =====

test('getRoleInfo: an explicit role="" attribute always wins over any implicit mapping', () => {
  const { helpers, document } = helpersFor('<button id="b" role="link">X</button>');
  const info = helpers.getRoleInfo(byId(document, 'b'), {});
  assert.equal(info.role, 'link');
  assert.equal(info.source, 'explicit');
});

test('getRoleInfo: role="presentation" and role="none" are both flagged "presentation"', () => {
  const { helpers, document } = helpersFor('<div id="a" role="presentation"></div><div id="b" role="none"></div>');
  assert.ok(helpers.getRoleInfo(byId(document, 'a'), {}).flags.includes('presentation'));
  assert.ok(helpers.getRoleInfo(byId(document, 'b'), {}).flags.includes('presentation'));
});

test('getRoleInfo: a role attribute with multiple space-separated tokens is flagged "multiple-roles"', () => {
  const { helpers, document } = helpersFor('<div id="a" role="button link"></div>');
  const info = helpers.getRoleInfo(byId(document, 'a'), {});
  assert.ok(info.flags.includes('multiple-roles'));
});

test('getRoleInfo: implicit role mapping covers common native controls', () => {
  const { helpers, document } = helpersFor(
    '<a id="a" href="/x">L</a><button id="btn"></button><input id="cb" type="checkbox">' +
    '<input id="rd" type="radio"><input id="rng" type="range">' +
    '<select id="sel"></select><textarea id="ta"></textarea>'
  );
  assert.equal(helpers.getRoleInfo(byId(document, 'a'), {}).role, 'link');
  assert.equal(helpers.getRoleInfo(byId(document, 'btn'), {}).role, 'button');
  assert.equal(helpers.getRoleInfo(byId(document, 'cb'), {}).role, 'checkbox');
  assert.equal(helpers.getRoleInfo(byId(document, 'rd'), {}).role, 'radio');
  assert.equal(helpers.getRoleInfo(byId(document, 'rng'), {}).role, 'slider');
  assert.equal(helpers.getRoleInfo(byId(document, 'sel'), {}).role, 'combobox');
  assert.equal(helpers.getRoleInfo(byId(document, 'ta'), {}).role, 'textbox');
});

test('getRoleInfo: an <a> with no href has no implicit link role', () => {
  const { helpers, document } = helpersFor('<a id="a">Not a link</a>');
  const info = helpers.getRoleInfo(byId(document, 'a'), {});
  assert.equal(info.role, '');
  assert.equal(info.source, 'none');
});

test('getRoleInfo: opts.disallowImplicit suppresses the native-tag fallback', () => {
  const { helpers, document } = helpersFor('<button id="b"></button>');
  const info = helpers.getRoleInfo(byId(document, 'b'), {}, { disallowImplicit: true });
  assert.equal(info.role, '');
  assert.equal(info.source, 'none');
});

// ===== getFocusableInfo =====

test('getFocusableInfo: a plain button is focusable and tabbable via native mechanism', () => {
  const { helpers, document } = helpersFor('<button id="b"></button>');
  const info = helpers.getFocusableInfo(byId(document, 'b'), {});
  assert.equal(info.focusable, true);
  assert.equal(info.tabbable, true);
  assert.equal(info.mechanism, 'native');
});

test('getFocusableInfo: tabindex="-1" is focusable but not tabbable', () => {
  const { helpers, document } = helpersFor('<div id="d" tabindex="-1"></div>');
  const info = helpers.getFocusableInfo(byId(document, 'd'), {});
  assert.equal(info.focusable, true);
  assert.equal(info.tabbable, false);
  assert.equal(info.mechanism, 'tabindex');
  assert.ok(info.flags.includes('tabindex-negative'));
});

test('getFocusableInfo: a disabled button is neither focusable nor tabbable', () => {
  const { helpers, document } = helpersFor('<button id="b" disabled></button>');
  const info = helpers.getFocusableInfo(byId(document, 'b'), {});
  assert.equal(info.focusable, false);
  assert.equal(info.tabbable, false);
  assert.equal(info.mechanism, 'disabled');
});

test('getFocusableInfo: an element under an inert ancestor is not focusable', () => {
  const { helpers, document } = helpersFor('<div inert><button id="b"></button></div>');
  const info = helpers.getFocusableInfo(byId(document, 'b'), {});
  assert.equal(info.focusable, false);
  assert.ok(info.flags.includes('inert'));
});

test('getFocusableInfo: a non-element input returns present:false-shaped result rather than throwing', () => {
  const { helpers } = helpersFor('<div></div>');
  const info = helpers.getFocusableInfo(null, {});
  assert.equal(info.focusable, false);
  assert.ok(info.flags.includes('notElement'));
});

// ===== getEligibilityInfo =====

test('getEligibilityInfo: targetSet "dom" reflects structural/CSS visibility', () => {
  const { helpers, document } = helpersFor('<div id="d" style="display:none"></div>');
  const info = helpers.getEligibilityInfo(byId(document, 'd'), {}, { targetSet: 'dom' });
  assert.equal(info.eligible, false);
  assert.equal(info.targetSet, 'dom');
  assert.ok(info.reasons.includes('displayNone'));
});

test('getEligibilityInfo: targetSet "acc" reflects accessibility-tree eligibility (e.g. aria-hidden)', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-hidden="true"></div>');
  const info = helpers.getEligibilityInfo(byId(document, 'd'), {}, { targetSet: 'acc' });
  assert.equal(info.eligible, false);
  assert.equal(info.targetSet, 'acc');
  assert.equal(info.accEligible, false);
});

test('getEligibilityInfo: default targetSet (no opts) is "dom"', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  const info = helpers.getEligibilityInfo(byId(document, 'd'), {});
  assert.equal(info.targetSet, 'dom');
  assert.equal(info.eligible, true);
});
