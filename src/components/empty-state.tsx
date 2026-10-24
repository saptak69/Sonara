import React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-[340px] flex-col items-center justify-center p-6 text-center select-none ${className}`}
    >
      {/* 56px circular surface-2 icon tile with neutral secondary glyph */}
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-white/50 shadow-sm">
        <Icon className="size-6 text-white/60" strokeWidth={1.75} />
      </div>

      {/* Title (18-20px / 600, spaces intact, no negative letter-spacing) */}
      <h3 className="text-lg sm:text-xl font-semibold text-white tracking-normal mb-1.5">
        {title}
      </h3>

      {/* Description (14px / secondary, max 36ch) */}
      <p className="max-w-[36ch] text-sm text-white/60 leading-relaxed mb-6 font-normal">
        {description}
      </p>

      {/* Actions (One warm-white primary, optional ghost secondary) */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <Button
              type="button"
              onClick={primaryAction.onClick}
              className="h-10 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 font-semibold text-sm px-6 shadow-sm transition-all"
            >
              {primaryAction.icon && (
                <primaryAction.icon className="size-4 mr-2" strokeWidth={2} />
              )}
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              type="button"
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="h-10 rounded-full border border-white/10 bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white active:scale-95 font-medium text-sm px-5 transition-all"
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="size-4 mr-2" strokeWidth={1.75} />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
