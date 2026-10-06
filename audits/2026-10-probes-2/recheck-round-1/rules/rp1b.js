const {run}=require('../../visual/h.js');
run([
 ['stacking: black under white under text', `<div style="position:relative;height:80px"><div style="position:absolute;inset:0;background:#000;z-index:1"></div><div style="position:absolute;inset:0;background:#fff;z-index:2"></div><p style="position:relative;z-index:3;color:#ddd">Text really on white</p></div>`],
 ['stacking: painter above text (covered)', `<div style="position:relative;height:80px"><p style="color:#ddd">Hidden under overlay</p><div style="position:absolute;inset:0;background:#000;z-index:5"></div></div>`],
],['contrast-minimum','contrast-computable']).catch(e=>{console.error(e);process.exit(1)});
