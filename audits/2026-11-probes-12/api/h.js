const ROOT = process.env.ROOT || '/home/user/r12-api';
const T = require(ROOT + '/src/testing.js');
const core = require(ROOT + '/src/index.js');
const req = (m) => { try { return require(ROOT + '/src/' + m + '.js'); } catch (e) { return {}; } };
const sarif = req('sarif'), junit = req('junit'), earl = req('earl'), report = req('report'), baseline = req('baseline'), pack = req('pack');
function quiet(fn) { const W = console.warn, E = console.error, L = console.log; const logs = []; console.warn = (...a) => logs.push('W ' + a.map(String).join(' ').slice(0, 400)); console.error = (...a) => logs.push('E ' + a.map(String).join(' ').slice(0, 400)); try { const r = fn(); return { r, logs }; } catch (e) { return { err: e, logs }; } finally { console.warn = W; console.error = E; } }
function scan(html, eo = {}, runOnly = null, extra = {}) { return quiet(() => T.runa11yCoreOnHtml(html, Object.assign({ entryPointParity: false, engineOptions: eo, runOnly }, extra))); }
const page = (body, title = 't') => `<!doctype html><html lang="en"><head><title>${title}</title></head><body><main><h1>h</h1>${body}</main></body></html>`;
const slowRule = (id, ms, extra = {}) => Object.assign({ id, meta: { title: id, tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
  runInPage(ctx) { const t = Date.now(); while (Date.now() - t < ms); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; } }, extra);
module.exports = { ROOT, T, core, sarif, junit, earl, report, baseline, pack, quiet, scan, page, slowRule };
// Map @surea11y/core to ROOT for packs
const Module = require('module'); const orig = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '@surea11y/core') return orig.call(this, ROOT + '/src/index.js', parent, ...rest);
  if (request.startsWith('@surea11y/core/')) { const sub = request.slice(15); const map = require(ROOT + '/package.json').exports || {}; const e = map['./' + sub]; const t = typeof e === 'string' ? e : e && (e.require || e.default || e.node); if (t) return orig.call(this, ROOT + '/' + t.replace(/^\.\//, ''), parent, ...rest); return orig.call(this, ROOT + '/src/' + sub + '.js', parent, ...rest); }
  return orig.call(this, request, parent, ...rest);
};
module.exports.loadPack = (n) => require(__dirname + '/packs/' + n);
