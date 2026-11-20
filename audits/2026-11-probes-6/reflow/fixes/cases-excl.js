module.exports = (page) => [
  ['excluded wide div', page('.wide{width:600px}', '<div class="wide" id="x">Wide</div>'), { engineOptions: { excludeSelectors: ['#x'] } }]
];
