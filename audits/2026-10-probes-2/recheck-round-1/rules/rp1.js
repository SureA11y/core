const {run}=require('../../visual/h.js');
run([
 ['a) painter outside opaque card', `<div style="position:relative"><div style="background:#fff;padding:20px"><p style="position:relative;z-index:2;color:#ddd">Card text over dark box</p></div><div style="position:absolute;top:0;left:0;width:400px;height:80px;background:#000;z-index:1"></div></div>`],
 ['b) fixed dark backdrop', `<div style="position:fixed;inset:0;background:#000;z-index:-1"></div><p style="color:#ddd">Text over fixed backdrop</p>`, {head:'<style>html,body{background:transparent!important}html{background:#fff!important}</style>'}],
 ['b2) sticky dark header bg', `<div style="position:sticky;top:0;height:60px;background:#000"></div><p style="margin-top:-50px;position:relative;color:#ddd">Text over sticky block</p>`],
 ['d) gradient glow', `<section style="position:relative;padding:40px"><div style="position:absolute;inset:0;background:radial-gradient(circle,rgba(0,100,255,.08),transparent 70%)"></div><p style="position:relative;color:#7d8ba4">Glow text 3.4 ratio</p></section>`],
 ['e) control: fully covered by solid black, real ratio ~15', `<div style="position:relative;height:60px"><div style="position:absolute;inset:0;background:#000"></div><p style="position:absolute;top:0;color:#ddd">Over solid</p></div>`],
],['contrast-minimum','contrast-computable']).catch(e=>{console.error(e);process.exit(1)});
