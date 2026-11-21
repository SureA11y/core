const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const B = require('/home/user/core-r8/src/baseline.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
(async () => {
  console.warn = (...a) => console.log('warn', String(a[0]).slice(0, 140));
  const r = await runa11yCoreOnHtml('<html lang="en"><head><title>t</title></head><body><main><img src="a"><img src="b"></main></body></html>', { runOnly: ['img-alt-present'] });
  const e = B.buildBaselineEntries(r);
  console.log('entries', JSON.stringify(e));
  const variants = {
    exact: e,
    file: { version: 1, generatedAt: 'x', entries: e },
    fileVersion99: { version: 99, entries: e },
    fileVersionStr: { version: 'x', entries: e },
    protoRule: [{ ruleId: '__proto__', reasonCode: 'x', selector: 's', html: 'h' }, ...e],
    upperRule: e.map(x => ({ ...x, ruleId: x.ruleId.toUpperCase() })),
    prefixRule: e.map(x => ({ ...x, ruleId: 'a11ycore-' + x.ruleId })),
    noHtml: e.map(x => ({ ruleId: x.ruleId, reasonCode: x.reasonCode, selector: x.selector })),
    nullEntry: [null, ...e],
    extraKey: e.map(x => ({ ...x, foo: 1 })),
    leanOther: e.map(x => ({ ...x, lean: 'pass' })),
    frameStr: e.map(x => ({ ...x, frame: 'x' })),
    dup: [...e, ...e],
    once: [e[0]],
    protoJson: JSON.parse('[{"ruleId":"img-alt-present","reasonCode":"' + e[0].reasonCode + '","selector":"' + e[0].selector + '","html":' + JSON.stringify(e[0].html) + ',"__proto__":{"lean":"fail"}}]'),
  };
  for (const [k, v] of Object.entries(variants)) {
    let m, s, j;
    try { const x = B.matchBaseline(r, v); m = `known=${x.knownCount} new=${x.newCount} stale=${x.staleCount}`; } catch (er) { m = 'THROW ' + (er.code || '') + ' ' + er.message.slice(0, 90); }
    try { s = JSON.parse(renderSarifReport(r, { baselineEntries: v })).runs[0].results.filter(z => z.level === 'error').length; } catch (er) { s = 'THROW'; }
    try { j = (renderJunitReport(r, { baselineEntries: v }).match(/failures="(\d+)"/) || [])[1]; } catch (er) { j = 'THROW'; }
    console.log(k.padEnd(14), m, '| sarif errors', s, '| junit failures', j);
  }
  try { console.log('migrate', JSON.stringify(B.migrateBaselineEntries(variants.file)).slice(0, 200)); } catch (er) { console.log('migrate THROW', er.message); }
  try { console.log('migrate proto', JSON.stringify(B.migrateBaselineEntries(variants.protoRule)).slice(0, 200)); } catch (er) { console.log('migrate THROW', er.message); }
})();
