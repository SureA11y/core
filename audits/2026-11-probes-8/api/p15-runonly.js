const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';
const getterThrow = {}; Object.defineProperty(getterThrow, 'tags', { get() { throw new Error('getter boom'); }, enumerable: true });
const cases = {
  wcagLower: { wcag: { version: '2.2', level: 'aa' } },
  wcagNumVersion: { wcag: { version: 2.2, level: 'AA' } },
  wcagVersion20: { wcag: { version: '2.0', level: 'A' } },
  wcagSpaces: { wcag: { version: ' 2.2 ', level: ' AA ' } },
  wcagExtraKey: { wcag: { version: '2.2', level: 'AA', foo: 1 } },
  wcagArr: { wcag: ['2.2', 'AA'] },
  wcagProtoKeys: { wcag: Object.create({ version: '2.2', level: 'AA' }) },
  bpString: { bestPractices: 'true' },
  bpOnlyFalseStrict: { bestPractices: false },
  tagsProto: { tags: ['__proto__'] },
  tagsCtor: { tags: 'constructor' },
  idsProto: { includeRuleIds: ['__proto__', 'img-alt-present'] },
  idsHasOwn: ['hasOwnProperty'],
  idsToString: 'toString',
  legacySet: { type: 'tag', values: new Set(['wcag2a']) },
  legacyTypeUpper: { type: 'TAG', values: ['wcag2a'] },
  legacyMap: { type: 'rule', values: new Map([['img-alt-present', 1]]) },
  getterThrow,
  proxyThrow: new Proxy({}, { get() { throw new Error('proxy boom'); }, ownKeys() { return ['tags']; }, getOwnPropertyDescriptor() { return { value: 1, enumerable: true, configurable: true }; } }),
  proxyOk: new Proxy({ tags: ['wcag2a'] }, {}),
  nullProto: Object.assign(Object.create(null), { tags: ['wcag2a'] }),
  hugeIds: { includeRuleIds: Array.from({ length: 200000 }, (_, i) => i ? 'nope' + i : 'img-alt-present') },
  longString: 'img-alt-present,' + 'x'.repeat(5_000_000),
  numberArr: [1, 2],
  nestedArr: [['img-alt-present']],
  symbol: [Symbol('x')],
  includeModeOr: { includeRuleIds: ['img-alt-present'], tags: ['wcag412'], includeMode: 'OR' },
  excludeAll: { excludeTags: ['wcag2a', 'wcag2aa', 'best-practice', 'wcag21aa', 'wcag21a', 'wcag22aa', 'wcag2aaa', 'wcag21aaa', 'experimental'] },
  compositeId: ['wcag-1.1.1'],
  compositeUpper: ['WCAG-1.1.1'],
  a11ycorePrefix: ['a11ycore-img-alt-present'],
  a11ycorePrefixUpper: ['A11YCORE-IMG-ALT-PRESENT'],
  optInTags: { optInTags: ['x'] },
  dateObj: new Date(),
  regex: /img/,
};
(async () => {
  console.warn = () => {}; console.info = () => {};
  for (const [k, ro] of Object.entries(cases)) {
    const t = Date.now(); let line, cat;
    try { const r = await runa11yCoreOnHtml(html, { runOnly: ro }); line = 'OK n=' + r.checksResults.length + ' wcagV=' + r.engine.wcagVersion + ' lvl=' + r.engine.wcagLevel; } catch (e) { line = 'THROW ' + (e.code || e.name) + ' ' + e.message.slice(0, 130); }
    try { cat = 'cat=' + core.getChecksForRunOnly(ro).length; } catch (e) { cat = 'catTHROW ' + (e.code || e.name); }
    console.log(k.padEnd(18), (Date.now() - t + 'ms').padEnd(7), cat.padEnd(18), line);
  }
})();
