const { scan, pack } = require('./h.js');
const { mk } = require('./p.js');
const HTML = '<!doctype html><html lang=en><head><title>t</title></head><body><main><p style="color:#666;background:#fff">5.7 to 1 text</p></main></body></html>';
for (const [n, v] of [['7', 7], ['NaN', NaN], ['Infinity', Infinity], ['-1', -1], ['0', 0], ['1e9', 1e9]]) {
  const p = pack.definePack(mk({ variants: [{ id: 'acme-cv', from: 'contrast-minimum', config: { normalTextRatio: v }, meta: { title: 'cv', tags: ['acme'], i18n: { titleKey: 'acmeCv_title', descriptionKey: 'acmeCv_description' } } }] }));
  const r = scan({ packs: [p] }, ['acme-cv'], HTML);
  const c = r.v.checksResults.find((c) => c.ruleId === 'acme-cv');
  console.log('normalTextRatio', n, '->', c.outcome, JSON.stringify(c.occurrences.map((o) => o.data && o.data.details && (o.data.details.requiredRatio || o.data.details.threshold || o.data.details)).slice(0, 1)).slice(0, 200));
}
