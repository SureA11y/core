const { packScript, definePack } = require('/home/user/core-r8/src/pack.js');
const mk = (code, extra = {}) => ({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '*', rules: [{ id: 'acme-r', meta: { title: 'T</script><script>alert(1)</script>', description: 'd x', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: (0, eval)('(' + code + ')') }], ...extra });
const cases = {
  closeTag: `function(){ var s = '</script><script>alert(1)</script>'; return { outcome: 'pass', occurrences: [] }; }`,
  closeTagUpper: `function(){ var s = '</SCRIPT >'; return { outcome: 'pass', occurrences: [] }; }`,
  commentOpen: `function(){ var s = '<!-- <script>'; return { outcome: 'pass', occurrences: [] }; }`,
  commentSplit: `function(){ var s = '<!-' + '- <scr' + 'ipt>'; return { outcome: 'pass', occurrences: [] }; }`,
  regexLiteral: `function(){ var r = /<\\/script>/; return { outcome: 'pass', occurrences: [] }; }`,
  templateLit: 'function(){ var s = `<!--${"x"}<script`; return { outcome: "pass", occurrences: [] }; }',
  lineSep: 'function(){ var s = " "; return { outcome: "pass", occurrences: [] }; }',
  dictScript: { code: `function(){ return { outcome: 'pass', occurrences: [] }; }`, extra: { dictionaries: { en: { acme_x: '<!-- <script>' } } } },
  dictClose: { code: `function(){ return { outcome: 'pass', occurrences: [] }; }`, extra: { dictionaries: { en: { acme_x: '</script>' } } } },
};
for (const [k, c] of Object.entries(cases)) {
  const code = typeof c === 'string' ? c : c.code, extra = typeof c === 'string' ? {} : c.extra;
  let out; try { const s = packScript([mk(code, extra)]); out = 'ok len=' + s.length + ' rawClose=' + /<\/script/i.test(s) + ' rawCommentOpen=' + s.includes('<!--') + ' rawScriptOpen=' + /<script/i.test(s); } catch (e) { out = 'THROW ' + e.message.slice(0, 160); }
  console.log(k.padEnd(14), out);
}
