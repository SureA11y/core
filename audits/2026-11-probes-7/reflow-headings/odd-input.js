const h = require('./harness');
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const odd = {
  svgForeign: `<svg width=300 height=200><foreignObject width=300 height=200><p xmlns="http://www.w3.org/1999/xhtml"><b>Title</b><br>${L}</p></foreignObject></svg>`,
  brOnly: `<br><br><b>x</b><br>${L}`,
  templateP: `<template><p><b>Title</b></p><p>${L}</p></template>`,
  nestedP: `<p><b>Title<p>${L}</p></b></p>`,
  emptyBold: `<p><b> </b></p><p>${L}</p>`,
  hugeText: `<p><b>${'x'.repeat(200000)}</b></p><p>${L}</p>`,
  zeroWidth: `<p><b>​​</b></p><p>${L}</p>`,
  rtlMarks: `<p><b>‮عنوان‬</b></p><p>${L}</p>`,
  fontWeightWeird: `<p style="font-weight:950"><span style="font-weight:1">Title</span></p><p>${L}</p>`,
  shadowP: `<div id=h></div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<p><b>Title</b><br>${L}</p>'</script>`,
  framesetDoc: null,
  manyNestedB: '<p>' + '<b>'.repeat(3000) + 'Title' + '</b>'.repeat(3000) + `</p><p>${L}</p>`,
};
(async () => {
  for (const [name, frag] of Object.entries(odd)) {
    if (!frag) continue;
    const html = '<!doctype html><html><body>' + frag + '</body></html>';
    for (const rule of ['p-as-heading']) {
      let c, j; try { c = await h.runChromium(html, rule, { width: 1024 }); } catch (e) { c = { outcome: 'THROW ' + e.message.slice(0, 80), occ: [] }; }
      try { j = await h.runJsdom(html, rule); } catch (e) { j = { outcome: 'THROW ' + e.message.slice(0, 80), occ: [] }; }
      console.log(name.padEnd(16), 'CR', c.outcome, c.occ.map(o=>o.code).join(','), c.error ? 'ERR':'', c.ms+'ms', '| JS', j.outcome, j.occ.map(o=>o.code).join(','), j.error?'ERR '+JSON.stringify(j.error).slice(0,120):'', j.ms+'ms');
    }
  }
  const fs = '<!doctype html><html><frameset cols="50%,50%"><frame src="about:blank"><frame src="about:blank"></frameset></html>';
  console.log('frameset reflow', (await h.runChromium(fs, 'reflow-horizontal-scroll')).outcome, 'pas', (await h.runChromium(fs, 'p-as-heading')).outcome);
  await h.close();
})();
