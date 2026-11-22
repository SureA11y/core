// compact: one line per case/rule showing 4 cells
const fs=require('fs');const t=fs.readFileSync(process.argv[2],'utf8').split('\n');
let cas='',rule='',cells=[];const out=[];
const flush=()=>{if(rule){const same=cells.every(c=>c[1]===cells[0][1]);out.push(`  ${rule}: `+(same?'ALL '+cells[0][1]:cells.map(c=>c[0]+'='+c[1]).join(' || ')))}cells=[]};
for(const l of t){let m;if(l.startsWith('### ')){flush();rule='';out.push(l)}else if(m=/^\s+\[(.*)\]$/.exec(l)){flush();rule=m[1]}else if(m=/^\s+(\w+)\s+(jsdom|chrome)\s*: (.*)$/.exec(l)){cells.push([m[1]+'.'+m[2][0],m[3].replace(/html > body > main > /g,'')])}}
flush();console.log(out.join('\n'));
