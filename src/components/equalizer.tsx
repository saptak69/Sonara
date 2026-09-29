import { cn } from "@/lib/utils";

export function Equalizer({ className }: { className?: string }) {
  return (
    <span className={cn("eq", className)} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}
