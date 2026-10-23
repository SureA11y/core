// Is every <textarea> a scrollable-region-focusable question? (UA style gives it overflow:auto)
import { open, scan, show } from './h.mjs';
import { createRequire } from 'node:module';
const runJsdom = createRequire('/home/user/core/package.json')('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const R = ['scrollable-region-focusable'];
const b = await open();
for (const html of [
  `<main><label>Comment <textarea></textarea></label></main>`,
  `<main><label>Comment <textarea disabled></textarea></label></main>`,
  `<main><div contenteditable aria-label=e style="overflow:auto">x</div></main>`
]) {
  for (let i = 0; i < 2; i++) console.log(show(html, await scan(b, html, { runOnly: R }), R).replace(/\n/g, ' |'));
  const j = runJsdom(html, { runOnly: R }).checksResults.find((c) => c.ruleId === R[0]);
  console.log('  jsdom:', j.outcome);
}
await b.close();
