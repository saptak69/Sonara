import { useEffect, useState } from "react";
import { artworkAt } from "@/lib/artwork";
import { cn, hashHue } from "@/lib/utils";

export function Cover({
  src,
  alt,
  title,
  className,
  rounded = "md",
  px,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  title?: string;
  className?: string;
  rounded?: "md" | "lg" | "full" | "sm";
  /** Width wanted in device pixels; sources with several sizes then send a smaller file. */
  px?: number;
  /** Above-the-fold image: load now instead of lazily. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "lg"
        ? "rounded-lg"
        : rounded === "sm"
          ? "rounded-sm"
          : "rounded-md";
  const showImg = src && !failed;
  const url = px ? artworkAt(src, px) : src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-chip",
        radius,
        className,
      )}
      style={
        showImg
          ? undefined
          : {
              background: `linear-gradient(145deg, hsl(${hashHue(title || alt)} 28% 22%), hsl(${hashHue(title || alt)} 18% 10%))`,
            }
      }
    >
      {showImg ? (
        <img
          src={url ?? undefined}
          alt={alt}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-lg font-semibold text-fg/80">
          {(title || alt).slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}
