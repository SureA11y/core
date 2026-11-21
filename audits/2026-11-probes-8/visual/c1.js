const { cases, close } = require('./multi');
const F = ['focus-not-obscured-minimum'];
const links = n => Array.from({length:n},(_,i)=>`<p><a href="#${i}">Link ${i}</a></p>`).join('');
(async () => {
await cases([
 ['fixed header, no padding', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`],
 ['fixed header, html scroll-padding', `<style>html{scroll-padding-top:80px}</style><header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`],
 ['fixed header, scroll-margin on links', `<style>a{scroll-margin-top:90px}</style><header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`],
 ['body scroller w/ body scroll-padding', `<style>html{overflow:hidden;height:100%}body{margin:0;height:100%;overflow:auto;scroll-padding-top:80px}</style><header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff">H</header><main style="padding-top:80px">${links(40)}</main>`],
 ['app shell main scroller, header outside', `<style>html,body{margin:0;height:100%;overflow:hidden}</style><div style="display:flex;flex-direction:column;height:100%"><header style="height:80px;background:#fff;flex:none">H</header><main style="flex:1;overflow:auto">${links(40)}</main></div>`],
 ['fixed left sidebar, content beside', `<nav style="position:fixed;left:0;top:0;bottom:0;width:200px;background:#eee"><a href="#n">Nav</a></nav><main style="margin-left:220px">${links(40)}</main>`],
 ['header hidden by transform', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff;transform:translateY(-100%)">H</header>${links(40)}`],
 ['header visibility hidden', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff;visibility:hidden">H</header>${links(40)}`],
 ['header clip-path hidden', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:#fff;clip-path:inset(0 0 100% 0)">H</header>${links(40)}`],
 ['sticky header in scroller', `<div style="height:300px;overflow:auto"><div style="position:sticky;top:0;height:60px;background:#fff">S</div>${links(30)}</div>`],
 ['fixed bottom banner 1px tall', `<div style="position:fixed;bottom:0;left:0;right:0;height:1px;background:#000"></div>${links(40)}`],
 ['fixed full-viewport transparent overlay w/ pointer-events none', `<div style="position:fixed;inset:0;pointer-events:none;background:transparent;border:2px solid red"></div>${links(40)}`],
], F);
await close();
})();
