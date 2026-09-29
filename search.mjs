import fs from 'fs';
const check = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = dir + '/' + f;
    if (fs.statSync(p).isDirectory()) check(p);
    else if (p.endsWith('.mjs')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('ssr_exports')) console.log(p);
    }
  }
};
check('.vercel/output/functions');
