const {run}=require('../../visual/h.js');
const R=['contrast-minimum','contrast-computable'];
const t='color:#ddd;font-size:16px';
run([
 ['abs over sibling', `<div style="position:relative;height:100px"><div style="position:absolute;inset:0;background:#000"></div><p style="position:absolute;top:10px;${t}">Hello hero text</p></div>`],
 ['img hero', `<div style="position:relative;height:100px"><img style="position:absolute;inset:0;width:300px;height:100px" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10'/%3E%3C/svg%3E" alt=""><p style="position:absolute;top:10px;${t}">Hello hero text</p></div>`],
 ['::before z-1', `<style>.c{position:relative;z-index:0}.c::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style><div class="c"><p style="${t}">Hello hero text</p></div>`],
 ['neg margin', `<div style="background:#000;height:80px"></div><p style="margin-top:-50px;position:relative;${t}">Hello hero text</p>`],
 ['R-2 oklch bg #ddd', `<p style="background:oklch(0.2 0 0);${t}">Hello oklch</p>`],
 ['R-2 oklch bg white text', `<p style="background:oklch(0.2 0 0);color:#fff">Hello oklch</p>`],
 ['R-2 lab bg', `<p style="background:lab(20 0 0);${t}">Hello lab</p>`],
 ['R-2 p3 bg', `<p style="background:color(display-p3 0.1 0.1 0.1);${t}">Hello p3</p>`],
 ['R-2 color-mix bg', `<p style="background:color-mix(in srgb, black 90%, white);${t}">Hello mix</p>`],
 ['R-2 oklch fg', `<p style="color:oklch(0.9 0 0)">Hello oklch fg</p>`],
 ['R-3 opacity', `<div style="opacity:.5"><p style="background:#fff;color:#000">Opacity text here</p></div>`,{head:'<style>html{background:#000!important}body{background:transparent!important}</style>'}],
],R).catch(e=>{console.error(e);process.exit(1)});
