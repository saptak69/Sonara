import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonara.app',
  appName: 'Sonara',
  webDir: 'dist',
  server: {
    url: 'https://sonara-murex.vercel.app',
    errorPath: 'error.html',
    cleartext: false,
    allowNavigation: [
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "*.gstatic.com"
    ]
  },
  // Keep the device's real user agent (so the web app can tell a TV from a phone)
  // and tag it so the server can recognise the app.
  appendUserAgent: "SonaraApp/1.1",
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0A0908",
      showSpinner: false,
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "1024926408578-qh9tug8msu59po57tdo3oj8dkfnugsqh.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;
