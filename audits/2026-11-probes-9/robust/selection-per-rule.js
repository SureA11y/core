'use strict';
// Which rule's focus probe replaces the page's selection.
const { serve, launch, addBundle } = require('./lib');

const body = `<!doctype html><html lang="en"><title>t</title>
<style>a:focus{outline:none} .x:focus{outline:0}</style>
<main><h1>x</h1><p id=p>Para text here</p>
<a href="#a">plain link</a> <input aria-label="field" value="abc" class=x>
<div contenteditable="true" aria-label="ed">Editable</div>
<div aria-hidden="true"><input aria-label="hid" value="zz"></div><div aria-hidden="true"><div contenteditable>hid ed</div></div>
<iframe title="f" srcdoc="<a href=#>in frame</a>"></iframe>
<button onblur="">b</button>
</main><script>
function selectP(){const r=document.createRange();r.selectNodeContents(document.getElementById('p'));getSelection().removeAllRanges();getSelection().addRange(r);}
selectP();</script>`;

const rules = [null, 'aria-hidden-focus', 'css-hidden-focus', 'focus-not-removed-by-script', 'iframe-focusable-content', 'focus-not-obscured-minimum', 'text-spacing-content-loss'];

(async () => {
  const { base, close } = await serve({ '/': { body } });
  const { browser, context } = await launch();
  for (const rule of rules) {
    const page = await context.newPage();
    await page.goto(base + '/');
    await addBundle(page, base);
    const sel = () => page.evaluate(() => {
      const s = getSelection();
      return `${s.rangeCount}/${s.type}/"${String(s)}"/active=${document.activeElement.nodeName}`;
    });
    const b = await sel();
    const ran = await page.evaluate(async (rule) => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, rule ? [rule] : null);
      return r.checksResults.filter((c) => c.outcome !== 'notApplicable' || rule).map((c) => c.ruleId + ':' + c.outcome).slice(0, 3).join(' ');
    }, rule);
    const a = await sel();
    console.log((rule || 'ALL').padEnd(30), b, ' => ', a, b === a ? '' : '  CHANGED', rule ? ran : '');
    await page.close();
  }
  await browser.close();
  close();
})();
