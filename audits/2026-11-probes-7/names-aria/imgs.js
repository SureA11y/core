const { launch, runCase, summarize } = require('./harness');
const R=['img-alt-present','role-img-text-alternative-present','svg-image-text-alternative-present','svg-text-alternative-present','img-alt-decorative','image-redundant-alt','img-alt-quality','presentation-role-conflict','aria-allowed-role','aria-prohibited-attr','link-name-present'];
const cases=[
 {id:'alt-empty-title', html:`<img data-t=a src=a.png alt="" title="Logo">`},
 {id:'alt-empty-arialabel', html:`<img data-t=b src=a.png alt="" aria-label="Logo">`},
 {id:'alt-empty-labelledby', html:`<span id=l>Logo</span><img data-t=c src=a.png alt="" aria-labelledby=l>`},
 {id:'alt-empty-tabindex', html:`<img data-t=d src=a.png alt="" tabindex=0>`},
 {id:'alt-empty-describedby', html:`<img data-t=e src=a.png alt="" aria-describedby=l2><span id=l2>desc</span>`},
 {id:'role-presentation-no-alt', html:`<img data-t=f src=a.png role=presentation>`},
 {id:'role-none-alt-text', html:`<img data-t=g src=a.png role=none alt="Chart">`},
 {id:'svg-img-no-name-in-link', html:`<a href=/x data-t=h><svg role=img aria-hidden=true></svg>Home</a>`},
 {id:'picture', html:`<picture><source srcset=a.webp><img data-t=i src=a.png alt="Cat"></picture>`},
 {id:'img-no-alt-hidden', html:`<img data-t=j src=a.png aria-hidden=true>`},
 {id:'img-in-figure-captioned-noalt', html:`<figure><img data-t=k src=a.png><figcaption>A cat</figcaption></figure>`},
 {id:'img-alt-empty-in-figure-captioned', html:`<figure><img data-t=l src=a.png alt=""><figcaption>A cat</figcaption></figure>`},
 {id:'svg-role-img-title-child-g', html:`<svg role=img data-t=m><g><title>Not direct</title></g></svg>`},
 {id:'svg-role-img-labelledby-title', html:`<svg role=img aria-labelledby=st data-t=n><title id=st>Chart</title></svg>`},
 {id:'svg-role-graphics-document', html:`<svg role=graphics-document data-t=o><title>Map</title></svg>`},
 {id:'img-generic-role-alt', html:`<img data-t=p src=a.png alt="Logo" role=generic>`},
];
(async () => { const b = await launch(); for (const c of cases) console.log(summarize(c, await runCase(b,c,R))); await b.close(); })();
