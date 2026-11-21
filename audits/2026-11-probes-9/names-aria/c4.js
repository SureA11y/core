const gif='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const R=['svg-image-text-alternative-present','svg-text-alternative-present','img-alt-decorative'];
module.exports=[
{name:'svg-img-named-with-image', rules:R, html:`<svg id=t role=img aria-label="Sales chart" width=10 height=10><image id=i href="${gif}" width=10 height=10 /></svg>`, ax:['#t','#i']},
{name:'button-svg-image', rules:R.concat(['button-name-present']), html:`<button id=b aria-label="Close"><svg width=10 height=10><image id=i href="${gif}" width=10 height=10 /></svg></button>`, ax:['#b','#i']},
{name:'svg-titled-image', rules:R, html:`<svg id=t width=10 height=10><title>Logo</title><image id=i href="${gif}" width=10 height=10 /></svg>`, ax:['#t','#i']},
];
