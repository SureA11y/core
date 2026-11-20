const {run,show}=require('./jsd');
const R=['link-name-quality','link-name-quality-link-only'];
const sr='style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"';
const cases=[
 ['sr-only-suffix', `<main><article><h2>Annual report</h2><p>Summary.</p><a href=/r>Read more<span ${sr}> about the annual report</span></a></article></main>`],
 ['aria-label', `<main><article><h2>Annual report</h2><a href=/r aria-label="Read more about the annual report">Read more</a></article></main>`],
 ['aria-labelledby-self-heading', `<main><article><h2 id=h>Annual report</h2><a href=/r id=l aria-labelledby="l h">Read more</a></article></main>`],
 ['describedby', `<main><article><h2 id=h>Annual report</h2><a href=/r aria-describedby=h>Read more</a></article></main>`],
 ['title-attr', `<main><p>Report <a href=/r title="Annual report 2026">here</a></p></main>`],
 ['generic-no-context', `<main><a href=/r>click here</a></main>`],
 ['para-context', `<main><p>To download the annual report, <a href=/r>click here</a>.</p></main>`],
 ['list-item-context', `<main><ul><li>Annual report: <a href=/r>PDF</a></li></ul></main>`],
 ['table-context', `<main><table><tr><th>Doc</th><th>Link</th></tr><tr><td>Annual report</td><td><a href=/r>Download</a></td></tr></table></main>`],
 ['img-link-generic-alt', `<main><p>Annual report <a href=/r><img src=a.png alt="more"></a></p></main>`],
 ['french', `<html lang=fr><head><title>t</title></head><body><main><p>Le rapport annuel <a href=/r>cliquez ici</a></p></main></body></html>`],
 ['email-link', `<main><p>Contact us at <a href="mailto:a@b.c">here</a></p></main>`],
 ['skip-link', `<a href="#main">Skip to content</a><main id=main><p>x</p></main>`],
 ['home', `<main><nav><a href=/>Home</a></nav></main>`],
 ['download-ext', `<main><p>Annual report (PDF, 2 MB) <a href=/r.pdf download>Download</a></p></main>`],
];
(async()=>{ for (const [id,h] of cases) { const s=show(id, await run(h,R)); console.log(s.split('\n').filter(l=>!/: (notApplicable|pass)$/.test(l)).join('\n')); } })();
