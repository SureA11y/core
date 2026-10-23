const R=['contrast-minimum'];
const g='#949494'; // ~3.03 on white
require('./h').run([
 ['14pt bold', `<p style="color:${g};font-size:14pt;font-weight:bold">Bold 14pt text</p>`],
 ['18pt normal', `<p style="color:${g};font-size:18pt">Normal 18pt text</p>`],
 ['1.5rem', `<p style="color:${g};font-size:1.5rem">Normal 1.5rem text</p>`],
 ['calc 14pt via em', `<div style="font-size:14pt"><p style="color:${g};font-size:1em;font-weight:700">Bold em text</p></div>`],
 ['h1 default 2em', `<h1 style="color:${g}">Heading one</h1>`],
 ['h2 bold 1.5em=24px', `<h2 style="color:${g}">Heading two</h2>`],
 ['h3 1.17em bold=18.72px', `<h3 style="color:${g}">Heading three</h3>`],
 ['strong in 19px', `<p style="font-size:19px;color:${g}"><strong>Strong words</strong></p>`],
 ['font shorthand', `<p style="color:${g};font:bold 14pt serif">Shorthand bold</p>`],
 ['b bolder inside weight 300', `<p style="color:${g};font-size:19px;font-weight:300"><b>Bolder b</b></p>`],
 ['font-size 18.666px bold', `<p style="color:${g};font-size:18.666px;font-weight:bold">Just under</p>`],
 ['font-size 18.67px bold', `<p style="color:${g};font-size:18.67px;font-weight:bold">Just over</p>`],
],R);
