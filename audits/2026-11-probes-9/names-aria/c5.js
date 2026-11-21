const gif='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const R=['img-alt-present','svg-text-alternative-present','role-img-text-alternative-present','canvas-text-alternative-present'];
module.exports=[
{name:'roleimg-with-img', rules:R, html:`<div id=d role=img aria-label="Team photo"><img id=i src="${gif}"></div>`, ax:['#d','#i']},
{name:'btn-with-img', rules:R, html:`<button id=d aria-label="Close"><img id=i src="${gif}"></button>`, ax:['#d','#i']},
{name:'roleimg-with-svg', rules:R, html:`<div id=d role=img aria-label="Team photo"><svg id=i role=img width=5 height=5><rect width=5 height=5 /></svg><canvas id=c width=5 height=5></canvas></div>`, ax:['#d','#i','#c']},
{name:'tab-with-img', rules:R, html:`<div role=tablist><div id=d role=tab aria-label="Home"><img id=i src="${gif}"></div></div>`, ax:['#d','#i']},
];
