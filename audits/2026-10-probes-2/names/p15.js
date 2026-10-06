const p=require('./h');
const S=['form-control-single-label'];
p('wrapper labels first input only','<label>From <input id="from"> to <input id="to"></label><label for="to">End date</label>',S);
p('wrap+for elsewhere','<label for="email">Email <input id="email2" type="email"></label><input id="email" type="email"><label for="email2">Backup email</label>',S);
p('dup id: label for first only','<label for="x">A</label><input id="x"><label>B <input id="x"></label>',S);
