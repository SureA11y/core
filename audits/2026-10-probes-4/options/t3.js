const { scan } = require('./h.js');
for (const n of [1e4, 1e5, 1e6, 2e6]) { const t = Date.now(); scan({ locale: 'x'.repeat(n) }); console.log('locale', n, Date.now() - t); }
for (const n of [1e4, 1e5, 1e6]) { const t = Date.now(); scan({ locale: 'de-' + 'x'.repeat(n) }); console.log('locale de-', n, Date.now() - t); }
for (const n of [1000, 5000, 20000, 50000]) { const t = Date.now(); scan({ excludeSelectors: 'a,'.repeat(n) }); console.log('excl str', n, Date.now() - t); }
for (const n of [1000, 5000, 20000]) { const t = Date.now(); scan({ excludeSelectors: Array(n).fill('.nope') }); console.log('excl arr', n, Date.now() - t); }
for (const n of [1e4, 1e5, 1e6]) { const t = Date.now(); scan({ excludeSelectors: ':not(' .repeat(1)+ 'a'.repeat(n) + ')' }); console.log('excl longsel', n, Date.now() - t); }
for (const n of [1e3, 1e4, 1e5]) { const t = Date.now(); scan({ excludeSelectors: '('.repeat(n) }); console.log('excl parens', n, Date.now() - t); }
for (const n of [1e3, 1e4, 1e5]) { const t = Date.now(); scan({ excludeSelectors: '\\'.repeat(n) + ',' + '"'.repeat(n) }); console.log('excl bs/quote', n, Date.now() - t); }
