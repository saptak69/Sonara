const fs = require('fs');
let code = fs.readFileSync('src/routes/login.tsx', 'utf8');

const imports = 'import { Capacitor } from "@capacitor/core";\nimport { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";\n';
code = code.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\n' + imports);

const oldGoogleClick = `  // Handle Continue with Google (Real Google OAuth)
  const handleGoogleClick = async () => {
    setLoading(true);
    try {
      const res = await (authClient.signIn as any).social?.({
        provider: "google",
        callbackURL: \`\${window.location.origin}/studio\`,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to start Google sign in", {
          description:
            "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
          duration: 6000,
        });
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google OAuth failed";
      toast.error(msg, {
        description:
          "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };`;

const newGoogleClick = `  // Handle Continue with Google (Real Google OAuth)
  const handleGoogleClick = async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const googleUser = await GoogleAuth.signIn();
          if (googleUser.authentication.idToken) {
            const res = await (authClient.signIn as any).social?.({
              provider: "google",
              idToken: googleUser.authentication.idToken,
            });
            if (res?.error) {
              toast.error(res.error.message || "Failed native Google sign in");
            } else {
              toast.success("Welcome to Sonara!");
              void navigate({ to: "/studio" });
            }
            return;
          }
        } catch (e: any) {
           console.error("Native Google Auth Error", e);
           if (e.message && e.message.includes("cancel")) return;
           toast.error("Native Google Auth failed");
           return;
        } finally {
           setLoading(false);
        }
      }

      const res = await (authClient.signIn as any).social?.({
        provider: "google",
        callbackURL: \`\${window.location.origin}/studio\`,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to start Google sign in", {
          description:
            "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
          duration: 6000,
        });
      } else if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google OAuth failed";
      toast.error(msg, {
        description:
          "To connect real Google accounts, set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in your environment, or sign in directly with your email below.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(oldGoogleClick, newGoogleClick);
fs.writeFileSync('src/routes/login.tsx', code);
console.log('done');
