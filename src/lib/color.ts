import { hashHue } from "./utils";

export async function extractAccent(urlOrId: string): Promise<string | null> {
  const h = hashHue(urlOrId);
  return `hsla(${h.toFixed(0)} 70% 55% / 0.45)`;
}
