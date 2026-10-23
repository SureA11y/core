'use strict';
// A checklist's title becomes its standard's name. Titles equal to a core
// standard's name: accepted? What does a result under its profile say?
const path = require('path');
const { scan, quiet, base, report, ROOT } = require('./lib.js');
const { renderHtmlReport } = require(path.join(ROOT, 'src/report.js'));
for (const title of ['EN 301 549', 'WCAG']) {
  const pack = base({ name: 't', namespace: 'tt', title, profiles: { 'tt-p': { tags: ['wcag2a'] } },
    rollups: [{ id: 'tt-r', title: 'R', checksIds: ['img-alt-present'] }] });
  const { r, error } = quiet(() => scan({ packs: [pack], profile: 'tt-p', mappings: ['en301549'] }));
  if (error) { report(title, 'THROWS ' + error.message); continue; }
  const html = renderHtmlReport(r);
  report(`title "${title}"`, { packs: r.engine.packs, skipped: r.skippedPacks, standards: r.standards,
    ttR: (r.rulesResults.find((x) => x.ruleId === 'tt-r') || {}).meta && r.rulesResults.find((x) => x.ruleId === 'tt-r').meta.standard,
    reportSections: (html.match(/<h2>[^<]*rollup<\/h2>/g) || []) });
}
