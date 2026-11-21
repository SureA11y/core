const I=['img-alt-present','img-alt-decorative','img-alt-quality','image-redundant-alt'];
const gif='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
module.exports=[
{name:'img-alt-space', rules:I, html:`<img id=a src="${gif}" alt=" ">`, ax:['#a']},
{name:'img-title-only', rules:I, html:`<img id=a src="${gif}" title="Logo">`, ax:['#a']},
{name:'img-labelledby', rules:I, html:`<img id=a src="${gif}" aria-labelledby=l><span id=l>Chart</span>`, ax:['#a']},
{name:'img-role-none-noalt', rules:I, html:`<img id=a src="${gif}" role=none><img id=b src="${gif}" role=presentation alt="Logo">`, ax:['#a','#b']},
{name:'img-aria-hidden', rules:I, html:`<img id=a src="${gif}" aria-hidden=true>`, ax:['#a']},
{name:'img-role-none-tabindex', rules:I, html:`<img id=a src="${gif}" role=none tabindex=0>`, ax:['#a']},
{name:'img-role-none-aria-label', rules:I, html:`<img id=a src="${gif}" role=none aria-label="x">`, ax:['#a']},
{name:'picture', rules:I, html:`<picture><source srcset="${gif}"><img id=a src="${gif}"></picture>`, ax:['#a']},
{name:'img-filename-alt', rules:I, html:`<img id=a src="photo_123.jpg" alt="photo_123.jpg"><img id=b src="${gif}" alt="image"><img id=c src="${gif}" alt="写真">`, ax:['#a','#b','#c']},
{name:'img-redundant', rules:I, html:`<a href="/"><img id=a src="${gif}" alt="Home"> Home</a><figure><img id=b src="${gif}" alt="Cat on mat"><figcaption>Cat on mat</figcaption></figure>`, ax:['#a','#b']},
{name:'img-alt-empty-title', rules:I, html:`<img id=a src="${gif}" alt="" title="Logo">`, ax:['#a']},
{name:'img-usemap-noalt', rules:I.concat(['area-alt-present']), html:`<img id=a src="${gif}" usemap="#m"><map name=m><area href="/x" alt="X" shape=rect coords="0,0,1,1"></map>`, ax:['#a']},
{name:'img-in-svg-image', rules:I.concat(['svg-image-text-alternative-present','svg-text-alternative-present','role-img-text-alternative-present']), html:`<svg id=s width=10 height=10><image id=a href="${gif}" width=10 height=10 /></svg><svg id=t role=img width=10 height=10><image href="${gif}" width=10 height=10 /></svg>`, ax:['#s','#a','#t']},
{name:'img-hidden-sizes', rules:I, html:`<img id=a src="${gif}" width=1 height=1><img id=b src="${gif}" style="width:0;height:0">`, ax:['#a','#b']},
];
