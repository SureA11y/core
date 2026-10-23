'use strict';
// Round-5 oracles on top of round 4's check.js (copied as check4.js):
// - every round-4 invariant (no throw, serialisable, tiers, placeholders, selectors, scan twice);
// - the scan does not change the DOM (light DOM and open/closed shadow roots serialised before/after);
// - a rule alone, and inside a random subset of rules, gives what it gives in the full scan.
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
const { runCase, stripVolatile } = require('./check4.js');
const { attachShadows, rng } = require('./gen5.js');
const ALL = require('/home/user/core/src/index.js').getChecksCatalog().map((c) => c.ruleId);

function serialise(doc) {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 1) {
      out.push('<' + n.localName + [...n.attributes].map((a) => ' ' + a.name + '=' + JSON.stringify(a.value)).join('') + '>');
      const sr = n.__fzRoot || n.shadowRoot;
      if (sr) { out.push('#shadow'); for (const c of sr.childNodes) walk(c); out.push('/#shadow'); }
      if (n.localName === 'template' && n.content) for (const c of n.content.childNodes) walk(c);
    } else if (n.nodeType === 3) out.push(JSON.stringify(n.data));
    else if (n.nodeType === 8) out.push('<!--' + n.data + '-->');
    for (const c of n.childNodes) walk(c);
    if (n.nodeType === 1) out.push('</' + n.localName + '>');
  };
  walk(doc.documentElement);
  return out.join('');
}

function buildKeep(c) {
  const dom = createDom(c.html);
  // keep a handle on closed roots, so the serialiser can read them
  const orig = dom.window.Element.prototype.attachShadow;
  dom.window.Element.prototype.attachShadow = function (init) { const r = orig.call(this, init); Object.defineProperty(this, '__fzRoot', { value: r }); return r; };
  if (c.shadows && c.shadows.length) attachShadows(dom.window.document, c.shadows);
  dom.window.Element.prototype.attachShadow = orig;
  return dom;
}

function runOne(c, runOnly) {
  const dom = buildKeep(c);
  const eo = { ...(c.engineOptions || {}) };
  dom.window.__a11ycoreEngineOptions = eo; dom.window.document.__a11ycoreEngineOptions = eo;
  const before = serialise(dom.window.document);
  let res, err;
  try { res = runa11yCoreOnDom(dom, { engineOptions: eo, entryPointParity: false, runOnly }); } catch (e) { err = e; }
  const after = serialise(dom.window.document);
  // No window.close(): after serialise() reads the tree, jsdom's close() can take 30 s (bisect-close.js); a worker exits after its chunk.
  return { res, err, mutated: before !== after ? firstDiff(before, after) : null };
}
function firstDiff(a, b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return { at: i, before: a.slice(Math.max(0, i - 80), i + 120), after: b.slice(Math.max(0, i - 80), i + 120) }; }

const norm = (c) => { if (!c) return 'MISSING'; const o = JSON.parse(JSON.stringify(c)); delete o.engineOptions; delete o.rollupIds; return JSON.stringify(o); };

function runCase5(c, seed, { aloneK = 3, subset = true } = {}) {
  const base = runCase(c, { determinism: true, parity: seed % 10 === 0, profile: true });
  const issues = base.issues.slice();
  const full = runOne(c, null);
  if (full.err) { issues.push({ kind: 'throwFull', msg: String(full.err.stack || full.err).slice(0, 400) }); return { issues, ms: base.ms, ruleTimings: base.ruleTimings }; }
  if (full.mutated) issues.push({ kind: 'domMutated', diff: full.mutated });
  const fr = stripVolatile(full.res);
  const byId = new Map(fr.checksResults.map((x) => [x.ruleId, x]));
  const r = rng(seed * 31 + 7);
  const alone = [];
  for (let i = 0; i < aloneK; i++) alone.push(r.pick(ALL));
  for (const id of alone) {
    const a = runOne(c, { includeRuleIds: [id] });
    if (a.err) { issues.push({ kind: 'throwAlone', ruleId: id, msg: String(a.err).slice(0, 200) }); continue; }
    if (a.mutated) issues.push({ kind: 'domMutatedAlone', ruleId: id, diff: a.mutated });
    const x = stripVolatile(a.res).checksResults.find((q) => q.ruleId === id);
    if (norm(x) !== norm(byId.get(id))) issues.push({ kind: 'aloneDiffers', ruleId: id, alone: x && x.outcome + '/' + x.occurrences.length, full: byId.get(id) && byId.get(id).outcome + '/' + byId.get(id).occurrences.length });
  }
  if (subset) {
    const ids = ALL.filter(() => r.chance(0.2));
    if (ids.length) {
      const s = runOne(c, { includeRuleIds: ids });
      if (s.err) issues.push({ kind: 'throwSubset', msg: String(s.err).slice(0, 200) });
      else for (const x of stripVolatile(s.res).checksResults) if (norm(x) !== norm(byId.get(x.ruleId))) issues.push({ kind: 'subsetDiffers', ruleId: x.ruleId, sub: x.outcome + '/' + x.occurrences.length, full: byId.get(x.ruleId) && byId.get(x.ruleId).outcome + '/' + byId.get(x.ruleId).occurrences.length, subsetSize: ids.length });
    }
  }
  return { issues, ms: base.ms, ruleTimings: base.ruleTimings };
}
module.exports = { runCase5, serialise, buildKeep, runOne };
