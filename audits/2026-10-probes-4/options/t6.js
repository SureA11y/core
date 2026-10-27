const { scan, pack, capture } = require('./h.js');
const { mk } = require('./p.js');
const rule = (tags, wcagSc) => ({ id: 'aaa-r', meta: { title: 'r', tags, wcagSc }, runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } });
const variants = {
  'ns-tag, wcagSc, no checklist': mk({ name: '@aaa/p', namespace: 'aaa' }, [rule(['aaa'], ['1.1.1'])]),
  'ns-tag, wcagSc, checklist': mk({ name: '@aaa/p', namespace: 'aaa', profiles: { 'aaa-p': { tags: [] } } }, [rule(['aaa'], ['1.1.1'])]),
  'ns-tag, wcagSc 1.4.3, checklist': mk({ name: '@aaa/p', namespace: 'aaa', profiles: { 'aaa-p': { tags: [] } } }, [rule(['aaa'], ['1.4.3'])]),
  'no ns-tag, wcagSc, checklist': mk({ name: '@aaa/p', namespace: 'aaa', profiles: { 'aaa-p': { tags: [] } } }, [rule(['wcag2a'], ['1.1.1'])]),
  'ns-tag, no wcagSc, checklist': mk({ name: '@aaa/p', namespace: 'aaa', profiles: { 'aaa-p': { tags: [] } } }, [rule(['aaa'], [])]),
};
for (const [name, p] of Object.entries(variants)) {
  const d = capture(() => pack.definePack(p));
  const c = pack.checkPack(p);
  const r = scan({ packs: [d.ok ? d.v : p], profile: 'aaa-p' });
  console.log(name, '| define:', d.ok ? 'ok' : d.msg, '| checkPack:', JSON.stringify(c), '| scan:', r.ok ? JSON.stringify(r.v.skippedPacks || 'ran') : r.msg);
}
