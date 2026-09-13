import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonara.app',
  appName: 'Sonara',
  webDir: 'dist',
  server: {
    url: 'https://sonara-murex.vercel.app/',
    cleartext: true
  }
};

export default config;
