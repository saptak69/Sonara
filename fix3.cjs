const fs = require('fs');
let content = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

const target = '    });\n\n      }\n    });\n\n    const handleGlobalKeyDown = (e: KeyboardEvent) => {\n';
const replacement = '    });\n\n    const handleGlobalKeyDown = (e: KeyboardEvent) => {\n';
content = content.replace(target, replacement);

const targetCRLF = '    });\r\n\r\n      }\r\n    });\r\n\r\n    const handleGlobalKeyDown = (e: KeyboardEvent) => {\r\n';
const replacementCRLF = '    });\r\n\r\n    const handleGlobalKeyDown = (e: KeyboardEvent) => {\r\n';
content = content.replace(targetCRLF, replacementCRLF);

fs.writeFileSync('src/components/app-shell.tsx', content);
console.log('Fixed');
