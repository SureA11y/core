const { cases, close } = require('./multi');
const R = ['css-hidden-focus'];
(async () => {
await cases([
 ['skip link translateY + focus none', `<style>.s{position:absolute;top:0;transform:translateY(-100%)}.s:focus{transform:none}</style><a class=s href="#m">Skip</a><main id=m>x</main>`],
 ['skip link translateY no focus rule', `<style>.s{position:absolute;top:0;transform:translateY(-120%)}</style><a class=s href="#m">Skip</a><main id=m>x</main>`],
 ['accordion max-height 0', `<div style="max-height:0;overflow:hidden"><a href="#">Hidden link</a></div>`],
 ['accordion height 0', `<div style="height:0;overflow:hidden"><a href="#">Hidden link</a></div>`],
 ['offcanvas fixed translateX(-100%)', `<nav style="position:fixed;left:0;top:0;bottom:0;width:250px;transform:translateX(-100%);background:#fff"><a href="#">Menu link</a></nav><p>page</p>`],
 ['offcanvas fixed right -300', `<nav style="position:fixed;right:-300px;top:0;bottom:0;width:250px;background:#fff"><a href="#">Menu link</a></nav><p>page</p>`],
 ['offcanvas fixed translateX(100%) right 0', `<nav style="position:fixed;right:0;top:0;bottom:0;width:250px;transform:translateX(100%);background:#fff"><a href="#">Menu link</a></nav><p>page</p>`],
 ['offcanvas absolute in overflow-x hidden body', `<style>body{overflow-x:hidden}</style><nav style="position:absolute;left:100%;top:0;width:250px"><a href="#">Menu link</a></nav><p>page</p>`],
 ['scale 0 container', `<div style="transform:scale(0)"><a href="#">Hidden link</a></div>`],
 ['scaleY 0 dropdown', `<ul style="transform:scaleY(0);transform-origin:top"><li><a href="#">Dropdown link</a></li></ul>`],
 ['covered by sibling', `<div style="position:relative"><a href="#">Under cover</a><div style="position:absolute;inset:0;background:#fff"></div></div>`],
 ['clip-path inset 100 container', `<div style="clip-path:inset(0 0 100% 0)"><a href="#">Hidden link</a></div>`],
 ['carousel slide off track (overflow hidden)', `<div style="width:300px;overflow:hidden"><div style="display:flex;width:900px"><div style="width:300px"><a href="#">Slide 1</a></div><div style="width:300px"><a href="#">Slide 2</a></div></div></div>`],
], R);
await close();
})();
