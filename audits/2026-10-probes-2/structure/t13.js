const p=require('./h.js');
const R=['td-has-header','table-th-has-data-cells','table-headers-attr-valid'];
const rows=n=>Array.from({length:n},(_,i)=>`<tr><td>d${i}a</td><td>d${i}b</td><td>d${i}c</td></tr>`).join('');
p('rowspan0',`<!doctype html><html lang="en"><head><title>t</title></head><body><table><tr><th rowspan="0">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3)}</table></body></html>`,R);
p('rowspan2 control',`<!doctype html><html lang="en"><head><title>t</title></head><body><table><tr><th rowspan="4">Group</th><td>a</td><td>b</td><td>c</td></tr>${rows(3)}</table></body></html>`,R);
p('th role foo',`<!doctype html><html lang="en"><head><title>t</title></head><body><table><tr><th role="foo">A</th><th>B</th><th>C</th><th>D</th></tr>${Array.from({length:4},(_,i)=>`<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>`).join('')}</table></body></html>`,R);
p('th role=columnheader foo? "foo columnheader"',`<!doctype html><html lang="en"><head><title>t</title></head><body><table><tr><th role="foo columnheader">A</th><th>B</th><th>C</th><th>D</th></tr>${Array.from({length:4},(_,i)=>`<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>`).join('')}</table></body></html>`,R);
p('table role="foo"',`<!doctype html><html lang="en"><head><title>t</title></head><body><table role="foo"><tr><th>A</th><th>B</th></tr></table></body></html>`,R);
