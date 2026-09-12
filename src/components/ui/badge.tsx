import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-accent-fg shadow-sm",
        secondary: "border-transparent bg-white/10 text-fg hover:bg-white/15",
        destructive: "border-transparent bg-red-600 text-white shadow-sm",
        outline: "border-white/15 bg-white/5 text-fg",
        accent: "border-accent/30 bg-accent/15 text-accent",
        glass: "border-white/10 bg-white/5 backdrop-blur-md text-fg/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
