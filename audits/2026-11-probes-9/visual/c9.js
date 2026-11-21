const show = id => p => p.evaluate(id => document.getElementById(id).showModal(), id);
module.exports = [
 ['lightbox #999 caption over dark backdrop', `<style>dialog::backdrop{background:rgba(0,0,0,.85)} dialog{background:transparent;border:0}</style><main><p>Page text.</p></main><dialog id=d><p id=t style="font:16px Arial;color:#999">Caption text</p></dialog>`, { before: show('d') }],
];
