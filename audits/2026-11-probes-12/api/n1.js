const B = require('./bh.js');
const body = `<main><h1>t</h1><label>Name <input placeholder="Your name" style="color:#000"></label><label>Pick <select><option>One</option><option>Two</option></select></label><img src="a.png"><p style="color:#777;background:#fff">grey text</p><input placeholder="faint" aria-label="f" style="color:#ccc">
<div style="position:fixed;bottom:0">fixed</div><a href="#">x</a></main>`;
const pg = `<!doctype html><html lang="en"><head><title>t</title><script src="/core.js"></script></head><body>${body}</body></html>`;
(async () => {
  await B.start();
  const { page, logs } = await B.open('/', pg);
  const out = await page.evaluate(async () => {
    const sum = (r) => r.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length).sort().join(',');
    window.__mo = []; new MutationObserver((m) => window.__mo.push(m.length)).observe(document, { childList: true, subtree: true });
    const base = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
    await new Promise(r => setTimeout(r, 50)); const moBase = __mo.length; __mo = [];
    let inner = null, innerErr = null;
    const nest = { id: 'a-nest', meta: { title: 'nest', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: function (ctx) { try { inner = a11ycore.runa11yCoreInPage(location.href, null, {}, null); } catch (e) { innerErr = e.code + ' ' + e.message; } return { ruleId: ctx.rule.ruleId, outcome: 'pass', occurrences: [] }; } };
    const outer = a11ycore.runa11yCoreInPage(location.href, null, { customRules: [nest] }, null);
    await new Promise(r => setTimeout(r, 50));
    const a = sum(base), o = sum(outer).replace(/,?a-nest:pass:0/, ''), i = inner ? sum(inner) : null;
    const diff = (x, y) => { const X = new Set(x.split(',')), Y = new Set(y.split(',')); return [...X].filter(k => !Y.has(k)).concat(['|'], [...Y].filter(k => !X.has(k))); };
    // concurrent async
    const [c1, c2] = await Promise.all([a11ycore.runa11yCoreInPageAsync(location.href, null, {}, null), a11ycore.runa11yCoreInPageAsync(location.href, null, { locale: 'de' }, null)]);
    // scan from a mutation observer callback triggered by the scan's own holder
    let moScan = null; const mo2 = new MutationObserver(() => { if (!moScan) { try { moScan = sum(a11ycore.runa11yCoreInPage(location.href, null, {}, null)); } catch (e) { moScan = 'ERR ' + e.message; } } });
    mo2.observe(document.body, { childList: true, subtree: true });
    const afterMo = a11ycore.runa11yCoreInPage(location.href, null, {}, null); await new Promise(r => setTimeout(r, 50)); mo2.disconnect();
    return { innerErr, outerVsBase: diff(a, o), innerVsBase: i && diff(a, i), conc: [diff(a, sum(c1)), diff(a, sum(c2)), c2.engine.locale.resolved], moCallsPerScan: moBase, moScan: moScan && (moScan.startsWith('ERR') ? moScan : diff(a, moScan)), afterMo: diff(a, sum(afterMo)), leftovers: document.querySelectorAll('body > :not(main)').length, iframes: document.querySelectorAll('iframe').length };
  });
  console.log(JSON.stringify(out, null, 1)); console.log(logs.slice(0, 5));
  await B.stop();
})();
