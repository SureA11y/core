'use strict';
// The same packs and page in Node (jsdom, runDomRulesInPage with the pack
// objects) and in Chromium (bundle + packScript, names). Rule outcomes,
// occurrence counts, rollups and the standards block are compared.
const path = require('path');
const L = require('./lib');
const sample = require(path.join(L.ROOT, 'tests/fixtures/packs/sample.js'));
const { packScript } = L.packApi;

const checklist = L.packApi.definePack({
  name: '@acme/policy', version: '2.0.0', namespace: 'acme', core: '*', title: 'Acme Policy',
  rules: [
    L.rule('acme-generic-link', (ctx) => {
      const links = ctx.helpers.queryAllSmart('a[href]');
      if (!links.length) return { outcome: 'notApplicable' };
      const occurrences = [];
      for (const a of links) {
        const name = ctx.helpers.getAccessibleNameInfo(a, ctx);
        const text = String((name && name.value) || (ctx.helpers.getContentNameInfo(a, ctx) || {}).value || '').trim().toLowerCase();
        if (/^(click here|read more|here)$/.test(text)) occurrences.push(ctx.helpers.reportOccurrence(a, { summary: 'generic: ' + text }));
      }
      return occurrences.length ? { outcome: 'fail', occurrences } : { outcome: 'pass' };
    }, { tags: ['acme'], defaultSeverity: 'moderate' })
  ],
  profiles: { 'acme-policy': { tags: ['wcag2a', 'wcag2aa'], rules: ['region'], severity: { 'img-alt-present': 'critical' } } },
  rollups: [{ id: 'acme-links', title: 'Links', checksIds: ['link-name-present', 'acme-generic-link'] }]
});

const HTML = `<!doctype html><html><head><title>Parity</title></head><body>
<a href="#main">Skip</a>
<header><nav><a href="/a">click here</a><a href="/b">Read more</a><a href="/c"></a></nav></header>
<main id="main"><h1>T</h1><h3>skip</h3>
<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="photo">
<form><input id="x" type="text"><label>Name <input type="text"></label><input type="text" id="x">
<select><option>a</option></select><button></button></form>
<table><tr><th>h</th></tr><tr><td>d</td></tr></table>
<div role="button">fake</div><div aria-hidden="true"><a href="/h">hidden link</a></div>
<ul><li>a</li><div>bad child</div></ul>
<p lang="xx-invalid">lang</p><iframe src="about:blank"></iframe>
<video src="v.mp4" autoplay></video>
<p style="color:#767676;background:#fff">Grey text</p><p style="color:#595959;background:#fff">darker</p>
</main><footer><a href="https://example.org">Statement</a></footer></body></html>`;

const cases = [
  { label: 'control: no packs', packs: [], eo: {} },
  { label: 'sample standard, profile sample-1.0', packs: [sample], eo: { profile: 'sample-1.0' } },
  { label: 'checklist, profile acme-policy', packs: [checklist], eo: { profile: 'acme-policy' } },
  { label: 'both packs, no profile', packs: [sample, checklist], eo: {} },
  { label: 'both packs, mappings sample, locale fr', packs: [sample, checklist], eo: { mappings: ['sample'], locale: 'fr' } }
];

const pick = (r) => ({
  acme: JSON.stringify((r.checksResults.find((c) => c.ruleId === 'acme-generic-link') || {}).outcome),
  checks: Object.fromEntries(r.checksResults.map((c) => [c.ruleId, `${c.outcome}/${(c.occurrences || []).length}/${c.severity}`])),
  rollups: Object.fromEntries((r.rulesResults || []).map((c) => [c.ruleId, c.outcome])),
  standards: JSON.stringify(r.standards),
  packs: JSON.stringify(r.engine.packs || null),
  profile: r.engine.profile
});

(async () => {
  await L.withBrowser(async (b) => {
    for (const c of cases) {
      const node = pick(L.scanNode({ ...(c.packs.length ? { packs: c.packs } : {}), ...c.eo }, { html: HTML }));
      const { page, context } = await L.openPage(b, { html: HTML });
      await page.addScriptTag({ content: L.BUNDLE });
      if (c.packs.length) await page.addScriptTag({ content: packScript(c.packs) });
      const names = c.packs.map((p) => `${p.name}@${p.version}`);
      const web = pick(await L.scanInPage(page, names.length ? names : null, c.eo));
      await context.close();
      const diff = [];
      for (const k of new Set([...Object.keys(node.checks), ...Object.keys(web.checks)])) if (node.checks[k] !== web.checks[k]) diff.push(`check ${k}: node ${node.checks[k]} | chromium ${web.checks[k]}`);
      for (const k of new Set([...Object.keys(node.rollups), ...Object.keys(web.rollups)])) if (node.rollups[k] !== web.rollups[k]) diff.push(`rollup ${k}: node ${node.rollups[k]} | chromium ${web.rollups[k]}`);
      for (const k of ['acme', 'standards', 'packs', 'profile']) if (node[k] !== web[k]) diff.push(`${k}: node ${node[k]} | chromium ${web[k]}`);
      L.log(c.label, { acme: node.acme, nodeChecks: Object.keys(node.checks).length, webChecks: Object.keys(web.checks).length, diff });
    }
  });
})();
