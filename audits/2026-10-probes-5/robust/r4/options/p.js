const { pack } = require('./h.js');
const { version } = require('/home/user/core/package.json');
function mk(over = {}, rules) {
  return {
    name: '@acme/a11y-rules', version: '1.2.0', namespace: 'acme', core: '^' + version,
    rules: rules || [{ id: 'acme-r', meta: { title: 'R', tags: ['acme'] }, runInPage(ctx) { return { outcome: 'pass' }; } }],
    ...over
  };
}
module.exports = { mk, version };
