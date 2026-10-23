const R=['avoid-inline-spacing'];
const long='This is a long paragraph of text that will certainly wrap across several lines at narrow widths because it keeps going on and on without stopping.';
const cases=[];
for (const fs of ['11pt','13px','0.9rem','1.1em','15.5px','17px','10.5pt','14.6px','19px','22px','2.3vw']) {
  cases.push([fs+' lh1.5', `<p style="font-size:${fs};line-height:1.5 !important">${long}</p>`]);
  cases.push([fs+' ls.12em', `<p style="font-size:${fs};letter-spacing:0.12em !important">${long}</p>`]);
  cases.push([fs+' ws.16em', `<p style="font-size:${fs};word-spacing:0.16em !important">${long}</p>`]);
}
require('./h').run(cases,R);
