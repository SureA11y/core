// inspect('names') lists roles from getRoleInfo: <select multiple>, size>1,
// <td> in a grid, <input type=number list>, etc.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const { chromium } = req('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(`<main><select id="s1" multiple aria-label="Multi"><option>a</option></select><select id="s2" size="4" aria-label="Sized"><option>a</option></select><select id="s3" aria-label="Drop"><option>a</option></select><input id="i1" type="password" aria-label="Pw"><table role="grid" aria-label="g"><tr><td id="c1" tabindex="0">cell</td></tr></table><div id="h1" role="none" tabindex="0">x</div><a id="a1">no href</a><h2 id="hh" role="none" tabindex="-1">Heading</h2></main>`);
await p.addScriptTag({ content: BUNDLE });
const out = await p.evaluate(async () => {
  const logs = [];
  const orig = console.table;
  console.table = (rows) => logs.push(rows);
  try { await window.a11ycore.inspect('names'); await window.a11ycore.inspect('headings'); } finally { console.table = orig; }
  return logs;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
