import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

export function PushNotificationsSetup() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      registerPushNotifications();
    }
  }, []);

  const registerPushNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.warn("User denied push notification permissions");
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success, token: " + token.value);
      });

      PushNotifications.addListener("registrationError", (error) => {
        console.error("Error on registration: " + JSON.stringify(error));
      });

      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push received: " + JSON.stringify(notification));
      });

      PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        console.log("Push action performed: " + JSON.stringify(notification));
      });
    } catch (e) {
      console.error("Error setting up push notifications:", e);
    }
  };

  return null;
}
