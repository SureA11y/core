const p=require('./h.js');
const R=['meta-refresh-timing-absent','meta-refresh-no-exceptions'];
const cases=[
 ['.5 then 30', '<meta http-equiv="refresh" content=".5; url=/a"><meta http-equiv="refresh" content="30">'],
 ['1..5 then 30', '<meta http-equiv="refresh" content="0..5"><meta http-equiv="refresh" content="30">'],
 ['0.5.5', '<meta http-equiv="refresh" content="5.5.5">'],
 ['nbsp', '<meta http-equiv="refresh" content=" 5">'],
 ['30url', '<meta http-equiv="refresh" content="30url=/x">'],
 ['30;url', '<meta http-equiv="refresh" content="30;url=/x">'],
 ['body meta', '</head><body><meta http-equiv="refresh" content="30"><p>x'],
 ['empty then 30', '<meta http-equiv="refresh" content=""><meta http-equiv="refresh" content="30">'],
 ['refresh  spaced', '<meta http-equiv=" refresh" content="30">'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title>${h}</head><body><p>x</p></body></html>`,R);
