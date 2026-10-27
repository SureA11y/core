'use strict';
// node runner.js <mode> <from> <to> <parallel> <chunk> <outdir>
const { spawn } = require('child_process');
const fs = require('fs');
const [mode, from, to, par, chunk, outdir] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], +process.argv[6], process.argv[7]];
fs.mkdirSync(outdir, { recursive: true });
const queue = [];
for (let s = from; s < to; s += chunk) queue.push([s, Math.min(chunk, to - s)]);
const hangs = fs.openSync(`${outdir}/hangs.jsonl`, 'a');
let running = 0;
function next() {
  while (running < par && queue.length) {
    const [s, n] = queue.shift();
    running++;
    const out = `${outdir}/${mode}-${s}.jsonl`;
    const p = spawn(process.execPath, ['--stack-size=4000', __dirname + '/worker.js', mode, String(s), String(n), out], { stdio: 'ignore' });
    const per = 90000; // generous per-case budget
    let lastCur = null, lastChange = Date.now();
    const iv = setInterval(() => {
      let cur = null;
      try { cur = fs.readFileSync(out + '.cur', 'utf8'); } catch {}
      if (cur !== lastCur) { lastCur = cur; lastChange = Date.now(); }
      else if (Date.now() - lastChange > per) {
        fs.writeSync(hangs, JSON.stringify({ mode, seed: +cur, budgetMs: per }) + '\n');
        p.kill('SIGKILL');
      }
    }, 2000);
    p.on('exit', (code, sig) => {
      clearInterval(iv);
      running--;
      let cur = null;
      try { cur = +fs.readFileSync(out + '.cur', 'utf8'); } catch {}
      if ((code !== 0 || sig) && cur != null && cur < s + n - 1) {
        fs.writeSync(hangs, JSON.stringify({ mode, seed: cur, exit: code, sig }) + '\n');
        queue.unshift([cur + 1, s + n - cur - 1]);
      } else if ((code !== 0 || sig) && cur != null) {
        fs.writeSync(hangs, JSON.stringify({ mode, seed: cur, exit: code, sig }) + '\n');
      }
      next();
    });
  }
  if (!running && !queue.length) console.log('done');
}
next();
