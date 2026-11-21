// reflow-horizontal-scroll at 320px: old (ec664338) vs new, a battery of page shapes. Flags a new 'fail' (the rule must only ask) and losses.
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const B = { old: fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8'), new: fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8') };
const wide = '<div style="width:500px;background:#eee">Wide block of text that does not wrap within 320 pixels</div>';
const cases = {
  standards: '<!doctype html><html lang="en"><body><p>x</p>' + wide + '</body></html>',
  quirks: '<html lang="en"><body><p>x</p>' + wide + '</body></html>',
  quirksFits: '<html lang="en"><body><p>Just text that wraps nicely within the viewport width.</p></body></html>',
  verticalRL: '<!doctype html><html lang="ja" style="writing-mode:vertical-rl"><body><p>縦書きの文章です。</p>' + wide + '</body></html>',
  bodyVerticalRL: '<!doctype html><html lang="ja"><body style="writing-mode:vertical-rl"><p>縦書きの文章です。</p><div style="height:2000px;width:500px">x</div></body></html>',
  rtlWide: '<!doctype html><html lang="ar" dir="rtl"><body><p>مرحبا</p>' + wide + '</body></html>',
  shadowWide: '<!doctype html><html lang="en"><body><x-w></x-w><script>customElements.define("x-w", class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML=' + JSON.stringify(wide) + '}})</script></body></html>',
  longWord: '<!doctype html><html lang="de"><body><p>Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft</p></body></html>',
  longUrl: '<!doctype html><html lang="en"><body><p>See https://example.com/a/very/long/path/that/does/not/break/anywhere/at/all/index.html</p></body></html>',
  htmlOverflowHidden: '<!doctype html><html lang="en" style="overflow-x:hidden"><body><p>x</p>' + wide + '</body></html>',
  bodyOverflowHidden: '<!doctype html><html lang="en"><body style="overflow-x:hidden"><p>x</p>' + wide + '</body></html>',
  fixedBanner: '<!doctype html><html lang="en"><body><p>x</p><div style="position:fixed;bottom:0;left:0;width:500px;background:#ccc">Cookie banner text <button>OK</button></div></body></html>',
  scrollerTable: '<!doctype html><html lang="en"><body><div style="overflow-x:auto"><table><tr>' + '<th>Heading</th>'.repeat(8) + '</tr><tr>' + '<td>1234567</td>'.repeat(8) + '</tr></table></div></body></html>',
  inputWide: '<!doctype html><html lang="en"><body><label>Name <input style="width:500px"></label></body></html>',
  marginNegStart: '<!doctype html><html lang="en"><body><p style="margin-left:-60px">Text that starts before the left edge of the page and is cut.</p></body></html>',
  zoomed: '<!doctype html><html lang="en" style="zoom:2"><body><p>Text at zoom 2 that wraps.</p></body></html>',
  svgWide: '<!doctype html><html lang="en"><body><svg width="600" height="50" role="img" aria-label="chart"><rect width="600" height="50"/></svg></body></html>',
  preWide: '<!doctype html><html lang="en"><body><pre>const x = "a long line of code that will not wrap within the viewport";</pre></body></html>',
  contentVisibility: '<!doctype html><html lang="en"><body><div style="content-visibility:auto">' + wide + '</div></body></html>',
  many: '<!doctype html><html lang="en"><body>' + Array.from({ length: 80 }, (_, i) => `<p><span style="display:inline-block;width:${400 + i}px">w${i}</span></p>`).join('') + '</body></html>',
};
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [k, html] of Object.entries(cases)) {
    const out = {};
    for (const v of ['old', 'new']) {
      const page = await br.newPage({ viewport: { width: 320, height: 640 } });
      await page.setContent(html, { waitUntil: 'load' });
      await page.addScriptTag({ content: B[v] });
      const t0 = Date.now();
      out[v] = await page.evaluate(async () => {
        const r = await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: ['reflow-horizontal-scroll'] } }, null);
        const c = r.checksResults.find(x => x.ruleId === 'reflow-horizontal-scroll') || {};
        const codes = {};
        for (const o of c.occurrences || []) { const k = (o.occurrenceOutcome || c.outcome) + ':' + (o.data && o.data.details && o.data.details.reasonCode) + (o.lean ? '/' + o.lean.toward : ''); codes[k] = (codes[k] || 0) + 1; }
        return c.outcome + ' ' + JSON.stringify(codes) + (c.error ? ' ERR ' + c.error : '') + (c.data && c.data.omitted ? ' omitted=' + JSON.stringify(c.data.omitted) : '') + ' cw=' + document.documentElement.clientWidth + ' sw=' + document.scrollingElement.scrollWidth;
      });
      out[v] += ' ' + (Date.now() - t0) + 'ms';
      await page.close();
    }
    console.log((/^fail/.test(out.new) ? '!! ' : '   ') + k.padEnd(18), '\n      old', out.old, '\n      new', out.new);
  }
  await br.close();
})();
