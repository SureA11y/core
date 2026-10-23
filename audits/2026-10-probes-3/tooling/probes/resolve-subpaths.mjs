// Imports every subpath export (ESM) from the consumer folder given as argv[2].
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const base = pathToFileURL(path.join(path.resolve(process.argv[2]), 'x.mjs')).href;
const subs = ['', '/baseline', '/report', '/sarif', '/junit', '/earl', '/en301549', '/wcag', '/pack', '/testing', '/eslint-plugin', '/pack-docs', '/browser', '/i18n/fr', '/package.json'];
for (const s of subs) {
  try {
    const url = import.meta.resolve('@surea11y/core' + s, base);
    const m = await import(url, s === '/package.json' ? { with: { type: 'json' } } : undefined);
    console.log('esm ok', s || '.', Object.keys(m).join(',').slice(0, 90));
  } catch (e) { console.log('esm FAIL', s, e.message.split('\n')[0]); }
}
