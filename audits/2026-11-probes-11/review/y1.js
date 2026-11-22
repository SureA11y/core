const { run, page } = require('./sc.js');
const ID='symbol-graphic-contrast', L='color:#ccc;background:#fff';
run([
 ['disabled button ★', page(`<button disabled style="${L}">★</button>`), ID],
 ['button in first legend of disabled fieldset (NOT disabled)', page(`<fieldset disabled><legend><button style="${L}">★</button></legend><input aria-label=x></fieldset>`), ID],
 ['span aria-disabled (not a control)', page(`<span aria-disabled="true" style="${L}">★</span>`), ID],
 ['div role=button aria-disabled', page(`<div role=button aria-disabled="true" style="${L}">★</div>`), ID],
 ['label of disabled input', page(`<label style="${L}"><input type=checkbox disabled> ★</label>`), ID],
 ['link in aria-disabled toolbar', page(`<div role=toolbar aria-disabled="true"><a href=# style="${L}">★</a></div>`), ID],
 ['disabled anchor (no such thing) a[disabled]', page(`<a href=# disabled style="${L}">★</a>`), ID],
 ['aria-disabled=false button', page(`<button aria-disabled="false" style="${L}">★</button>`), ID],
 ['nested ★<b>★★</b>', page(`<span style="${L}">★<b style="color:#000">★★</b></span>`), ID],
 ['nested only child holds symbol', page(`<span style="${L}"><b>★★</b></span>`), ID],
 ['parent text is only separators', page(`<span style="${L}">| <b>★</b> |</span>`), ID],
 ['split text nodes', page(`<span style="${L}">★<!-- c -->★</span>`), ID],
 ['parent symbol, child letters', page(`<span style="${L}">★ <b>Top</b></span>`), ID],
 ['deep nest 3 levels', page(`<span style="${L}">✓<i>✓<b>✓</b></i></span>`), ID],
]);
