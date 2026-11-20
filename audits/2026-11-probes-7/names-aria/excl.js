const {run,show}=require('./jsd');
const all=['button-name-present','link-name-present','form-control-programmatic-label-present','aria-valid-attr-value','heading-order','page-has-heading-one','td-has-header','page-zones-landmark','landmark-unique','region','link-name-quality','identical-links-same-purpose','label-in-name','duplicate-id-aria','aria-required-children','aria-required-parent','listitem-parent-valid','form-control-label-quality','empty-heading','dialog-name-present','landmark-one-main','landmark-no-duplicate-banner','skip-link','bypass-blocks-present'];
const cases=[
 ['ref-into-excluded', '<div id=x><span id=lab>Close</span><h1>Site</h1></div><main><button aria-labelledby=lab></button><label for=f id=lf>Name</label></main><div id=y><input id=f></div>', {excludeSelectors:['#x','#y']}],
 ['labelfor-into-excluded', '<main><div id=x><label for=f>Name</label></div><input id=f></main>', {excludeSelectors:['#x']}],
 ['owner-excluded-child-not', '<main><ul id=x><li><a href=/a>Read more</a></li></ul><a href=/b>Read more</a></main>', {excludeSelectors:['#x']}],
 ['excl-list-parent', '<main><ul id=x></ul><div role=listbox id=x2 aria-label=l><div role=option id=o>a</div></div></main>', {excludeSelectors:['#x2']}],
 ['excl-tablist', '<main><div id=x role=tablist aria-label=t><div role=tab aria-selected=true>a</div></div><div role=tabpanel aria-label=p>p</div></main>', {excludeSelectors:['#x']}],
 ['excl-dup-id', '<main><div id=x><span id=dup>A</span></div><span id=dup>B</span><button aria-labelledby=dup></button></main>', {excludeSelectors:['#x']}],
 ['excl-banners', '<header id=x>admin</header><header>site</header><main><h1>a</h1></main>', {excludeSelectors:['#x']}],
 ['excl-main', '<header>h</header><main id=x><h1>a</h1></main><footer>f</footer>', {excludeSelectors:['#x']}],
];
(async()=>{ for (const [id,h,ex] of cases) { const s=show(id, await run(h,all,ex)); console.log(s.split('\n').filter(l=>!/: (notApplicable|pass)$/.test(l)).join('\n')); } })();
