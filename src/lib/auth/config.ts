/** Public auth settings shared by the server and the browser. */

export const PRODUCTION_URL = "https://sonara-murex.vercel.app";

/** OAuth client used by the website and as the audience for Android ID tokens. */
export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  "1024926408578-qh9tug8msu59po57tdo3oj8dkfnugsqh.apps.googleusercontent.com";

/** OAuth client registered for the Android package (com.sonara.app). */
export const GOOGLE_ANDROID_CLIENT_ID =
  "1024926408578-sl9v10b7qtkqoo58ankofpkrhppp3kke.apps.googleusercontent.com";
