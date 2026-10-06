const {run}=require('../../visual/h.js');
const L=['text-spacing-content-loss'];
const txt='Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
run([
 ['excerpt partly clipped', `<div style="width:300px;height:50px;overflow:hidden;font-size:16px;line-height:20px"><p style="margin:0">${txt}</p></div>`],
 ['line-clamp', `<p style="width:300px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:16px;margin:0">${txt}</p>`],
 ['fits fully, tight', `<div style="width:300px;height:22px;overflow:hidden;font-size:16px;line-height:20px"><p style="margin:0">Short text fits</p></div>`],
 ['fits fully, margin case', `<div style="width:400px;height:30px;overflow:hidden;font-size:16px;line-height:18px"><p style="margin:0">Short text here</p></div>`],
],L).catch(e=>{console.error(e);process.exit(1)});
