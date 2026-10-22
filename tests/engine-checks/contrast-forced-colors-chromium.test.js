'use strict';

// Forced colors (#227, #231): under Windows high contrast, or Chromium's
// emulated forced-colors: active, the browser forces color and
// background-color in the computed style but not the text fill color the
// contrast rules read, so they measured the page's text on a background it
// did not choose. The scan holds the page in its own colors while it
// measures, and puts the page back as it was: the outcomes are those of the
// page with forced colors off, and engine.environment still records them.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const { addBundle } = require('../helpers/browserBundle');
const FR = fs.readFileSync(path.join(__dirname, '../../surea11y.i18n.fr.js'), 'utf8');

// Dark gray on the page's black (a fail, which forced colors measured on
// white); black on white (a pass); text on a gradient (asked about, which
// forced colors measured on the plain background); a box of the page's
// own in forced-color-adjust: none; text in open shadow roots, one whose
// own sheet sets forced-color-adjust: auto; text a ::before generates; and
// a link told apart from its sentence by color alone.
const HTML =
  '<!doctype html><html lang="en"><head><title>t</title><style>' +
  'body { background: #000; color: #fff }' +
  '#dark { color: #333 }' +
  '#ok { color: #000; background: #fff }' +
  '#gradient { color: #fff; background: linear-gradient(#000, #777) }' +
  '#own { forced-color-adjust: none; color: #555; background: #000 }' +
  '#tag::before { content: "New"; color: #444; background: #000 }' +
  '#sentence { color: #fff } #sentence a { color: #eee; text-decoration: none }' +
  '</style></head><body><main>' +
  '<p id="dark">Opening hours</p>' +
  '<p id="ok">Closed today</p>' +
  '<p id="gradient">Summer sale</p>' +
  '<p id="own">Kept in its colors</p>' +
  '<p id="tag">Arrivals</p>' +
  '<p id="sentence">Read <a href="#x">the terms</a> before you buy.</p>' +
  '<div id="host"></div><div id="auto-host"></div>' +
  '</main><script>' +
  'document.getElementById("host").attachShadow({ mode: "open" }).innerHTML =' +
  ' "<style>span { color: #3a3a3a }</style><span>In a shadow root</span>";' +
  'document.getElementById("auto-host").attachShadow({ mode: "open" }).innerHTML =' +
  ' "<style>span { color: #3b3b3b; forced-color-adjust: auto }</style><span>Set back to auto</span>";' +
  '</script></body></html>';

const RULES = [
  'contrast-minimum',
  'contrast-enhanced',
  'contrast-computable',
  'link-in-text-block'
];

// What the scan could change on the page: each element's forced-color-adjust
// and the style sheets of the document and its shadow roots.
function pageStyles() {
  const roots = [document];
  for (const el of document.querySelectorAll('*')) if (el.shadowRoot) roots.push(el.shadowRoot);
  const all = [];
  for (const root of roots) {
    for (const el of root.querySelectorAll('*')) all.push(el);
  }
  return {
    adjust: all.map((el) => getComputedStyle(el).forcedColorAdjust),
    color: all.map((el) => getComputedStyle(el).color),
    before: getComputedStyle(document.getElementById('tag'), '::before').forcedColorAdjust,
    styleSheets: roots.map((r) => r.styleSheets.length),
    adoptedStyleSheets: roots.map((r) => r.adoptedStyleSheets.length),
    elements: document.getElementsByTagName('*').length
  };
}

test(
  'under forced colors the contrast rules measure the page’s own colors, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (forcedColors) => {
      const page = await browser.newPage();
      t.after(() => page.close());
      await page.emulateMedia({ forcedColors });
      await page.setContent(HTML);
      await addBundle(page);
      return page.evaluate(
        ([rules, pageStylesSource]) => {
          const read = new Function('return (' + pageStylesSource + ')')();
          const before = read();
          const r = window.a11ycore.runa11yCoreInPage(null, null, {}, rules);
          return {
            environment: r.engine.environment,
            before,
            after: read(),
            checks: r.checksResults.map((c) => ({
              ruleId: c.ruleId,
              outcome: c.outcome,
              occurrences: c.occurrences.map((o) => ({
                selector: o.selector,
                summary: o.summary,
                hint: o.hint,
                data: o.data
              }))
            }))
          };
        },
        [RULES, pageStyles.toString()]
      );
    };

    const off = await scan('none');
    const on = await scan('active');
    assert.equal(off.environment.forcedColors, 'none');
    assert.equal(on.environment.forcedColors, 'active');

    // The same outcomes, occurrences, ratios and hints either way.
    assert.deepEqual(on.checks, off.checks);
    const check = (id) => on.checks.find((c) => c.ruleId === id);
    assert.equal(check('contrast-minimum').outcome, 'fail');
    // The two spans are the shadow roots' text.
    assert.deepEqual(
      check('contrast-minimum')
        .occurrences.map((o) => o.selector)
        .sort(),
      ['#dark', '#own', '#tag', 'span', 'span']
    );
    const tag = check('contrast-minimum').occurrences.find((o) => o.selector === '#tag');
    assert.equal(tag.data.details.generatedBy, '::before');
    const dark = check('contrast-minimum').occurrences.find((o) => o.selector === '#dark');
    assert.equal(Number(dark.data.details.metrics.ratio.toFixed(2)), 1.66);
    assert.ok(
      check('contrast-computable').occurrences.some((o) => o.selector === '#gradient'),
      'the gradient is asked about'
    );
    assert.equal(check('link-in-text-block').outcome, 'fail');
    for (const c of on.checks) {
      for (const o of c.occurrences) {
        assert.equal(o.data && o.data.details && o.data.details.forcedColors, undefined, c.ruleId);
      }
    }

    // The page is as it was: forced-color-adjust, colors and style sheets.
    assert.deepEqual(on.after, on.before);
    assert.deepEqual(off.after, off.before);
    assert.equal(on.before.adjust[on.before.adjust.length - 1], 'auto');
    assert.ok(on.before.adjust.includes('none'), 'the page’s own none is kept');
  }
);

// Where the page can't be held in its colors (no constructable style sheets,
// and a Content Security Policy that blocks an added <style>), the colors
// measured are forced, and each occurrence says so.
test(
  'where the page can’t be held in its own colors, each contrast occurrence says so, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (locale) => {
      const page = await browser.newPage();
      t.after(() => page.close());
      await page.emulateMedia({ forcedColors: 'active' });
      await page.setContent(
        '<!doctype html><html lang="en"><head><title>t</title>' +
          '<meta http-equiv="Content-Security-Policy" content="style-src \'none\'"></head>' +
          '<body><main><p id="grey">Opening hours</p></main></body></html>'
      );
      await addBundle(page);
      if (locale === 'fr') await page.addScriptTag({ content: FR });
      return page.evaluate((locale) => {
        document.getElementById('grey').style.color = '#999';
        delete window.CSSStyleSheet;
        const r = window.a11ycore.runa11yCoreInPage(null, null, locale ? { locale } : {}, [
          'contrast-minimum',
          'contrast-enhanced',
          'contrast-computable'
        ]);
        return {
          environment: r.engine.environment,
          styleSheets: document.styleSheets.length,
          elements: document.getElementsByTagName('*').length,
          checks: r.checksResults.map((c) => ({
            ruleId: c.ruleId,
            occurrences: c.occurrences.map((o) => ({
              forcedColors: o.data.details.forcedColors,
              hint: o.hint,
              hintKey: o.i18n && o.i18n.hintKey
            }))
          }))
        };
      }, locale || null);
    };

    const r = await scan();
    assert.equal(r.environment.forcedColors, 'active');
    assert.equal(r.styleSheets, 0);
    for (const check of r.checks) {
      assert.ok(check.occurrences.length, check.ruleId);
      for (const o of check.occurrences) {
        assert.equal(o.forcedColors, true, check.ruleId);
        assert.equal(o.hintKey, 'contrast_hint_forcedColors', check.ruleId);
        assert.match(o.hint, /^Forced colors were on when this page was checked/, check.ruleId);
      }
    }

    // The hint is translated like any other.
    const fr = await scan('fr');
    assert.match(fr.checks[0].occurrences[0].hint, /^Les couleurs forcées étaient actives/);
  }
);

// Under forced colors the browser resolves Canvas, and the page's color
// scheme, to the forced palette: a page that asks for dark and paints no
// background of its own reads a white canvas. Its own canvas can't be read
// then, so its text is asked about rather than measured on the wrong one:
// #333 there fails at 1.48:1 on the dark canvas, and passed on white.
test(
  'under forced colors a page with no background of its own is not measured on the forced canvas, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const scan = async (forcedColors) => {
      const page = await browser.newPage();
      t.after(() => page.close());
      await page.emulateMedia({ forcedColors });
      await page.setContent(
        '<!doctype html><html lang="en"><head><title>t</title><meta name="color-scheme" content="dark"></head>' +
          '<body><main><p style="color:#333">Dark grey text</p></main></body></html>'
      );
      await addBundle(page);
      return page.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, [
          'contrast-minimum',
          'contrast-computable'
        ]);
        const by = (id) => r.checksResults.find((c) => c.ruleId === id).outcome;
        return [by('contrast-minimum'), by('contrast-computable')];
      });
    };
    assert.deepEqual(await scan('none'), ['fail', 'pass']);
    const [minimum, computable] = await scan('active');
    assert.notEqual(minimum, 'pass');
    assert.equal(computable, 'cantTell');
  }
);
