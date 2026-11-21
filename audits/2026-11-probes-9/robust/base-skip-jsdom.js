'use strict';
// jsdom: same <base> skip-link case.
const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const mk = (head) => `<!doctype html><html lang="en"><head><title>b</title>${head}</head><body>
<header><a href="#main" class="skip">Skip to content</a><nav aria-label="Main">${Array.from({ length: 12 }, (_, i) => `<a href="/n${i}">Nav ${i}</a>`).join(' ')}</nav></header>
<main id="main"><h1>Title</h1><p>Body</p></main></body></html>`;
for (const [k, head] of [['nobase', ''], ['angular-style <base href="/"> on /products/42', '<base href="/">']]) {
  const r = runa11yCoreOnHtml(mk(head), { url: 'https://shop.example/products/42', runOnly: ['skip-link', 'bypass-blocks-present'] });
  console.log(k, r.checksResults.map((c) => c.ruleId + '=' + c.outcome).join(' '));
}
