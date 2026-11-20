const { page, runCases } = require('./harness');
runCases([
  { name: 'sanity wide div', html: page('', '<div id="w" style="width:600px">x</div>') },
  { name: 'sanity fits', html: page('', '<p>ok</p>') },
]);
