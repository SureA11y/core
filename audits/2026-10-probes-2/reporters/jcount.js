const { parseXml } = require('./validate.js');
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const doc = parseXml(fs.readFileSync(f, 'utf8'));
  const root = doc.documentElement;
  let T = 0, F = 0, S = 0;
  for (const s of root.getElementsByTagName('testsuite')) {
    const tc = s.getElementsByTagName('testcase');
    const fl = [...tc].filter(t => t.getElementsByTagName('failure').length).length;
    const sk = [...tc].filter(t => t.getElementsByTagName('skipped').length).length;
    if (+s.getAttribute('tests') !== tc.length || +s.getAttribute('failures') !== fl || +s.getAttribute('skipped') !== sk) console.log('suite mismatch', s.getAttribute('name'));
    T += tc.length; F += fl; S += sk;
  }
  console.log(f, root.getAttribute('tests'), T, root.getAttribute('failures'), F, root.getAttribute('skipped'), S);
}
