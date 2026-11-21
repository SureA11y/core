const show = id => p => p.evaluate(id => document.getElementById(id).showModal(), id);
module.exports = [
 ['lightbox white caption over dark backdrop', `<style>dialog::backdrop{background:rgba(0,0,0,.85)} dialog{background:transparent;border:0;color:#fff}</style><main><h1>Gallery</h1><p>Page text.</p></main><dialog id=d><p id=t style="font:16px Arial">Caption: sunset over the bay</p><button style="color:#fff;background:transparent;border:1px solid #fff">Close</button></dialog>`, { before: show('d') }],
 ['lightbox dark text over dark backdrop', `<style>dialog::backdrop{background:rgba(0,0,0,.85)} dialog{background:transparent;border:0;color:#333}</style><main><p>Page text.</p></main><dialog id=d><p id=t style="font:16px Arial">Caption text</p></dialog>`, { before: show('d') }],
];
