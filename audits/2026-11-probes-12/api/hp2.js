const B = require('./bh.js');
const body = '<main><h1>t</h1><img src="a.png"><img src="b.png"><a href="/x"></a><div id="cookie"><img src="c.png"></div></main>';
const pg = (pre) => `<!doctype html><html lang="en"><head><title>t</title><script>${pre}</script><script src="/core.js"></script></head><body>${body}</body></html>`;
const cases = {
  protoOutcome: "Object.defineProperty(Object.prototype,'occurrenceOutcome',{value:'pass',configurable:true});",
  protoOutcomeEnum: "Object.prototype.occurrenceOutcome='pass';",
  protoType: "Object.defineProperty(Object.prototype,'type',{value:'manual',configurable:true});",
  protoProfile: "Object.defineProperty(Object.prototype,'profile',{value:'wcag20-a',configurable:true});",
  protoCap: "Object.defineProperty(Object.prototype,'maxOccurrencesPerRule',{value:1,configurable:true});",
  protoExcl: "Object.defineProperty(Object.prototype,'excludeSelectors',{value:['main'],configurable:true});",
  protoSeverity: "Object.defineProperty(Object.prototype,'severity',{value:'minor',configurable:true});",
  protoLean: "Object.defineProperty(Object.prototype,'lean',{value:{toward:'pass'},configurable:true});",
};
(async () => {
  await B.start();
  for (const [name, pre] of Object.entries(cases)) {
    const { page } = await B.open('/' + name, pg(pre));
    const out = await page.evaluate(async () => {
      try {
        const r = a11ycore.runa11yCoreInPage(location.href, null, {}, null);
        const img = (r.checksResults.find(c => c.ruleId === 'img-alt-present') || {});
        return { s: r.checksResults.reduce((m, c) => (m[c.outcome] = (m[c.outcome] || 0) + 1, m), {}), img: [img.outcome, (img.occurrences || []).length, img.occurrencesOmitted, img.severity], ver: r.engine.version };
      } catch (e) { return { threw: e.code || '', msg: String(e.message).slice(0, 160) }; }
    });
    console.log(B.ROOT.split('/').pop(), name.padEnd(18), JSON.stringify(out));
    await page.close();
  }
  await B.stop();
})();
