declare global { interface Window { a11ycore: typeof import('@surea11y/core/browser'); } }
export async function f() {
  const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
  const t = window.a11ycore.table(r);
  window.a11ycore.highlight(r);
  await window.a11ycore.openReport(r);
  const r2 = await window.a11ycore.run();
  const ann = window.a11ycore.getAnnouncements().map((a) => a.text);
  return [t, r2, ann];
}
