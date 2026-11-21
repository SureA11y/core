const { cases, close } = require('./multi');
const L = [
 ['grey text', `<p style="color:#777">Grey</p><p style="color:#333;background:#000">dark on black</p>`],
 ['gradient bg', `<div style="background:linear-gradient(#fff,#eee)"><p style="color:#999">on gradient</p></div>`],
 ['link in text', `<p style="color:#333">Read <a href="#" style="color:#444;text-decoration:none">terms</a> now.</p>`, { rules: ['link-in-text-block'] }],
 ['shadow root text', `<div id=h></div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<p style="color:#888">Shadow grey</p>'</script>`],
 ['placeholder', `<input placeholder="Search here" style="background:#fff">`],
 ['select', `<select style="color:#999"><option>Choose</option></select>`],
 ['canvas text', `<p>Plain canvas text</p>`],
];
(async () => {
console.log('### off'); await cases(L);
console.log('### forced'); await cases(L, undefined, { forcedColors: 'active' });
await close();
})();
