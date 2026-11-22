const {four,page,close}=require('./h.js');
const S=(inner)=>`<svg aria-label=chart role=img width=300 height=60>${inner}</svg>`;
const cases=[
 ['rect with stroke dark, white text', S(`<rect x=0 y=0 width=200 height=50 fill="#000" stroke="#fff" stroke-width="4"/><text x=30 y=35 font-size=14 fill="#fff">Badge</text>`)],
 ['rect fill-opacity .2, white text', S(`<rect x=0 y=0 width=200 height=50 fill="#000" fill-opacity=".2"/><text x=30 y=35 font-size=14 fill="#fff">Badge</text>`)],
 ['rect fill-opacity .2, grey text', S(`<rect x=0 y=0 width=200 height=50 fill="#000" fill-opacity=".2"/><text x=30 y=35 font-size=14 fill="#999">Badge</text>`)],
 ['ellipse no stroke dark, white text', S(`<ellipse cx=60 cy=30 rx=55 ry=25 fill="#000"/><text x=30 y=35 font-size=14 fill="#fff">Badge</text>`)],
 ['ellipse stroke, grey text', S(`<ellipse cx=60 cy=30 rx=55 ry=25 fill="#000" stroke="#fff" stroke-width="4"/><text x=30 y=35 font-size=14 fill="#333">Badge</text>`)],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['contrast-minimum','contrast-computable']);await close();})();
