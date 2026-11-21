const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"></main></body></html>';
(async () => {
  const warns = []; console.warn = (...a) => warns.push(String(a[0]).slice(0, 150)); console.info = () => {};
  for (const [k, prof] of Object.entries({ hole: ['wcag22-aa', , 'wcag21-aa'], nullItem: ['wcag22-aa', null, 'wcag21-aa'], emptyStr: ['wcag22-aa', '', 'wcag21-aa'], blank: ['wcag22-aa', '  '], num: ['wcag22-aa', 5] })) {
    for (const strict of [false, true]) {
      warns.length = 0; let line;
      try { const r = await runa11yCoreOnHtml(html, { engineOptions: { profile: prof, strictOptions: strict } }); line = 'ok profiles=' + JSON.stringify(r.engine.profiles) + ' notRun=' + JSON.stringify(r.engine.profilesNotRun); } catch (e) { line = 'THROW ' + e.code + ' ' + e.message.slice(0, 120); }
      console.log(k.padEnd(9), 'strict=' + strict, line, warns.length ? '| warns: ' + warns.join(' | ') : '| no warning');
    }
  }
})();
