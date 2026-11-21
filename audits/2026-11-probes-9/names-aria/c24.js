const R=['label-in-name','link-name-present'];
module.exports=[
{name:'ruby-label-in-name', rules:R, html:'<main lang=ja><a id=a href="/tokyo" aria-label="東京"><ruby>東京<rt>とうきょう</rt></ruby></a> <button id=b aria-label="Kanji"><ruby>漢<rp>(</rp><rt>kan</rt><rp>)</rp></ruby></button></main>', ax:['#a','#b']},
{name:'ruby-en', rules:R, html:'<main><button id=b aria-label="Tokyo tour"><ruby>Tokyo<rt>capital</rt></ruby> tour</button></main>', ax:['#b']},
];
