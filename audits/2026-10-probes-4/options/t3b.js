const { scan, setup } = require('./h.js');
const n = +process.argv[2]; const sel = process.argv[3] === 'not' ? ':not(' + 'a'.repeat(n) + ')' : 'a'.repeat(n);
const d = setup(); let t = Date.now(); try { d.window.document.querySelectorAll(sel); } catch (e) { console.log('qsa err', e.message.slice(0, 80)); } console.log('jsdom qsa', Date.now() - t);
t = Date.now(); try { d.window.document.body.matches(sel); } catch (e) {} console.log('jsdom matches', Date.now() - t);
t = Date.now(); const r = scan({ excludeSelectors: sel }); console.log('scan', Date.now() - t, r.ok, r.warns.slice(0, 1).map(w=>w.slice(0,100)));
