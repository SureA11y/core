// Requires every subpath export (CJS) from the consumer folder given as argv[2].
const { createRequire } = require('module');
const path = require('path');
const req = createRequire(path.join(path.resolve(process.argv[2]), 'x.js'));
const subs = ['', '/baseline', '/report', '/sarif', '/junit', '/earl', '/en301549', '/wcag', '/pack', '/testing', '/eslint-plugin', '/pack-docs', '/browser', '/i18n/fr', '/i18n/de', '/i18n/es', '/i18n/ja', '/package.json'];
for (const s of subs) {
  try { const m = req('@surea11y/core' + s); console.log('cjs ok', s || '.', Object.keys(m).length); } catch (e) { console.log('cjs FAIL', s, e.message.split('\n')[0]); }
}
