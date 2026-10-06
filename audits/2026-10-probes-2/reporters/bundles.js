const fs=require('fs'), vm=require('vm');
for (const loc of ['de','es','fr','ja']) {
  let got=null;
  const ctx={window:{a11ycore:{registerMessages:(l,m)=>{got={l,m};}}}};
  vm.runInNewContext(fs.readFileSync(`/home/user/core/surea11y.i18n.${loc}.js`,'utf8'), ctx);
  const src=JSON.parse(fs.readFileSync(`/home/user/core/src/i18n/${loc}.json`,'utf8'));
  const a=Object.keys(src), b=Object.keys(got.m);
  const diff=a.filter(k=>got.m[k]!==src[k]);
  console.log(loc, got.l, a.length, b.length, 'diff', diff.length, diff.slice(0,5), 'extra', b.filter(k=>!(k in src)).slice(0,5));
}
