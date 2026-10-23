'use strict';
// Every tag core's rules carry, used as a checklist namespace: which are
// accepted, and how many core rules each removes from a default scan.
const { scan, quiet, main } = require('./lib.js');
const plain = scan({}).checksResults.map((c) => c.ruleId);
const tags = new Set();
for (const d of main.getChecksCatalog()) for (const t of d.tags || []) tags.add(t);
const rows = [];
for (const ns of [...tags].sort()) {
  const pack = { name: `@x/${ns}`, version: '1.0.0', namespace: ns, core: '*',
    profiles: { [`${ns}-p`]: { tags: ['wcag2a'] } } };
  const { r, error } = quiet(() => scan({ packs: [pack] }));
  if (error) { rows.push([ns, 'throws']); continue; }
  if (r.skippedPacks) { rows.push([ns, 'skipped: ' + r.skippedPacks[0].reason.split('\n')[0].slice(0, 60)]); continue; }
  const now = r.checksResults.map((c) => c.ruleId);
  const lost = plain.filter((id) => !now.includes(id));
  rows.push([ns, `ACCEPTED, default scan loses ${lost.length} core rules${lost.length ? ': ' + lost.join(' ') : ''}`]);
}
for (const [ns, s] of rows) console.log(ns.padEnd(16), s);
