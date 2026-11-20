const h = require('./harness');
(async () => {
  console.log(JSON.stringify(await h.runChromium('<div style="width:500px">x</div>', 'reflow-horizontal-scroll')));
  console.log(JSON.stringify(await h.runJsdom('<p><strong>Opening hours</strong></p><p>Monday to Friday 9 to 5, closed on weekends and public holidays.</p>', 'p-as-heading')));
  console.log(JSON.stringify(await h.runChromium('<p><strong>Opening hours</strong></p><p>Monday to Friday 9 to 5, closed on weekends and public holidays.</p>', 'p-as-heading')));
  await h.close();
})();
