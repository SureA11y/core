// (a) What a scan leaves in the page when the cleanup step throws.
// (b) text-spacing-content-loss under a CSP that blocks inline <style>.
const h = require('./harness');
const CLIP = `<div style="overflow:hidden;height:20px;width:120px;white-space:nowrap;font-size:16px">clipped text clipped</div>
<div style="overflow:hidden;height:18px;width:200px;line-height:18px;font-size:16px">Two words fit, but at 1.5 line height the second line is lost lost lost lost lost lost lost</div>`;
const page = (head) => `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><h1>H</h1>${CLIP}</main></body></html>`;
(async () => {
  for (const [name, trap] of [
    ['removeChild#1 throws', `(function(){const o=Node.prototype.removeChild;let n=0;Node.prototype.removeChild=function(){if(++n===1)throw new Error('rc');return o.apply(this,arguments)}})()`],
    ['setAttribute#1 throws', `(function(){const o=Element.prototype.setAttribute;let n=0;Element.prototype.setAttribute=function(){if(++n===1)throw new Error('sa');return o.apply(this,arguments)}})()`],
  ]) {
    const r = await h.runChromium(page(''), {}, { pre: new Function(trap), post: () => ({ head: Array.from(document.head.children).map((e) => e.outerHTML.slice(0, 200)), lh: getComputedStyle(document.querySelector('h1')).letterSpacing + ' ' + getComputedStyle(document.querySelector('h1')).lineHeight }) });
    const s = h.summarize(r.r || {});
    console.log(name, '| scan err:', r.err || 'none', '| text-spacing:', s['text-spacing-content-loss'], '| other errs:', Object.entries(s).filter(([, v]) => /ERR/.test(v)).map(([k, v]) => k + '=' + v).join('; '));
    console.log('   head after scan:', JSON.stringify(r.post));
  }
  for (const [name, head] of [
    ['no CSP', ''],
    ["CSP style-src 'self'", `<meta http-equiv="Content-Security-Policy" content="style-src 'self' 'unsafe-hashes' 'sha256-AAAA'">`],
    ["CSP style-src nonce", `<meta http-equiv="Content-Security-Policy" content="style-src 'nonce-abc'">`],
    ["CSP default-src 'none'", `<meta http-equiv="Content-Security-Policy" content="default-src 'none'">`],
  ]) {
    const r = await h.runChromium(page(head), {}, {});
    const c = (r.r.checksResults || []).find((x) => x.ruleId === 'text-spacing-content-loss');
    console.log(name, '->', c.outcome, (c.occurrences || []).length, c.error || '', JSON.stringify((c.occurrences || []).map((o) => o.selector)).slice(0, 200), '| pageErrors:', r.pageErrors.length);
  }
  await h.closeBrowser();
})();
