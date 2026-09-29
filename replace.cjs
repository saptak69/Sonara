const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.css'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let orig = content;
  
  content = content.replace(/#0c1210/gi, 'var(--color-bg)');
  content = content.replace(/#17211f/gi, 'var(--color-surface)');
  content = content.replace(/#202b28/gi, 'var(--color-hover)');
  content = content.replace(/#e8e1cc/gi, 'var(--color-fg)');
  content = content.replace(/#8b9994/gi, 'var(--color-muted)');
  content = content.replace(/#c08a3e/gi, 'var(--color-accent)');
  content = content.replace(/#080c0b/gi, 'var(--color-bg)');
  
  if (orig !== content) {
    fs.writeFileSync(f, content);
  }
});
console.log('Replaced hardcoded colors!');
