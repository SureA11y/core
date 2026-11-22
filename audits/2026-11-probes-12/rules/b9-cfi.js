const {run4,setMsg}=require('./h.js');setMsg(120);
const W=(css,b)=>`<!doctype html><html lang=en><head><title>t</title><style>${css}</style></head><body><main>${b}</main></body></html>`;
const R=['css-focus-indicator-suppressed'];
const B='<a href=#>Link</a> <button>Btn</button> <input aria-label=i>';
const cases=[
 ['moz-first','button:-moz-focusring{outline:none} button:focus{outline:none}'],
 ['moz-in-list','button:-moz-focusring, button:focus{outline:none}'],
 ['webkit-pseudo','input::-webkit-search-cancel-button:focus{outline:none} a:focus{outline:none}'],
 ['focus-visible-only','a:focus:not(:focus-visible){outline:none}'],
 ['focus-visible-none','a:focus-visible{outline:none}'],
 ['is-focus','a:is(:focus){outline:none}'],
 ['where-focus-hover','a:where(:focus,:hover){outline:none}'],
 ['has-focus','main:has(a:focus) a{outline:none}'],
 ['focus-within','main:focus-within a{outline:none}'],
 ['outline-0-bg-change','a:focus{outline:0;background:#ff0}'],
 ['outline-0-color-inherit','a:focus{outline:0;color:inherit}'],
 ['outline-0-shadow-var','html{--r:0 0 0 3px blue}a:focus{outline:0;box-shadow:var(--r)}'],
 ['outline-0-shadow-var-none','html{--r:none}a:focus{outline:0;box-shadow:var(--r)}'],
 ['star-focus','*:focus{outline:none}'],
 ['universal-plain-focus',':focus{outline:none}'],
 ['layer','@layer base{a:focus{outline:none}}'],
 ['media','@media (min-width:1px){a:focus{outline:none}}'],
 ['supports','@supports (display:grid){a:focus{outline:none}}'],
 ['nested-css','main{& a:focus{outline:none}}'],
 ['scope','@scope (main){a:focus{outline:none}}'],
 ['important-later-restore','a:focus{outline:none} a:focus{outline:2px solid}'],
 ['wp-reset','button:focus,input:focus,a:focus{outline:none}.wp-block-button__link:focus{outline:2px dotted}'],
 ['shadow-style','',`<x-b></x-b><script>customElements.define("x-b",class extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).innerHTML="<style>button:focus{outline:none}</style><button>S</button>"}})</script>`],
];
run4(cases.map(([n,css,b])=>({name:n,rules:R,html:W(css,b||B)})));
