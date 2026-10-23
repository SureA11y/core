// FZ-2, FZ-4, FZ-5, FZ-7 rechecks (jsdom). FZ-3/FZ-6 timing in speed-recheck.js.
'use strict';
const { createDom, runa11yCoreOnDom, runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
console.warn = () => {};
function one(html, rule, { profile = false, alone = false, setup } = {}) {
  const dom = createDom(html); if (setup) setup(dom.window.document);
  const eo = profile ? { perfStats: true, profileRules: true } : {};
  const r = runa11yCoreOnDom(dom, { engineOptions: eo, entryPointParity: false, runOnly: alone ? { includeRuleIds: [rule] } : null });
  const c = r.checksResults.find(x => x.ruleId === rule); dom.window.close();
  return c.outcome + '|' + c.occurrences.filter(o => o.tier !== 'pass').map(o => o.selector).join(',');
}
function four(name, html, rule, setup) {
  const v = [one(html, rule, { setup }), one(html, rule, { profile: true, setup }), one(html, rule, { alone: true, setup }), one(html, rule, { alone: true, profile: true, setup })];
  console.log(`${name} ${rule}: ${new Set(v).size === 1 ? 'STABLE' : 'DIFFERS'} :: ${v.join(' || ')}`);
}
// FZ-2
const fz2 = `<!doctype html><html><body aria-hidden="true"><dl id="d" role="rowgroup" aria-labelledby="b">I</dl><area id="a"><input aria-labelledby="c" id="b"><input aria-labelledby="x a" id="c"><span id="x" aria-labelledby="d">T</span></body></html>`;
four('FZ-2a', fz2, 'aria-required-children');
four('FZ-2a', fz2, 'area-alt-present');
const fz2b = `<!doctype html><html lang=en><head><title>t</title></head><body aria-hidden="true"><x-card aria-braillelabel="tree"></x-card>T</body></html>`;
const sh = d => { d.querySelector('x-card').attachShadow({ mode: 'open' }).innerHTML = `<h3 id="lbl"></h3><form id="lbl" role="definition" aria-describedby="id2"><input aria-labelledby="id2 lbl" id="id2"></form>`; };
four('FZ-2b', fz2b, 'aria-braille-equivalent', sh);
// cousin: cycles in a not-hidden tree, with labelledby to hidden content
const fz2c = `<!doctype html><html lang=en><head><title>t</title></head><body><main><div aria-hidden="true"><div role="list" id="l" aria-labelledby="m">I</div><span id="m" aria-labelledby="l n">x</span></div><input aria-labelledby="l" id="n"><button aria-labelledby="m n"></button></main></body></html>`;
for (const r of ['aria-required-children', 'button-name-present', 'form-control-programmatic-label-present', 'aria-owns-valid', 'label-in-name']) four('FZ-2c', fz2c, r);
// FZ-P1
const p1 = `<!doctype html><html lang=en><head><title>t</title></head><body><main><div aria-hidden="true"><div role="list" id="l">I</div></div><input aria-labelledby="l"></main></body></html>`;
four('FZ-P1', p1, 'aria-required-children');
// FZ-4
const fz4 = `<!doctype html><html lang=en><head><title>t</title></head><body><main>L<a href="#" popover><img></a></main></body></html>`;
four('FZ-4', fz4, 'link-name-present'); four('FZ-4', fz4, 'img-alt-present');
// cousins: popover on a non-link wrapper, popover="manual", popover="hint", popover=""
for (const pv of ['popover', 'popover="manual"', 'popover="hint"', 'popover="auto"', 'popover="bogus"'])
  four('FZ-4 ' + pv, `<!doctype html><html lang=en><head><title>t</title></head><body><main><div ${pv}><button></button><img src=a.png></div></main></body></html>`, 'button-name-present');
// FZ-5 selectors
function selOk(html) {
  const dom = createDom(html); const doc = dom.window.document;
  const r = runa11yCoreOnDom(dom, { entryPointParity: false }); const bad = [];
  for (const c of r.checksResults) for (const o of c.occurrences || []) {
    if (!o.selector || !o.structuralPath || (o.shadowHostSelectors && o.shadowHostSelectors.length)) continue;
    let t = doc.documentElement; for (const i of o.structuralPath) t = t && t.children[i];
    let el; try { el = doc.querySelector(o.selector); } catch (e) { el = 'THROW'; }
    if (el !== t) bad.push(c.ruleId + ' ' + o.selector);
  }
  dom.window.close(); return bad;
}
console.log('FZ-5 svg fo dup:', selOk(`<!doctype html><html lang=en><head><title>t</title></head><body><main><svg><foreignObject><p id="dup">a</p><p id="dup">b</p></foreignObject></svg></main></body></html>`));
console.log('FZ-5 backslash:', selOk(`<!doctype html><html lang=en><head><title>t</title></head><body><main><div id="a\\b"><h5 id="dup">H</h5><p id="dup">x</p></div></main></body></html>`));
console.log('FZ-5 svg no-id:', selOk(`<!doctype html><html lang=en><head><title>t</title></head><body><main><svg><foreignObject><img src=a.png><img src=b.png></foreignObject></svg></main></body></html>`));
console.log('FZ-5 mathml:', selOk(`<!doctype html><html lang=en><head><title>t</title></head><body><main><math><mtext><img src=a.png></mtext><mtext><img src=b.png></mtext></math></main></body></html>`));
console.log('FZ-5 weird ids:', selOk(`<!doctype html><html lang=en><head><title>t</title></head><body><main><div id="1a"><img src=x></div><div id="a:b"><img src=x></div><div id="a b"><img src=y></div><div id=" "><img src=z></div><div id='a"b'><img src=w></div><div id="--"><img></div><div id="-1"><img></div><div id="__proto__"><img></div><div id="constructor"><img></div></main></body></html>`));
// FZ-7
const fz7 = `<!doctype html><html lang=en><head><title>t</title><style>*{color:#777;background:#888}</style></head><body><main><p style="background-image:url(hero.png)">Hello</p></main></body></html>`;
try { const r = runa11yCoreOnHtml(fz7, { runOnly: null }); console.log('FZ-7 testing helper parity: ok; contrast-computable=', r.checksResults.find(c => c.ruleId === 'contrast-computable').outcome); } catch (e) { console.log('FZ-7 THROWS', e.message.slice(0, 200)); }
// same DOM twice
{ const dom = createDom(fz7); const a = runa11yCoreOnDom(dom, { entryPointParity: false }); const b = runa11yCoreOnDom(dom, { entryPointParity: false });
  const g = r => r.checksResults.find(c => c.ruleId === 'contrast-computable').outcome; console.log('FZ-7 same DOM twice:', g(a), g(b)); }
try { const dom = createDom(fz7); runa11yCoreOnDom(dom, {}); console.log('FZ-7 runa11yCoreOnDom parity ok'); } catch (e) { console.log('FZ-7 OnDom THROWS', e.message.slice(0, 160)); }
