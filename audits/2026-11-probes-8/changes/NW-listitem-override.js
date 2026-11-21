// listitem-parent-valid: <ul role=X><li> for several roles, jsdom
const { runa11yCoreOnHtml } = require(process.env.CORE || '/home/user/core-r8/src/testing.js');
for (const role of ['none', 'presentation', 'navigation', 'group', 'list', 'LIST', 'directory', 'foo list', 'menu', 'tablist', 'listbox', 'generic', 'region']) {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><ul role="${role}" aria-label="n"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul></main></body></html>`;
  const r = runa11yCoreOnHtml(html, { runOnly: ['listitem-parent-valid', 'aria-required-children', 'aria-required-parent'] });
  console.log(role.padEnd(14), r.checksResults.map(c => c.ruleId.replace(/-(valid|children|parent)$/, '') + '=' + c.outcome + ' ' + [...new Set(c.occurrences.map(o => (o.data.details.reasonCode || '') + (o.lean ? '/' + o.lean.toward : (o.data.details.lean ? '/' + o.data.details.lean.toward : ''))))].join(',')).join(' | '));
}
