// Per-rule time (perfStats) on one page for two bundles, summed over
// rounds; the rules whose time changed most.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const pages = require('./pages.js');
const bundles = { base: fs.readFileSync(__dirname + '/base.browser.js', 'utf8'), new: fs.readFileSync(__dirname + '/new.browser.js', 'utf8') };
const page = process.argv[2] || 'realistic';
const width = Number(process.argv[3] || 1280);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const sum = { base: {}, new: {} };
  let shape = null;
  for (let round = 0; round < 6; round++) for (const k of round % 2 ? ['new', 'base'] : ['base', 'new']) {
    const p = await b.newPage({ viewport: { width, height: 800 } });
    await p.setContent(pages[page]); await p.addScriptTag({ content: bundles[k] });
    const ps = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, null).perfStats);
    if (!shape) { shape = Object.keys(ps || {}); console.log('perfStats keys:', shape.join(', ')); }
    const rules = (ps && ps.ruleTimings) || {};
    const list = Array.isArray(rules) ? rules : Object.entries(rules).map(([id, v]) => ({ id, ...(typeof v === 'object' ? v : { ms: v }) }));
    for (const r of list) { const id = r.ruleId || r.id; const ms = r.ms ?? r.durationMs ?? r.totalMs ?? r.time ?? 0; sum[k][id] = (sum[k][id] || 0) + ms; }
    await p.close();
  }
  const ids = [...new Set([...Object.keys(sum.base), ...Object.keys(sum.new)])];
  const rows = ids.map((id) => [id, (sum.new[id] || 0) / 3 - (sum.base[id] || 0) / 3, (sum.base[id] || 0) / 3, (sum.new[id] || 0) / 3]).sort((a, b) => b[1] - a[1]);
  for (const [id, d, a, n] of rows.slice(0, 10)) console.log(id.padEnd(42), 'base', a.toFixed(1).padStart(7), ' new', n.toFixed(1).padStart(7), ' diff', d.toFixed(1));
  console.log('...'); for (const [id, d, a, n] of rows.slice(-3)) console.log(id.padEnd(42), 'base', a.toFixed(1).padStart(7), ' new', n.toFixed(1).padStart(7), ' diff', d.toFixed(1));
  await b.close();
})();
