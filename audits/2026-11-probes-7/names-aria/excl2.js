const {run,show}=require('./jsd');
const all=['bypass-blocks-present','landmark-one-main','region','skip-link','landmark-no-duplicate-main','landmark-no-duplicate-banner','landmark-unique','page-has-heading-one','heading-order'];
const nav='<nav><ul>'+Array.from({length:8},(_,i)=>`<li><a href=/p${i}>Page ${i}</a></li>`).join('')+'</ul></nav>';
const cases=[
 ['skip-in-excluded-header', `<header id=x><a href="#c">Skip to content</a>${nav}</header><div id=c tabindex=-1><h1>T</h1><p>body</p></div>`, {excludeSelectors:['#x']}],
 ['skip-in-header-noexcl', `<header id=x><a href="#c">Skip to content</a>${nav}</header><div id=c tabindex=-1><h1>T</h1><p>body</p></div>`, {}],
 ['main-excluded', `<header>${nav}</header><main id=m><h1>T</h1><p>x</p></main><footer>f</footer>`, {excludeSelectors:['#m']}],
 ['dup-main-one-excluded', `<main id=m><h1>T</h1></main><main><p>x</p></main>`, {excludeSelectors:['#m']}],
 ['region-excluded-landmark-wraps', `<div id=w><main><h1>T</h1><p>x</p></main></div>`, {excludeSelectors:['#w']}],
];
(async()=>{ for (const [id,h,ex] of cases) { const s=show(id, await run(h,all,ex)); console.log(s.split('\n').filter(l=>!/: (notApplicable|pass)$/.test(l)).join('\n')); } })();
