const p=require('./h.js');
const L=['valid-lang','language-page-present','html-xml-lang-mismatch'];
for (const v of ['i-klingon','x-pig-latin','zh-min-nan','EN','en-gb-oed',' fr ','fr\t','sgn-be-fr','zh-yue','en-US-x-foo','ar-aao','und','mis','mul','zxx','qaa','tlh','art-lojban','en_US','fr-','-fr','root','sr-Latn-RS']) {
  p(JSON.stringify(v),`<!doctype html><html lang="en"><head><title>t</title></head><body><p lang="${v}">tlh</p></body></html>`,['valid-lang']);
}
