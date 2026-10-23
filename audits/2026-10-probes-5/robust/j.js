// Shared jsdom helper for the robust probes.
'use strict';
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
function scan(html, { runOnly = null, eo = {}, parity = false } = {}) {
  const w = console.warn; console.warn = () => {};
  try { return runa11yCoreOnHtml(html, { runOnly, engineOptions: eo, entryPointParity: parity }); }
  finally { console.warn = w; }
}
function sum(r, ids) {
  const out = [];
  for (const c of r.checksResults) {
    if (ids && !ids.includes(c.ruleId)) continue;
    const occ = (c.occurrences || []).filter(o => o.tier !== 'pass').map(o => `${o.tier||o.occurrenceOutcome||''}:${o.data && o.data.details && o.data.details.reasonCode || ''}:${o.selector}`);
    out.push(`${c.ruleId}=${c.outcome}${c.error ? ' ERR ' + String(c.error.message || c.error).slice(0, 80) : ''}${occ.length ? ' [' + occ.join(', ') + ']' : ''}`);
  }
  return out.join('\n');
}
function t(fn) { const s = process.hrtime.bigint(); const v = fn(); return [Number(process.hrtime.bigint() - s) / 1e6, v]; }
module.exports = { scan, sum, t };
