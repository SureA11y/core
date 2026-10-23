const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/page.html', 'utf8');
for (const [name, eo] of Object.entries({
  en301549: { profile: 'en301549-v4.1.1' },
  en3: { profile: 'en301549-v3.2.1' },
  s508: { profile: 'section508' },
  allmap: { mappings: ['en301549'] },
  w21: { wcagVersion: '2.1' },
})) {
  try {
    const r = run(html, { url: 'https://example.test/', engineOptions: { ...eo, timestamp: '2026-01-01T00:00:00.000Z' } });
    fs.writeFileSync(`result.${name}.json`, JSON.stringify(r));
    console.log(name, r.checksResults.length, r.rulesResults.length, JSON.stringify(r.engine).slice(0, 300));
  } catch (e) { console.log(name, 'ERR', e.message); }
}
