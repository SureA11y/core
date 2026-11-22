const { four, page, close } = require('./h.js');
(async () => {
  await four('woo price span €', page('<p style="color:#000">Price <span class="woocommerce-Price-amount amount"><bdi>45,00&nbsp;<span class="woocommerce-Price-currencySymbol" style="color:#aaa">€</span></bdi></span></p>'), ['contrast-minimum','symbol-graphic-contrast']);
  await close();
})();
