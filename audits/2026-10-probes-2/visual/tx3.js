const R=['text-spacing-content-loss'];
require('./h').run([
 ['line-clamp card', `<p style="width:200px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">Short teaser text that is exactly long enough here</p>`],
 ['ellipsis fits before', `<div style="width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Product name fits barely</div>`],
 ['overflow hidden on html/body only (common reset)', `<div style="width:300px">Some normal paragraph text that wraps a few times inside the box and grows.</div>`,{head:'<style>body{overflow-x:hidden}</style>'}],
 ['visually-hidden sr-only', `<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Skip</span><p>Body</p>`],
 ['icon font ligature in fixed square button', `<button style="width:24px;height:24px;overflow:hidden;padding:0;font-size:14px;line-height:24px">X</button>`],
],R);
