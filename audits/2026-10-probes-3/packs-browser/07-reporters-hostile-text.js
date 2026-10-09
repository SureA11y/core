'use strict';
// Reporters fed by a pack whose texts are hostile: HTML/JS payloads, a
// javascript: helpUrl, bidi overrides, NUL and other XML-invalid characters,
// "]]>", very long strings. The pack runs in Chromium (packScript); the
// result is rendered by every reporter in Node, the HTML report is loaded in
// Chromium to see whether anything runs, SARIF is validated against the
// 2.1.0 schema, JUnit parsed by a strict XML parser.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { packScript, ruleMappedStandard } = L.packApi;
const R = (m) => require(path.join(L.ROOT, 'src', m));
const { renderHtmlReport } = R('report.js');
const { renderSarifReport } = R('sarif.js');
const { renderJunitReport } = R('junit.js');
const { renderEarlReport } = R('earl.js');
const { buildBaselineEntries, matchBaseline } = R('baseline.js');
const Ajv = require(path.join(L.ROOT, 'node_modules/ajv'));

const X = (tag) => `"'><img src=x onerror="window.__xss=(window.__xss||[]).concat('${tag}')"><script>window.__xss=(window.__xss||[]).concat('${tag}-s')</script>]]><!--`;
const BIDI = '‮evil‬⁦x⁩';
const CTRL = 'nul\u0000bell\u0007vt\u000Bff\u000Cfffe￾lone\uD800surrogate';
const LONG = 'L'.repeat(200000);

// A checklist pack: title, rollup titles, a profile name, rule texts.
const checklist = L.packApi.definePack({
  name: 'evil-checklist', version: '1.0.0', namespace: 'ev', core: '*',
  title: 'Policy ' + X('checklistTitle') + BIDI,
  rules: [
    {
      id: 'ev-' + 'rule',
      meta: { title: X('ruleTitle') + BIDI + CTRL, description: X('ruleDesc') + LONG, tags: ['ev'], helpUrl: 'javascript:window.__xss=["helpUrl"]', defaultSeverity: 'serious' },
      runInPage: new Function('X', 'return (ctx) => ({ outcome: "fail", occurrences: [{ __node: ctx.document.body, summary: X("summary") + "\\u202Eevil\\u0000", hint: X("hint") + "\\u0007", data: { details: { reasonCode: X("reason") } } }] })')(X)
    },
    {
      id: 'ev-throw',
      meta: { title: 'throws', tags: ['ev'], helpUrl: '  https://ok.example/x"onmouseover="window.__xss=1' },
      runInPage: () => { throw new Error('<img src=x onerror="window.__xss=[\'ruleError\']">\u0000]]>'); }
    },
    {
      id: 'ev-html-id-<b>x</b>',
      meta: { title: 'id', tags: ['ev'] },
      runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] })
    }
  ],
  profiles: { ['ev-' + X('profile')]: { tags: [], rules: ['img-alt-present'] } },
  rollups: [{ id: 'ev-' + X('rollupId'), title: X('rollupTitle') + CTRL, checksIds: ['ev-rule', 'ev-throw', 'img-alt-present'] }]
});

// X captured by closure would not reach the page: inline it.
checklist.rules[0].runInPage = new Function('return ' + `(ctx) => { const X = ${X.toString()}; return { outcome: "fail", occurrences: [{ __node: ctx.document.body, summary: X("summary") + "\\u202Eevil\\u0000", hint: X("hint") + "\\u0007", data: { details: { reasonCode: X("reason") } } }] }; }`)();

// A standard pack: standard name, requirement titles, note, titleLang.
const STD = 'Std ' + X('standardName');
const kit = ruleMappedStandard({
  standard: STD, tag: 'evs',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements: { '1.0': { ['1' + X('reqId')]: { title: X('reqTitle') + CTRL, wcagSc: ['1.1.1'] } } },
  ruleMap: { '1.0': { 'img-alt-present': { requirements: ['1' + X('reqId')], note: X('note') } } }
});
const standardPack = L.packApi.definePack({
  name: 'evil-standard', version: '1.0.0', namespace: 'evs', core: '*',
  standard: {
    key: 'evs', standard: STD, versions: ['1.0'],
    profiles: { 'evs-1.0': { version: '1.0', tags: kit.wcagTagsOf('1.0').concat(['evs']), mappedRules: true } },
    ruleTag: 'evs', ruleMapped: true, mappingsFor: kit.mappingsFor, composites: kit.composites, validate: kit.validate,
    report: { noteKey: 'evsNote_note', titleLang: 'en" onmouseover="window.__xss=1' }
  },
  dictionaries: { en: { evsNote_note: X('noteText') } }
});

const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

function xmlCheck(xml) {
  const { JSDOM } = L;
  const doc = new new JSDOM('').window.DOMParser().parseFromString(xml, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  return err ? 'NOT WELL-FORMED: ' + err.textContent.slice(0, 200) : 'well-formed';
}
const schema = JSON.parse(fs.readFileSync(path.join(L.ROOT, 'tests/schemas/sarif-schema-2.1.0.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, schemaId: 'id', logger: false });
ajv.addMetaSchema(require(path.join(L.ROOT, 'node_modules/ajv/lib/refs/json-schema-draft-04.json')));
const validateSarif = ajv.compile(schema);

async function renderAndLoad(b, result, label) {
  const out = { label };
  const safe = (name, fn) => { try { return fn(); } catch (e) { out[name + 'Error'] = e.message.slice(0, 200); return null; } };
  const html = safe('html', () => renderHtmlReport(result));
  const sarif = safe('sarif', () => renderSarifReport(result));
  const junit = safe('junit', () => renderJunitReport(result));
  const earl = safe('earl', () => renderEarlReport(result));
  safe('baseline', () => matchBaseline(result, buildBaselineEntries(result)));
  if (sarif) {
    const doc = JSON.parse(sarif);
    out.sarifValid = validateSarif(doc) ? 'valid' : validateSarif.errors.slice(0, 3).map((e) => `${e.dataPath} ${e.message}`);
    out.sarifRuleIds = doc.runs[0].tool.driver.rules.map((r) => r.id).filter((id) => /ev|evs/.test(id)).slice(0, 4);
    out.sarifHelpUris = doc.runs[0].tool.driver.rules.filter((r) => /^ev/.test(r.id)).map((r) => r.helpUri || null);
    out.sarifHasNul = sarif.includes('\\u0000');
  }
  if (junit) out.junit = xmlCheck(junit);
  if (earl) out.earlJsonRoundTrip = JSON.stringify(JSON.parse(JSON.stringify(earl))) === JSON.stringify(earl);
  if (html) {
    out.htmlMB = +(html.length / 1e6).toFixed(2);
    out.htmlHasRawBidi = html.includes('‮');
    out.htmlHasNul = html.includes('\u0000');
    const page = await b.newPage();
    const dialogs = [];
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await page.setContent(html);
    await page.waitForTimeout(300);
    // hover everything so onmouseover payloads would fire
    out.loaded = await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      // click into the occurrences table: search and paging use innerHTML
      const s = document.getElementById('search');
      if (s) { s.value = 'ev'; s.dispatchEvent(new Event('input')); }
      const hrefs = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')).filter((h) => !/^https?:/i.test(h));
      return { xss: window.__xss || null, nonHttpLinks: hrefs, imgs: document.images.length, scripts: document.scripts.length,
        sections: Array.from(document.querySelectorAll('h2')).map((h) => h.textContent.slice(0, 60)) };
    });
    out.dialogs = dialogs;
    await page.close();
  }
  L.log(label, out);
}

(async () => {
  await L.withBrowser(async (b) => {
    for (const [label, packs, eo] of [
      ['checklist, its profile', [checklist], { profile: 'ev-' + X('profile') }],
      ['standard, its profile', [standardPack], { profile: 'evs-1.0' }],
      ['both, runOnly none', [checklist, standardPack], { mappings: ['evs'] }]
    ]) {
      const { page, context, logs } = await L.openPage(b, { html: HTML });
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript(packs) });
      const result = await L.scanInPage(page, packs.map((p) => `${p.name}@${p.version}`), eo).catch((e) => ({ error: e.message.split('\n')[0] }));
      await context.close();
      if (result.error) { L.log(label, { scanError: result.error, logs }); continue; }
      fs.writeFileSync(path.join(__dirname, 'out', `07-${label.replace(/\W+/g, '_')}.json`), JSON.stringify(result));
      await renderAndLoad(b, result, label);
    }
  });
})();
