import fs from 'node:fs';
import path from 'node:path';

const file = path.join('.vercel', 'output', 'functions', '__server.func', '_ssr', 'ssr.mjs');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ssr_exports as [a-zA-Z0-9_]+, ?/g, '');
  content = content.replace(/server_exports as [a-zA-Z0-9_]+, ?/g, '');
  content = content.replace(/, ?ssr_exports as [a-zA-Z0-9_]+/g, '');
  content = content.replace(/, ?server_exports as [a-zA-Z0-9_]+/g, '');
  fs.writeFileSync(file, content);
  console.log('Fixed ssr.mjs exports!');
} else {
  console.log('ssr.mjs not found.');
}
