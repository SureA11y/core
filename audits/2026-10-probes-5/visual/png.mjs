// Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced) using zlib only.
import zlib from 'node:zlib';
export function decodePNG(buf) {
  let p = 8, w, h, ct, bd; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bd !== 8 || (ct !== 2 && ct !== 6)) throw new Error('unsupported png ' + bd + '/' + ct);
  const bpp = ct === 6 ? 4 : 3; const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp; const out = Buffer.alloc(w * h * 4); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { out[(y * w + x) * 4] = line[x * bpp]; out[(y * w + x) * 4 + 1] = line[x * bpp + 1]; out[(y * w + x) * 4 + 2] = line[x * bpp + 2]; out[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255; }
    prev = line;
  }
  return { w, h, px: out, at(x, y) { const i = (y * w + x) * 4; return [out[i], out[i + 1], out[i + 2]]; } };
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
// Colour histogram of a region: returns the extremes by luminance plus the most common colour.
export function regionStats(img, x0, y0, x1, y1) {
  const counts = new Map();
  for (let y = Math.max(0, y0); y < Math.min(img.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(img.w, x1); x++) { const k = img.at(x, y).join(','); counts.set(k, (counts.get(k) || 0) + 1); }
  const list = [...counts.entries()].map(([k, n]) => ({ c: k.split(',').map(Number), n })).sort((a, b) => b.n - a.n);
  const bg = list[0].c; let fg = bg, best = 1;
  for (const e of list) { const r = ratio(e.c, bg); if (r > best) { best = r; fg = e.c; } }
  return { bg: hex(bg), fg: hex(fg), maxRatio: +best.toFixed(2), colours: list.length };
}
