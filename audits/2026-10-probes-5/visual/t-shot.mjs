// node t-shot.mjs file.html out.png [selector]
import { launch } from './probe.mjs';
import fs from 'node:fs';
const b = await launch();
const page = await b.newPage({ viewport: { width: 600, height: 300 } });
await page.goto('data:text/html,' + encodeURIComponent(fs.readFileSync(process.argv[2], 'utf8')));
await page.waitForTimeout(100);
await page.screenshot({ path: process.argv[3], animations: 'disabled' });
await b.close();
