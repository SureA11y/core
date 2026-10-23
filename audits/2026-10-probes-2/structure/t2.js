const p=require('./h.js');
const R=['html-xml-lang-mismatch','html-lang-attr-present'];
for (const [l,x] of [['en','english'],['en','x-foo'],['en','fr'],['EN','en-us'],['en','!!'],['xx','yy']]) {
  p(l+'/'+x,`<!doctype html><html lang="${l}" xml:lang="${x}"><head><title>t</title></head><body><p>hi</p></body></html>`,R);
}
p('nolang','<!doctype html><html><head><title>t</title></head><body><p>hi</p></body></html>',R);
