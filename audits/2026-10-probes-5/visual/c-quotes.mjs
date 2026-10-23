const P = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.4 Arial;background:#fff;color:#000} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'Q1 open-quote words light', html: P('q{quotes:"Quote: " " (end)"} q::before{content:open-quote;color:#ccc} q::after{content:close-quote;color:#ccc}', '<p><q id=a>quoted</q></p>'), rules: R, sample: ['#a'] },
  { name: 'Q2 default curly quotes light (q::before color)', html: P('q::before,q::after{color:#ccc}', '<p><q id=a>quoted</q></p>'), rules: R },
  { name: 'Q3 counter with list-style upper-roman light', html: P('ol{list-style:none;counter-reset:n} li{counter-increment:n} li::before{content:counter(n, upper-roman) ". ";color:#bbb}', '<ol><li id=a>One</li></ol>'), rules: R },
  { name: 'Q4 counters() nested light', html: P('ol{list-style:none;counter-reset:n} li{counter-increment:n} li::before{content:counters(n,".") " ";color:#bbb}', '<ol><li id=a>One<ol><li>Sub</li></ol></li></ol>'), rules: R },
  { name: 'Q5 content string + attr + counter mixed', html: P('#a{counter-reset:c 3} #a::after{content:" (" attr(data-n) " of " counter(c) ")";color:#bbb}', '<p id=a data-n=2>Item</p>'), rules: R },
  { name: 'Q6 marker ::marker in ol with list-style-type string', html: P('ol{list-style-type:"Step "} li::marker{color:#bbb}', '<ol><li id=a>One</li></ol>'), rules: R },
  { name: 'Q7 marker of summary (disclosure triangle) light', html: P('summary::marker{color:#ddd}', '<details><summary id=a>More</summary>x</details>'), rules: R },
];
