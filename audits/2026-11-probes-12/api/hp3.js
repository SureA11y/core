const B = require('./bh.js');
const body = '<main><h1>t</h1><img src="a.png"></main>';
const pg = (pre) => `<!doctype html><html lang="en"><head><title>t</title><script>${pre}</script><script src="/core.js"></script></head><body>${body}</body></html>`;
const cases = {
  typeGetter: "Object.defineProperty(Object.prototype,'type',{get(){return 'manual'},configurable:true});",
  typeAssign: "Object.prototype.type='manual';",
  typeWritable: "Object.defineProperty(Object.prototype,'type',{value:'manual',writable:true,configurable:true});",
  outcomeGetter: "Object.defineProperty(Object.prototype,'occurrenceOutcome',{get(){return 'pass'},configurable:true});",
  budgetGetter: "Object.defineProperty(Object.prototype,'timeBudgetMs',{get(){return 1},configurable:true});",
  budgetSpentEnum: "Object.prototype.__budgetSpent=true;",
  exclGetter: "Object.defineProperty(Object.prototype,'excludeSelectors',{get(){return ['body']},configurable:true});",
};
(async () => {
  await B.start();
  for (const [name, pre] of Object.entries(cases)) {
    const { page } = await B.open('/' + name, pg(pre));
    const out = await page.evaluate(async () => {
      try { const r = a11ycore.runa11yCoreInPage(location.href, null, {}, null); const img = (r.checksResults.find(c => c.ruleId === 'img-alt-present') || {}); return { n: r.checksResults.length, inc: !!r.engine.incomplete, img: [img.outcome, (img.occurrences || []).length] }; }
      catch (e) { return { threw: e.code || '', msg: String(e.message).slice(0, 160) }; }
    });
    console.log(name.padEnd(16), JSON.stringify(out)); await page.close();
  }
  await B.stop();
})();
