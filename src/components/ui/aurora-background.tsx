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
        "relative flex flex-col h-full w-full items-center justify-center bg-bg text-fg transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            `
          [--dark-gradient:repeating-linear-gradient(100deg,var(--color-bg)_0%,var(--color-bg)_7%,transparent_10%,transparent_12%,var(--color-bg)_16%)]
          [--aurora:repeating-linear-gradient(100deg,#ff4a3a_10%,#4a8f7f_15%,#ff8a6a_20%,#204d41_25%,#ff4a3a_30%)]
          [background-image:var(--dark-gradient),var(--aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[15px]
          after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] 
          after:[background-size:200%,_100%] 
          after:animate-[aurora_60s_linear_infinite] after:[background-attachment:fixed] after:mix-blend-difference
          absolute -inset-[10px] opacity-[0.25] will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
