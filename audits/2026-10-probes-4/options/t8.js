const { pack, capture } = require('./h.js');
const { mk } = require('./p.js');
const evil = 'a</script><script>alert(1)</script>  `${x}`\\ <!-- <script> -->';
const P = (extra, rules) => capture(() => pack.packScript([pack.definePack(mk(extra, rules))]));
const show = (n, r) => console.log(n, r.ok ? 'ok len=' + r.v.length + ' hasRawScriptClose=' + /<\/script/i.test(r.v) + ' hasCommentOpen=' + /<!--/.test(r.v) + ' hasScriptOpen=' + /<script/i.test(r.v) : 'THROW ' + r.msg.slice(0, 250));
show('evil messages', P({ dictionaries: { en: { acmeR_title: evil } } }, [{ id: 'acme-r', meta: { title: evil, description: evil, tags: ['acme'], i18n: { titleKey: 'acmeR_title' } }, runInPage() { return { outcome: 'pass' }; } }]));
show('evil title/desc', P({ title: evil, description: evil }));
show('rule code with <!--<script', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { const s = '<!--<script>'; return { outcome: 'pass', data: { s } }; } }]));
show('rule code with </SCRIPT', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { return { outcome: 'pass', data: '</SCRIPT >' }; } }]));
show('rule code with <\\/script', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { return { outcome: 'pass', data: '<\/script>' }; } }]));
show('rule code with U+2028 in string', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { return { outcome: 'pass', data: ' ' }; } }]));
show('rule code with backtick template', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage(ctx) { const x = 1; return { outcome: 'pass', data: `${x}\`` }; } }]));
show('rule meta data with </script', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, data: { s: '</script>' }, runInPage() { return { outcome: 'pass' }; } }]));
show('probes doc with </script', P({ probes: { 'a.b': { description: '</script> ', readBy: ['acme-r'] } } }));
show('rollup title </script', P({ profiles: { 'acme-p': { tags: [] } }, rollups: [{ id: 'acme-x', title: '</script> ${`', checksIds: ['acme-r'] }] }));
// method named with weird names
const m = { ['run' + 'InPage'](ctx) { return { outcome: 'pass' }; } };
show('computed method', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: m.runInPage }]));
const g = { get x() { return 1; } }; const getter = Object.getOwnPropertyDescriptor(g, 'x').get;
show('getter as runInPage', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: getter }]));
class K { static runInPage() { return { outcome: 'pass' }; } }
show('static method', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: K.runInPage }]));
show('class as runInPage', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: class X {} }]));
show('generator', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: function* () {} }]));
const o2 = { async *runInPage() {} };
show('async gen method', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o2.runInPage }]));
const o3 = { 'quoted name'(ctx) { return { outcome: 'pass' }; } };
show('quoted method name', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o3['quoted name'] }]));
const o4 = { 123(ctx) { return { outcome: 'pass' }; } };
show('numeric method name', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o4[123] }]));
const s = Symbol('runInPage'); const o5 = { [s](ctx) { return { outcome: 'pass' }; } };
show('symbol method name', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o5[s] }]));
const fnRenamed = function (ctx) { return { outcome: 'pass' }; }; Object.defineProperty(fnRenamed, 'name', { value: ']; alert(1); [' });
show('renamed fn name', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: fnRenamed }]));
const o6 = { runInPage(ctx) { return { outcome: 'pass' }; } }; Object.defineProperty(o6.runInPage, 'name', { value: 'other' });
show('method with renamed name', P({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o6.runInPage }]));
