'use strict';

// What old libraries do to a page's built-ins, as page scripts, and a page
// that reaches the engine's code paths those changes would get wrong: lists
// made from a Set or a Map iterator, a string counted by code point, a
// mapping function. Shared by the jsdom and the Chromium tests.

// Prototype 1.7: Array.from is $A, which takes an object's own toArray and
// otherwise reads indexes up to length (a Set or a Map iterator gives an
// empty list, the mapping function is ignored); String#toArray splits UTF-16
// code units; the Array.prototype additions are enumerable; map, filter, some
// and every are wrapped to default the callback.
const PROTOTYPE_LIKE = `(function () {
  var slice = Array.prototype.slice;
  function $A(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  }
  Array.from = $A;
  String.prototype.toArray = function () { return this.split(''); };
  var K = function (x) { return x; };
  function wrapNative(method) {
    return function () {
      if (arguments.length === 0) return method.call(this, K);
      if (arguments[0] === undefined) {
        var args = slice.call(arguments, 1);
        args.unshift(K);
        return method.apply(this, args);
      }
      return method.apply(this, arguments);
    };
  }
  var additions = {
    toArray: function () { return slice.call(this); },
    clone: function () { return slice.call(this); },
    each: function (f) { for (var i = 0; i < this.length; i++) f(this[i], i); return this; },
    first: function () { return this[0]; },
    last: function () { return this[this.length - 1]; },
    compact: function () { return this.filter(function (x) { return x != null; }); },
    without: function () {
      var values = slice.call(arguments);
      return this.filter(function (x) { return values.indexOf(x) < 0; });
    },
    inspect: function () { return '[' + this.join(', ') + ']'; },
    size: function () { return this.length; },
    map: wrapNative(Array.prototype.map),
    filter: wrapNative(Array.prototype.filter),
    some: wrapNative(Array.prototype.some),
    every: wrapNative(Array.prototype.every)
  };
  for (var key in additions) Array.prototype[key] = additions[key];
})();`;

// MooTools 1.3 and later: Array.from gives back an array as it is, copies
// what has a length, and wraps anything else (a Set, a string) in a list;
// enumerable Array.prototype additions.
const MOOTOOLS_LIKE = `(function () {
  var slice = Array.prototype.slice;
  Array.from = function (item) {
    if (item == null) return [];
    var listLike = typeof item.length == 'number' && typeof item != 'function';
    return listLike && typeof item != 'string'
      ? (Array.isArray(item) ? item : slice.call(item))
      : [item];
  };
  Array.prototype.contains = function (x) { return this.indexOf(x) != -1; };
  Array.prototype.erase = function (x) {
    for (var i = this.length; i--; ) if (this[i] === x) this.splice(i, 1);
    return this;
  };
})();`;

const PATCHES = { 'Prototype-like': PROTOTYPE_LIKE, 'MooTools-like': MOOTOOLS_LIKE };

// 80 letters outside the Basic Multilingual Plane: 80 characters, 160 UTF-16
// code units, so an alt counted by code unit reads as too long.
const ASTRAL = '\u{20000}';

const PAGE_BODY = `<main>
<h1>Shop</h1>
<img src="a.png" alt="${ASTRAL.repeat(80)}">
<button role="buton">Buy</button>
<button aria-label="Send ${ASTRAL}">${ASTRAL}</button>
<p style="color:#767676;background:#fff url(bg.png)">Text over an image</p>
<span class="tag">item</span>
<ul><li>One</li><li>Two</li></ul>
<a href="/x">Go</a>
</main>`;

// The page, with its scripts: patch is the source of a script that runs
// before the body is parsed, as a library in the head does.
function pageHtml(patch) {
  return `<!doctype html><html lang="en"><head><title>Replaced built-ins</title>
<style>.tag::before { content: "New"; color: #999; background: #fff; }
li::marker { color: #aaa; }</style>
<script>${patch || ''}</script></head><body>${PAGE_BODY}</body></html>`;
}

// A caller's rule that returns a Map and a Set in its data, which the engine
// turns into lists; it doesn't use Array.from itself.
const DATA_RULE_SOURCE = `function runInPage() {
  return {
    outcome: 'cantTell',
    occurrences: [
      {
        summary: 'Data with a Map and a Set',
        data: { details: { seen: new Map([['a', 1]]), ids: new Set(['x', 'y']) } }
      }
    ]
  };
}`;

// A caller's rule that uses Array.from.
const ARRAY_FROM_RULE_SOURCE = `function runInPage(ctx) {
  const ids = Array.from(new Set(['x', 'y']));
  return { outcome: ids.length === 2 ? 'pass' : 'fail', occurrences: [] };
}`;

function customRule(id, source) {
  return { id, meta: { title: id, type: 'automatic', tags: ['best-practice'] }, runInPage: source };
}

// A result without what changes from one run to the next.
function stable(result) {
  return JSON.parse(
    JSON.stringify(result, (key, value) =>
      key === 'timestamp' || key === 'perfStats' ? undefined : value
    )
  );
}

module.exports = {
  PATCHES,
  pageHtml,
  DATA_RULE_SOURCE,
  ARRAY_FROM_RULE_SOURCE,
  customRule,
  stable
};
