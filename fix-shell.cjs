const fs = require('fs');
let content = fs.readFileSync('src/components/app-shell.tsx', 'utf8');

// Remove import
content = content.replace(/import \{ LocalNotifications \} from "@capacitor\/local-notifications";\r?\n?/g, '');

// Remove notifSub block
content = content.replace(/    const notifSub = LocalNotifications.addListener[^]*?\}\);\r?\n?/g, '');

// Remove notifSub cleanup
content = content.replace(/      notifSub\.then\(s => s\.remove\(\)\);\r?\n?/g, '');

fs.writeFileSync('src/components/app-shell.tsx', content);
