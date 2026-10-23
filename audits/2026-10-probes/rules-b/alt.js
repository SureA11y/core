const h = require('./h.js'); const { jscan } = require('./j.js');
const alts = [
  ['2024 report', 'report.png', ''], ['Photo 2024', 'a.jpg', ''], ['Screenshot 2024', 'a.png',''], ['Image 1234', 'a.png',''],
  ['🎉', 'a.png',''], ['★★★★☆', 'stars.png',''], ['Q3_2024', 'q3_2024.png',''], ['Logo', 'l.png',''], ['ACME logo', 'l.png',''],
  ['Bild', 'b.png','de'], ['Bild', 'b.png','nl'], ['Foto', 'b.png','it'], ['Imagen de la playa', 'b.png','es'], ['Image d\'Épinal colorée', 'b.png','fr'],
  ['富士山の写真', 'f.png','ja'], ['富士山', 'f.png','ja'], ['图片', 'f.png','zh'], ['Изображение', 'f.png','ru'], ['صورة', 'f.png','ar'],
  ['Test', 't.png','de'], ['Test tube rack in a laboratory', 't.png',''], ['Description', 'd.png','fr'], ['www.acme.com', 'w.png',''],
  ['x'.repeat(151), 'a.png',''], ['界'.repeat(151), 'a.png','ja'], ['Node.js', 'node.svg',''], ['search', 'search.svg',''], ['dsc-0001', 'a.jpg',''], ['IMG_20240101_123456', 'a.jpg',''],
  ['R2-D2', 'r2-d2.png', ''], ['COVID-19 cases by region', 'covid-19.png', ''], ['F-35', 'f-35.jpg', ''], ['A-B-C', 'a-b-c.png',''], ['Model 3', 'a.png',''], ['iPhone 15', 'iphone-15.png',''], ['WD-40', 'wd-40.png', ''],
];
const body = alts.map(([a, s, l], i) => `<img id="i${i}" src="${s}" alt="${a.replace(/"/g, '&quot;')}"${l ? ` lang="${l}"` : ''} width=10 height=10>`).join('');
(async () => {
  const r = (await h.scan(body, { rules: ['img-alt-quality'] }))['img-alt-quality'];
  const bySel = {}; for (const o of r.occ) bySel[o.sel] = o.d ? o.d.altSignal : null;
  alts.forEach(([a, s, l], i) => console.log(JSON.stringify(a.slice(0, 30)), l || '-', s, '=>', bySel['#i' + i] === undefined ? 'MISSING' : bySel['#i' + i]));
  await h.close();
})();
