const { cases, close } = require('./multi');
const R = ['css-focus-indicator-suppressed'];
const btn = `<button>Go</button><a href="#">Link</a>`;
(async () => {
await cases([
 ['focus none + focus-visible outline', `<style>:focus{outline:none}:focus-visible{outline:2px solid blue}</style>` + btn],
 ['focus none + background transparent (no change)', `<style>a:focus,button:focus{outline:none;background:transparent}</style><a href="#">Link</a>`],
 ['focus none + text-decoration none (no change)', `<style>a:focus{outline:0;text-decoration:none}</style><a href="#" style="text-decoration:none">Link</a>`],
 ['focus none + box-shadow none', `<style>button:focus{outline:none;box-shadow:none}</style><button>Go</button>`],
 ['focus none + border 0', `<style>button:focus{outline:none;border:0}</style><button style="border:0">Go</button>`],
 ['focus none + color inherit', `<style>a:focus{outline:none;color:inherit}</style><a href="#">Link</a>`],
 ['outline-style none', `<style>a:focus{outline-style:none}</style><a href="#">Link</a>`],
 ['outline-width 0', `<style>a:focus{outline-width:0}</style><a href="#">Link</a>`],
 ['where focus', `<style>:where(a):focus{outline:none}</style><a href="#">Link</a>`],
 ['is focus', `<style>:is(a, button):is(:focus){outline:none}</style>` + btn],
 ['layer', `<style>@layer base{a:focus{outline:none}}</style><a href="#">Link</a>`],
 ['outline white on white focus', `<style>a:focus{outline:2px solid #fff}</style><a href="#">Link</a>`],
 ['focus-visible none, no replacement', `<style>a:focus-visible{outline:none}</style><a href="#">Link</a>`],
 ['outline: transparent 2px (HCM trick) + box-shadow', `<style>a:focus{outline:2px solid transparent;box-shadow:0 0 0 3px #00f}</style><a href="#">Link</a>`],
 ['outline: transparent only', `<style>a:focus{outline:2px solid transparent}</style><a href="#">Link</a>`],
], R);
await close();
})();
