const {four,page,close}=require('./h.js');
const S=(inner)=>`<svg aria-label=chart role=img width=300 height=60>${inner}</svg>`;
const cases=[
 ['anchor middle centred in rect, fits', S(`<rect x=0 y=0 width=200 height=40 fill="#eee"/><text x=100 y=25 text-anchor=middle font-size=16 fill="#ddd">Sales</text>`)],
 ['anchor end at right edge, fits', S(`<rect x=0 y=0 width=200 height=40 fill="#eee"/><text x=198 y=25 text-anchor=end font-size=16 fill="#ddd">Sales</text>`)],
 ['anchor end text runs out left of rect', S(`<rect x=100 y=0 width=100 height=40 fill="#eee"/><text x=198 y=25 text-anchor=end font-size=16 fill="#ddd">A long label running out</text>`)],
 ['letter-spacing attr 20, would overflow', S(`<rect x=0 y=0 width=100 height=40 fill="#eee"/><text x=2 y=25 letter-spacing=20 font-size=16 fill="#ddd">Sales</text>`)],
 ['textLength stretches beyond rect', S(`<rect x=0 y=0 width=100 height=40 fill="#eee"/><text x=2 y=25 textLength=250 font-size=16 fill="#ddd">Sales</text>`)],
 ['circle covers text, transform on circle', S(`<circle cx=30 cy=30 r=28 fill="#eee" transform="translate(200,0)"/><text x=15 y=35 font-size=12 fill="#ddd">Hi</text>`)],
 ['circle text partly outside', S(`<circle cx=30 cy=30 r=12 fill="#000"/><text x=10 y=35 font-size=14 fill="#fff">Hello world</text>`)],
 ['ellipse with stroke dark, text white inside', S(`<ellipse cx=60 cy=30 rx=55 ry=25 fill="#000" stroke="#fff" stroke-width=4/><text x=30 y=35 font-size=14 fill="#fff">Badge</text>`)],
 ['circle fill-opacity .2', S(`<circle cx=30 cy=30 r=28 fill="#000" fill-opacity=.2/><text x=15 y=35 font-size=12 fill="#fff">Hi</text>`)],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['contrast-minimum','contrast-computable']);await close();})();
