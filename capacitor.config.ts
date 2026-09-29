import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonara.app',
  appName: 'Sonara',
  webDir: 'dist',
  server: {
    url: 'https://sonara-murex.vercel.app/',
    cleartext: true,
    allowNavigation: [
      "accounts.google.com",
      "*.google.com"
    ]
  },
  overrideUserAgent: "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#070302",
      showSpinner: false,
    }
  }
};

export default config;
