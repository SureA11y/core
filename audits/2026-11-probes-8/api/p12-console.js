const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button><a href="x"></a><div id="d" role="button" tabindex="0" onclick="1">x</div></main></body></html>';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const logs = [];
  const tests = {
    basic: `const r = await a11ycore.run(); return [a11ycore.table(r).length, a11ycore.highlight(r)];`,
    tableNull: `return [a11ycore.table(null).length, a11ycore.table(undefined).length, a11ycore.table({checksResults: 5}).length, a11ycore.highlight(null)];`,
    tableHostile: `const r = { checksResults: [ { ruleId: 'x', outcome: 'fail', occurrences: [{ selector: 'main[' }, { selector: 'img', shadowHostSelectors: 'img' }, { selector: 'img', shadowHostSelectors: ['img'] }, null, 5, { selector: '__proto__' }] }, null, { outcome: 'fail', get occurrences() { throw new Error('getter'); } } ] }; try { return [a11ycore.table(r).length, a11ycore.highlight(r)]; } catch (e) { return 'THROW ' + e.message; }`,
    proxyResult: `const r = new Proxy({}, { get(t,k){ throw new Error('proxy '+String(k)); } }); const out=[]; for (const f of ['table','highlight']) { try { out.push(f+':'+a11ycore[f](r)); } catch(e) { out.push(f+' THROW '+e.message); } } try { out.push('inspect:'+JSON.stringify(await a11ycore.inspect(r)).slice(0,80)); } catch(e) { out.push('inspect THROW '+e.message); } return out;`,
    inspectKinds: `const out = []; for (const k of ['headings','landmarks','names','focus-order','HEADINGS','bogus', undefined, '__proto__']) { try { const x = await a11ycore.inspect(k); out.push(k + ':' + (Array.isArray(x) ? x.length : typeof x)); } catch (e) { out.push(k + ' THROW ' + e.message.slice(0,100)); } } return out;`,
    runBadOpts: `const out=[]; for (const o of [5, 'x', [], {type:'tag'}, {engineOptions:{}}, {foo:1}, {runOnly:['bogus-rule']}, {context:'main['}, {strictOptions:true, foo:1}, {runOnly: { tags: ['wcag2a']}, profile: 'wcag22-aa'}, Object.create({locale:'de'}), {locale: 'de', __proto__: {runOnly: ['img-alt-present']}}]) { try { const r = await a11ycore.run(o); out.push('ok ' + r.checksResults.length + ' ' + JSON.stringify(r.engine.locale)); } catch (e) { out.push('REJ ' + (e.code||e.name) + ' ' + e.message.slice(0, 90)); } } return out;`,
    brokenMap: `const r = await a11ycore.run(); const M = window.Map; window.Map = function(){ throw new Error('no map'); }; try { return a11ycore.highlight(r); } catch (e) { return 'THROW ' + e.message; } finally { window.Map = M; }`,
    brokenAssign: `const oa = Object.assign; Object.assign = function(){ throw new Error('no assign'); }; try { const r = await a11ycore.run(); return 'ok '+r.checksResults.length; } catch (e) { return 'THROW ' + (e.code||'') + ' ' + e.message.slice(0,150); } finally { Object.assign = oa; }`,
    brokenArrayIsArray: `const oa = Array.isArray; Array.isArray = () => false; try { const r = await a11ycore.run(); return 'ok '+r.checksResults.length; } catch (e) { return 'THROW ' + (e.code||'') + ' ' + e.message.slice(0,150); } finally { Array.isArray = oa; }`,
    consoleTableGone: `const r = await a11ycore.run(); const ct = console.table; console.table = 5; try { return a11ycore.table(r).length; } catch(e) { return 'THROW '+e.message; } finally { console.table = ct; }`,
    highlightThenScan: `const r = await a11ycore.run(); a11ycore.highlight(r); const r2 = await a11ycore.runa11yCoreInPage(null, null, {}, null); const n1 = r.checksResults.filter(c=>c.outcome==='fail').length, n2 = r2.checksResults.filter(c=>c.outcome==='fail').length; const rs = r2.checksResults.filter(c=>c.outcome!=='notApplicable' && c.occurrences.some(o=>/surea11y-highlights/.test(o.html||'')||/surea11y/.test(o.selector||''))).map(c=>c.ruleId); return [n1, n2, rs];`,
  };
  for (const [k, src] of Object.entries(tests)) {
    const page = await browser.newPage();
    page.on('console', m => logs.push(k + ' ' + m.type() + ': ' + m.text().slice(0, 200)));
    await page.setContent(html);
    await page.addScriptTag({ content: bundle });
    let out;
    try { out = await page.evaluate(`(async () => { ${src} })()`); } catch (e) { out = 'EVAL THROW ' + e.message.slice(0, 200); }
    console.log(k.padEnd(18), JSON.stringify(out));
  }
  console.log(logs.filter(l => !/^table|^log/.test(l)).slice(0, 30).join('\n'));
  await browser.close();
})();
