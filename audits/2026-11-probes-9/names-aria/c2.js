const B=['button-name-present','link-name-present'];
module.exports=[
{name:'math-btn', rules:B, html:'<button id=b><math><mi>x</mi><mo>+</mo><mn>1</mn></math></button><a id=a href="/"><math alttext="x plus 1"><mi>x</mi></math></a><a id=c href="/">Sum <math><mi>x</mi></math></a>', ax:['#b','#a','#c','math','mi']},
];
