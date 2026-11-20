const { launch, runCase, summarize } = require('./harness');
const R=['landmark-one-main','bypass-blocks-present','page-has-heading-one','region'];
const full=b=>`<!doctype html><html lang=en><head><title>T</title></head><body>${b}</body></html>`;
const nav='<nav><a href=/a>A</a><a href=/b>B</a></nav>';
(async () => { const b = await launch();
 for (const [id,html,ex] of [['main-excluded', full(`<header>${nav}</header><main id=m><h1>T</h1><p>x</p></main><footer>f</footer>`), {excludeSelectors:['#m']}],
   ['app-root-main-excluded', full(`<header>${nav}</header><div id=app><main><h1>T</h1><p>x</p></main></div><footer>f</footer>`), {excludeSelectors:['#app']}]]) {
  console.log(summarize({id}, await runCase(b,{id,html},R,ex))); }
 await b.close(); })();
