// Compare inspect(kind) rows with Chromium's AX tree for each listed element.
// Also list elements Chromium exposes with matching roles that inspect() omitted.
export async function axCompare(page, kind) {
  const rows = await page.evaluate(async (k) => {
    document.querySelectorAll('[data-k]').forEach((e) => e.removeAttribute('data-k'));
    const rows = await a11ycore.inspect(k, { draw: false });
    rows.forEach((r, i) => { const el = document.querySelector(r.element); if (el) el.setAttribute('data-k', String(i)); });
    return rows;
  }, kind);
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byBackend = new Map(nodes.map((n) => [n.backendDOMNodeId, n]));
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `[data-k="${i}"]` });
    let ax = null;
    if (nodeIds.length) {
      const { node } = await cdp.send('DOM.describeNode', { nodeId: nodeIds[0] });
      const n = byBackend.get(node.backendNodeId);
      if (n) ax = { role: n.role && n.role.value, name: n.name && n.name.value, ignored: n.ignored, level: (n.properties || []).find((p) => p.name === 'level')?.value?.value };
    }
    out.push({ row: rows[i], ax });
  }
  const listed = new Set(out.filter((o) => o.ax).map((o) => o.ax.id));
  await cdp.detach();
  return { out, nodes };
}
