const {run,show}=require('./jsd');
const R=['img-alt-quality','image-redundant-alt','img-alt-decorative','input-image-alt-quality','area-alt-quality','svg-text-alternative-quality','link-name-quality','link-name-quality-link-only','form-control-label-quality','object-text-alternative-quality','embed-text-alternative-quality','canvas-text-alternative-quality','image-of-text','form-control-programmatic-label-quality','identical-links-same-purpose','heading-quality','label-in-name'];
const long='A'.repeat(5000);
const cases=[
 ['filename', '<main><img src=photo.jpg alt="IMG_1234.jpg"><img src=a.png alt="image"><img src=b.png alt="<script>alert(1)</script>"></main>'],
 ['quotes', `<main><img src=a.png alt='He said "hi" &amp; left'><img src=a.png alt="${long}"></main>`],
 ['rtl-emoji', '<main><img src=a.png alt="שלום עולם"><img src=a.png alt="👍🏽 picture"><img src=a.png alt="‮gnp.olleh"></main>'],
 ['links', '<main><p>Read the report. <a href=/r>click here</a></p><a href=/a>Read more</a><a href=/b>Read more</a><ul><li>Annual report <a href=/c>more</a></li></ul></main>'],
 ['redundant', '<main><figure><img src=a.png alt="Sunset over the bay"><figcaption>Sunset over the bay</figcaption></figure><a href=/x><img src=a.png alt="Home">Home</a></main>'],
 ['label-in-name', '<main><button aria-label="Submit form">Send</button><a href=/x aria-label="Next page: 2">Next</a><button aria-label="Search">🔍</button><button aria-label="Close dialog">X</button></main>'],
];
(async()=>{ for (const [id,h] of cases) { const s=show(id, await run(h,R)); console.log(s.split('\n').filter(l=>!/: (notApplicable|pass)$/.test(l)).map(l=>l.length>500?l.slice(0,500)+'…['+l.length+']':l).join('\n')); } })();
