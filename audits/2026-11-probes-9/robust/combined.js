'use strict';
// Builds one page from many fixtures' bodies (scripts dropped), for fuzzing.
const fs = require('node:fs');
const path = require('node:path');
const DIR = '/home/user/core-r9/tests/fixtures';

function combined(filter = () => true) {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('-all-scenarios.html')).filter(filter).sort();
  let styles = '';
  let bodies = '';
  for (const f of files) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    const st = html.match(/<style[\s\S]*?<\/style>/gi) || [];
    styles += st.join('\n');
    const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let b = m ? m[1] : '';
    b = b.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<meta[^>]*>/gi, '');
    bodies += `<section data-fixture="${f}">${b}</section>\n`;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Combined fixtures</title>${styles}</head><body>${bodies}</body></html>`;
}
module.exports = { combined };
if (require.main === module) {
  const out = combined();
  fs.writeFileSync('/tmp/surea11y-audit/r9/robust/combined.html', out);
  console.log(out.length);
}
