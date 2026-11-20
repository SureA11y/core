const {run,show}=require('./jsd');
(async()=>{ for (const h of ['<form><input type=submit value=""></form>','<form><input type=reset value=""></form>','<form><input type=submit value="   "></form>','<form><input type=submit></form>']) console.log(show(h, await run(`<main>${h}</main>`,['button-name-present']))); })();
