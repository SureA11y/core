const { both, page, close } = require('./h.js');
(async () => {
  await both('svg role=img text only', page('<svg role="img" width="50" height="20"><text x="0" y="15">Sales</text></svg>'), 'svg-text-alternative-present');
  await both('svg role=img text + aria-hidden none', page('<svg role="img" width="50" height="20"><title> </title><text x="0" y="15">Sales</text></svg>'), 'svg-text-alternative-present');
  await close();
})();
