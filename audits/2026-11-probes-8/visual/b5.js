const { cases, close } = require('./multi');
(async () => {
await cases([
 ['html zoom .8 28px buttons', `<html style="zoom:.8"><body><button style="width:28px;height:28px">a</button><button style="width:28px;height:28px">b</button></body></html>`],
 ['body zoom 1.5 18px buttons', `<body style="zoom:1.5"><button style="width:18px;height:18px;padding:0">a</button><button style="width:18px;height:18px;padding:0">b</button></body>`],
 ['semi-transparent fixed header (enhanced)', `<header style="position:fixed;top:0;left:0;right:0;height:80px;background:rgba(255,255,255,.8)">H</header>${Array.from({length:40},(_, i)=>`<p><a href="#">L${i}</a></p>`).join('')}`, { rules: ['focus-not-obscured-minimum','focus-not-obscured-enhanced'] }],
], ['target-size-minimum']);
await close();
})();
