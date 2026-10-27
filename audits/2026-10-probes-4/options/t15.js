const { scan, capture, pack } = require('./h.js');
const { mk } = require('./p.js');
const HTML = '<!doctype html><html lang=en><head><title>t</title></head><body><main><p style="color:#777;background:#fff">low contrast text</p><p style="color:#000;background:#fff">ok</p></main></body></html>';
const variant = (config) => mk({ variants: [{ id: 'acme-cv', from: 'contrast-minimum', config, meta: { title: 'cv', tags: ['acme'], i18n: { titleKey: 'acmeCv_title', descriptionKey: 'acmeCv_description' } } }] });
for (const [n, cfg] of Object.entries({ nan: { normalTextRatio: NaN }, inf: { normalTextRatio: Infinity }, neg: { normalTextRatio: -1 }, zero: { normalTextRatio: 0 }, str: { normalTextRatio: '7' }, unknownKey: { foo: 1 }, proto: JSON.parse('{"__proto__": {"normalTextRatio": 1}}'), huge: { normalTextRatio: 1e308 }, ok7: { normalTextRatio: 7, largeTextRatio: 4.5 }, none: undefined, nullcfg: null, arr: [] })) {
  const d = capture(() => pack.definePack(variant(cfg)));
  const r = scan({ packs: [d.ok ? d.v : variant(cfg)] }, null, HTML);
  const o = (id) => r.ok ? (r.v.checksResults.find((c) => c.ruleId === id) || {}) : {};
  console.log(n, '| define:', d.ok ? 'ok' : d.msg.slice(0, 160), '| scan:', r.ok ? (r.v.skippedPacks ? 'skipped: ' + r.v.skippedPacks[0].reason.slice(0, 160) : 'cv=' + o('acme-cv').outcome + ' n=' + (o('acme-cv').occurrences || []).length + ' err=' + (o('acme-cv').error || '') + ' | cm=' + o('contrast-minimum').outcome) : 'THROW ' + r.msg.slice(0, 200));
}
// applicability edge cases
