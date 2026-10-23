const { withPage } = require('./pw');
const core = require('/home/user/core/src/index.js');
const SRC = core.runa11yCoreInPage.toString();
const scan = (page, ctx, eo, ro) => page.evaluate(([src, ctx, eo, ro]) => { const fn = new Function('return (' + src + ')')(); try { return fn(location.href, ctx, eo, ro); } catch (e) { return { THROW: e.message }; } }, [SRC, ctx, eo, ro]);
const s = r => r.THROW ? 'THROW '+r.THROW : r.checksResults.filter(c=>c.outcome!=='notApplicable').map(c=>c.ruleId+':'+c.outcome+':'+c.occurrences.map(o=>o.html.slice(0,60)+(o.shadowHostSelectors?'@'+o.shadowHostSelectors.join('>'):'')).join('|'));
(async () => {
  await withPage(async (page) => {
    await page.setContent(`<html lang="en"><head><title>t</title></head><body><main id="main"><img src="a.png" class="a"><img src="b.png" class="b"><img src="c.png" class="c">
      <div id="openhost"></div><div id="closedhost"></div><my-el id="nested"></my-el></main></body></html>`);
    await page.evaluate(() => {
      const o = document.getElementById('openhost').attachShadow({ mode: 'open' }); o.innerHTML = '<img src="shadow.png" class="sh"><div id="inner"></div>';
      const inner = o.getElementById('inner').attachShadow({ mode: 'open' }); inner.innerHTML = '<img src="deep.png" class="deep">';
      const c = document.getElementById('closedhost').attachShadow({ mode: 'closed' }); c.innerHTML = '<img src="closed.png">';
    });
    const ro = ['img-alt-present'];
    console.log('default', s(await scan(page, null, {}, ro)));
    console.log('no shadow', s(await scan(page, null, { includeShadowDom: false }, ro)));
    console.log('not(.a,.b) str', s(await scan(page, null, { excludeSelectors: 'img:not(.a, .b)' }, ro)));
    console.log('exclude host', s(await scan(page, null, { excludeSelectors: ['#openhost'] }, ro)));
    console.log('exclude .sh', s(await scan(page, null, { excludeSelectors: ['.sh'] }, ro)));
    console.log('exclude .deep', s(await scan(page, null, { excludeSelectors: ['.deep'] }, ro)));
    console.log('exclude #inner', s(await scan(page, null, { excludeSelectors: ['#inner'] }, ro)));
    console.log('exclude host>img (no pierce)', s(await scan(page, null, { excludeSelectors: ['#openhost img'] }, ro)));
    console.log('ctx openhost', s(await scan(page, '#openhost', {}, ro)));
    console.log('ctx openhost noshadow', s(await scan(page, '#openhost', { includeShadowDom: false }, ro)));
    console.log('rule-scoped .deep', s(await scan(page, null, { rules: { 'img-alt-present': { excludeSelectors: '.deep' } } }, ro)));
  });
})();
