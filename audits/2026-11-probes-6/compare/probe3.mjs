import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/core/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent('<table><tr><th>Item</th><td>Price</td></tr><tr><td>Tea</td><td>2.00</td></tr></table>');
const snap = await p.locator('table').ariaSnapshot();
console.log(snap);
await b.close();
