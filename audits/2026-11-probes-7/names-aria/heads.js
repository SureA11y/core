const {run,show}=require('./jsd');
const R=['heading-order','page-has-heading-one','empty-heading'];
const cases=[
 ['h1-h2-h3', '<main><h1>a</h1><h2>b</h2><h3>c</h3></main>'],
 ['rolehead-l3', '<main><h1>a</h1><div role=heading aria-level=3>b</div></main>'],
 ['rolehead-default', '<main><h1>a</h1><div role=heading>b</div></main>'],
 ['aria-level-10', '<main><h1>a</h1><h2 aria-level=10>b</h2><h3>c</h3></main>'],
 ['aria-level-1.5', '<main><h2 aria-level="1.5">a</h2></main>'],
 ['div-rolehead-level-1e1', '<main><h1>a</h1><div role=heading aria-level="2e1">b</div></main>'],
 ['div-rolehead-l9', '<main><h1>a</h1><div role=heading aria-level="9">b</div></main>'],
 ['h1-hidden', '<main><h1 hidden>a</h1><h2>b</h2></main>'],
 ['h1-sr-only', '<main><h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">a</h1><h2>b</h2></main>'],
 ['h1-in-shadow', '<main><x-h></x-h><h2>b</h2></main>'],
 ['h1-rolepresentation', '<main><h1 role=presentation>a</h1><h2>b</h2></main>'],
 ['h1-arialevel2', '<main><h1 aria-level=2>a</h1><h2>b</h2></main>'],
 ['h2-arialevel1', '<main><h2 aria-level=1>a</h2><h3>b</h3></main>'],
 ['h-leading-ws', '<main><h1>a</h1><h2 aria-level=" 3">b</h2></main>'],
 ['div-head-l0', '<main><h1>a</h1><div role=heading aria-level=0>b</div><h3>c</h3></main>'],
 ['hgroup', '<main><hgroup><h1>Title</h1><p>sub</p></hgroup><h2>x</h2></main>'],
 ['excluded-h1', '<header id=x><h1>Site</h1></header><main><h2>a</h2><h4>b</h4></main>', { excludeSelectors:['#x'] }],
 ['excluded-skip', '<header id=x><h1>Site</h1></header><main><h3>a</h3></main>', { excludeSelectors:['#x'] }],
 ['empty-heading-img', '<main><h1><img src=a.png alt=""></h1><h2 aria-label="Hi"></h2><h2><span aria-hidden=true>x</span></h2></main>'],
];
(async()=>{ for (const [id,h,ex] of cases) console.log(show(id, await run(h,R,ex||{}))); })();
