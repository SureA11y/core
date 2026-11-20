// Runs every case through surea11y (committed browser bundle), axe-core,
// IBM accessibility-checker-engine, Siteimprove Alfa and HTML_CodeSniffer
// in Chromium, and writes results.json.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const coreRequire = createRequire('/home/user/core/package.json');
const { chromium } = coreRequire('playwright');
const cases = require('./cases.js');

const { Playwright } = await import('@siteimprove/alfa-playwright');
const alfaRule = async (id) => {
  const f = path.join(here, 'node_modules/@siteimprove/alfa-rules/dist', id, 'rule.js');
  if (!fs.existsSync(f)) return null;
  return (await import(f)).default;
};

const OURS = '/home/user/core/surea11y.browser.js';
const AXE = require.resolve('axe-core/axe.min.js');
const ACE = path.join(here, 'node_modules/accessibility-checker-engine/ace.js');
const HTMLCS = path.join(here, 'node_modules/html_codesniffer/build/HTMLCS.js');

const GROUPS = {
  reflow: {
    viewport: { width: 320, height: 640 },
    ours: ['reflow-horizontal-scroll'],
    axe: ['meta-viewport', 'meta-viewport-large', 'scrollable-region-focusable'],
    ibm: ['style_viewport_resizable', 'meta_viewport_zoomable', 'element_scrollable_tabbable'],
    alfa: ['sia-r47', 'sia-r83', 'sia-dr83', 'sia-r84'],
    htmlcs: /1_4_10|1_4_4/
  },
  tdHeader: {
    ours: ['td-has-header'],
    axe: ['td-has-header', 'th-has-data-cells'],
    ibm: ['table_headers_exists', 'table_headers_related'],
    alfa: ['sia-r77', 'sia-r46'],
    htmlcs: /H43|H63|H39|H51|H73/
  },
  pAsHeading: {
    ours: ['p-as-heading'],
    axe: ['p-as-heading'],
    ibm: ['text_block_heading'],
    alfa: [],
    htmlcs: /H42/
  },
  linkOnly: {
    ours: ['link-name-quality-link-only', 'link-name-quality'],
    axe: ['identical-links-same-purpose', 'link-name'],
    ibm: ['a_text_purpose'],
    alfa: ['sia-r11', 'sia-r41', 'sia-r81'],
    htmlcs: /2_4_9|2_4_4/
  },
  headings: {
    ours: ['heading-order', 'page-has-heading-one'],
    axe: ['heading-order', 'page-has-heading-one'],
    ibm: ['heading_markup_misuse'],
    alfa: ['sia-r53', 'sia-r61'],
    htmlcs: /G141|H42/
  },
  exclude: {
    ours: ['img-alt-present', 'heading-order', 'page-has-heading-one', 'td-has-header', 'link-name-quality-link-only'],
    axe: ['image-alt', 'heading-order', 'page-has-heading-one', 'td-has-header', 'th-has-data-cells'],
    ibm: [],
    alfa: [],
    htmlcs: /H37|G141|H43|H63|2_4_9/
  }
};

const summarizeOurs = (r) => {
  if (!r) return 'missing';
  const occ = (r.occurrences || []).map(
    (o) =>
      `${o.occurrenceOutcome ?? r.outcome}:${o.data?.details?.reasonCode ?? o.reasonCode ?? '?'}${o.lean ? '~' + o.lean.toward : ''}`
  );
  const counts = {};
  for (const o of occ) counts[o] = (counts[o] || 0) + 1;
  let s = r.outcome + (occ.length ? ' [' + Object.entries(counts).map(([k, v]) => (v > 1 ? `${k} x${v}` : k)).join(', ') + ']' : '');
  if (r.excludedOccurrences) s += ' excluded=' + JSON.stringify(r.excludedOccurrences);
  return s;
};

async function runCase(browser, group, cfg, [id, desc, html, expected, excludeSel]) {
  const out = { id, desc, expected, group };
  const vp = cfg.viewport || { width: 1280, height: 800 };
  const page = await browser.newPage({ viewport: vp });
  await page.setContent(html);

  // Chromium's own view of headings (ground truth for levels)
  if (group === 'headings' || group === 'exclude') {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    out.chromium = nodes
      .filter((n) => n.role?.value === 'heading' && !n.ignored)
      .map((n) => `${n.name?.value}:L${(n.properties || []).find((p) => p.name === 'level')?.value?.value}`)
      .join(' ');
  }
  if (group === 'reflow') {
    out.chromium = await page.evaluate(() => {
      const se = document.scrollingElement;
      return `scrollWidth=${se.scrollWidth} clientWidth=${se.clientWidth}`;
    });
  }

  // ours
  await page.addScriptTag({ path: OURS });
  const engineOptions = excludeSel ? { excludeSelectors: [excludeSel] } : {};
  out.ours = await page.evaluate(
    ([ids, eo]) => {
      const res = window.a11ycore.runa11yCoreInPage(null, null, eo, ids);
      const pick = {};
      for (const r of res.checksResults) if (ids.includes(r.ruleId)) pick[r.ruleId] = r;
      return pick;
    },
    [cfg.ours, engineOptions]
  );
  for (const k of Object.keys(out.ours)) out.ours[k] = { summary: summarizeOurs(out.ours[k]), raw: { outcome: out.ours[k].outcome, occurrences: (out.ours[k].occurrences || []).map((o) => ({ html: String(o.html || '').slice(0, 120), outcome: o.occurrenceOutcome ?? out.ours[k].outcome, code: o.data?.details?.reasonCode, lean: o.lean?.toward, details: o.data?.details })), excludedOccurrences: out.ours[k].excludedOccurrences, error: out.ours[k].error } };

  // axe
  if (cfg.axe.length) {
    await page.addScriptTag({ path: AXE });
    out.axe = await page.evaluate(
      async ([ids, sel]) => {
        const ctx = sel ? { exclude: [[sel]] } : document;
        const r = await window.axe.run(ctx, { runOnly: { type: 'rule', values: ids } });
        const s = {};
        for (const id of ids) s[id] = 'n/a';
        for (const [kind, label] of [['passes', 'pass'], ['violations', 'fail'], ['incomplete', 'cantTell']])
          for (const rr of r[kind]) s[rr.id] = `${label}(${rr.nodes.length})` + (label !== 'pass' ? ' ' + rr.nodes.map((n) => n.target.join(' ')).join('|') : '');
        return s;
      },
      [cfg.axe, excludeSel]
    );
  }

  // HTML_CodeSniffer (pa11y's default runner); pa11y's hideElements filters issues afterwards
  if (cfg.htmlcs) {
    await page.addScriptTag({ path: HTMLCS });
    out.htmlcs = await page.evaluate(
      ([src, sel]) =>
        new Promise((resolve) => {
          window.HTMLCS.process('WCAG2AAA', document, () => {
            const re = new RegExp(src);
            const hidden = sel ? [...document.querySelectorAll(sel)] : [];
            const msgs = window.HTMLCS.getMessages()
              .filter((m) => re.test(m.code))
              .filter((m) => !hidden.some((h) => h === m.element || h.contains(m.element)));
            const counts = {};
            for (const m of msgs) {
              const k = `${['', 'E', 'W', 'N'][m.type]}:${m.code.split('.').slice(3).join('.')}`;
              counts[k] = (counts[k] || 0) + 1;
            }
            resolve(Object.entries(counts).map(([k, v]) => `${k}${v > 1 ? ' x' + v : ''}`).join('; ') || 'none');
          });
        }),
      [cfg.htmlcs.source, excludeSel]
    );
  }

  // IBM
  if (cfg.ibm.length) {
    await page.addScriptTag({ path: ACE });
    out.ibm = await page.evaluate(async (ids) => {
      const checker = new window.ace.Checker();
      const report = await checker.check(document, ['IBM_Accessibility']);
      const s = {};
      for (const id of ids) {
        const rs = report.results.filter((r) => r.ruleId === id);
        if (!rs.length) { s[id] = 'n/a'; continue; }
        const c = {};
        for (const r of rs) { const k = r.value[1] + (r.value[1] !== 'PASS' ? '(' + r.reasonId + ')' : ''); c[k] = (c[k] || 0) + 1; }
        s[id] = Object.entries(c).map(([k, v]) => `${k}${v > 1 ? ' x' + v : ''}`).join(', ');
      }
      return s;
    }, cfg.ibm);
  }

  // Alfa
  if (cfg.alfa.length) {
    const doc = await page.evaluateHandle(() => document);
    const alfaPage = await Playwright.toPage(doc);
    out.alfa = {};
    for (const id of cfg.alfa) {
      const rule = await alfaRule(id);
      if (!rule) { out.alfa[id] = 'no such rule'; continue; }
      try {
        const outcomes = [...(await rule.evaluate(alfaPage))];
        const c = {};
        for (const o of outcomes) { const k = o.toJSON().outcome; c[k] = (c[k] || 0) + 1; }
        out.alfa[id] = Object.entries(c).map(([k, v]) => `${k}${v > 1 ? ' x' + v : ''}`).join(', ') || 'inapplicable';
      } catch (e) {
        out.alfa[id] = 'error: ' + e.message.slice(0, 80);
      }
    }
  }
  await page.close();
  return out;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const only = process.argv[2];
for (const [group, list] of Object.entries(cases)) {
  if (only && only !== group) continue;
  for (const c of list) {
    try {
      const r = await runCase(browser, group, GROUPS[group], c);
      results.push(r);
      console.log(JSON.stringify({ id: r.id, ours: Object.fromEntries(Object.entries(r.ours).map(([k, v]) => [k, v.summary])), axe: r.axe, ibm: r.ibm, alfa: r.alfa, htmlcs: r.htmlcs, chromium: r.chromium }));
    } catch (e) {
      console.log(c[0], 'ERROR', e.stack.slice(0, 400));
      results.push({ id: c[0], error: String(e) });
    }
  }
}
await browser.close();
fs.writeFileSync(path.join(here, only ? `results-${only}.json` : 'results.json'), JSON.stringify(results, null, 1));
