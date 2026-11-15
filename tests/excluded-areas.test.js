'use strict';

// excludeSelectors says excluded elements "are skipped entirely, for every
// rule" (docs/ENGINE_OPTIONS.md). The engine leaves them out of the elements
// it hands rules, but a rule that walks the document itself must ask
// helpers.isExcluded, and one that forgets reports inside an area the caller
// left out (page-zones-landmark did, on a site's admin toolbar). This runs
// every rule on a page whose problems all sit in one excluded block, and
// fails on any finding there.

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../src/index.js');

// Something for as many rules as possible to find: zones, forms, images,
// links, buttons, ids, ARIA, tables, headings, language, media, frames.
const PROBLEMS = `
  <div class="site-header"><a href="/a">A</a><a href="/b">B</a></div>
  <div class="menu"><a href="/a">Home</a><a href="/b">About</a><a href="/c">Contact</a></div>
  <form><input type="search" name="s"><button>Search</button></form>
  <div class="footer">Footer</div>
  <header><h2>Inner header</h2></header>
  <img src="IMG_1234.png"><img src="a.png" alt="image"><img src="b.png" alt="IMG_1234.png">
  <a href="#"></a><a href="/x">click here</a><a href="/files/report.pdf">Report</a>
  <button></button><div role="button">Do</div><span onclick="x()">Go</span>
  <input type="text"><input type="text" placeholder="Name"><select><option>A</option></select><textarea></textarea>
  <label>Twice <input id="dup-field" type="text"></label>
  <p id="dup">a</p><p id="dup">b</p>
  <div role="buttonx" aria-pressed="maybe" tabindex="5" aria-labelledby="missing">x</div>
  <div aria-hidden="true"><a href="/h">Hidden link</a></div>
  <ul><div>Not a list item</div></ul><li>Orphan item</li>
  <table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>
  <table><tr><th></th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
  <h4></h4><h6>Skipped</h6>
  <p><strong>Bold heading</strong></p><p>Plain text after it, long enough to be read as a paragraph.</p>
  <p lang="xx-nope">Wrong language</p>
  <span style="font-size:8px;color:#ccc;background:#fff">tiny and pale</span>
  <video src="v.mp4" autoplay></video><audio src="a.mp3" autoplay></audio>
  <iframe src="about:blank"></iframe>
  <marquee>Moving</marquee><blink>Blink</blink>
  <svg role="img"><circle r="4"></circle></svg>
  <object data="x.swf"></object>
  <a href="/same">More</a><a href="/other">More</a>
  <div tabindex="0" style="outline:none">Focusable</div>
`;

const PAGE = `<!doctype html><html lang="en"><head><title>T</title></head><body>
  <div id="excluded">${PROBLEMS}</div>
  <main id="main"><h1>Page</h1><p>Fine content.</p></main>
</body></html>`;

const ALL_RULES = getChecksCatalog().map((r) => r.ruleId);

// The occurrences whose element is inside #excluded, by rule.
function insideExcluded(result) {
  const doc = new JSDOM(PAGE).window.document;
  const found = {};
  for (const check of result.checksResults) {
    for (const o of check.occurrences || []) {
      if (!o.selector) continue;
      let el;
      try {
        el = doc.querySelector(o.selector);
      } catch {
        continue;
      }
      if (el && el.closest('#excluded')) (found[check.ruleId] ||= []).push(o.selector);
    }
  }
  return found;
}

test('without an exclusion, the block gives many rules something to report', () => {
  const result = runa11yCoreOnHtml(PAGE, { runOnly: ALL_RULES });
  const rules = Object.keys(insideExcluded(result));
  // The probe is only worth something if it reaches many rules.
  assert.ok(rules.length >= 30, `${rules.length} rules report in the block: ${rules.join(', ')}`);
});

test('no rule reports inside an area left out with excludeSelectors', () => {
  const result = runa11yCoreOnHtml(PAGE, {
    runOnly: ALL_RULES,
    engineOptions: { excludeSelectors: ['#excluded'] }
  });
  assert.deepStrictEqual(insideExcluded(result), {});
});

// A rule from outside core, as a pack or a custom rule would be, that walks
// the document itself and forgets the exclusion: every <p> is reported.
const careless = (type) => ({
  id: 'careless-paragraphs',
  meta: {
    title: 'Careless',
    description: 'Reports every paragraph.',
    tags: ['best-practice'],
    wcagSc: [],
    type
  },
  runInPage:
    "function (ctx) { var ps = Array.prototype.slice.call(ctx.document.querySelectorAll('p')); " +
    "return { ruleId: ctx.rule.ruleId, outcome: ps.length ? (ctx.rule.type === 'manual' ? 'cantTell' : 'fail') : 'pass', " +
    "occurrences: ps.map(function (p) { return ctx.helpers.reportOccurrence(p, { summary: 'A paragraph.', occurrenceOutcome: ctx.rule.type === 'manual' ? 'cantTell' : 'fail' }); }) }; }"
});
const carelessPage = (body) =>
  `<!doctype html><html lang="en"><head><title>T</title></head><body>${body}</body></html>`;
const runCareless = (body, engineOptions, type = 'automatic') =>
  runa11yCoreOnHtml(carelessPage(body), {
    runOnly: ['careless-paragraphs'],
    engineOptions: { customRules: [careless(type)], ...engineOptions }
  }).checksResults.find((c) => c.ruleId === 'careless-paragraphs');

test('the engine drops what a rule reports in an excluded area, and says so', () => {
  const body = '<div id="bar"><p>In the bar</p><p>Also</p></div><main><p>Content</p></main>';
  for (const engineOptions of [
    { excludeSelectors: ['#bar'] },
    { rules: { 'careless-paragraphs': { excludeSelectors: ['#bar'] } } }
  ]) {
    const r = runCareless(body, engineOptions);
    assert.strictEqual(r.outcome, 'fail', JSON.stringify(engineOptions));
    assert.strictEqual(r.occurrences.length, 1);
    assert.match(r.occurrences[0].selector, /main/);
    assert.deepStrictEqual(r.excludedOccurrences, { dropped: 2 });
    assert.match(
      r.error,
      /reported 2 occurrences on elements left out with excludeSelectors; dropped/
    );
  }
});

test('a rule that found something only in excluded areas is notApplicable', () => {
  for (const type of ['automatic', 'manual']) {
    const r = runCareless(
      '<div id="bar"><p>In the bar</p></div><main><h1>No paragraphs</h1></main>',
      { excludeSelectors: ['#bar'] },
      type
    );
    assert.strictEqual(r.outcome, 'notApplicable', type);
    assert.strictEqual(r.outcomeNormalized, 'inapplicable');
    assert.deepStrictEqual(r.occurrences, []);
    assert.deepStrictEqual(r.excludedOccurrences, {
      dropped: 1,
      coercedFrom: type === 'manual' ? 'cantTell' : 'fail'
    });
  }
});

test('without exclusions, or with none that matches, nothing changes', () => {
  const body = '<div id="bar"><p>In the bar</p></div><main><p>Content</p></main>';
  for (const engineOptions of [{}, { excludeSelectors: ['#nothing'] }]) {
    const r = runCareless(body, engineOptions);
    assert.strictEqual(r.occurrences.length, 2);
    assert.strictEqual(r.excludedOccurrences, undefined);
    assert.strictEqual(r.error, undefined);
  }
});
