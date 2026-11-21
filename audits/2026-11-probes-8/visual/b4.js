const { cases, close } = require('./multi');
const T = ['target-size-minimum'];
const ib = (l) => `<button aria-label="${l}" style="width:16px;height:16px;padding:0;border:0;background:#ccc;vertical-align:middle"></button>`;
(async () => {
await cases([
 ['table row text + icon buttons', `<table><tr><td>John Smith ${ib('Edit')}${ib('Delete')}</td></tr></table>`],
 ['pager label + icon buttons', `<div>Page 1 of 10 ${ib('Prev')}${ib('Next')}</div>`],
 ['icon buttons alone', `<div>${ib('Prev')}${ib('Next')}</div>`],
 ['chip with remove x', `<span style="display:inline-flex;align-items:center;gap:2px;background:#eee;padding:2px 6px">Tag one ${ib('Remove tag one')}</span><span style="display:inline-flex;align-items:center;gap:2px;background:#eee;padding:2px 6px">Tag two ${ib('Remove tag two')}</span>`],
], T);
await close();
})();
