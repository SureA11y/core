'use strict';
// Renders stored pack-scan results (10a) in a process that never loads a
// pack, then with the standards block tampered with. Prints, per variant,
// what each reporter says about the pack's standard: the HTML sections, the
// rows labelled as WCAG criteria, SARIF tags, JUnit properties, and whether a
// reporter threw.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const R = (m) => require(path.join(ROOT, 'src', m));
const { renderHtmlReport } = R('report.js');
const { renderSarifReport } = R('sarif.js');
const { renderJunitReport } = R('junit.js');
const { renderEarlReport } = R('earl.js');
const { buildBaselineEntries } = R('baseline.js');
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'out', f), 'utf8'));

function summarize(result) {
  const out = {};
  const run = (k, fn) => { try { return fn(); } catch (e) { out[k + 'Throws'] = e.message.slice(0, 160); return null; } };
  const html = run('html', () => renderHtmlReport(result));
  if (html) {
    out.h2 = [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]).filter((t) => !/Worth|Scorecard|Occurrences|Frames/.test(t));
    // rows whose first cell claims a WCAG criterion that is not one (S1, acme-item...)
    out.fakeWcagRows = [...html.matchAll(/<td class="sc-cell">WCAG ([^<]*)</g)].map((m) => m[1]).filter((sc) => !/^\d+\.\d+\.\d+$/.test(sc));
    out.unmappedRows = (html.match(/sc-cell">[^<]*Not mapped|sc-cell">[^<]*Unmapped/gi) || []).length;
    out.titlesInRollups = [...html.matchAll(/<td class="sc-cell">([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/g)].filter((m) => /S\d|acme/i.test(m[1] + m[2])).map((m) => `${m[1]} | ${m[2]}`).slice(0, 4);
    out.cards = [...html.matchAll(/<span class="card-title"><strong>([^<]*)<\/strong>/g)].map((m) => m[1]);
  }
  const sarif = run('sarif', () => JSON.parse(renderSarifReport(result)));
  if (sarif) {
    const tags = new Set();
    for (const r of sarif.runs[0].tool.driver.rules) for (const t of (r.properties && r.properties.tags) || []) if (/^(sample|acme)/.test(t)) tags.add(t);
    out.sarifStdTags = [...tags].sort().slice(0, 6);
    out.sarifRuleDescs = sarif.runs[0].tool.driver.rules.filter((r) => /^(sample|acme)-/.test(r.id)).map((r) => `${r.id}: ${r.shortDescription.text}`);
  }
  const junit = run('junit', () => renderJunitReport(result));
  if (junit) {
    out.junitStdProps = [...new Set([...junit.matchAll(/<property name="([^"]*)"/g)].map((m) => m[1]))].filter((n) => !/^(wcag|engine|url|env|locale|profile)/i.test(n)).slice(0, 8);
    out.junitFailures = (junit.match(/<testsuites[^>]*failures="(\d+)"/) || [])[1];
  }
  run('earl', () => renderEarlReport(result));
  run('baseline', () => buildBaselineEntries(result));
  return out;
}

const variants = {
  'as stored': (r) => r,
  'standards deleted': (r) => { delete r.standards; return r; },
  'standards = {} (object)': (r) => ({ ...r, standards: {} }),
  'standards = "x"': (r) => ({ ...r, standards: 'x' }),
  'standards = []': (r) => ({ ...r, standards: [] }),
  'entry without standard name': (r) => ({ ...r, standards: r.standards.map((s) => ({ key: s.key })) }),
  'entry with wrong types': (r) => ({ ...r, standards: r.standards.map((s) => ({ key: 1, standard: ['x'], note: { a: 1 } })) }),
  'entry renamed (standard differs from rollups)': (r) => ({ ...r, standards: r.standards.map((s) => ({ ...s, standard: s.standard + ' v2' })) }),
  'entry named WCAG': (r) => ({ ...r, standards: r.standards.map((s) => ({ ...s, standard: 'WCAG' })) }),
  'entries duplicated': (r) => ({ ...r, standards: r.standards.concat(r.standards) }),
  'null entries': (r) => ({ ...r, standards: [null, ...r.standards, 7] }),
  'extra unknown standard': (r) => ({ ...r, standards: r.standards.concat([{ key: 'ghost', standard: 'Ghost Standard', note: 'n' }]) }),
  'rollup meta.standard removed': (r) => ({ ...r, rulesResults: r.rulesResults.map((x) => (x.meta && x.meta.standard ? { ...x, meta: { ...x.meta, standard: undefined } } : x)) }),
  'rollup mapping level __proto__': (r) => ({ ...r, rulesResults: r.rulesResults.map((x) => (x.meta && x.meta.standard ? { ...x, meta: { ...x.meta, normativeMappings: [{ requirement: 'S1', level: '__proto__' }] } } : x)) }),
  'rollup checksIds a string': (r) => ({ ...r, rulesResults: r.rulesResults.map((x) => (x.meta && x.meta.standard ? { ...x, data: { details: { ...x.data.details, checksIds: 'img-alt-present' } } } : x)) })
};

for (const file of process.argv.slice(2).length ? process.argv.slice(2) : ['10-sample.json', '10-checklist.json', '10-both.json']) {
  for (const [label, fn] of Object.entries(variants)) {
    if (/compact/.test(file) && label !== 'as stored') continue;
    console.log(`--- ${file} / ${label}\n` + JSON.stringify(summarize(fn(load(file))), null, 1));
  }
}
