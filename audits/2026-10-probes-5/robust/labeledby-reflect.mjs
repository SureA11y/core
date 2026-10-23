// Does Chromium's ariaLabelledByElements reflect the misspelled aria-labeledby attribute?
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
await p.setContent('<button id="i" aria-labeledby="v"></button><span id="v">Save</span>');
console.log(await p.evaluate(() => JSON.stringify({ attr: i.getAttribute('aria-labelledby'), labeled: i.getAttribute('aria-labeledby'), reflected: (i.ariaLabelledByElements || []).map(e => e.id) })));
await b.close();
