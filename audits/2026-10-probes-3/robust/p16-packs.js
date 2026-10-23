// Packs (src/pack.js) under hostile or careless rule code, in jsdom:
// (a) packScript on rule functions written in shapes functionExpression may
//     not read back; (b) a pack rule that changes ctx.helpers or the page
//     for the rules after it; (c) the engine cache when a pack object is
//     changed between scans; (d) rules that throw, return garbage, or
//     return huge occurrence lists.
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const { JSDOM } = require(path.join(ROOT, 'node_modules/jsdom'));
const main = require(path.join(ROOT, 'src/index.js'));
const { definePack, packScript, checkPack } = require(path.join(ROOT, 'src/pack.js'));
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>H</h1><button></button><img src="a.png"></main></body></html>';
function scan(engineOptions, page = PAGE) {
  const dom = new JSDOM(page, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  try { return main.runDomRulesInPage('https://example.test/', null, { timestamp: 'x', ...engineOptions }); } finally { dom.window.close(); }
}
const out = (r, id) => { const c = r.checksResults.find((x) => x.ruleId === id); return c ? c.outcome + '#' + c.occurrences.length + (c.error ? ' ERR ' + String(c.error).slice(0, 80) : '') : 'absent'; };
const pack = (name, rules) => definePack({ name, version: '1.0.0', namespace: 'acme', core: '*', rules });

// (a)
const SHAPES = {
  arrowDefaultWithParens: (ctx, o = String(1)) => ({ outcome: 'pass' }),
  arrowDestructure: ({ document }) => ({ outcome: 'pass' }),
  asyncLikeName: function runInPage(ctx) { return { outcome: 'pass' }; },
  bound: function (ctx) { return { outcome: 'pass' }; }.bind(null),
  arrowWithComment: /* lead */ (ctx) => ({ outcome: 'pass' }),
  methodWithDefaultParens: { runInPage(ctx, o = String(1)) { return { outcome: 'pass' }; } }.runInPage,
  generatorMethod: null,
};
console.log('== (a) packScript per function shape');
for (const [shape, fn] of Object.entries(SHAPES)) {
  if (!fn) continue;
  let res;
  try {
    const p = pack('@acme/s-' + shape.toLowerCase(), [{ id: 'acme-x', meta: { title: 'x', tags: ['acme'] }, runInPage: fn }]);
    const problems = checkPack(p);
    const script = packScript([p]);
    try { new Function(script); res = 'script parses'; } catch (e) { res = 'SCRIPT DOES NOT PARSE: ' + e.message; }
    try { new Function(script)(); const r = (function () { const dom = new JSDOM(PAGE, { url: 'https://example.test/' }); global.window = dom.window; global.document = dom.window.document; try { return main.runa11yCoreInPage('https://example.test/', null, { packs: ['@acme/s-' + shape.toLowerCase() + '@1.0.0'] }); } finally { dom.window.close(); } })(); res += ' | in-page acme-x: ' + out(r, 'acme-x'); } catch (e) { res += ' | run threw: ' + String(e.message).slice(0, 100); }
    delete globalThis.__surea11yPacks;
    res += ' | checkPack problems: ' + problems.length;
  } catch (e) { res = 'packScript threw: ' + String(e.message).slice(0, 120); }
  console.log(shape.padEnd(26), res);
}

// (b) a pack rule that runs before core rules (ids sort 'acme-' < 'button-')
console.log('== (b) a pack rule changing shared state');
const base = scan({});
console.log('no pack:', 'button-name-present', out(base, 'button-name-present'), '| img-alt-present', out(base, 'img-alt-present'));
const MUTATORS = {
  helpersReplaced: (ctx) => { for (const k of Object.keys(ctx.helpers)) if (/Name|name/.test(k) && typeof ctx.helpers[k] === 'function') ctx.helpers[k] = () => ({ present: true, value: 'x', mechanism: 'aria-label' }); return { outcome: 'pass' }; },
  helpersQueryEmpty: (ctx) => { ctx.helpers.queryAllSmart = () => []; ctx.helpers.queryAll = () => []; return { outcome: 'pass' }; },
  domChanged: (ctx) => { ctx.document.querySelector('button').setAttribute('aria-label', 'fixed'); ctx.document.querySelector('img').alt = 'fixed'; return { outcome: 'pass' }; },
  ctxFrozenCheck: (ctx) => ({ outcome: 'pass', occurrences: [], note: Object.isFrozen(ctx.helpers) }),
};
for (const [n, fn] of Object.entries(MUTATORS)) {
  try {
    const p = pack('@acme/m-' + n.toLowerCase(), [{ id: 'acme-a', meta: { title: 'x', tags: ['acme'] }, runInPage: fn }]);
    const r1 = scan({ packs: [p] });
    const r2 = scan({});
    console.log(n.padEnd(20), '| with pack: button', out(r1, 'button-name-present'), 'img', out(r1, 'img-alt-present'), '| next scan without pack: button', out(r2, 'button-name-present'), 'img', out(r2, 'img-alt-present'));
  } catch (e) { console.log(n, 'threw', e.message); }
}

// (c) engine cache by object identity
console.log('== (c) pack object changed between scans');
const p = pack('@acme/cache', [{ id: 'acme-c', meta: { title: 'x', tags: ['acme'] }, runInPage: () => ({ outcome: 'pass' }) }]);
const r1 = scan({ packs: [p] });
p.rules.push({ id: 'acme-d', meta: { title: 'y', tags: ['acme'] }, runInPage: () => ({ outcome: 'fail', occurrences: [] }) });
p.rules[0].runInPage = () => ({ outcome: 'fail', occurrences: [] });
const r2 = scan({ packs: [p] });
console.log('scan1 acme-c', out(r1, 'acme-c'), '| after changing the pack object: acme-c', out(r2, 'acme-c'), 'acme-d', out(r2, 'acme-d'));

// (d)
console.log('== (d) rules that misbehave');
const BAD = {
  throwsNonError: () => { throw { toString() { throw new Error('nested'); } }; },
  throwsNull: () => { throw null; },
  returnsCyclic: () => { const o = { outcome: 'fail', occurrences: [] }; o.self = o; return o; },
  occurrenceNotNode: () => ({ outcome: 'fail', occurrences: [{ __node: { nodeType: 1 } }, { __node: 42 }, null, 'x'] }),
  occurrences100k: (ctx) => ({ outcome: 'fail', occurrences: Array.from({ length: 100000 }, () => ({ __node: ctx.document.body })) }),
  outcomeWeird: () => ({ outcome: 'FAIL', occurrences: [] }),
  outcomeGetterThrows: () => ({ get outcome() { throw new Error('getter'); } }),
  proxyResult: () => new Proxy({}, { get() { throw new Error('proxy'); } }),
};
for (const [n, fn] of Object.entries(BAD)) {
  try {
    const pk = pack('@acme/b-' + n.toLowerCase(), [{ id: 'acme-b', meta: { title: 'x', tags: ['acme'] }, runInPage: fn }]);
    const t = Date.now();
    const r = scan({ packs: [pk] });
    console.log(n.padEnd(20), 'acme-b', out(r, 'acme-b'), '| button', out(r, 'button-name-present'), '|', Date.now() - t, 'ms');
  } catch (e) { console.log(n.padEnd(20), 'SCAN THREW', String(e && e.message).slice(0, 150)); }
}
