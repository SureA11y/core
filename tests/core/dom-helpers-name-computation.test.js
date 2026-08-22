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
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true
  });
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
// attribute, and an intentionally empty alt="" (a "this is decorative, name
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

// ===== getContentNameInfo: NON-image descendant title vs. its own content =====
//
// Companion to the image-descendant block above, applying the same precedence
// to every other descendant. The generic branch resolved a descendant's
// contribution via the general getAccessibleNameInfo, whose last-resort `title`
// fallback then short-circuited recursion into that descendant's own text -- so
// a tooltip replaced the visible text of anything named from its content.
// accname orders name-from-content ahead of the title fallback.

test("getContentNameInfo: a link descendant's text content outranks its own title", () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" title="Some tooltip">Real Link Text</a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Real Link Text');
  assert.ok(info.flags.includes('descendant-title-superseded-by-content'));
});

test('getContentNameInfo: a non-link descendant (span) also has its content outrank its title', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><span title="Some tooltip">Real Span Text</span></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Real Span Text');
});

test('getContentNameInfo: a descendant title IS used when that descendant has no content', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" title="Tooltip only"></a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Tooltip only');
  assert.ok(info.flags.includes('descendant-name-used:title-fallback'));
});

test('getContentNameInfo: a descendant whose content is only whitespace falls back to its title', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" title="Tooltip only">   </a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Tooltip only');
  assert.ok(info.flags.includes('descendant-name-used:title-fallback'));
});

test('getContentNameInfo: aria-label on a non-image descendant still outranks its content and title', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" aria-label="Aria Name" title="Tooltip">Content Text</a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Aria Name');
  assert.ok(info.flags.includes('descendant-name-used:aria-label'));
});

test('getContentNameInfo: two labels differing only in text (shared title) produce DISTINCT names', () => {
  // Same title on both label targets, different visible text -- collapsing
  // these to one name is what produces a phantom landmark-unique collision.
  const { helpers, document } = helpersFor(
    '<div id="lA"><a href="/x" title="SHARED">Alpha Navigation</a></div>' +
      '<div id="lB"><a href="/y" title="SHARED">Beta Navigation</a></div>'
  );
  const a = helpers.getContentNameInfo(byId(document, 'lA'), { helpers });
  const b = helpers.getContentNameInfo(byId(document, 'lB'), { helpers });
  assert.equal(a.value, 'Alpha Navigation');
  assert.equal(b.value, 'Beta Navigation');
  assert.notEqual(a.value, b.value);
});

// A whitespace-only aria-label is treated as absent by accname, so computation
// falls through to content -- and, with the title precedence above, past the
// title too.

test('getContentNameInfo: a whitespace-only aria-label on a descendant is skipped in favour of its content', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" aria-label=" " title="Tooltip">Text Content</a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Text Content');
  assert.ok(info.flags.includes('descendant-title-superseded-by-content'));
});

test('getContentNameInfo: whitespace-only aria-label with no content falls through to the title', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><a href="/x" aria-label=" " title="Tooltip"></a></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.value, 'Tooltip');
  assert.ok(info.flags.includes('descendant-name-used:title-fallback'));
});

test('getContentNameInfo: a deeper descendant title still loses to its own nested content', () => {
  const { helpers, document } = helpersFor(
    '<div id="wrap"><span title="Outer tooltip"><em>Nested Real Text</em></span></div>'
  );
  const info = helpers.getContentNameInfo(byId(document, 'wrap'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Nested Real Text');
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

// Regression coverage for a cycle found while extending this suite with
// the computeIdRefTargetTextAlternative native-label fix above: a label
// whose content contains a descendant aria-labelledby'd back to the very
// control it labels (self-contradictory markup, but not invalid) used to
// resolve that descendant by re-entering the SAME label's own text via a
// brand-new getTextFromIdRefs cycle guard that had no idea the control's
// name was already mid-computation -- doubling every part of the label's
// text ("Custom Custom ignored text label label" instead of "Custom
// ignored text label"). Fixed by seeding getAccessibleNameInfo's own
// .labels lookup with a cycle guard pre-populated with the element itself.
test("getAccessibleNameInfo: a label containing a descendant aria-labelledby'd back to the control it labels does not double the label's text", () => {
  const { helpers, document } = helpersFor(
    '<label id="lbl">Custom <span aria-labelledby="x">ignored text</span> label<input id="x"></label>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'x'), { helpers });
  assert.equal(info.value, 'Custom ignored text label');
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

  const withOpt = helpers.getAccessibleDescriptionInfo(
    byId(document, 'x'),
    { helpers },
    { allowTitle: true }
  );
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
  const { helpers, document } = helpersFor(
    '<canvas id="c">Your browser does not support canvas</canvas>'
  );
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

// Regression coverage for two bugs found while extending this suite in
// computeIdRefTargetTextAlternative (the function that resolves what an
// aria-labelledby/aria-describedby TARGET itself contributes -- re-applying
// name computation to that target, not just reading its raw textContent):
//
// 1) It checked the target's own aria-label BEFORE its own aria-labelledby,
//    backwards from the accname spec (2A labelledby, then 2B label) and from
//    this same file's getAriaNameInfo, which gets the order right. A target
//    with both attributes (aria-label stale/decorative, aria-labelledby
//    pointing to the real, current name) resolved to the wrong, stale text.
// 2) It never consulted a native <label> association at all, so a target
//    that is itself a labeled form control (e.g. an <input> named via
//    <label for="...">, with no aria-label/aria-labelledby of its own)
//    resolved to empty text instead of the label -- unlike
//    getAccessibleNameInfo, whose own label-before-value/content priority
//    this function otherwise exists to mirror for a referenced target.
test("getTextFromIdRefs: a referenced target's own aria-labelledby outranks its own aria-label", () => {
  const { helpers } = helpersFor(
    '<span id="c">Right</span><div id="b" aria-label="Wrong" aria-labelledby="c">content</div>'
  );
  const t = helpers.getTextFromIdRefs('b', {});
  assert.equal(t.text, 'Right');
});

test('getTextFromIdRefs: a referenced target with no aria-label/aria-labelledby resolves via its own native <label>', () => {
  const { helpers } = helpersFor(
    '<label for="cb">Accept terms</label><input type="checkbox" id="cb">'
  );
  const t = helpers.getTextFromIdRefs('cb', {});
  assert.equal(t.text, 'Accept terms');
});

test('resolveIdRefs: an empty/whitespace-only idref string returns an empty result flagged "empty"', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.resolveIdRefs('   ', {}), { refs: [], missing: [], flags: ['empty'] });
});

test('resolveIdRefs: resolves multiple space-separated ids, tracking missing ones separately from found ones', () => {
  const { helpers } = helpersFor('<span id="a">A</span><span id="c">C</span>');
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

test("getTextFromIdRefs: joins each referenced element's own computed text alternative with a space", () => {
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
  const { helpers, document } = helpersFor(
    '<div id="a" role="presentation"></div><div id="b" role="none"></div>'
  );
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

// ===== getLandmarkNameInfo =====
// (aria-label -> aria-labelledby -> title, no content fallback -- see this
// function's own header comment for why landmark roles never derive a name
// from their rendered content.)

test('getLandmarkNameInfo: a non-element returns present:false with mechanism "unsupported"', () => {
  const { helpers, document } = helpersFor('<nav id="n"></nav>');
  const info = helpers.getLandmarkNameInfo(document, {});
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'unsupported');
  assert.ok(info.flags.includes('notElement'));
});

test('getLandmarkNameInfo: aria-label names the landmark directly', () => {
  const { helpers, document } = helpersFor('<nav id="n" aria-label="Primary"></nav>');
  const info = helpers.getLandmarkNameInfo(byId(document, 'n'), {});
  assert.equal(info.present, true);
  assert.equal(info.value, 'Primary');
  assert.equal(info.mechanism, 'aria-label');
});

test('getLandmarkNameInfo: title is a legitimate fallback when no ARIA name is present (DuckDuckGo-style distinguishing nav, see header comment)', () => {
  const { helpers, document } = helpersFor('<nav id="n" title="navigation"></nav>');
  const info = helpers.getLandmarkNameInfo(byId(document, 'n'), {});
  assert.equal(info.present, true);
  assert.equal(info.value, 'navigation');
  assert.equal(info.mechanism, 'title');
});

test('getLandmarkNameInfo: no aria and no title yields present:false with no stray flags', () => {
  const { helpers, document } = helpersFor('<nav id="n"></nav>');
  const info = helpers.getLandmarkNameInfo(byId(document, 'n'), {});
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'none');
  assert.deepEqual(info.flags, []);
});

test('getLandmarkNameInfo: an explicit but empty title="" is flagged "title-empty" rather than silently ignored', () => {
  const { helpers, document } = helpersFor('<nav id="n" title=""></nav>');
  const info = helpers.getLandmarkNameInfo(byId(document, 'n'), {});
  assert.equal(info.present, false);
  assert.ok(info.flags.includes('title-empty'));
});

test('getLandmarkNameInfo: rendered content alone (no aria, no title) does not name a landmark -- unlike getContentNameInfo-driven controls', () => {
  const { helpers, document } = helpersFor('<nav id="n">Some visible nav text</nav>');
  const info = helpers.getLandmarkNameInfo(byId(document, 'n'), {});
  assert.equal(info.present, false);
});

// ===== IDREF id-lookup resilience (safeDocGetById / safeRootQueryById) =====
//
// These two lookups exist specifically because a scan can be scoped to a
// non-document root (contextSelector, shadow-root-like fragments), so an
// idref target may live outside document.getElementById's reach but still
// be found via a scoped root.querySelector. Both wrap their DOM calls in
// try/catch so a hostile/unusual id or a foreign-realm document element
// never turns a naming lookup into an uncaught exception.

test('safeDocGetById: a getElementById that throws (e.g. a foreign/proxied document) degrades to "missing" instead of propagating the error', () => {
  const { helpers, document } = helpersFor('<span id="a">Text</span>');
  // Simulate an environment where document.getElementById is broken/foreign.
  // In jsdom, querySelector('#id') is itself implemented in terms of
  // getElementById, so breaking it also removes the root-scoped fallback's
  // ability to find the element -- the behavior actually under test is
  // narrower than "still finds it another way": resolveIdRefs must not let
  // the underlying exception escape, and must report the id as simply
  // unresolved rather than crashing name computation for the whole page.
  document.getElementById = () => {
    throw new Error('simulated foreign-document failure');
  };
  let r;
  assert.doesNotThrow(() => {
    r = helpers.resolveIdRefs('a', {});
  });
  assert.equal(r.refs.length, 0);
  assert.deepEqual(r.missing, ['a']);
});

test('safeRootQueryById: resolving the same id again under a different idref string reuses the per-id root-lookup cache', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  // A detached fragment (not attached to `document`) means
  // document.getElementById can never find it -- every lookup must go
  // through the root-scoped querySelector path (and its cache) instead.
  // Using two DIFFERENT idref strings (not the same string twice) matters:
  // resolveIdRefs has its own higher-level cache keyed by the full,
  // normalized idref string, which would otherwise short-circuit a second
  // call for the identical string before ever reaching safeRootQueryById's
  // own per-id cache a second time.
  const detached = document.createElement('div');
  detached.innerHTML = '<span id="target">Detached text</span>';
  const helpers = createDomHelpers({ window, document, root: detached });

  const first = helpers.resolveIdRefs('target', {});
  const second = helpers.resolveIdRefs('target other', {});
  assert.equal(first.refs.length, 1);
  assert.equal(second.refs.length, 1);
  assert.deepEqual(second.missing, ['other']);
});

test('safeRootQueryById: an id that is not valid CSS-selector syntax (e.g. leading digit) resolves as missing instead of throwing', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  // Detached so document.getElementById can't shortcut around the
  // querySelector('#1abc') call that would otherwise throw a SyntaxError.
  const detached = document.createElement('div');
  detached.innerHTML = '<span id="1abc">Text</span>';
  const helpers = createDomHelpers({ window, document, root: detached });

  const r = helpers.resolveIdRefs('1abc', {});
  assert.deepEqual(r.missing, ['1abc']);
  assert.equal(r.refs.length, 0);
});

// ===== computeIdRefTargetTextAlternative / __getElementValueLikeName =====
// (native "name is derived from value/alt" mechanisms, applied when
// resolving what an aria-labelledby/aria-describedby TARGET itself
// contributes -- see this function's own header comment.)

test('getTextFromIdRefs: a referenced img target with alt text contributes its alt (value-like name)', () => {
  const { helpers } = helpersFor(
    '<div aria-labelledby="photo">desc</div><img id="photo" src="x.png" alt="A cat">'
  );
  const t = helpers.getTextFromIdRefs('photo', {});
  assert.equal(t.text, 'A cat');
});

test('getTextFromIdRefs: a referenced img target with alt="" contributes nothing (not the img\'s absent title/content)', () => {
  const { helpers } = helpersFor(
    '<div aria-labelledby="photo">desc</div><img id="photo" src="x.png" alt="">'
  );
  const t = helpers.getTextFromIdRefs('photo', {});
  assert.equal(t.text, '');
});

test('getTextFromIdRefs: a referenced input[type=button] target with a value contributes that value', () => {
  const { helpers } = helpersFor(
    '<div aria-labelledby="btn">desc</div><input id="btn" type="button" value="Click me">'
  );
  const t = helpers.getTextFromIdRefs('btn', {});
  assert.equal(t.text, 'Click me');
});

test('getTextFromIdRefs: a referenced input[type=submit] target with no value defaults to "Submit"', () => {
  const { helpers } = helpersFor(
    '<div aria-labelledby="sub">desc</div><input id="sub" type="submit">'
  );
  const t = helpers.getTextFromIdRefs('sub', {});
  assert.equal(t.text, 'Submit');
});

test('getTextFromIdRefs: a referenced input[type=reset] target with no value defaults to "Reset"', () => {
  const { helpers } = helpersFor(
    '<div aria-labelledby="res">desc</div><input id="res" type="reset">'
  );
  const t = helpers.getTextFromIdRefs('res', {});
  assert.equal(t.text, 'Reset');
});

// NOTE on an intentional-looking asymmetry (flagged for human review, not
// changed): getAccessibleNameInfo does NOT credit this same
// value-like "Submit"/"Reset" UA-default when computing a plain
// input[type=submit|reset]'s OWN accessible name (see the
// "deliberate project policy" test below, backed by
// tests/fixtures/button-name-present-all-scenarios.html's case_10, which
// explicitly expects FAIL for a value-less <input type="submit">). Whether
// computeIdRefTargetTextAlternative crediting the same default when
// resolving a REFERENCED target is *also* intentional (a referenced
// target's contribution is arguably a different question than "does this
// control have an adequate authored name") or a leftover inconsistency is
// not something this suite can settle with confidence either way, so
// behavior is left as-is and simply documented here.
test('getAccessibleNameInfo: an input[type=submit] with no value/aria/label has no accessible name -- deliberate project policy (see button-name-present-all-scenarios.html case_10), not a bug', () => {
  const { helpers, document } = helpersFor('<input type="submit" id="s">');
  const info = helpers.getAccessibleNameInfo(byId(document, 's'), { helpers });
  assert.equal(info.present, false);
});

// ===== getTextFromIdRefsIdrefEligible / isIdRefEligibleTarget =====
// IDREF policy: include hidden/aria-hidden/collapsed targets (unlike the
// general accessible-name computation), but exclude inert or
// non-composed targets.

test('getTextFromIdRefsIdrefEligible: a fully eligible reference resolves normally with no exclusions', () => {
  const { helpers } = helpersFor('<span id="a">Hello</span>');
  const t = helpers.getTextFromIdRefsIdrefEligible('a', {});
  assert.equal(t.text, 'Hello');
  assert.deepEqual(t.excluded, []);
  assert.ok(!t.flags.includes('idref-excluded'));
});

test('getTextFromIdRefsIdrefEligible: an inert referenced target is excluded from the resolved text and reported separately from a missing id', () => {
  const { helpers } = helpersFor('<span id="a">Visible</span><span id="b" inert>Blocked</span>');
  const t = helpers.getTextFromIdRefsIdrefEligible('a b', {});
  assert.equal(t.text, 'Visible');
  assert.equal(t.excluded.length, 1);
  assert.equal(t.excluded[0].id, 'b');
  assert.ok(t.excluded[0].reasons.includes('inert'));
  assert.ok(t.flags.includes('idref-excluded'));
});

test('getTextFromIdRefsIdrefEligible: a referenced target that resolves to empty text is flagged "resolved-empty-text"', () => {
  const { helpers } = helpersFor('<span id="a"></span>');
  const t = helpers.getTextFromIdRefsIdrefEligible('a', {});
  assert.equal(t.text, '');
  assert.ok(t.flags.includes('resolved-empty-text'));
});

// ===== getLabelSubtreeNameInfo (via getAccessibleNameInfo's native-<label> path) =====
// A wrapping <label>'s OWN naming subtree walk: a descendant with its own
// aria-label/aria-labelledby speaks for itself (its own children are not
// also walked into), and an image-like descendant contributes its alt --
// see this function's own header comment for why it never calls back into
// getAccessibleNameInfo/getContentNameInfo for descendants.

test("getAccessibleNameInfo: a label's descendant with its own aria-label overrides that descendant's own text, without re-walking into its children", () => {
  const { helpers, document } = helpersFor(
    '<label>Text <span aria-label="Override">ignored</span> more<input id="x"></label>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'x'), { helpers });
  assert.equal(info.value, 'Text Override more');
});

test("getAccessibleNameInfo: a label's descendant with aria-labelledby resolves through the referenced element", () => {
  const { helpers, document } = helpersFor(
    '<span id="lblSrc">Real label</span><label>Prefix <b aria-labelledby="lblSrc">ignored content</b> Suffix<input id="y"></label>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'y'), { helpers });
  assert.equal(info.value, 'Prefix Real label Suffix');
});

test('getAccessibleNameInfo: an image-like descendant inside a label contributes its alt text', () => {
  const { helpers, document } = helpersFor(
    '<label><img src="a.png" alt="Photo of cat"><input id="z"></label>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'z'), { helpers });
  assert.equal(info.value, 'Photo of cat');
});

// ===== getAccessibleNameInfo: diagnostic flags and id-based <label for> fallback =====

test('getAccessibleNameInfo: an aria-labelledby pointing only at a missing id surfaces a diagnostic flag even though no name is found', () => {
  const { helpers, document } = helpersFor('<div id="d" aria-labelledby="missing"></div>');
  const info = helpers.getAccessibleNameInfo(byId(document, 'd'), { helpers });
  assert.equal(info.present, false);
  assert.ok(info.flags.includes('aria-labelledby-empty-or-unresolvable'));
});

test('getAccessibleNameInfo: a <label for="..."> names a non-natively-labelable element (e.g. div[role=button]) via the id-based fallback, since it has no .labels API', () => {
  const { helpers, document } = helpersFor(
    '<label for="x">Name</label><div id="x" role="button" tabindex="0"></div>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'x'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Name');
  assert.equal(info.mechanism, 'label');
});

test('getAccessibleNameInfo: a <label for="..."> that exists but has empty content falls through rather than producing an empty name', () => {
  const { helpers, document } = helpersFor(
    '<label for="y"></label><div id="y" role="button"></div>'
  );
  const info = helpers.getAccessibleNameInfo(byId(document, 'y'), { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'none');
});

// ===== getAccessibleNameInfo / getContentNameInfo: shared recursion-depth guard =====

test('getContentNameInfo (via getTextFromIdRefs): an extremely long aria-labelledby chain hits the shared depth guard rather than recursing unbounded', () => {
  const CHAIN_LENGTH = 40;
  let html = '';
  // Each link is EMPTY on purpose (no text of its own) so that once the
  // depth guard blocks the leaf's content computation, there is no
  // intermediate link's own rendered text to "rescue" the result on the
  // way back up -- isolating the guard's effect from ordinary content
  // fallback behavior.
  for (let i = 0; i < CHAIN_LENGTH - 1; i++) {
    html += `<span id="e${i}" aria-labelledby="e${i + 1}"></span>`;
  }
  html += `<span id="e${CHAIN_LENGTH - 1}">Leaf text</span>`;
  const { helpers } = helpersFor(html);
  const t = helpers.getTextFromIdRefs('e0', {});
  // The chain is long enough that by the time the final link falls back to
  // its own content, the shared depth guard has already tripped -- this
  // must resolve deterministically (not throw, not hang), even though it
  // means the leaf's real text is unreachable through a chain this long.
  assert.equal(t.text, '');
});

// ===== getContentNameInfo: maxContentNodes truncation =====

test('getContentNameInfo: opts.maxContentNodes truncates a pathologically wide content tree and flags "truncated"', () => {
  let html = '<div id="wrap">';
  for (let i = 0; i < 20; i++) html += `<span>t${i} </span>`;
  html += '</div>';
  const { helpers, document } = helpersFor(html);
  const info = helpers.getContentNameInfo(
    byId(document, 'wrap'),
    { helpers },
    { maxContentNodes: 5 }
  );
  assert.ok(info.flags.includes('truncated'));
  assert.ok(!info.value.includes('t19'));
});

// ===== getContentNameInfo: <slot> content in a shadow root =====
// A <slot>'s own childNodes are its FALLBACK content only -- see this
// function's own header comment (the Shoelace <sl-button> regression).

test('getContentNameInfo: a <slot> with assigned light-DOM content resolves via assignedNodes, not its own (empty) childNodes', () => {
  const { helpers, document } = helpersFor('<div id="host">Follow</div>');
  const host = byId(document, 'host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="btn"><slot></slot></button>';
  const btn = shadow.querySelector('button');
  const info = helpers.getContentNameInfo(btn, { helpers });
  assert.equal(info.value, 'Follow');
});

test('getContentNameInfo: a <slot> with nothing assigned falls back to its own fallback content', () => {
  const { helpers, document } = helpersFor('<div id="host"></div>');
  const host = byId(document, 'host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="btn"><slot>Default label</slot></button>';
  const btn = shadow.querySelector('button');
  const info = helpers.getContentNameInfo(btn, { helpers });
  assert.equal(info.value, 'Default label');
});

// ===== getTextAlternativeInfo: notElement and canvas edge cases =====

test('getTextAlternativeInfo: a non-element (e.g. document) returns present:false with mechanism "unsupported" and requiredMechanism "unknown"', () => {
  const { helpers, document } = helpersFor('<div></div>');
  const info = helpers.getTextAlternativeInfo(document, { helpers });
  assert.equal(info.present, false);
  assert.equal(info.mechanism, 'unsupported');
  assert.equal(info.requiredMechanism, 'unknown');
  assert.ok(info.flags.includes('notElement'));
});

test('getTextAlternativeInfo: a canvas with no fallback content or aria falls back to title, flagged "title-used"', () => {
  const { helpers, document } = helpersFor('<canvas id="c" title="Sales chart"></canvas>');
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.value, 'Sales chart');
  assert.equal(info.mechanism, 'title');
  assert.equal(info.requiredMechanism, 'fallback-or-name');
  assert.ok(info.flags.includes('title-used'));
});

// ===== __hasMeaningfulCanvasFallbackDescendant (via getTextAlternativeInfo) =====
// <canvas> fallback content is the element's *children*, not just its
// rendered textContent -- a documented HTML5 technique is an equivalent
// <img alt="..."> (or similarly self-describing element) inside <canvas>.

test('getTextAlternativeInfo: a canvas with no direct text but a meaningful img[alt] descendant counts as having fallback content', () => {
  const { helpers, document } = helpersFor(
    '<canvas id="c"><img src="chart.png" alt="Bar chart of quarterly sales"></canvas>'
  );
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.mechanism, 'canvas-fallback');
});

test('getTextAlternativeInfo: a canvas with a meaningful area[alt] descendant (image-map fallback) counts as having fallback content', () => {
  const { helpers, document } = helpersFor(
    '<canvas id="c"><map><area shape="rect" coords="0,0,10,10" alt="Region"></map></canvas>'
  );
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.mechanism, 'canvas-fallback');
});

test('getTextAlternativeInfo: a canvas with a descendant carrying aria-label (no text, no alt) counts as having fallback content', () => {
  const { helpers, document } = helpersFor(
    '<canvas id="c"><button aria-label="Retry loading chart"></button></canvas>'
  );
  const info = helpers.getTextAlternativeInfo(byId(document, 'c'), { helpers });
  assert.equal(info.present, true);
  assert.equal(info.mechanism, 'canvas-fallback');
});

// ===== getLabelMethod / getLabelStrength =====
// getLabelMethod's own precedence: native <label> association first
// (hasLabelAssociation), then aria-labelledby, then aria-label, then
// title, then placeholder (placeholder-capable elements only) -- see
// getLabelStrength's tiering of the same mechanisms.

test('getLabelMethod: a native <label> association wins, method "label"', () => {
  const { helpers, document } = helpersFor('<label for="x">Full Name</label><input id="x">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'label');
});

test('getLabelMethod: aria-labelledby is used when there is no label association', () => {
  const { helpers, document } = helpersFor(
    '<span id="ref">Search field</span><input id="x" aria-labelledby="ref">'
  );
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'aria-labelledby');
  assert.equal(r.value, 'Search field');
});

test('getLabelMethod: aria-label is used when there is no label or aria-labelledby', () => {
  const { helpers, document } = helpersFor('<input id="x" aria-label="Search">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'aria-label');
  assert.equal(r.value, 'Search');
});

test('getLabelMethod: title is the fallback when no label/aria mechanism is present', () => {
  const { helpers, document } = helpersFor('<input id="x" title="Search">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'title');
  assert.equal(r.value, 'Search');
});

test('getLabelMethod: placeholder is the last resort, only for placeholder-capable inputs', () => {
  const { helpers, document } = helpersFor('<input id="x" type="text" placeholder="Search...">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'placeholder');
  assert.equal(r.value, 'Search...');
});

test('getLabelMethod: placeholder on a non-placeholder-capable input (e.g. checkbox) is not used as a label method', () => {
  const { helpers, document } = helpersFor('<input id="x" type="checkbox" placeholder="ignored">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'none');
});

test('getLabelMethod: no label/aria/title/placeholder at all yields method "none"', () => {
  const { helpers, document } = helpersFor('<input id="x">');
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'none');
  assert.equal(r.value, null);
});

test('getLabelMethod: a non-element returns method "none" with value null', () => {
  const { helpers } = helpersFor('<div></div>');
  const r = helpers.getLabelMethod(null, {});
  assert.equal(r.method, 'none');
  assert.equal(r.value, null);
});

test('getLabelMethod: an explicitly-associated label with no name of its own but its own title still counts as a label association (case_22 regression)', () => {
  const { helpers, document } = helpersFor('<label for="s" title="Search"></label><input id="s">');
  const r = helpers.getLabelMethod(byId(document, 's'), {});
  assert.equal(r.method, 'label');
});

test('getLabelMethod: repeated calls on the same element reuse the per-run label-association cache and remain consistent', () => {
  const { helpers, document } = helpersFor('<label for="x">Full Name</label><input id="x">');
  const el = byId(document, 'x');
  const first = helpers.getLabelMethod(el, {});
  const second = helpers.getLabelMethod(el, {});
  assert.equal(first.method, 'label');
  assert.equal(second.method, 'label');
});

test('getLabelStrength: maps each label method to its documented tier', () => {
  assert.equal(helpersFor('<div></div>').helpers.getLabelStrength('label'), 'strong');
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.getLabelStrength('aria-labelledby'), 'strong');
  assert.equal(helpers.getLabelStrength('aria-label'), 'medium');
  assert.equal(helpers.getLabelStrength('title'), 'weak');
  assert.equal(helpers.getLabelStrength('placeholder'), 'weak');
  assert.equal(helpers.getLabelStrength('none'), 'none');
  assert.equal(helpers.getLabelStrength('something-unknown'), 'none');
});

// ===== Defensive resilience: isPlaceholderCapable / labelContributesAccessibleName =====
// These cover try/catch guards around otherwise-safe DOM reads, exercised
// by making a specific attribute/property access throw on the exact
// element under test (simulating a hostile/unusual element implementation)
// rather than by breaking anything global.

test('getLabelMethod: an input whose getAttribute("type") throws is treated as not placeholder-capable rather than propagating the error', () => {
  const { helpers, document } = helpersFor('<input id="x" placeholder="Search...">');
  const el = byId(document, 'x');
  const originalGetAttribute = el.getAttribute.bind(el);
  el.getAttribute = (name) => {
    if (name === 'type') throw new Error('simulated broken getAttribute');
    return originalGetAttribute(name);
  };
  const r = helpers.getLabelMethod(el, {});
  assert.equal(r.method, 'none');
});

test('getAccessibleNameInfo (via native <label>): a label whose content-walk throws is still conservatively treated as contributing a name, per labelContributesAccessibleName\'s own "conservative on error" policy', () => {
  const { helpers, document } = helpersFor('<label id="lbl">Some text<input id="x"></label>');
  const label = byId(document, 'lbl');
  Object.defineProperty(label, 'childNodes', {
    get() {
      throw new Error('simulated broken childNodes');
    }
  });
  // hasLabelAssociation -> labelContributesAccessibleName(label) hits its
  // getContentNameInfo(lab) try/catch and, per the documented policy,
  // returns true (conservative: don't newly fail an association just
  // because the content walk errored) rather than false.
  const r = helpers.getLabelMethod(byId(document, 'x'), {});
  assert.equal(r.method, 'label');
});
