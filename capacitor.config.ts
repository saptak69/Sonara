import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonara.app',
  appName: 'Sonara',
  webDir: 'dist',
  server: {
    url: 'https://sonara-murex.vercel.app/',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    }
  }
};

export default config;
