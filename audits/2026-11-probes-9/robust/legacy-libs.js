'use strict';
// Real native-extending libraries loaded in the combined-fixtures page; compare with clean.
const fs = require('node:fs');
const { serve, launch, addBundle, scanSummary, diff } = require('./lib');
const V = '/tmp/surea11y-audit/r9/vendor/';
const libs = {
  clean: [],
  mootools152: ['mootools-1.5.2/package/lib/mootools-core-1.5.2-server.js'],
  sugar141: ['sugar-1.4.1/package/release/sugar-full.development.js'],
  sugar206ext: ['sugar-2.0.6/package/dist/sugar.min.js', '<Sugar.extend()'],
  zone: ['zone.js-0.14.4/package/fesm2015/zone.min.js'],
  webcomponents: ['webcomponents-webcomponentsjs-2.8.0/package/webcomponents-bundle.js'],
  webcomponentsForced: ['<window.WebComponents={root:"/"};window.ShadyDOM={force:true};window.customElements&&(window.customElements.forcePolyfill=true)', 'webcomponents-webcomponentsjs-2.8.0/package/webcomponents-bundle.js'],
  corejs: ['core-js-bundle-3.37.1/package/minified.js'],
  es5shim: ['es5-shim-4.6.7/package/es5-shim.min.js', 'es5-shim-4.6.7/package/es5-sham.min.js'],
  es6shim: ['es6-shim-0.35.8/package/es6-shim.min.js']
};
const which = process.argv[2];
const body = fs.readFileSync(__dirname + '/combined.html', 'utf8');
(async () => {
  const pages = {};
  for (const [name, list] of Object.entries(libs)) {
    const head = list.map((f) => (f.startsWith('<') ? `<script>${f.slice(1)}</script>` : `<script src="/v/${f}"></script>`)).join('');
    pages['/' + name] = { body: body.replace('<head>', '<head>' + head) };
  }
  const s = await serve(new Proxy(pages, { get: (t, k) => t[k] || (String(k).startsWith('/v/') ? { type: 'text/javascript', body: fs.readFileSync(V + String(k).slice(3)) } : undefined) }));
  const { browser, context } = await launch();
  let base;
  for (const name of Object.keys(libs)) {
    if (which && name !== 'clean' && !name.includes(which)) continue;
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
    await page.goto(s.base + '/' + name);
    await page.waitForTimeout(300);
    await addBundle(page, s.base);
    const r = await scanSummary(page);
    if (name === 'clean') { base = r.out; console.log('clean', Object.keys(base).length); }
    else if (!r.ok) console.log(name, 'THROW', r.code, r.msg.slice(0, 200));
    else { const d = diff(base, r.out); console.log(name, d.length ? 'DIFF ' + d.length + '\n   ' + d.slice(0, 25).join('\n   ') : 'same'); }
    if (errs.length) console.log('   pageerrors', errs.slice(0, 3));
    await page.close();
  }
  await browser.close();
  s.close();
})();
