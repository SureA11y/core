const R=['target-size-minimum'];
const txt='Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ';
require('./h').run([
 ['pagination li', `<ul style="display:flex;list-style:none;gap:2px"><li><a href="/1" style="font-size:12px">1</a></li><li><a href="/2" style="font-size:12px">2</a></li><li><a href="/3" style="font-size:12px">3</a></li></ul>`],
 ['sentence in div, links stacked lines', `<div style="width:300px;font-size:14px;line-height:16px">${txt}<a href="/a">alpha</a> ${txt}<a href="/b">beta</a> ${txt}<a href="/c">gamma</a> ${txt}</div>`],
 ['sentence in div, links on consecutive lines', `<div style="width:120px;font-size:14px;line-height:16px">See <a href="/a">alpha</a> and also <a href="/b">beta</a> or then <a href="/c">gamma</a> ok</div>`],
 ['sentence in section text', `<section style="width:120px;font-size:14px;line-height:16px">See <a href="/a">alpha</a> and also <a href="/b">beta</a> or then <a href="/c">gamma</a> ok</section>`],
 ['same in p', `<p style="width:120px;font-size:14px;line-height:16px">See <a href="/a">alpha</a> and also <a href="/b">beta</a> or then <a href="/c">gamma</a> ok</p>`],
],R);
