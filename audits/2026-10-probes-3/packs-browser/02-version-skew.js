'use strict';
// The pack script carries the catalog of the core it was made with; the page
// runs the bundle it was given. (a) a released bundle without pack support;
// (b) a bundle whose built-in code lacks a rule the script points at, as a
// script made by a newer core than the bundle would.
const { execFileSync } = require('child_process');
const L = require('./lib');
const { packScript } = L.packApi;
const OLD = execFileSync('git', ['-C', L.ROOT, 'show', 'v1.10.0:surea11y.browser.js'], { encoding: 'utf8', maxBuffer: 64 << 20 });

const P = L.pack({
  name: '@s/pack', version: '1.0.0', namespace: 's',
  rules: [L.rule('s-one', (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }))],
  variants: [{ id: 's-contrast', from: 'contrast-minimum', config: { normalTextRatio: 7, largeTextRatio: 4.5 }, meta: { title: 'c7', i18n: { titleKey: 'sContrast_title', descriptionKey: 'sContrast_description' } } }],
  dictionaries: { en: { sContrast_title: 'c7', sContrast_description: 'c7 d' } }
});

(async () => {
  await L.withBrowser(async (browser) => {
    {
      const { page, logs } = await L.openPage(browser);
      await page.addScriptTag({ content: OLD });
      await page.addScriptTag({ content: packScript([P]) });
      const r = await L.scanInPage(page, ['@s/pack@1.0.0']).catch((e) => ({ error: e.message.split('\n')[0] }));
      L.log('a) 1.10.0 bundle + pack script', { n: r.checksResults && r.checksResults.length, error: r.error, engineVersion: r.engine && r.engine.version, packs: r.engine && r.engine.packs, sOne: L.outcome(r, 's-one'), logs });
      const s = await L.scanInPage(page, ['@s/pack@1.0.0'], { strictOptions: true }).catch((e) => ({ error: e.message.split('\n')[0] }));
      L.log('a2) same, strictOptions', { error: s.error, packs: s.engine && s.engine.packs });
      await page.context().close();
    }
    {
      const { page, logs } = await L.openPage(browser);
      await page.addScriptTag({ content: L.BUNDLE });
      const script = packScript([P]).replace('"contrast-minimum": "contrast-minimum"', '"contrast-minimum": "contrast-minimum-gone"').replace('"s-contrast": "contrast-minimum"', '"s-contrast": "contrast-minimum-gone"');
      await page.addScriptTag({ content: script });
      const r = await L.scanInPage(page, ['@s/pack@1.0.0']).catch((e) => ({ error: e.message.split('\n')[0] }));
      const c = (id) => r.checksResults && r.checksResults.find((x) => x.ruleId === id);
      L.log('b) script names a built-in impl the bundle lacks', { replaced: script.includes('contrast-minimum-gone'), n: r.checksResults && r.checksResults.length, ids: r.checksResults && r.checksResults.filter((x) => /contrast/.test(x.ruleId)).map((x) => x.ruleId + ':' + x.outcome + ':' + (x.error || '')), packs: r.engine && r.engine.packs, error: r.error, cm: c('contrast-minimum') && { outcome: c('contrast-minimum').outcome, error: c('contrast-minimum').error }, sc: c('s-contrast') && { outcome: c('s-contrast').outcome, error: c('s-contrast').error }, logs });
      await page.context().close();
    }
  });
})();
