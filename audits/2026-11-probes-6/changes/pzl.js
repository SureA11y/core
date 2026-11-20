const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body>${b}</body></html>`;
function go(name, body, eo) {
  const r = runa11yCoreOnHtml(page(body), { runOnly: ['page-zones-landmark'], engineOptions: eo }).checksResults.find(c => c.ruleId === 'page-zones-landmark');
  console.log('## ' + name + '\n  ', r.outcome, JSON.stringify(r.occurrences.map(o => [o.selector, o.data.details.reasonCode])), r.excludedOccurrences || '', r.error || '');
}
const toolbarBanner = '<div id="tb"><header>Admin bar</header></div><div class="site-header">Site</div><main><p>x</p></main>';
go('banner only inside excluded toolbar; .site-header outside — no exclusion', toolbarBanner, {});
go('same, toolbar excluded', toolbarBanner, { excludeSelectors: ['#tb'] });
go('excluded via shadow host', '<x-bar id="xb"></x-bar><main><p>x</p></main>', {});
go('search form inside excluded ancestor, string selector', '<div class="admin"><form><input type="search"></form></div><main>x</main>', { excludeSelectors: '.admin' });
go('nav block w/ excluded class token', '<div class="menu wpadminbar"><a href="/a">a</a><a href="/b">b</a></div>', { excludeSelectors: ['.wpadminbar'] });
go('excluded via role-scoped wrong id', '<div class="menu"><a href="/a">a</a><a href="/b">b</a></div>', { rules: { 'page-zones-landmarks': { excludeSelectors: ['.menu'] } } });
