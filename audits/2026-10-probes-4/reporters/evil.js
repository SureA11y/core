'use strict';
// Builds hostile results (as stored JSON would carry them) for the HTML report.
const L = require('./lib.js');
const { runa11yCoreOnHtml } = require(L.C + '/src/testing.js');
const X = (tag) => `"'><img src=x onerror="window.__pwn=(window.__pwn||[]).concat('${tag}')"><script>window.__pwn=(window.__pwn||[]).concat('${tag}-s')</script></script><!--]]>--><svg onload="window.__pwn=1">‮\u0000￾\uD800`;
function evilResult(url) {
  const r = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><a href="/x"></a></main></body></html>', { url: url || 'https://example.test/', engineOptions: { mappings: ['en301549'] }, entryPointParity: false });
  const j = JSON.parse(JSON.stringify(r));
  j.url = 'javascript:window.__pwn=1//' + X('url');
  j.title = X('title');
  j.timestamp = X('ts');
  j.engine.tag = X('tag'); j.engine.schemaVersion = X('schema'); j.engine.wcagVersion = X('wv'); j.engine.profile = X('profile');
  j.engine.optInRules = [X('optin')];
  j.engine.environment = { layout: true, viewport: { width: 1, height: 2 }, devicePixelRatio: 2, colorScheme: X('cs'), fonts: 'loading' };
  j.engine.locale = { requested: X('lreq'), resolved: 'en', reason: 'x' };
  j.standards = j.standards.map(s => ({ ...s, note: X('note'), titleLang: X('tl') }));
  for (const c of j.checksResults) {
    if (c.outcome === 'fail') {
      c.ruleId = c.ruleId + X('rid');
      c.severity = X('sev');
      c.meta.helpUrl = 'https://x.test/"onmouseover="window.__pwn=1"' ;
      c.meta.normativeMappings.push({ standard: 'WCAG', requirement: X('req'), title: X('mt') });
      for (const o of c.occurrences) { o.selector = X('sel'); o.html = X('html') + '</script>'; o.summary = X('sum'); o.hint = X('hint'); }
    }
  }
  for (const rr of j.rulesResults) { rr.title = X('rtitle'); if (rr.data && rr.data.details) rr.data.details.checksIds = [X('cid')]; }
  // margin
  j.checksResults[0].margin = { measure: X('m'), unit: 'px', limit: 'min', threshold: 1, value: 2, headroom: 1, measuredCount: 1, selector: X('msel') };
  // a rule that threw
  j.checksResults.push({ ruleId: 'thrower' + X('thr'), outcome: 'cantTell', occurrences: [], error: X('err'), severity: 'minor', type: 'automatic', meta: { normativeMappings: [] } });
  return j;
}
function evilCrossFrame() {
  return {
    topFrame: evilResult(),
    frames: [
      { url: X('furl'), selector: X('fsel'), title: X('ftitle'), topFrame: evilResult('https://f.test/'), frames: [ { url: X('u2'), selector: X('s2'), title: X('t2'), error: X('ferr') } ] },
    ]
  };
}
module.exports = { evilResult, evilCrossFrame, X };
