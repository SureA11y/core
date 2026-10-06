const {scan,show,close}=require('../../visual/h.js');
const L=['css-orientation-lock','css-focus-indicator-suppressed'];
const lock='.w{transform:rotate(90deg);width:100vh;height:100vw}';
const body='<div class="w"><p>Some content inside a rotated wrapper with lots of text</p></div><a href="#">link</a>';
const cases=[
 ['top-level @media', `<style>@media (orientation:portrait){${lock}}</style>`],
 ['@layer', `<style>@layer a{@media (orientation:portrait){${lock}}}</style>`],
 ['@supports', `<style>@supports (display:grid){@media (orientation:portrait){${lock}}}</style>`],
 ['nested @media', `<style>@media screen{@media (orientation:portrait){${lock}}}</style>`],
 ['@container', `<style>body{container-type:inline-size}@container (min-width:1px){@media (orientation:portrait){${lock}}}</style>`],
 ['CSS nesting', `<style>.w{@media (orientation:portrait){transform:rotate(90deg);width:100vh;height:100vw}}</style>`],
 ['style media attr', `<style media="(orientation:portrait)">${lock}</style>`],
 ['focus nesting', `<style>a{&:focus{outline:none}}</style>`],
 ['focus top-level control', `<style>a:focus{outline:none}</style>`],
];
(async()=>{
 for (const vp of [{width:600,height:800},{width:800,height:600}]) for (const [l,h] of cases) show(l+' '+vp.width+'x'+vp.height, await scan(body,L,{head:h,viewport:vp}));
 await close();
})();
