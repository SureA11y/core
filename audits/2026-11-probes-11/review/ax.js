const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const cases = {
    ariaHidden: '<legend><span aria-hidden="true">Size</span></legend>',
    displayNone: '<legend><span style="display:none">Size</span></legend>',
    legendHidden: '<legend hidden>Size</legend>',
    legendRolePres: '<legend role="presentation">Size</legend>',
    before: '<legend class=l></legend>',
    ariaLabel: '<legend aria-label="Size"></legend>',
    imgAlt: '<legend><img alt="Size" src="x.png"></legend>',
    secondLegend: '<legend></legend><legend>Size</legend>',
  };
  for (const [k, lg] of Object.entries(cases)) {
    const p = await b.newPage();
    await p.setContent(`<style>.l::before{content:"Size"}</style><fieldset id=f>${lg}<input type=radio name=s aria-label=a></fieldset>`);
    const cdp = await p.context().newCDPSession(p);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const g = nodes.find((n) => n.role && n.role.value === 'group');
    console.log(k.padEnd(15), JSON.stringify(g && g.name && g.name.value));
    await p.close();
  }
  await b.close();
})();
