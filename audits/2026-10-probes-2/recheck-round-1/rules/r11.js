const {run}=require('../../visual/h.js');
const L=['target-size-minimum'];
const btn='display:inline-block;padding:0;border:0;margin:0;';
run([
 ['clipped to 10x10', `<div style="width:10px;height:10px;overflow:hidden;position:absolute;top:100px;left:100px"><button style="${btn}width:40px;height:40px">x</button></div>`],
 ['2/3 covered', `<div style="position:absolute;top:100px;left:100px"><button style="${btn}width:30px;height:30px">x</button><div style="position:absolute;top:0;left:0;width:20px;height:30px;background:red"></div></div>`],
 ['rotated 20x20', `<button style="${btn}width:20px;height:20px;transform:rotate(45deg);position:absolute;top:100px;left:100px">x</button>`],
 ['display contents link', `<p>Text <a href="#" style="display:contents">tiny</a></p><div style="position:absolute;top:100px;left:100px"><a href="#" style="display:contents"><span style="display:inline-block;width:10px;height:10px;background:#000"></span></a></div>`],
 ['23.98px', `<button style="${btn}width:23.98px;height:30px;position:absolute;top:100px;left:100px">x</button>`],
 ['control 10x10 plain', `<button style="${btn}width:10px;height:10px;position:absolute;top:100px;left:100px">x</button><button style="${btn}width:10px;height:10px;position:absolute;top:100px;left:112px">y</button>`],
],L).catch(e=>{console.error(e);process.exit(1)});
