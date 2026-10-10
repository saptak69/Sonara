import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const VARIATIONS = [
  {
    title: "শুভ শারদীয়া 🌺",
    message: "ভোরের প্রথম আলোয় শুনুন মহালয়া। আপনার প্রিয় সুরের ঠিকানা, Sonara।",
    cta: "Listen to Mahalaya"
  },
  {
    title: "Listen to Mahalaya on Sonara",
    message: "Begin this festive morning with the timeless invocation of Mahalaya. Tune in on Sonara.",
    cta: "Listen Now"
  },
  {
    title: "That Mahalaya Morning Feeling",
    message: "The familiar voice, the timeless chants, the beginning of Pujo. Experience Mahalaya with Sonara.",
    cta: "Experience Mahalaya"
  },
  {
    title: "মহালয়ার সুরে শুরু হোক পুজো",
    message: "Let the sounds of Mahalaya bring the spirit of Durga Puja closer. Listen on Sonara.",
    cta: "Play Mahalaya"
  },
  {
    title: "Your Mahalaya Morning Awaits",
    message: "Make room for a timeless tradition this Sharodiya season. Listen to Mahalaya on Sonara.",
    cta: "Listen Now"
  },
  {
    title: "শুভ মহালয়া 🌅",
    message: "সেই চেনা সুর, সেই চেনা অনুভূতি। Celebrate Mahalaya with Sonara.",
    cta: "Listen on Sonara"
  }
];

export function MahalayaPrompt() {
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    try {
      const dismissed = localStorage.getItem("sonara_mahalaya_dismissed_2026");
      if (dismissed === "true") return;

      const getKolkataDateString = () => {
        try {
          const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
          const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(new Date());
          const year = parts.find(p => p.type === "year")?.value;
          const month = parts.find(p => p.type === "month")?.value;
          const day = parts.find(p => p.type === "day")?.value;
          if (year && month && day) {
            return `${year}-${month}-${day}`;
          }
          return new Date().toISOString().slice(0, 10);
        } catch (e) {
          return new Date().toISOString().slice(0, 10);
        }
      };

      const kolkataDate = getKolkataDateString();

      if (kolkataDate !== "2026-10-10" && kolkataDate !== "2026-10-11") {
        return;
      }

      const variationIndex = Math.floor(Math.random() * VARIATIONS.length);
      const variation = VARIATIONS[variationIndex];

      toast(variation.title, {
        description: variation.message,
        action: {
          label: variation.cta,
          onClick: () => {
            localStorage.setItem("sonara_mahalaya_dismissed_2026", "true");
            void navigate({ to: "/search", search: { q: "Mahalaya" } });
          }
        },
        onDismiss: () => {
          localStorage.setItem("sonara_mahalaya_dismissed_2026", "true");
        },
        onAutoClose: () => {
          localStorage.setItem("sonara_mahalaya_dismissed_2026", "true");
        },
        duration: 15000,
      });
    } catch (e) {
      console.error("Failed to show Mahalaya prompt", e);
    }
  }, [navigate]);

  return null;
}
