import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full items-center justify-center bg-bg text-fg",
        className
      )}
      {...props}
    >
      {/* Dim listening room atmosphere: One soft warm brown-red radial at top-right */}
      {showRadialGradient && (
        <div 
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
          aria-hidden="true"
        >
          <div 
            className="absolute -top-[10%] right-[5%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #FF5B2E 0%, #3D1A10 60%, transparent 100%)",
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
};
