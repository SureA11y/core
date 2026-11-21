const { cases, close } = require('./multi');
const F = ['focus-not-obscured-minimum'];
const links = n => Array.from({length:n},(_,i)=>`<p><a href="#${i}">Link ${i}</a></p>`).join('');
const hdr = `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`;
(async () => {
await cases([
 ['html 5rem', `<style>html{scroll-padding-top:5rem}</style>` + hdr],
 ['html 10vh (60px<80)', `<style>html{scroll-padding-top:10vh}</style>` + hdr],
 ['html block-start 80', `<style>html{scroll-padding-block-start:80px}</style>` + hdr],
 ['body scroll-padding (no effect in CSS)', `<style>body{scroll-padding-top:80px}</style>` + hdr],
 ['html 80 but vertical-rl? none', `<style>html{scroll-padding:80px 0 0}</style>` + hdr],
 ['html 40 + header 80', `<style>html{scroll-padding-top:40px}</style>` + hdr],
], F, { viewport: { width: 800, height: 600 } });
await close();
})();
