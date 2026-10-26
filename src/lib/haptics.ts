import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/** A light tap of vibration in the Android app; does nothing on the web. */
export function tapFeedback(strength: "light" | "medium" = "light") {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style: strength === "medium" ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
}
